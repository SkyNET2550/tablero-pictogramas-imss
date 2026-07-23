import test from "node:test";
import assert from "node:assert/strict";
import { expandSemanticQuery, rankSemanticPictograms } from "../src/semantic/semanticEngine.js";

test("detecta una búsqueda crítica respiratoria", () => {
  const result = expandSemanticQuery("no puedo respirar");
  assert.equal(result.urgency_level, "critica");
  assert.ok(result.detected_intents.includes("alertar_emergencia"));
  assert.ok(result.suggested_subboards.some(board => board.slug === "respiracion-signos-alarma"));
});

test("folio prioriza trámites y seguimiento", () => {
  const result = expandSemanticQuery("necesito seguimiento de mi folio");
  assert.equal(result.suggested_boards[0].slug, "tramites-atencion-institucional");
  assert.ok(result.suggested_subboards.some(board => board.slug === "quejas-aclaraciones-seguimiento"));
});

test("sed relaciona agua y conserva texto alternativo", () => {
  const expansion = expandSemanticQuery("sed");
  const results = rankSemanticPictograms([{ label: "Agua", altText: "Vaso de agua", license: "CC", providerName: "ARASAAC" }], expansion);
  assert.equal(results[0].label, "Agua");
  assert.ok(results[0].altText);
  assert.ok(results[0].matchReasons.length);
});

test("sismo prioriza evacuación y seguridad", () => {
  const result = expandSemanticQuery("hay un sismo");
  assert.equal(result.urgency_level, "critica");
  assert.equal(result.suggested_boards[0].slug, "emergencia-seguridad");
  assert.ok(result.suggested_subboards.some(board => board.slug === "evacuacion-proteccion-civil"));
});
