import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el encabezado alinea MenÃº, bÃºsqueda y cinco tÃ­tulos temÃ¡ticos compactos", async () => {
  const html = await readFile("index.html", "utf8");
  const hierarchy = await readFile("src/boards/boardHierarchy.js", "utf8");
  assert.match(html, /<details class="app-menu header-menu">/);
  assert.match(html, /class="app-menu header-menu"/);
  assert.match(html, /id="header-theme-labels"/);
  assert.doesNotMatch(html, /id="clear-semantic-search"/);
  assert.match(hierarchy, /headerThemes\.append\(headerButton\)/);
  assert.match(hierarchy, /onSelectHeaderTheme\(board\)/);
});

test("el activador del menÃº usa tres lÃ­neas y no el icono de inicio", async () => {
  const html = await readFile("index.html", "utf8");
  assert.match(html, /<summary title="Menú"[^>]*><span aria-hidden="true">☰<\/span><\/summary>/);
  assert.doesNotMatch(html, /<summary[^>]*>.*⌂/);
});

test("los botones del encabezado abren directamente la secuencia del tema", async () => {
  const detail = await readFile("src/boards/predefinedBoardDetail.js", "utf8");
  const main = await readFile("src/main.js", "utf8");
  assert.match(detail, /showTheme\(parentId\)/);
  assert.match(detail, /filter\(board => board\.parentId === parentId\)/);
  assert.match(main, /predefinedDetailController\.showTheme\(board\.id\)/);
});

test("los botones de temÃ¡ticas globales abren la misma secuencia completa", async () => {
  const hierarchy = await readFile("src/boards/boardHierarchy.js", "utf8");
  assert.match(hierarchy, /Mostrar todos los tableros de/);
  assert.match(hierarchy, /themeButton\.addEventListener\("click", \(\) => onSelectHeaderTheme\(board\)\)/);
});

test("la navegaciÃ³n temÃ¡tica del encabezado tiene adaptaciÃ³n mÃ³vil", async () => {
  const css = await readFile("styles/print-letter.css", "utf8");
  assert.match(css, /\.header-theme-labels/);
  assert.match(css, /grid-template-columns:\s*1fr 1fr/);
  assert.match(css, /\.header-theme-label\s*\{[^}]*min-height:\s*34px/s);
});

