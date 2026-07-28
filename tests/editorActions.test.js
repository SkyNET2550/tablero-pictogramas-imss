import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el panel separa guardar de acciones y limita exportaciones", async () => {
  const html = await readFile("index.html", "utf8");
  for (const label of ["Exportar PDF", "Exportar imagen", "Exportar Word editable", "Guardar", "Abrir tableros guardados", "Imprimir tablero"]) {
    assert.match(html, new RegExp(label));
  }
  assert.match(html, /sidebar-save-actions/);
  assert.match(html, /<h3>Guardar<\/h3>[\s\S]*id="save-editable-button"[\s\S]*id="open-editable-button"[\s\S]*id="delete-board-button"/);
  assert.match(html, /<h3>Acciones<\/h3>[\s\S]*id="export-pdf-button"[\s\S]*id="export-image-button"[\s\S]*id="export-docx-button"[\s\S]*id="print-current-button"/);
  assert.doesNotMatch(html, /duplicate-board-button|Duplicar tablero|Exportar HTML|Exportar JPG|Exportar PNG|Guardar copia editable|Exportar DOCX editable|Abrir tablero editable/);
});

test("el servidor genera PDF real y deja de exponer exportación JPG", async () => {
  const server = await readFile("scripts/server.js", "utf8");
  const exporter = await readFile("scripts/export-pdf.cjs", "utf8");
  assert.match(server, /api\/export\/pdf/);
  assert.match(server, /application\/pdf/);
  assert.match(exporter, /print-to-pdf/);
  assert.doesNotMatch(server, /api\/export\/jpg/);
});

test("la exportación Word conserva tamaño fijo de pictogramas", async () => {
  const editor = await readFile("src/board-editor.js", "utf8");
  const docx = await readFile("scripts/export-docx.cjs", "utf8");

  assert.match(editor, /function makeWordCompatibleHtml\(board\)/);
  assert.match(editor, /table-layout:fixed/);
  assert.match(editor, /width="132" height="118"/);
  assert.match(editor, /margin:\.22in \.34in \.25in/);
  assert.doesNotMatch(editor, /td img\{max-width|max-height:95pt/);
  assert.match(docx, /HeightRule\.EXACT/);
  assert.match(docx, /TABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT/);
  assert.match(docx, /transformation:\s*\{\s*width:\s*132,\s*height:\s*118\s*\}/);
});
