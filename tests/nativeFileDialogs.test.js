import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("exportar, guardar y abrir utilizan cuadros de diálogo nativos con nombre sugerido", async () => {
  const source = await readFile("src/board-editor.js", "utf8");
  assert.match(source, /\/api\/native-dialog\/save/);
  assert.match(source, /\/api\/native-dialog\/open/);
  assert.match(source, /suggestedName/);
  assert.match(source, /safeName\(board\.title\)/);
  assert.doesNotMatch(source, /startIn:.*"documents"/);
});
