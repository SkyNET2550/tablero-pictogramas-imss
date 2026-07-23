import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("la interfaz no muestra ni inicializa audio por ahora", async () => {
  const html = await readFile("index.html", "utf8");
  const main = await readFile("src/main.js", "utf8");
  const css = await readFile("styles/print-letter.css", "utf8");

  assert.doesNotMatch(html, /speech-toggle-button|audio-toggle|audio-switch|>Audio</);
  assert.doesNotMatch(main, /initPictogramSpeech|pictogram-speech/);
  assert.doesNotMatch(css, /audio-toggle|audio-switch|speech-toggle/);
});
