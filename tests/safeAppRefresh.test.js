import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el menú incluye Actualizar sin borrar tableros guardados o en proceso", async () => {
  const html = await readFile("index.html", "utf8");
  const main = await readFile("src/main.js", "utf8");

  assert.match(html, /id="refresh-app-button"[^>]*>Actualizar/);
  assert.match(main, /refresh-app-button"\)\.addEventListener\("click", refreshApplicationCache\)/);
  assert.match(main, /async function refreshApplicationCache\(\)/);
  assert.match(main, /caches\.keys\(\)/);
  assert.match(main, /caches\.delete\(name\)/);
  assert.match(main, /navigator\.serviceWorker\.getRegistrations\(\)/);
  assert.match(main, /registration\.unregister\(\)/);
  assert.match(main, /sessionStorage\.clear\(\)/);
  assert.doesNotMatch(main, /localStorage\.clear\(\)|indexedDB\.deleteDatabase/);
});
