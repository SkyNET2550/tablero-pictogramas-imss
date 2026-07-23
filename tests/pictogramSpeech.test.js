import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("incluye interruptor de audio global junto al botón buscar del encabezado", async () => {
  const html = await readFile("index.html", "utf8");
  const main = await readFile("src/main.js", "utf8");
  const speech = await readFile("src/pictogram-speech.js", "utf8");

  assert.match(html, /id="speech-toggle-button"/);
  assert.match(html, /class="audio-toggle"/);
  assert.match(html, /gallery-title-row/);
  assert.match(html, /id="semantic-search"[\s\S]*aria-label="Buscar tableros">Buscar<\/button><label class="audio-toggle"[\s\S]*<span class="audio-toggle-label">Audio<\/span><input id="speech-toggle-button" type="checkbox" role="switch"[\s\S]*<span class="audio-switch"/);
  assert.doesNotMatch(html.match(/<form id="quick-search"[\s\S]*?<\/form>/)?.[0] || "", /speech-toggle-button/);
  assert.doesNotMatch(html, /Lectura: activada|Lectura: desactivada|aria-pressed="false"/);
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
  assert.match(speech, /toggle\.checked/);
  assert.match(speech, /aria-checked/);
  assert.doesNotMatch(speech, /Lectura: activada|Lectura: desactivada/);
  assert.match(speech, /closest\("button, input, textarea, select, summary, \.cell-actions, \.editor-page-controls"\)/);
  assert.match(speech, /if \(!enabled \|\| !\("speechSynthesis" in window\)\) return/);
  assert.match(speech, /speechSynthesis\.cancel/);
});
