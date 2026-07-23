import test from "node:test";
import assert from "node:assert/strict";
import { deduplicatePictograms, hasPictogramDuplicate, removeBoardDuplicates } from "../src/pictogram-identity.js";

test("impide repetir la misma imagen aunque cambie la etiqueta", () => {
  const first = { imageUrl: "https://api.example.test/img/123.png", label: "Dolor" };
  const repeated = { imageUrl: "https://api.example.test/img/123.png?size=500", label: "Me duele" };
  assert.equal(deduplicatePictograms([first, repeated]).length, 1);
  assert.equal(hasPictogramDuplicate([first], repeated), true);
});

test("permite dos imágenes distintas para un mismo concepto", () => {
  const items = [
    { imageUrl: "/img/dolor-1.png", label: "Dolor" },
    { imageUrl: "/img/dolor-2.png", label: "Dolor" }
  ];
  assert.equal(deduplicatePictograms(items).length, 2);
});

test("limpia duplicados al abrir un tablero editable", () => {
  const repeated = { provider: "arasaac", id: 55, label: "Ayuda" };
  const cells = removeBoardDuplicates([repeated, { ...repeated }, null], 4);
  assert.equal(cells.filter(Boolean).length, 1);
  assert.equal(cells.length, 4);
});

test("al sustituir se ignora la celda actual pero no las demás", () => {
  const a = { imageUrl: "/a.png" };
  const b = { imageUrl: "/b.png" };
  assert.equal(hasPictogramDuplicate([a, b], a, 0), false);
  assert.equal(hasPictogramDuplicate([a, b], b, 0), true);
});
