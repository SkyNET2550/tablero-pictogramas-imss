import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("incluye botón para habilitar o deshabilitar lectura de pictogramas", async () => {
  const html = await readFile("index.html", "utf8");
  const main = await readFile("src/main.js", "utf8");
  const speech = await readFile("src/pictogram-speech.js", "utf8");

  assert.match(html, /id="speech-toggle-button"/);
  assert.match(html, /gallery-title-row/);
  assert.match(html, /<h2 id="gallery-title">Acervo de pictogramas<\/h2><button id="speech-toggle-button"/);
  assert.match(html, /aria-pressed="false"/);
  assert.doesNotMatch(html.match(/<div class="app-menu-panel">[\s\S]*?<\/div>/)?.[0] || "", /speech-toggle-button/);
  assert.match(main, /initPictogramSpeech/);
  assert.match(speech, /SpeechSynthesisUtterance/);
  assert.match(speech, /utterance\.lang = "es-MX"/);
  assert.match(speech, /mouseover/);
  assert.match(speech, /focusin/);
  assert.match(speech, /click/);
});

test("la lectura evita controles internos y respeta estado activado", async () => {
  const speech = await readFile("src/pictogram-speech.js", "utf8");

  assert.match(speech, /pictogram-speech-enabled-v1/);
  assert.match(speech, /localStorage\.getItem/);
  assert.match(speech, /localStorage\.setItem/);
  assert.match(speech, /closest\("button, input, textarea, select, summary, \.cell-actions, \.editor-page-controls"\)/);
  assert.match(speech, /if \(!enabled \|\| !\("speechSynthesis" in window\)\) return/);
  assert.match(speech, /speechSynthesis\.cancel/);
});
