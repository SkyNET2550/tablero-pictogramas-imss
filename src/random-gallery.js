const MAX_ITEMS = 30;
import { searchAllProviders } from "./providers/provider-registry.js";
import { expandQuery, loadSemanticData } from "./semantic/semantic-data.js";
import { expandSemanticQuery, rankSemanticPictograms } from "./semantic/semanticEngine.js";

export async function initRandomGallery({ onSelectPictogram } = {}) {
  const container = document.querySelector("#random-pictograms");
  const section = document.querySelector("#initial-gallery");
  const response = await fetch("./data/pictogramas-metadata.json");
  const metadata = response.ok ? await response.json() : {};
  const records = Object.values(metadata).filter(item => item.id && item.group && item.term);
  const semanticData = await loadSemanticData();
  const quickForm = document.querySelector("#quick-search");
  const quickInput = document.querySelector("#quick-search-input");

  function render(items = shuffle(records).slice(0, MAX_ITEMS)) {
    container.replaceChildren();
    items.slice(0, MAX_ITEMS).forEach(item => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";
      const filename = slug(item.term);
      card.innerHTML = `<img src="./assets/pictograms/${item.group}/${filename}.png" alt="${escapeHtml(item.term)}"><strong>${sentenceCase(item.term)}</strong><small>${escapeHtml(item.source || item.provider || "ARASAAC")}</small>`;
      card.setAttribute("aria-label", `Ver tableros relacionados con ${item.term}`);
      card.addEventListener("click", () => onSelectPictogram?.(item.term));
      container.append(card);
    });
    section.hidden = records.length === 0;
  }
  document.querySelector("#refresh-gallery-button").addEventListener("click", () => render());
  quickForm.addEventListener("submit", async event => {
    event.preventDefault();
    await federatedSearch(quickInput.value);
  });
  quickInput.addEventListener("input", () => {
    if (!quickInput.value.trim()) render();
  });
  document.querySelector("#clear-quick-search").addEventListener("click", () => {
    quickInput.value = "";
    render();
    quickInput.focus();
  });
  render();

  async function federatedSearch(query) {
    const sought = query.trim();
    if (!sought) { render(); return; }
    container.innerHTML = '<p class="gallery-message">Buscando en acervos locales y servicios conectados…</p>';
    const semantic = expandSemanticQuery(sought);
    const terms = [...new Set([...semantic.expanded_terms, ...expandQuery(sought, semanticData), ...semanticQueries(sought)])].slice(0, 16);
    const [remote, local] = await Promise.all([
      searchAllProviders(terms, "es", 10),
      Promise.resolve(searchRecords(sought, records))
    ]);
    const combined = rankSemanticPictograms(mergeResults(remote, local), semantic);
    renderFederated(combined);
    announceResults(sought, combined.length, semantic);
  }

  function announceResults(query, count, semantic) {
    const status = document.querySelector("#status");
    status.textContent = `Resultados de pictogramas para la búsqueda: ${query}. Se encontraron ${count} resultados. Use tabulador para recorrerlos.${semantic.urgency_level === "critica" ? " Se detectó una posible urgencia crítica." : ""}`;
  }

  function renderFederated(items) {
    container.replaceChildren();
    if (!items.length) {
      container.innerHTML = '<p class="gallery-message">No se encontraron pictogramas relacionados en los acervos conectados.</p>';
      return;
    }
    items.slice(0, MAX_ITEMS).forEach(item => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";
      card.innerHTML = `<img src="${item.imageUrl}" alt="${escapeHtml(item.label)}"><strong>${sentenceCase(item.label)}</strong><small>${escapeHtml(item.providerName)}</small>`;
      card.setAttribute("aria-label", `Ver tableros relacionados con ${item.label}`);
      card.addEventListener("click", () => onSelectPictogram?.(item.label));
      container.append(card);
    });
  }
}

export function hideInitialGallery() {
  document.querySelector("#initial-gallery").hidden = true;
}
function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const random = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[random]] = [copy[random], copy[index]];
  }
  return copy;
}
function slug(text) { return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function sentenceCase(text) { return text.charAt(0).toLocaleUpperCase("es") + text.slice(1); }
function escapeHtml(value = "") { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
function searchRecords(query, records) {
  const sought = normalize(query);
  const semanticTerms = expandSemanticTerms(sought);
  return records
    .map(item => {
      const haystack = normalize(`${item.term} ${item.group} ${item.source || ""}`);
      let score = haystack.includes(sought) ? 100 : 0;
      for (const term of semanticTerms) if (haystack.includes(term)) score += 25;
      for (const word of sought.split(" ").filter(word => word.length > 2)) if (haystack.includes(word)) score += 10;
      return { item, score };
    })
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(result => result.item);
}
function normalize(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function expandSemanticTerms(query) {
  const groups = [
    ["dolor de panza", "dolor abdominal", "dolor", "medico", "hospital", "medicina"],
    ["emergencia", "proteccion civil", "alarma", "evacuar", "riesgo", "ambulancia"],
    ["tramite", "documento", "identificacion", "solicitud", "formulario", "firma"],
    ["accesibilidad", "rampa", "elevador", "silla de ruedas", "interprete", "apoyo"],
    ["comunicacion", "hola", "gracias", "ayuda", "entiendo", "repetir"]
  ].map(group => group.map(normalize));
  const matched = groups.find(group => group.some(term => query.includes(term) || term.includes(query)));
  return matched || [query];
}
function semanticQueries(query) {
  const normalized = normalize(query);
  return [...new Set([query, ...expandSemanticTerms(normalized)])].slice(0, 6);
}
function mergeResults(remote, local) {
  const merged = [];
  const seen = new Set();
  for (const item of remote) {
    const key = `${item.provider}:${item.remoteId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      imageUrl: item.imageUrl,
      label: item.label,
      altText: item.altText || item.label,
      license: item.license,
      providerName: item.providerOriginal ? `${providerDisplayName(item.provider)} · ${sentenceCase(item.providerOriginal)}` : providerDisplayName(item.provider)
    });
  }
  for (const item of local) {
    const key = `local:${item.group}:${normalize(item.term)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      imageUrl: `./assets/pictograms/${item.group}/${slug(item.term)}.png`,
      label: item.term,
      altText: item.term,
      license: item.license || "CC BY-NC-SA",
      providerName: item.source || item.provider || "ARASAAC"
    });
  }
  return merged;
}
function providerDisplayName(provider) {
  return ({ arasaac: "ARASAAC", opensymbols: "OpenSymbols", globalsymbols: "Global Symbols", symbotalk: "SymboTalk" })[provider] || provider;
}
