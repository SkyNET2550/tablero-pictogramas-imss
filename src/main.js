import { buildBoardPage } from "./board-generator.js";
import { loadManualSelections, loadSemanticGroups } from "./semantic-groups.js";
import { findSemanticTopic, loadSemanticCatalog, topicToGroups } from "./semantic-search.js";
import { choosePictogramForConcept, initBoardEditor, openPredefinedBoardEditor } from "./board-editor.js";
import { getPictogramImageUrl } from "./arasaac-api.js";
import { initInstitutionalBrand } from "./institutional-brand.js";
import { initApiStatus } from "./api-status.js";
import { hideInitialGallery, initRandomGallery } from "./random-gallery.js";
import { initBoardHierarchy } from "./boards/boardHierarchy.js";
import { expandSemanticQuery } from "./semantic/semanticEngine.js";
import { initPredefinedBoardDetail } from "./boards/predefinedBoardDetail.js";
import { childrenOf as seedChildren } from "./data/boards/seedBoards.js";
import { searchAllProviders } from "./providers/provider-registry.js";
import { rankSemanticPictograms } from "./semantic/semanticEngine.js";
import { institutionalHeaderHtml } from "./board-branding.js";
import { INSTITUTIONAL_FOOTER } from "./config.js";
import { initPictogramSpeech } from "./pictogram-speech.js";

const container = document.querySelector("#boards-container");
const status = document.querySelector("#status");
const form = document.querySelector("#semantic-search");
const input = document.querySelector("#search-input");
const summary = document.querySelector("#semantic-summary");
let catalog;
let config;
let selections;
let predefinedDetailController;

function initDismissibleMenu() {
  const menu = document.querySelector(".app-menu");
  const summaryButton = menu?.querySelector("summary");
  if (!menu || !summaryButton) return;

  document.addEventListener("pointerdown", event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !menu.open) return;
    menu.open = false;
    summaryButton.focus();
  });
  menu.querySelector(".app-menu-panel")?.addEventListener("click", event => {
    if (event.target.closest("button")) menu.open = false;
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();
  search(input.value);
});
async function generate(groups) {
  hideInitialGallery();
  container.replaceChildren();
  status.textContent = "Generando pictogramas…";
  try {
    for (let index = 0; index < groups.length; index++) {
      status.textContent = `Generando ${index + 1} de ${groups.length}…`;
      container.append(await buildBoardPage(groups[index], selections, config.documento.idioma));
    }
    status.textContent = `${groups.length} tablero${groups.length === 1 ? "" : "s"} listo${groups.length === 1 ? "" : "s"}`;
  } catch (error) {
    console.error(error);
    status.textContent = "No se pudo generar";
    container.innerHTML = `<div class="error-panel"><h2>No se pudieron cargar los tableros</h2><p>${error.message}</p><p>Abre el proyecto mediante <code>npm run dev</code>; los módulos y archivos JSON no funcionan correctamente al abrir index.html como archivo local.</p></div>`;
  }
}

