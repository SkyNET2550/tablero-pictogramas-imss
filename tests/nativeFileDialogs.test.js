import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("exportar, guardar y abrir usan cuadros nativos en local y descarga del navegador en línea", async () => {
  const source = await readFile("src/board-editor.js", "utf8");
  assert.match(source, /\/api\/native-dialog\/save/);
  assert.match(source, /\/api\/native-dialog\/open/);
  assert.match(source, /usesNativeDialogs/);
  assert.match(source, /127\.0\.0\.1/);
  assert.match(source, /localhost/);
  assert.match(source, /saveWithBrowser/);
  assert.match(source, /showSaveFilePicker/);
  assert.match(source, /link\.download = suggestedName/);
  assert.match(source, /safeName\(board\.title\)/);
  assert.doesNotMatch(source, /startIn:.*"documents"/);
});
