import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la búsqueda semántica abre tableros y no ejecuta la búsqueda rápida", async () => {
  const main = await readFile("src/main.js", "utf8");
  const searchBlock = main.slice(main.indexOf("async function search(query)"), main.indexOf("function escapeHtml"));
  assert.match(searchBlock, /showSemanticBoards\(suggested\)/);
  assert.match(searchBlock, /location\.hash = "tableros-predefinidos"/);
  assert.doesNotMatch(searchBlock, /quick-search/);
  assert.doesNotMatch(searchBlock, /requestSubmit/);
});

test("los campos explican sus funciones diferentes", async () => {
  const html = await readFile("index.html", "utf8");
  assert.match(html, /Búsqueda semántica o temática de tableros/);
  assert.match(html, /Buscar pictogramas por texto o título/);
});
