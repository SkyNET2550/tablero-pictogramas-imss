import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el constructor permite agregar una página desde los controles de la página", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");

  assert.doesNotMatch(html, /editor-add-blank-page|Agregar página en blanco/);
  assert.match(editor, /data-page-action="add">Agregar p.gina/);
  assert.match(editor, /function addBlankPage\(sourceBoardId = activeId\)/);
  assert.match(editor, /boards\.find\(item => item\.id === sourceBoardId\)/);
  assert.match(editor, /manualBlankPage:\s*true/);
  assert.match(editor, /semanticParentId:\s*root\.id/);
  assert.match(editor, /cells:\s*Array\(CELLS_PER_PAGE\)\.fill\(null\)/);
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
  assert.match(editor, /safeSetLocalStorage\(AUTOSAVE_KEY/);
  assert.match(editor, /function safeSetLocalStorage\(key, value\)/);
  assert.match(editor, /isStorageQuotaError\(error\)/);
  assert.match(editor, /localStorage\.removeItem\(key\)/);
});