async function search(query) {
  const semantic = expandSemanticQuery(query);
  if (!query.trim()) {
    status.textContent = "Escribe una idea o necesidad para encontrar tableros.";
    return;
  }
  const suggested = semantic.suggested_subboards.length
    ? semantic.suggested_subboards
    : semantic.suggested_boards.flatMap(board => seedChildren(board.id));
  location.hash = "tableros-predefinidos";
  showPredefined();
  predefinedDetailController.showSemanticBoards(suggested);
  status.textContent = `${suggested.length} tablero${suggested.length === 1 ? "" : "s"} relacionado${suggested.length === 1 ? "" : "s"} con la idea “${query}”.`;
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

async function init() {
  status.textContent = "Cargando catálogo…";
  resetInitialRoute();
initDismissibleMenu();
initPictogramSpeech();
  document.querySelector("#logo-upload-button").addEventListener("click", goHome);
  document.querySelector("#menu-home-button").addEventListener("click", goHome);
  document.querySelector("#thematic-boards-button").addEventListener("click", () => {
    location.hash = "tableros-tematicos";
    showThematicIndex();
  });
  [config, selections, catalog] = await Promise.all([loadSemanticGroups(), loadManualSelections(), loadSemanticCatalog()]);
  status.textContent = "Escribe una búsqueda";
  input.focus();
  initBoardEditor();
  initApiStatus();
  predefinedDetailController = await initPredefinedBoardDetail({
    onHome: () => {
      history.pushState(null, "", location.pathname + location.search);
      showHome();
    }
  });
  await initRandomGallery({
    onSelectPictogram: term => {
      input.value = term;
      generateBoardFromPictogram(term);
    }
  });
  initBoardHierarchy({
    onSelectSubboard: async (subboard, parent) => {
      predefinedDetailController.show(subboard);
    },
    onEditSubboard: subboard => openPredefinedBoardEditor(subboard),
    onSelectHeaderTheme: board => predefinedDetailController.showTheme(board.id)
  });
  document.querySelector("#predefined-boards-button").addEventListener("click", () => {
    location.hash = "tableros-predefinidos";
    showPredefined();
  });
  window.addEventListener("hashchange", applyViewFromHash);
  applyViewFromHash();
  initInstitutionalBrand(() => {
    document.querySelector("#boards-container").replaceChildren();
    status.textContent = "Logotipo institucional guardado";
  });
  window.addEventListener("choose-missing-pictogram", event => {
    const { term, groupId, cell } = event.detail;
    choosePictogramForConcept({
      term,
      groupId,
      onSelected: selection => {
        cell.classList.remove("missing-cell");
        const imageUrl = selection.imageData || selection.imageUrl || getPictogramImageUrl(selection.id);
        cell.innerHTML = `<img src="${imageUrl}" alt="${escapeHtml(selection.label)}"><div class="cell-label">${escapeHtml(selection.label)}</div>`;
        status.textContent = `Pictograma guardado para “${term}”`;
      }
    });
  });
}

async function generateBoardFromPictogram(term) {
  const query = term.trim();
  if (!query) return;
  hideInitialGallery();
  document.querySelector("#predefined-view").hidden = true;
  container.replaceChildren();
  status.textContent = `Generando tablero semántico para “${query}”…`;
  try {
    const semantic = expandSemanticQuery(query);
    const queries = [...new Set([query, ...semantic.expanded_terms])].filter(Boolean).slice(0, 24);
    const remote = await searchAllProviders(queries, "es", 10);
    const ranked = rankSemanticPictograms(remote.map(item => ({
      imageUrl: item.imageUrl,
      label: item.label,
      altText: item.altText || item.label,
      license: item.license,
      providerName: item.providerOriginal || item.provider
    })), semantic);
    const unique = uniquePictograms(ranked).slice(0, 64);
    container.replaceChildren(...buildSemanticBoardPages(query, unique));
    status.textContent = unique.length
      ? `Tablero semántico generado para “${query}” con ${unique.length} pictogramas sin repetir.`
      : `No se encontraron pictogramas relacionados con “${query}”.`;
  } catch (error) {
    console.error(error);
    status.textContent = "No se pudo generar el tablero semántico.";
    container.innerHTML = `<div class="error-panel"><h2>No se pudo generar el tablero</h2><p>${escapeHtml(error.message)}</p></div>`;
  }
}

function buildSemanticBoardPages(query, items) {
  const pages = chunk(items, 16);
  return pages.map((pageItems, index) => {
    const page = document.createElement("section");
    page.className = "page semantic-generated-board";
    page.dataset.group = `semantico-${slug(query)}-${index + 1}`;
    page.innerHTML = `<header class="board-header">${institutionalHeaderHtml(sentenceCase(query))}<p class="board-description">Tablero generado automáticamente con pictogramas asociados semánticamente a “${escapeHtml(query)}”.</p></header>`;
    const grid = document.createElement("main");
    grid.className = "grid";
    for (const item of pageItems) {
      const cell = document.createElement("article");
      cell.className = "cell";
      cell.innerHTML = `<img src="${item.imageUrl}" alt="${escapeHtml(item.altText || item.label)}"><div class="cell-label">${escapeHtml(sentenceCase(item.label || query))}</div>`;
      grid.append(cell);
    }
    while (grid.children.length < 16) {
      const cell = document.createElement("article");
      cell.className = "cell missing-cell";
      cell.innerHTML = `<button class="missing-pictogram" type="button"><span>Sin pictograma</span><small>Agregar pictograma</small></button>`;
      grid.append(cell);
    }
    page.append(grid);
    const footer = document.createElement("footer");
    footer.className = "license";
    footer.textContent = INSTITUTIONAL_FOOTER;
    page.append(footer);
    return page;
  });
}

function uniquePictograms(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = normalizeKey(item.imageUrl || item.label || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function chunk(items, size) {
  const pages = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size));
  return pages.length ? pages : [[]];
}

function sentenceCase(text = "") {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean ? clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1) : "";
}

function slug(text = "") {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeKey(value = "") {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\?.*$/, "").replace(/[^a-z0-9/:._-]+/g, "");
}

function resetInitialRoute() {
  if (!location.hash) return;
  history.replaceState(null, "", location.pathname + location.search);
}

function showPredefined() {
  document.querySelectorAll(".home-view").forEach(element => element.hidden = true);
  document.querySelector("#predefined-view").hidden = false;
  document.querySelector("#hierarchy-title").textContent = "Tableros predefinidos";
  document.querySelector("#hierarchy-selection-title").textContent = "Temáticas y tableros institucionales editables.";
  document.querySelector("#predefined-view").scrollIntoView({ block: "start" });
}
function showThematicIndex() {
  document.querySelectorAll(".home-view").forEach(element => element.hidden = true);
  document.querySelector("#predefined-view").hidden = false;
  document.querySelector("#hierarchy-title").textContent = "Tableros temáticos";
  document.querySelector("#hierarchy-selection-title").textContent = "Grandes grupos temáticos y sus subtableros previamente construidos.";
  document.querySelector("#global-board-types").hidden = false;
  document.querySelector("#predefined-board-groups").hidden = false;
  document.querySelector("#predefined-detail").hidden = true;
  document.querySelector("#predefined-view").scrollIntoView({ block: "start" });
}
function showHome() {
  document.querySelectorAll(".home-view").forEach(element => {
    if (element.id !== "semantic-summary" || element.innerHTML) element.hidden = false;
  });
  document.querySelector("#predefined-view").hidden = true;
}
function applyViewFromHash() {
  if (location.hash === "#tableros-tematicos") showThematicIndex();
  else if (location.hash === "#tableros-predefinidos") showPredefined();
  else showHome();
}

function goHome() {
  history.pushState(null, "", location.pathname + location.search);
  showHome();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

init().catch(error => {
  console.error(error);
  status.textContent = "No se pudo iniciar";
});
