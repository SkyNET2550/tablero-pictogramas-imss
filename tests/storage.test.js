import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
test("existe almacenamiento por proveedor", () => {
  for (const provider of ["arasaac", "opensymbols", "globalsymbols", "symbotalk"]) {
    for (const folder of ["raw", "normalized", "by_category", "metadata"]) assert.ok(existsSync(`pictograms/${provider}/${folder}`));
  }
});
test("índice maestro conserva licencia", () => {
  const items = JSON.parse(readFileSync("data/metadata/pictograms_master.json", "utf8"));
  assert.ok(items.length >= 88);
  assert.ok(items.every(item => item.provider && item.license && item.attribution));
});
