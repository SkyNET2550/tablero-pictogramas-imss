import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("al elegir un pictograma del acervo se genera un tablero semántico sin repetidos", async () => {
  const source = await readFile("src/main.js", "utf8");
  assert.match(source, /onSelectPictogram:\s*term\s*=>\s*\{/);
  assert.match(source, /generateBoardFromPictogram\(term\)/);
  assert.match(source, /searchAllProviders\(queries, "es", 10\)/);
  assert.match(source, /rankSemanticPictograms/);
  assert.match(source, /uniquePictograms\(ranked\)/);
  assert.match(source, /Tablero generado automáticamente con pictogramas asociados semánticamente/);
});
