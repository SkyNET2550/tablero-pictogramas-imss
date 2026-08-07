import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("los pictogramas muestran acciones verticales y editan la etiqueta desde el texto", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");
  const styles = await readFile("styles/print-letter.css", "utf8");

  assert.doesNotMatch(editor, /data-action="validate"/);
  assert.doesNotMatch(editor, /Quitar validaci/);
  assert.doesNotMatch(editor, /data-action="edit-label"/);
  assert.doesNotMatch(editor, />Editar nombre</);
  assert.match(editor, /function editCellLabel\(article, cell\)/);
  assert.match(editor, /cell-label-editor/);
  assert.match(editor, /label\.replaceWith\(input\)/);
  assert.match(editor, /querySelector\("strong"\)\.addEventListener\("click"/);
  assert.doesNotMatch(editor, /prompt\("Editar nombre del pictograma"/);
  assert.match(editor, /data-action="replace"/);
  assert.match(editor, /data-action="delete"/);
  assert.doesNotMatch(editor, /data-action="left"/);
  assert.doesNotMatch(editor, /data-action="right"/);
  assert.match(styles, /\.cell-actions \{[^}]*flex-direction: column/s);
  assert.doesNotMatch(styles, /editor-cell\.validated::after/);
});

test("los tableros semánticos se presentan como páginas secuenciales hacia abajo", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");
  const styles = await readFile("styles/print-letter.css", "utf8");

  assert.match(editor, /semanticSiblingBoards\(board\)/);
  assert.match(editor, /editor-page-sequence/);
  assert.match(editor, /makeBoardPage\(item, pageIndex, groupBoards\.length\)/);
  assert.match(editor, /Validar p.gina/);
  assert.match(editor, /Eliminar p.gina/);
  assert.match(editor, /data-page-action="add">Agregar p.gina/);
  assert.match(styles, /\.editor-page-sequence \{[^}]*flex-direction: column/s);
});

test("eliminar un pictograma compacta la página y desplaza los posteriores", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");

  assert.match(editor, /function removeCellAndShift\(index\)/);
  assert.match(editor, /cells\.splice\(index, 1\)/);
  assert.match(editor, /cells\.push\(null\)/);
  assert.match(editor, /removeCellAndShift\(index\)/);
});
