import test from "node:test";
import assert from "node:assert/strict";
import { seedBoards, mainBoards, childrenOf } from "../src/data/boards/seedBoards.js";
import { pictogramSeedRequests } from "../src/data/pictograms/pictogramSeedRequests.js";

test("crea cinco tableros principales y todos sus subtableros", () => {
  assert.equal(mainBoards.length, 5);
  assert.equal(mainBoards[1].slug, "atencion-medica");
  assert.equal(seedBoards.filter(board => board.level === "subboard").length, 36);
  assert.equal(pictogramSeedRequests.length, 36);
});

test("cada subtablero conserva relación padre-hijo y accesibilidad", () => {
  for (const main of mainBoards) {
    const children = childrenOf(main.id);
    assert.ok(children.length >= 6);
    assert.ok(children.every(board => board.parentId === main.id));
    assert.ok(children.every(board => board.accessibility.minimumTouchTargetPx === 48));
    assert.ok(children.every(board => board.semanticKeywords.length > 0));
  }
});

test("las categorías sensibles exigen revisión humana", () => {
  const sensitive = seedBoards.filter(board => /violencia|medicamentos|alarma|consentimiento|derechos/.test(board.slug));
  assert.ok(sensitive.length >= 4);
  assert.ok(sensitive.every(board => board.requiresManualReview));
});
