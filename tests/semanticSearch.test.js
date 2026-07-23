import test from "node:test";
import assert from "node:assert/strict";
import { normalizeText } from "../src/semantic/textNormalizer.js";
import { expandSynonyms } from "../src/semantic/synonymExpander.js";
import { mapIntents } from "../src/semantic/intentMapper.js";
import synonyms from "../data/dictionaries/synonyms_es.json" with { type: "json" };
import intents from "../data/intents/intent_map_es.json" with { type: "json" };

test("normaliza acentos, signos y stopwords", () => {
  assert.deepEqual(normalizeText("¡Me siento mal y necesito ayuda!", ["y"]).tokens, ["me", "siento", "mal", "necesito", "ayuda"]);
});
test("expande dolor de panza", () => assert.ok(expandSynonyms("dolor de panza", synonyms).includes("dolor")));
test("mapea intención no puedo respirar", () => {
  const result = mapIntents("no puedo respirar", intents);
  for (const expected of ["respirar", "emergencia", "hospital", "ambulancia"]) assert.ok(result.includes(expected));
});
