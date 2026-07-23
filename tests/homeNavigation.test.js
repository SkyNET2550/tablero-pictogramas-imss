import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el logotipo y la primera opciÃ³n del menÃº permiten volver al inicio", async () => {
  const html = await readFile("index.html", "utf8");
  const main = await readFile("src/main.js", "utf8");
  assert.match(html, /id="logo-upload-button"[^>]*aria-label="Volver al inicio"/);
  assert.doesNotMatch(html, /id="header-home-button"/);
  assert.match(html, /class="app-menu header-menu"/);
  assert.match(html, /id="menu-home-button"[^>]*>Inicio/);
  assert.match(main, /logo-upload-button"\)\.addEventListener\("click", goHome\)/);
  assert.match(main, /menu-home-button"\)\.addEventListener\("click", goHome\)/);
});
