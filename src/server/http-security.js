const counters = new Map();
const DEFAULT_LIMIT_BYTES = 2 * 1024 * 1024;
const LARGE_LIMIT_BYTES = 16 * 1024 * 1024;
const WINDOW_MS = 60_000;

export function setSecurityHeaders(response, { contentType } = {}) {
  const headers = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; img-src 'self' data: blob: https://api.arasaac.org https://static.arasaac.org https://globalsymbols.com https://*.globalsymbols.com https://symbotalkapiv1.azurewebsites.net; connect-src 'self' https://api.arasaac.org https://globalsymbols.com https://*.globalsymbols.com https://symbotalkapiv1.azurewebsites.net; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"
  };
  if (contentType) headers["Content-Type"] = contentType;
  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
}

export function applyCors(request, response, allowedOrigins) {
  const origin = request.headers.origin;
  if (!origin) return true;
  if (!allowedOrigins.has(origin)) return false;
  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Vary", "Origin");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,X-Board-Key");
  return true;
}

export function isMutationAllowed(request, allowedOrigins) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return true;
  const origin = request.headers.origin;
  return !origin || allowedOrigins.has(origin);
}

export function enforceRateLimit(request, path) {
  const now = Date.now();
  const remote = request.socket?.remoteAddress || "unknown";
  const category = path.startsWith("/api/export/") ? "export" : request.method === "GET" ? "read" : "write";
  const maximum = category === "export" ? 5 : category === "read" ? 120 : 30;
  const key = `${remote}|${category}`;
  const current = counters.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    counters.set(key, { startedAt: now, count: 1 });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  return current.count <= maximum
    ? { allowed: true, retryAfter: 0 }
    : { allowed: false, retryAfter: Math.max(1, Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000)) };
}

export async function readJsonBody(request, path) {
  const limit = path.startsWith("/api/export/") || path === "/api/native-dialog/save" ? LARGE_LIMIT_BYTES : DEFAULT_LIMIT_BYTES;
  const declared = Number(request.headers["content-length"] || 0);
  if (declared > limit) throw httpError(413, "La solicitud supera el tamaño permitido.");
  let text = "";
  let size = 0;
  for await (const chunk of request) {
    size += Buffer.byteLength(chunk);
    if (size > limit) throw httpError(413, "La solicitud supera el tamaño permitido.");
    text += chunk;
  }
  if (!text) return {};
  try { return JSON.parse(text); }
  catch { throw httpError(400, "El cuerpo JSON no es válido."); }
}

export function isLoopbackRequest(request) {
  const address = request.socket?.remoteAddress || "";
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
