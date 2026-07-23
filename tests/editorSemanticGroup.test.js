import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el constructor agrega grupos semánticos y crea páginas de 16 pictogramas", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");
  assert.match(html, /id="editor-add-semantic-group"/);
  assert.match(html, /Lista de palabras/);
  assert.match(html, /id="clear-editor-semantic"/);
  assert.match(editor, /searchAllProviders\(\[term\], "es", 40\)/);
  assert.match(editor, /index \+= 16/);
  assert.match(editor, /Página \$\{Math\.floor\(index \/ 16\) \+ 1\}/);
});
