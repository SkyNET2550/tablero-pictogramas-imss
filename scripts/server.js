import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { loadEnv } from "../src/server/env.js";
import { GlobalSymbolsClient, createGlobalSymbolsService, ExternalProviderError } from "../src/server/global-symbols.js";

const root = normalize(join(import.meta.dirname, ".."));
const projectRoot = normalize(join(root, ".."));
const savedDirectory = normalize(join(projectRoot, "Guardados"));
loadEnv(join(root, ".env"));
const globalSymbolsClient = new GlobalSymbolsClient({
  apiKey: process.env.GLOBAL_SYMBOLS_API_KEY,
  baseUrl: process.env.GLOBAL_SYMBOLS_BASE_URL,
  authMode: process.env.GLOBAL_SYMBOLS_AUTH_MODE,
  timeoutMs: process.env.GLOBAL_SYMBOLS_TIMEOUT_MS
});
const globalSymbolsService = createGlobalSymbolsService({ root, client: globalSymbolsClient });
const execFileAsync = promisify(execFile);
const bundledNode = "C:\\Users\\Rosemberg\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\bin\\node.exe";
const bundledModules = "C:\\Users\\Rosemberg\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\node\\node_modules";
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8"
};
const server = createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (urlPath.startsWith("/api/")) {
    handleApi(request, response, urlPath);
    return;
  }
  let file = normalize(join(root, urlPath === "/" ? "index.html" : urlPath));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404); response.end("No encontrado"); return;
  }
  response.writeHead(200, { "Content-Type": mime[extname(file)] || "application/octet-stream", "Cache-Control": "no-cache" });
  createReadStream(file).pipe(response);
});

