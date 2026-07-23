import test from "node:test";
import assert from "node:assert/strict";
import { seedBoards } from "../src/data/boards/seedBoards.js";
import { calculatePictogramMatchScore, matchPictogramsToBoard } from "../src/boards/pictogramMatcher.js";

const board = seedBoards.find(item => item.slug === "alimentacion-e-hidratacion");
const request = { requiredConcepts: ["agua", "sed", "comida"] };

test("asocia una coincidencia exacta con licencia y texto alternativo", () => {
  const pictogram = { id: "1", source: "arasaac", label: "agua", altText: "Vaso de agua para pedir una bebida", license: "CC BY-NC-SA", context: ["hospital"], communicationIntent: ["request"] };
  assert.ok(calculatePictogramMatchScore({ pictogram, board, seedRequest: request }) >= 80);
  assert.equal(matchPictogramsToBoard([pictogram], board, request).length, 1);
});

test("excluye resultados sin licencia o texto alternativo", () => {
  const invalid = { id: "2", source: "other", label: "agua", altText: "", license: "" };
  assert.equal(matchPictogramsToBoard([invalid], board, request).length, 0);
});
