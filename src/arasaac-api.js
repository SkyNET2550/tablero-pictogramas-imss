import { ARASAAC_SEARCH_BASE, DEFAULT_LANGUAGE } from "./config.js";

export async function searchPictograms(term, language = DEFAULT_LANGUAGE, limit = 6) {
  const alternatives = SEARCH_ALIASES[term.toLocaleLowerCase("es")] || [];
  const words = term.split(/\s+/).filter(word => word.length > 3);
  const candidates = [...new Set([term, ...alternatives, ...words])];
  for (const candidate of candidates) {
    const url = `${ARASAAC_SEARCH_BASE}/${language}/search/${encodeURIComponent(candidate)}`;
    const response = await fetch(url);
    if (response.status === 404) continue;
    if (!response.ok) throw new Error(`ARASAAC respondió ${response.status} al buscar “${candidate}”`);
    const results = await response.json();
    if (Array.isArray(results) && results.length) return results.slice(0, limit);
  }
  return [];
}

export function getPictogramImageUrl(id) {
  return `${ARASAAC_SEARCH_BASE}/${encodeURIComponent(id)}?download=false`;
}

export async function resolvePictogram(term, manualSelections = {}, language = DEFAULT_LANGUAGE) {
  const key = term.toLocaleLowerCase("es");
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("arasaac-concept-selections-v1")) || {}; } catch {}
  const manual = saved[key] || manualSelections[key];
  if (manual?.imageData) return { imageData: manual.imageData, manual: true, label: manual.label, source: manual.source };
  if (manual?.imageUrl) return { _id: manual.id, imageUrl: manual.imageUrl, manual: true, label: manual.label, source: manual.source, provider: manual.provider };
  if (manual?.id) return { _id: manual.id, manual: true, label: manual.label };
  try {
    const results = await searchPictograms(term, language);
    return results[0] || null;
  } catch (error) {
    console.warn(error.message);
    return null;
  }
}

const SEARCH_ALIASES = {
  "lengua de señas": ["lengua de signos", "signar"],
  "dolor de barriga": ["dolor de estómago", "dolor abdominal", "barriga"],
  "dolor fuerte": ["mucho dolor", "dolor"],
  "dolor leve": ["poco dolor", "dolor"],
  "hinchazón": ["inflamación"],
  "náuseas": ["náusea", "ganas de vomitar"],
  "pérdida de apetito": ["sin hambre", "apetito"],
  "infección intestinal": ["infección", "intestino"],
  "intoxicación alimentaria": ["intoxicación", "comida en mal estado"],
  "parásitos intestinales": ["parásitos", "lombrices"],
  "ruta de evacuación": ["evacuación", "salida de emergencia"],
  "seguir instrucciones": ["obedecer", "instrucciones"],
  "teléfono de emergencia": ["teléfono", "emergencia"]
};