async function handleApi(request, response, path) {
  const requestUrl = new URL(request.url, "http://localhost");
  const send = (status, payload) => { response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" }); response.end(JSON.stringify(payload)); };
  if (request.method === "GET" && path === "/api/health") return send(200, { ok: true, app: "Pictogramas_CAA_IMSS", version: "1.0" });
  if (request.method === "GET" && path === "/api/storage") {
    await mkdir(savedDirectory, { recursive: true });
    return send(200, { ok: true, folder: "Guardados", path: savedDirectory });
  }
  if (request.method === "GET" && path === "/api/pictograms/local") {
    const data = JSON.parse(await readFile(join(root, "data/metadata/pictograms_master.json"), "utf8"));
    return send(200, data);
  }
  if (request.method === "GET" && path === "/api/pictograms/search") {
    try {
      const result = await globalSymbolsService.search(
        requestUrl.searchParams.get("q"),
        requestUrl.searchParams.get("language") || process.env.GLOBAL_SYMBOLS_DEFAULT_LANGUAGE || "es",
        requestUrl.searchParams.get("page") || 1,
        requestUrl.searchParams.get("limit") || 24
      );
      return send(200, result);
    } catch (error) {
      if (error instanceof ExternalProviderError) return send(error.status, { error: error.message, code: error.code, provider: "globalsymbols" });
      return send(502, { error: error.message, code: "provider_error", provider: "globalsymbols" });
    }
  }
  if (request.method === "GET" && path === "/api/pictograms/providers/status") return send(200, await providerStatus());
  if (request.method === "GET" && path === "/api/providers/status") return send(200, await providerStatus());
  if (request.method === "POST" && path === "/api/providers/check-all") return send(200, await checkProviders());
  if (request.method === "POST" && /^\/api\/providers\/[^/]+\/check$/.test(path)) {
    const id = path.split("/")[3]; await checkProviders(id); return send(200, await providerStatus());
  }
  if (request.method === "POST" && /^\/api\/providers\/[^/]+\/enabled$/.test(path)) {
    const id = path.split("/")[3]; const body = await readBody(request);
    const status = await providerStatus(); if (!status[id]) return send(404, { error: "Proveedor no encontrado" });
    status[id].enabled = Boolean(body.enabled); if (!body.enabled) { status[id].status = "disabled"; status[id].message = "Servicio desactivado manualmente"; }
    await writeFile(join(root, "metadata/provider_status.json"), JSON.stringify(status, null, 2)); return send(200, status);
  }
  if (request.method === "POST" && /^\/api\/providers\/[^/]+\/connect$/.test(path)) {
    const id = path.split("/")[3];
    const body = await readBody(request);
    if (!["arasaac", "opensymbols", "globalsymbols", "symbotalk"].includes(id)) return send(404, { error: "Proveedor no encontrado" });
    if (id === "globalsymbols") {
      if (!body.apiKey) return send(400, { message: "Ingresa la clave API de Global Symbols." });
      process.env.GLOBAL_SYMBOLS_API_KEY = body.apiKey;
      globalSymbolsClient.apiKey = body.apiKey;
    }
    if (id === "opensymbols") {
      if (!body.apiKey && !body.password) return send(400, { message: "Ingresa el token o secreto de OpenSymbols." });
      process.env.OPENSYMBOLS_TOKEN = body.apiKey || "";
      process.env.OPENSYMBOLS_SECRET = body.password || "";
      process.env.OPENSYMBOLS_USERNAME = body.username || "";
    }
    if (id === "symbotalk") {
      process.env.SYMBOTALK_API_KEY = body.apiKey || "";
      process.env.SYMBOTALK_USERNAME = body.username || "";
    }
    const status = await providerStatus();
    status[id].status = id === "arasaac" ? "connected" : "unknown";
    status[id].message = id === "arasaac" ? "No requiere credenciales" : "Credenciales recibidas; utiliza Verificar para comprobar la conexión";
    status[id].checkedAt = new Date().toISOString();
    await writeFile(join(root, "metadata/provider_status.json"), JSON.stringify(status, null, 2));
    return send(200, { message: status[id].message, status: status[id] });
  }
  if (request.method === "GET" && path.startsWith("/api/boards/")) {
    const id = path.split("/").pop();
    const registry = await readRegistry();
    const board = registry.find(item => item.id === id || item.board_id === id);
    return board ? send(200, board) : send(404, { error: "Tablero no encontrado" });
  }
  if (request.method === "POST" && path === "/api/boards") {
    const body = await readBody(request); const registry = await readRegistry();
    const board = { ...body, id: body.id || body.board_id || `board_${Date.now()}`, updated_at: new Date().toISOString() };
    const index = registry.findIndex(item => item.id === board.id);
    index >= 0 ? registry[index] = board : registry.push(board);
    await writeFile(join(root, "metadata/board_registry.json"), JSON.stringify(registry, null, 2));
    return send(201, board);
  }
  if (request.method === "POST" && path === "/api/boards/save-editable") {
    const body = await readBody(request);
    const board = body.board;
    if (!board || typeof board !== "object") return send(400, { error: "El tablero editable no es válido." });
    await mkdir(savedDirectory, { recursive: true });
    const baseName = safeFileName(board.title || "tablero");
    let filename = `${baseName}.json`;
    let destination = join(savedDirectory, filename);
    if (existsSync(destination)) {
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      filename = `${baseName}-${stamp}.json`;
      destination = join(savedDirectory, filename);
    }
    await writeFile(destination, JSON.stringify({ ...board, savedAt: new Date().toISOString() }, null, 2), "utf8");
    return send(201, { ok: true, filename, folder: "Guardados" });
  }
  if (request.method === "POST" && path === "/api/native-dialog/save") {
    const body = await readBody(request);
    await mkdir(savedDirectory, { recursive: true });
    const selected = await nativeDialog("save", savedDirectory, body.suggestedName, body.filter);
    if (!selected) return send(200, { cancelled: true });
    await writeFile(selected, Buffer.from(body.base64 || "", "base64"));
    return send(200, { ok: true, path: selected });
  }
  if (request.method === "POST" && path === "/api/native-dialog/open") {
    await mkdir(savedDirectory, { recursive: true });
    const selected = await nativeDialog("open", savedDirectory, "tablero.json", "Tablero editable JSON (*.json)|*.json");
    if (!selected) return send(200, { cancelled: true });
    return send(200, { ok: true, filename: selected, content: await readFile(selected, "utf8") });
  }
  if (request.method === "POST" && (path === "/api/export/docx" || path === "/api/export/png" || path === "/api/export/pdf")) {
    try {
      const format = path.endsWith("docx") ? "docx" : path.endsWith("pdf") ? "pdf" : "png";
      const body = await readBody(request);
      const token = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      const input = join(tmpdir(), `picto-${token}.json`);
      const output = join(tmpdir(), `picto-${token}.${format}`);
      await writeFile(input, JSON.stringify(body));
      await execFileAsync(bundledNode, [join(root, `scripts/export-${format}.cjs`), input, output, root], { env: { ...process.env, CODEX_NODE_MODULES: bundledModules }, timeout: 120000 });
      const data = await readFile(output);
      await mkdir(savedDirectory, { recursive: true });
      const savedFilename = uniqueSavedFilename(savedDirectory, safeFileName(body.board?.title || "tablero"), format);
      await writeFile(join(savedDirectory, savedFilename), data);
      response.writeHead(200, {
        "Content-Type": format === "docx" ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document" : format === "pdf" ? "application/pdf" : "image/png",
        "Content-Disposition": `attachment; filename="tablero.${format}"`,
        "Content-Length": data.length
      });
      response.end(data);
    } catch (error) {
      send(500, { error: error.message });
    }
    return;
  }
  if (request.method === "POST" && path.startsWith("/api/search")) return send(200, { method: "client-federated-search", available: true });
  return send(404, { error: "Ruta no encontrada" });
}
async function readBody(request) { let text = ""; for await (const chunk of request) text += chunk; return text ? JSON.parse(text) : {}; }
function safeFileName(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "tablero";
}
function uniqueSavedFilename(directory, baseName, extension) {
  const filename = `${baseName}.${extension}`;
  if (!existsSync(join(directory, filename))) return filename;
  return `${baseName}-${new Date().toISOString().replace(/[:.]/g, "-")}.${extension}`;
}
async function nativeDialog(mode, initialDirectory, suggestedName = "tablero.json", filter = "Todos los archivos (*.*)|*.*") {
  const { stdout } = await execFileAsync("powershell.exe", [
    "-NoProfile", "-STA", "-ExecutionPolicy", "Bypass",
    "-File", join(root, "scripts", "native-dialog.ps1"),
    "-Mode", mode,
    "-InitialDirectory", initialDirectory,
    "-SuggestedName", suggestedName,
    "-Filter", filter
  ], { timeout: 300000, windowsHide: false });
  return stdout.trim();
}
async function readRegistry() { try { return JSON.parse(await readFile(join(root, "metadata/board_registry.json"), "utf8")); } catch { return []; } }
async function providerStatus() {
  let saved = {}; try { saved = JSON.parse(await readFile(join(root, "metadata/provider_status.json"), "utf8")); } catch {}
  const definitions = {
    arasaac: { id: "arasaac", name: "ARASAAC", enabled: true, authLabel: "No requerida" },
    opensymbols: { id: "opensymbols", name: "OpenSymbols", enabled: true, authLabel: "Token/shared secret" },
    globalsymbols: { id: "globalsymbols", name: "Global Symbols", enabled: true, authLabel: "API key" },
    symbotalk: { id: "symbotalk", name: "SymboTalk", enabled: true, authLabel: "No requerida" }
  };
  return Object.fromEntries(Object.entries(definitions).map(([id, item]) => [id, { ...item, status: "unknown", message: "No verificado", checkedAt: null, responseTimeMs: null, ...saved[id] }]));
}
async function checkProviders(onlyId) {
  const status = await providerStatus();
  const ids = onlyId ? [onlyId] : Object.keys(status);
  for (const id of ids) {
    const item = status[id]; if (!item) continue;
    const start = Date.now();
    if (!item.enabled) { item.status = "disabled"; item.message = "Servicio desactivado manualmente"; continue; }
    if (id === "opensymbols" && !process.env.OPENSYMBOLS_SECRET && !process.env.OPENSYMBOLS_TOKEN) { item.status = "auth_required"; item.message = "Faltan credenciales"; }
    else if (id === "globalsymbols" && !process.env.GLOBAL_SYMBOLS_API_KEY) { item.status = "auth_required"; item.message = "Falta API key"; }
    else {
      try {
        if (id === "globalsymbols") {
          await globalSymbolsClient.search("help", "en", 1);
          item.status = "connected"; item.message = "Servicio disponible";
        } else {
          const url = id === "arasaac" ? "https://api.arasaac.org/api/pictograms/es/search/dolor" : id === "symbotalk" ? "https://symbotalkapiv1.azurewebsites.net/search/?name=help&lang=es&repo=all&limit=1" : null;
          const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
          item.status = response.ok ? "connected" : response.status === 401 || response.status === 403 ? "auth_error" : response.status === 429 ? "rate_limited" : "disconnected";
          item.message = response.ok ? "Servicio disponible" : `HTTP ${response.status}`;
        }
      } catch (error) { item.status = error.name === "TimeoutError" ? "timeout" : "disconnected"; item.message = error.message; }
    }
    item.responseTimeMs = Date.now() - start; item.checkedAt = new Date().toISOString();
  }
  await writeFile(join(root, "metadata/provider_status.json"), JSON.stringify(status, null, 2));
  let log=[]; try{log=JSON.parse(await readFile(join(root,"metadata/provider_connection_log.json"),"utf8"));}catch{}
  log.push(...ids.filter(id=>status[id]).map(id=>status[id])); await writeFile(join(root,"metadata/provider_connection_log.json"),JSON.stringify(log.slice(-500),null,2));
  return status;
}
server.listen(4173, "0.0.0.0", () => {
  console.log("Tableros disponibles en http://localhost:4173");
  console.log("También puede usar la dirección IP local del equipo seguida de :4173");
});
