import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("los tableros predefinidos permiten agregar pictogramas y grupos semánticos", async () => {
  const html = await readFile("index.html", "utf8");
  const source = await readFile("src/boards/predefinedBoardDetail.js", "utf8");
  assert.match(html, /id="predefined-add-dialog"/);
  assert.match(source, /Agregar grupo semántico de pictogramas/);
  assert.match(source, /Agregar pictograma/);
  assert.match(source, /searchAllProviders\(\[term\], "es", mode === "single" \? 12 : 40\)/);
  assert.match(source, /chunk\(boardPictograms\(board\), 16\)/);
  assert.match(source, /Grupo semántico:/);
});
