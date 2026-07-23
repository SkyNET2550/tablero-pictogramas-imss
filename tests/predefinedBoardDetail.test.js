import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la vista de detalle no incluye la barra de navegaciÃ³n eliminada", async () => {
  const html = await readFile("index.html", "utf8");
  assert.doesNotMatch(html, /predefined-detail-navigation|predefined-previous-button|predefined-next-button/);
});

test("el tablero predefinido se presenta en cuadrÃ­cula carta imprimible", async () => {
  const css = await readFile("styles/print-letter.css", "utf8");
  const module = await readFile("src/boards/predefinedBoardDetail.js", "utf8");
  assert.match(css, /\.predefined-letter-page/);
  assert.match(css, /body\.print-predefined/);
  assert.match(module, /chunk\(boardPictograms\(board\), 16\)/);
});

test("cada tema genera todas sus pÃ¡ginas y permite imprimir desde el encabezado contextual", async () => {
  const module = await readFile("src/boards/predefinedBoardDetail.js", "utf8");
  const html = await readFile("index.html", "utf8");
  const css = await readFile("styles/print-letter.css", "utf8");
  assert.match(module, /showSequence\(subboards\.filter/);
  assert.match(module, /showSequence\(sequence\.length \? sequence : subboards\)/);
  assert.match(html, /id="hierarchy-print-button"[^>]*>Imprimir tablero/);
  assert.match(module, /hierarchy-print-button/);
  assert.match(module, /searchAllProviders\(queries, "es", 8\)/);
  assert.match(module, /semanticQueries\(board\)/);
  assert.match(css, /\.print-target/);
});
