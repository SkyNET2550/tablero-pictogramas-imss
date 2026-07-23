import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("los pictogramas muestran solo acciones verticales de validar, sustituir y eliminar", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");
  const styles = await readFile("styles/print-letter.css", "utf8");

  assert.match(editor, /data-action="validate"/);
  assert.match(editor, /data-action="replace"/);
  assert.match(editor, /data-action="delete"/);
  assert.doesNotMatch(editor, /data-action="left"/);
  assert.doesNotMatch(editor, /data-action="right"/);
  assert.match(styles, /\.cell-actions \{[^}]*flex-direction: column/s);
});

test("los tableros semánticos se presentan como páginas secuenciales hacia abajo", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");
  const styles = await readFile("styles/print-letter.css", "utf8");

  assert.match(editor, /semanticSiblingBoards\(board\)/);
  assert.match(editor, /editor-page-sequence/);
  assert.match(editor, /makeBoardPage\(item, pageIndex, groupBoards\.length\)/);
  assert.match(editor, /Validar página/);
  assert.match(editor, /Eliminar página/);
  assert.match(styles, /\.editor-page-sequence \{[^}]*flex-direction: column/s);
});

test("eliminar un pictograma compacta la página y desplaza los posteriores", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");

  assert.match(editor, /function removeCellAndShift\(index\)/);
  assert.match(editor, /cells\.splice\(index, 1\)/);
  assert.match(editor, /cells\.push\(null\)/);
  assert.match(editor, /removeCellAndShift\(index\)/);
});
