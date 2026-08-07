import { createHash } from "node:crypto";
import { GlobalSymbolsClient, createGlobalSymbolsService, ExternalProviderError } from "../src/server/global-symbols.js";

const client = new GlobalSymbolsClient({
  apiKey: process.env.GLOBAL_SYMBOLS_API_KEY,
  baseUrl: process.env.GLOBAL_SYMBOLS_BASE_URL,
  authMode: process.env.GLOBAL_SYMBOLS_AUTH_MODE,
  timeoutMs: process.env.GLOBAL_SYMBOLS_TIMEOUT_MS
});
const globalSymbols = createGlobalSymbolsService({ root: "/tmp/pictogramas-caa", client });
const counters = new Map();
const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cache-Control": "no-store"
};

export default {
  async fetch(request) {
    try {
      const url = new URL(request.url);
      const path = url.pathname;
      if (!allowRequest(request, path)) return json({ error: "Demasiadas solicitudes" }, 429, { "Retry-After": "60" });
      if (request.method === "GET" && path === "/api/health") return json({ ok: true, app: "Pictogramas_CAA_IMSS", version: "1.1", runtime: "vercel" });
      if (request.method === "GET" && ["/api/providers/status", "/api/pictograms/providers/status"].includes(path)) return json(providerStatus());
      if (request.method === "POST" && path === "/api/providers/check-all") return json(await checkProviders());
      if (request.method === "POST" && /^\/api\/providers\/[^/]+\/check$/.test(path)) return json(await checkProviders());
      if (request.method === "POST" && /^\/api\/providers\/[^/]+\/enabled$/.test(path)) return await setProviderPreference(request, path);
      if (request.method === "GET" && path === "/api/pictograms/search") return await searchPictograms(url);
      if (request.method === "POST" && path === "/api/monitoring/events") return await recordMonitoringEvent(request);
      if (path === "/api/cloud/boards" && request.method === "POST") return await saveCloudBoard(request);
      if (path.startsWith("/api/cloud/boards/") && request.method === "GET") return await getCloudBoard(request, path.split("/").pop());
      if (path.startsWith("/api/export/") && request.method === "POST") return json({ error: "La exportación se realizará en el navegador.", fallback: "browser" }, 501);
      if (path.includes("/connect") && request.method === "POST") return json({ message: "Configure las credenciales desde las variables de entorno de Vercel." }, 501);
      return json({ error: "Ruta no encontrada" }, 404);
    } catch (error) {
      if (!error.status) console.error(JSON.stringify({ level: "error", event: "api_failure", message: error.message, at: new Date().toISOString() }));
      return json({ error: error.status ? error.message : "Error interno del servidor" }, error.status || 500);
    }
  }
};

async function searchPictograms(url) {
  try {
    const result = await globalSymbols.search(url.searchParams.get("q"), url.searchParams.get("language") || "es", url.searchParams.get("page") || 1, url.searchParams.get("limit") || 24);
    return json(result);
  } catch (error) {
    if (error instanceof ExternalProviderError) return json({ error: error.message, code: error.code, provider: "globalsymbols" }, error.status);
    throw error;
  }
}

function providerStatus() {
  return {
    arasaac: { id: "arasaac", name: "ARASAAC", enabled: true, status: "unknown", message: "Disponible desde el navegador", checkedAt: null, responseTimeMs: null, authLabel: "No requerida" },
    globalsymbols: { id: "globalsymbols", name: "Global Symbols", enabled: Boolean(process.env.GLOBAL_SYMBOLS_API_KEY), status: process.env.GLOBAL_SYMBOLS_API_KEY ? "unknown" : "auth_required", message: process.env.GLOBAL_SYMBOLS_API_KEY ? "Pendiente de verificación" : "Falta GLOBAL_SYMBOLS_API_KEY", checkedAt: null, responseTimeMs: null, authLabel: "API key en Vercel" },
    opensymbols: { id: "opensymbols", name: "OpenSymbols", enabled: false, status: "disabled", message: "Integración web no configurada", checkedAt: null, responseTimeMs: null, authLabel: "Token" },
    symbotalk: { id: "symbotalk", name: "SymboTalk", enabled: false, status: "disabled", message: "Servicio externo no disponible", checkedAt: null, responseTimeMs: null, authLabel: "No requerida" }
  };
}

