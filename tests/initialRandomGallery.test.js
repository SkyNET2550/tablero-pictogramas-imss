import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("el proyecto inicia siempre en el acervo aleatorio y no en tableros predefinidos", async () => {
  const source = await readFile("src/main.js", "utf8");
  assert.match(source, /resetInitialRoute\(\);\s*initDismissibleMenu/);
  assert.match(source, /history\.replaceState\(null, "", location\.pathname \+ location\.search\)/);
  assert.match(source, /await initRandomGallery\(\{\s*onSelectPictogram/);
});
