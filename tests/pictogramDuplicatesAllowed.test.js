import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el editor permite repetir pictogramas e imágenes PNG en el mismo tablero", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");
  assert.doesNotMatch(editor, /hasPictogramDuplicate/);
  assert.doesNotMatch(editor, /removeBoardDuplicates/);
  assert.doesNotMatch(editor, /Este pictograma ya está incluido/);
});

test("los tableros predefinidos no eliminan resultados repetidos por identidad", async () => {
  const predefined = await readFile("src/boards/predefinedBoardDetail.js", "utf8");
  assert.doesNotMatch(predefined, /deduplicatePictograms/);
});
