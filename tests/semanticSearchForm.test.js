import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el buscador semántico conserva envío con Enter", async () => {
  const html = await readFile("index.html", "utf8");
  assert.match(html, /<form id="semantic-search"[^>]*>/);
  assert.match(html, /<input id="search-input" type="search"/);
  assert.match(html, /<button type="submit">Buscar<\/button>/);
  assert.match(html, /Búsqueda semántica o temática/);
  assert.match(html, /V\. 1\.0/);
  assert.doesNotMatch(html, /UV\. 1\.0/);
});