async function checkProviders() {
  const status = providerStatus();
  const start = Date.now();
  try {
    const response = await fetch("https://api.arasaac.org/api/pictograms/es/search/dolor", { signal: AbortSignal.timeout(8000) });
    status.arasaac.status = response.ok ? "connected" : "disconnected";
    status.arasaac.message = response.ok ? "Servicio disponible" : `HTTP ${response.status}`;
  } catch { status.arasaac.status = "disconnected"; status.arasaac.message = "No fue posible conectar"; }
  status.arasaac.responseTimeMs = Date.now() - start; status.arasaac.checkedAt = new Date().toISOString();
  if (process.env.GLOBAL_SYMBOLS_API_KEY) {
    const globalStart = Date.now();
    try { await client.search("help", "en", 1); status.globalsymbols.status = "connected"; status.globalsymbols.message = "Servicio disponible"; }
    catch (error) { status.globalsymbols.status = error.status === 429 ? "rate_limited" : "disconnected"; status.globalsymbols.message = error.message; }
    status.globalsymbols.responseTimeMs = Date.now() - globalStart; status.globalsymbols.checkedAt = new Date().toISOString();
  }
  return status;
}

async function saveCloudBoard(request) {
  requireCloudStorage();
  const key = boardKey(request);
  const body = await limitedText(request, 2 * 1024 * 1024);
  const parsed = JSON.parse(body);
  if (!parsed?.board || typeof parsed.board !== "object") return json({ error: "Tablero no válido" }, 400);
  const id = hashKey(key);
  const { put } = await import("@vercel/blob");
  const pathname = `boards/${id}.pictims`;
  await put(pathname, JSON.stringify({ board: parsed.board, savedAt: new Date().toISOString() }), { access: "private", allowOverwrite: true, contentType: "application/x-pictims+json" });
  return json({ ok: true, id, storage: "private-vercel-blob" }, 201);
}

async function getCloudBoard(request, id) {
  requireCloudStorage();
  const key = boardKey(request);
  if (!/^[a-f0-9]{64}$/.test(id) || hashKey(key) !== id) return json({ error: "Acceso no autorizado" }, 403);
  const { get } = await import("@vercel/blob");
  const result = await get(`boards/${id}.pictims`, { access: "private" });
  if (!result || result.statusCode !== 200) return json({ error: "Tablero no encontrado" }, 404);
  return new Response(result.stream, { status: 200, headers: { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "private, no-store" } });
}

async function recordMonitoringEvent(request) {
  if (process.env.ENABLE_MONITORING !== "true") return new Response(null, { status: 204, headers: SECURITY_HEADERS });
  const raw = await limitedText(request, 16 * 1024);
  let event; try { event = JSON.parse(raw); } catch { return json({ error: "Evento no válido" }, 400); }
  console.log(JSON.stringify({ level: "info", event: "client_diagnostic", type: String(event.type || "unknown").slice(0, 40), message: String(event.message || "").slice(0, 500), path: String(event.path || "").slice(0, 200), at: new Date().toISOString() }));
  return new Response(null, { status: 204, headers: SECURITY_HEADERS });
}

async function setProviderPreference(request, path) {
  const id = path.split("/")[3];
  const status = providerStatus();
  if (!status[id]) return json({ error: "Proveedor no encontrado" }, 404);
  const body = JSON.parse(await limitedText(request, 8 * 1024));
  status[id].enabled = Boolean(body.enabled);
  status[id].status = body.enabled ? status[id].status : "disabled";
  status[id].message = body.enabled ? status[id].message : "Desactivado en este navegador";
  return json(status);
}

function requireCloudStorage() {
  if (process.env.ENABLE_CLOUD_STORAGE !== "true" || !process.env.BLOB_READ_WRITE_TOKEN) {
    const error = new Error("El almacenamiento en nube no está habilitado."); error.status = 503; throw error;
  }
}
function boardKey(request) { const key = request.headers.get("x-board-key") || ""; if (!/^[A-Za-z0-9_-]{32,128}$/.test(key)) { const error = new Error("Clave de tablero no válida."); error.status = 401; throw error; } return key; }
function hashKey(key) { return createHash("sha256").update(key).digest("hex"); }
async function limitedText(request, maximum) { const declared = Number(request.headers.get("content-length") || 0); if (declared > maximum) { const error = new Error("Solicitud demasiado grande"); error.status = 413; throw error; } const text = await request.text(); if (Buffer.byteLength(text) > maximum) { const error = new Error("Solicitud demasiado grande"); error.status = 413; throw error; } return text; }
function allowRequest(request, path) { const key = `${request.headers.get("x-forwarded-for") || "unknown"}|${path.startsWith("/api/export/") ? "export" : request.method}`; const now = Date.now(); const record = counters.get(key); const maximum = path.startsWith("/api/export/") ? 5 : request.method === "GET" ? 120 : 30; if (!record || now - record.at > 60_000) { counters.set(key, { at: now, count: 1 }); return true; } record.count += 1; return record.count <= maximum; }
function json(payload, status = 200, additional = {}) { return new Response(JSON.stringify(payload), { status, headers: { ...SECURITY_HEADERS, ...JSON_HEADERS, ...additional } }); }
