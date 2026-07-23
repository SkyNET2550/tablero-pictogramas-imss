import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el panel limita la exportación a PDF, imagen y Word editable", async () => {
  const html = await readFile("index.html", "utf8");
  for (const label of ["Exportar PDF", "Exportar imagen", "Exportar Word editable", "Guardar", "Abrir tableros guardados", "Imprimir tablero"]) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(html, /Exportar HTML|Exportar JPG|Exportar PNG|Guardar copia editable|Exportar DOCX editable|Abrir tablero editable/);
});

test("el servidor genera PDF real y deja de exponer exportación JPG", async () => {
  const server = await readFile("scripts/server.js", "utf8");
  const exporter = await readFile("scripts/export-pdf.cjs", "utf8");
  assert.match(server, /api\/export\/pdf/);
  assert.match(server, /application\/pdf/);
  assert.match(exporter, /print-to-pdf/);
  assert.doesNotMatch(server, /api\/export\/jpg/);
});
