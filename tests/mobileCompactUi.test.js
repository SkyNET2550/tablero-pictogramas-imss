import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la interfaz móvil aplica botones compactos a todas las áreas", async () => {
  const css = await readFile("styles/print-letter.css", "utf8");
  const mobile = css.slice(css.indexOf("@media screen and (max-width: 520px)"));
  assert.match(mobile, /button,\s*select\s*\{\s*min-height:\s*32px/);
  assert.match(mobile, /\.app-menu-panel button/);
  assert.match(mobile, /\.header-menu \.app-menu-panel\s*\{[^}]*left:\s*0;\s*right:\s*auto/s);
  assert.match(mobile, /\.header-theme-label\s*\{[^}]*width:\s*100%/s);
  assert.match(mobile, /\.quick-search button/);
  assert.match(mobile, /\.quick-search\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);\s*width:\s*100%/s);
  assert.match(mobile, /\.audio-toggle\s*\{[^}]*justify-content:\s*center/s);
  assert.match(mobile, /\.quick-search input\s*\{\s*grid-column:\s*1\s*\/\s*-1;\s*width:\s*100%/s);
  assert.match(mobile, /\.sidebar-actions button/);
  assert.doesNotMatch(mobile, /\.predefined-detail-navigation button/);
  assert.match(mobile, /\.brand strong\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(mobile, /\.brand span\s*\{[^}]*white-space:\s*nowrap/s);
  assert.match(mobile, /html,\s*body\s*\{[^}]*overflow-x:\s*hidden/s);
  assert.match(mobile, /\.search-box > div\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*58px/s);
  assert.match(mobile, /\.search-box input\s*\{[^}]*min-width:\s*0/s);
});
