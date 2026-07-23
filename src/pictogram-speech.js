const STORAGE_KEY = "pictogram-speech-enabled-v1";
const SELECTOR = ".gallery-card, .editor-cell, .predefined-pictogram-card, .cell";
let enabled = localStorage.getItem(STORAGE_KEY) === "true";
let lastSpoken = "";
let lastSpokenAt = 0;

export function initPictogramSpeech() {
  const button = document.querySelector("#speech-toggle-button");
  updateButton(button);
  button?.addEventListener("click", () => {
    enabled = !enabled;
    localStorage.setItem(STORAGE_KEY, String(enabled));
    if (!enabled) window.speechSynthesis?.cancel();
    updateButton(button);
  });

  document.addEventListener("mouseover", event => {
    if (event.target.closest("button, input, textarea, select, summary, .cell-actions, .editor-page-controls")) return;
    const card = event.target.closest(SELECTOR);
    if (card) speakCard(card);
  });

  document.addEventListener("focusin", event => {
    const card = event.target.closest(SELECTOR);
    if (card) speakCard(card);
  });

  document.addEventListener("click", event => {
    if (event.target.closest("button, input, textarea, select, summary, .cell-actions, .editor-page-controls")) return;
    const card = event.target.closest(SELECTOR);
    if (card) speakCard(card, true);
  });
}

function updateButton(button) {
  if (!button) return;
  button.setAttribute("aria-pressed", String(enabled));
  button.textContent = enabled ? "Lectura: activada" : "Lectura: desactivada";
}

function speakCard(card, force = false) {
  if (!enabled || !("speechSynthesis" in window)) return;
  const text = readableText(card);
  if (!text) return;
  const now = Date.now();
  if (!force && text === lastSpoken && now - lastSpokenAt < 1200) return;
  lastSpoken = text;
  lastSpokenAt = now;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "es-MX";
  utterance.rate = 0.9;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function readableText(card) {
  return (
    card.dataset.speakLabel ||
    card.querySelector("strong")?.textContent ||
    card.querySelector(".cell-label")?.textContent ||
    card.querySelector("img")?.alt ||
    card.getAttribute("aria-label") ||
    ""
  ).trim();
}
