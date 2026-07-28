import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el constructor permite agregar una página en blanco al tablero activo", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");

  assert.match(html, /id="editor-add-blank-page"[^>]*>Agregar página en blanco/);
  assert.match(editor, /function addBlankPage\(\)/);
  assert.match(editor, /manualBlankPage:\s*true/);
  assert.match(editor, /semanticParentId:\s*root\.id/);
  assert.match(editor, /cells:\s*Array\(16\)\.fill\(null\)/);
});

test("el editor mueve pictogramas entre páginas disponibles", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");

  assert.match(editor, /let draggedCell = null/);
  assert.match(editor, /draggedCell = \{ boardId, index \}/);
  assert.match(editor, /function moveSlot\(fromBoardId, fromIndex, toBoardId, toIndex\)/);
  assert.match(editor, /\[fromBoard\.cells\[fromIndex\], toBoard\.cells\[toIndex\]\] = \[toBoard\.cells\[toIndex\], fromBoard\.cells\[fromIndex\]\]/);
});

test("el tablero abierto se autosguarda silenciosamente cada minuto", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");

  assert.match(editor, /arasaac-custom-boards-autosave-v1/);
  assert.match(editor, /setInterval\(autosaveCurrentEditor,\s*60000\)/);
  assert.match(editor, /function autosaveCurrentEditor\(\)/);
  assert.match(editor, /if \(!editor\.open \|\| !editorDirty\) return/);
  assert.match(editor, /localStorage\.setItem\(AUTOSAVE_KEY/);
});
