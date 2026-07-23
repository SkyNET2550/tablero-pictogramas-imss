import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export class ExternalProviderError extends Error {
  constructor(message, status = 502, code = "provider_error") {
    super(message); this.name = "ExternalProviderError"; this.status = status; this.code = code;
  }
}

export function normalizeGlobalSymbol(item, query = "") {
  const picto = item?.picto || {};
  const set = picto.symbolset || {};
  return {
    provider: "globalsymbols",
    remoteId: String(picto.id ?? item.id),
    label: item.text_diacritised || item.text || query,
    speechText: item.text_diacritised || item.text || query,
    description: item.description || "",
    language: item.language || "",
    imageUrl: picto.preview_data_url || picto.image_url || "",
    symbolSet: set.name || set.slug || String(picto.symbolset_id || ""),
    license: set.licence?.name || set.license?.name || set.license || "Consultar licencia del conjunto",
    author: set.publisher || set.author || set.name || "Global Symbols",
    attribution: `${set.name || "Global Symbols"} / Global Symbols`,
    raw: item
  };
}

export class GlobalSymbolsClient {
  constructor({ apiKey, baseUrl = "https://globalsymbols.com/api/v2", authMode = "x-api-key", timeoutMs = 10000, fetchImpl = fetch } = {}) {
    this.apiKey = apiKey; this.baseUrl = baseUrl.replace(/\/$/, ""); this.authMode = authMode; this.timeoutMs = Number(timeoutMs); this.fetchImpl = fetchImpl;
  }
  headers() {
    if (!this.apiKey) throw new ExternalProviderError("Falta GLOBAL_SYMBOLS_API_KEY", 503, "auth_required");
    return this.authMode === "authorization" ? { Authorization: `ApiKey ${this.apiKey}` } : { "X-Api-Key": this.apiKey };
  }
  async search(query, language = "es", limit = 24) {
    const url = new URL(`${this.baseUrl}/labels/search`);
    url.searchParams.set("query", query); url.searchParams.set("language", language);
    url.searchParams.set("language_iso_format", "639-1"); url.searchParams.set("limit", String(limit));
    url.searchParams.set("include_preview", "true");
    const response = await this.fetchImpl(url, { headers: this.headers(), signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) throw new ExternalProviderError(`Global Symbols respondió HTTP ${response.status}`, response.status, response.status === 401 || response.status === 403 ? "auth_error" : response.status === 429 ? "rate_limited" : "provider_error");
    const data = await response.json();
    if (!Array.isArray(data)) throw new ExternalProviderError("Respuesta no válida de Global Symbols", 502, "invalid_response");
    return data;
  }
}

export function createGlobalSymbolsService({ root, client }) {
  const cacheDir = join(root, "cache/api_responses/globalsymbols");
  return {
    async search(query, language = "es", page = 1, limit = 24) {
      const clean = String(query || "").trim();
      if (clean.length < 2) throw new ExternalProviderError("La búsqueda debe tener al menos 2 caracteres", 400, "invalid_query");
      const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 50);
      const key = Buffer.from(`${clean.toLowerCase()}|${language}|${page}|${safeLimit}`).toString("base64url");
      const file = join(cacheDir, `${key}.json`);
      try {
        const cached = JSON.parse(await readFile(file, "utf8"));
        const ttl = cached.items.length ? 86400000 : 1800000;
        if (Date.now() - cached.savedAt < ttl) return { ...cached, cached: true };
      } catch {}
      const raw = await client.search(clean, language, safeLimit);
      const items = raw.map(item => normalizeGlobalSymbol(item, clean)).filter(item => item.imageUrl);
      const payload = { provider: "globalsymbols", query: clean, language, page: Number(page) || 1, limit: safeLimit, total: items.length, items, savedAt: Date.now(), cached: false };
      await mkdir(cacheDir, { recursive: true }); await writeFile(file, JSON.stringify(payload));
      return payload;
    }
  };
}
