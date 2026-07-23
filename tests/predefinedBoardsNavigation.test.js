import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("los tableros temáticos abren su índice independiente", async () => {
  const html = await readFile("index.html", "utf8");
  const main = await readFile("src/main.js", "utf8");
  assert.match(html, /id="global-board-types"/);
  assert.match(html, /id="thematic-boards-button"/);
  assert.match(html, /id="predefined-boards-button"[^>]*>Tableros predefinidos/);
  assert.match(main, /location\.hash = "tableros-tematicos"/);
  assert.match(main, /function showThematicIndex\(\)/);
  assert.match(main, /predefined-detail"\)\.hidden = true/);
  assert.doesNotMatch(html, /id="topic-buttons"/);
});

test("los tableros predefinidos viven en una vista independiente y son editables", async () => {
  const html = await readFile("index.html", "utf8");
  const editor = await readFile("src/board-editor.js", "utf8");
  assert.match(html, /id="predefined-view"[^>]*hidden/);
  assert.doesNotMatch(html, /id="predefined-home-button"/);
  assert.match(editor, /export function openPredefinedBoardEditor/);
});

test("el diseño incluye puntos de adaptación para tableta y celular", async () => {
  const css = await readFile("styles/print-letter.css", "utf8");
  assert.match(css, /max-width:\s*850px/);
  assert.match(css, /max-width:\s*520px/);
  assert.match(css, /\.global-board-types/);
});
