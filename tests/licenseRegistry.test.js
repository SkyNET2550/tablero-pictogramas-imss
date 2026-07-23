import test from "node:test";
import assert from "node:assert/strict";
import { INSTITUTIONAL_FOOTER } from "../src/config.js";
test("pie menciona proveedores y finalidad no comercial", () => {
  for (const text of ["Instituto Mexicano del Seguro Social", "no comerciales", "ARASAAC", "OpenSymbols", "Global Symbols", "SymboTalk"]) assert.match(INSTITUTIONAL_FOOTER, new RegExp(text));
});
