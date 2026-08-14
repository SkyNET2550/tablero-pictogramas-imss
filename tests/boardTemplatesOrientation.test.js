import { readFile } from "node:fs/promises";
import test from "node:test";
import assert from "node:assert/strict";

test("el constructor integra plantillas PNG y disposición horizontal", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");
  const css = await readFile("styles/print-letter.css", "utf8");

  assert.match(html, /id="board-orientation-select"[\s\S]*Vertical[\s\S]*Horizontal/);
  assert.match(html, /id="use-horizontal-template-button"[\s\S]*Plantilla horizontal IMSS/);
  assert.match(html, /id="template-file-input"[^>]+accept="image\/png,\.png"/);
  assert.match(editor, /HORIZONTAL_TEMPLATE_URL/);
  assert.match(editor, /function defaultTemplates\(\)/);
  assert.match(editor, /function pageCellCount/);
  assert.match(editor, /templates\.landscape = await loadDefaultHorizontalTemplate\(\)/);
  assert.match(editor, /function redistributeRootPages/);
  assert.match(editor, /boardPageCells\(board\)\.forEach/);
  assert.match(css, /\.editor-page-sheet\.landscape/);
  assert.match(css, /background-image: var\(--board-template-image\)/);
  assert.match(css, /width: 11in; height: 8\.5in/);
});
