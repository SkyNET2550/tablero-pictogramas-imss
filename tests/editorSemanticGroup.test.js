import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el constructor agrega grupos semánticos con páginas de 16 y mismo título", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");
  assert.match(html, /id="editor-add-semantic-group"/);
  assert.match(html, /Lista de palabras/);
  assert.match(html, /id="clear-editor-semantic"/);
  assert.match(editor, /searchAllProviders\(\[term\], "es", 40\)/);
  assert.match(editor, /index \+= 16/);
  assert.match(editor, /const sharedTitle = sentenceCase/);
  assert.match(editor, /title: sharedTitle/);
  assert.doesNotMatch(editor, /title: `\$\{base\.title\}.*Página/);
});

test("los tableros semánticos nuevos exigen guardar o se descartan al cerrar", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");
  assert.match(html, /id="save-editable-button"/);
  assert.match(editor, /semanticDraftDirty/);
  assert.match(editor, /requestEditorClose/);
  assert.match(editor, /saveCurrentEditableBoard/);
  assert.match(editor, /discardSemanticDraft/);
  assert.match(editor, /confirm\("Hay tableros creados desde un grupo semántico/);
});
