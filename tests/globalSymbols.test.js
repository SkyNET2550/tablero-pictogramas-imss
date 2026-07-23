import test from "node:test";
import assert from "node:assert/strict";
import { GlobalSymbolsClient, normalizeGlobalSymbol, createGlobalSymbolsService } from "../src/server/global-symbols.js";

test("la credencial de Global Symbols viaja en X-Api-Key", async () => {
  let request;
  const client = new GlobalSymbolsClient({ apiKey: "secreto", fetchImpl: async (url, options) => {
    request = { url: String(url), options };
    return { ok: true, json: async () => [] };
  }});
  await client.search("ayuda", "es", 12);
  assert.equal(request.options.headers["X-Api-Key"], "secreto");
  assert.match(request.url, /\/api\/v2\/labels\/search/);
  assert.match(request.url, /include_preview=true/);
});

test("normaliza un resultado al modelo común", () => {
  const result = normalizeGlobalSymbol({ id: 4, text: "help", language: "en", picto: { id: 9, image_url: "https://example.test/9.svg", symbolset: { name: "Mulberry" } } });
  assert.equal(result.provider, "globalsymbols");
  assert.equal(result.remoteId, "9");
  assert.equal(result.speechText, "help");
  assert.equal(result.symbolSet, "Mulberry");
});

test("rechaza búsquedas demasiado cortas antes de consultar al proveedor", async () => {
  const service = createGlobalSymbolsService({ root: ".", client: { search: async () => { throw new Error("no debe ejecutarse"); } } });
  await assert.rejects(() => service.search("a"), /al menos 2 caracteres/);
});
