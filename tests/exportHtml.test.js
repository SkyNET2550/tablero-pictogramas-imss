import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("CSS respeta tamaño A4, encabezado y pie", () => {
  const css = readFileSync("styles/print-letter.css", "utf8");
  assert.match(css, /@page\s*\{\s*size:\s*A4\s+portrait/);
  assert.match(css, /\.board-header/);
  assert.match(css, /\.license/);
});

