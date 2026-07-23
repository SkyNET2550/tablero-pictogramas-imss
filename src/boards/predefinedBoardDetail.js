import { seedBoards } from "../data/boards/seedBoards.js";
import { searchAllProviders } from "../providers/provider-registry.js";
import { institutionalHeaderHtml } from "../board-branding.js";
import { INSTITUTIONAL_FOOTER } from "../config.js";
import { deduplicatePictograms } from "../pictogram-identity.js";

const subboards = seedBoards.filter(board => board.level === "subboard");
const customPictograms = new Map();
const semanticCompletion = new Set();
let metadata = [];
let printTarget = null;
let addDialog;
let activeDetailBoard = null;
let activeDetailPage = null;

export async function initPredefinedBoardDetail() {
  const response = await fetch("./data/pictogramas-metadata.json");
  metadata = response.ok ? Object.values(await response.json()) : [];
  const detail = document.querySelector("#predefined-detail");
  const groups = document.querySelector("#predefined-board-groups");
  const headerActions = document.querySelector("#hierarchy-board-actions");
  addDialog = document.querySelector("#predefined-add-dialog");

  document.querySelector("#close-predefined-add").addEventListener("click", () => addDialog.close());
  document.querySelector("#predefined-add-form").addEventListener("submit", addRequestedPictograms);
  document.querySelector("#hierarchy-back-button").addEventListener("click", () => {
    detail.hidden = true;
    groups.hidden = false;
    document.querySelector("#global-board-types").hidden = false;
    headerActions.hidden = true;
    activeDetailBoard = null;
    activeDetailPage = null;
    document.querySelector("#board-hierarchy").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelector("#hierarchy-add-group-button").addEventListener("click", () => activeDetailBoard && openAddDialog(activeDetailBoard, "group"));
  document.querySelector("#hierarchy-add-pictogram-button").addEventListener("click", () => activeDetailBoard && openAddDialog(activeDetailBoard, "single"));
  document.querySelector("#hierarchy-print-button").addEventListener("click", () => activeDetailPage && printBoardPage(activeDetailPage));
  addDialog.addEventListener("close", () => {
    document.querySelector("#predefined-add-form").reset();
    document.querySelector("#predefined-add-status").textContent = "";
  });
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("print-predefined");
    printTarget?.classList.remove("print-target");
    printTarget = null;
  });

  return {
    show(board) {
      groups.hidden = true;
      document.querySelector("#global-board-types").hidden = true;
      detail.hidden = false;
      renderSingle(board);
      activateHeaderActions(board);
      completeBoard(board, detail.querySelector(`[data-board-id="${escapeAttr(board.id)}"]`));
      detail.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    showTheme(parentId) {
      showSequence(subboards.filter(board => board.parentId === parentId));
    },
    showSemanticBoards(boards) {
      const ids = new Set(boards.map(board => board.id));
      const sequence = subboards.filter(board => ids.has(board.id));
      showSequence(sequence.length ? sequence : subboards);
    }
  };

  function showSequence(boards) {
    groups.hidden = true;
    document.querySelector("#global-board-types").hidden = false;
    detail.hidden = false;
    renderSequence(boards);
    activateHeaderActions(boards[0]);
    detail.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function activateHeaderActions(board) {
    activeDetailBoard = board || null;
    activeDetailPage = detail.querySelector(".predefined-letter-page");
    headerActions.hidden = !board;
  }
}

function renderSingle(board) {
  const content = document.querySelector("#predefined-detail-content");
  content.innerHTML = boardPagesHtml(board);
  activeDetailPage = content.querySelector(".predefined-letter-page");
}

function renderSequence(boards) {
  const content = document.querySelector("#predefined-detail-content");
  content.replaceChildren();
  boards.forEach((board, index) => {
    const wrapper = document.createElement("section");
    wrapper.className = "predefined-page-wrapper";
    wrapper.dataset.boardId = board.id;
    wrapper.innerHTML = boardPagesHtml(board, `Tablero ${index + 1} de ${boards.length}`, true);
    content.append(wrapper);
    completeBoard(board, wrapper.querySelector(".predefined-letter-page"));
  });
}
async function completeBoard(board, page) {
  if (!page) return;
  if (boardPictograms(board).length >= 16) {
    page.classList.remove("loading-pictograms");
    return;
  }
  if (semanticCompletion.has(board.id)) {
    page.classList.remove("loading-pictograms");
    return;
  }
  semanticCompletion.add(board.id);
  const queries = semanticQueries(board);
  try {
    const remote = await searchAllProviders(queries, "es", 8);
    customPictograms.set(board.id, deduplicate([
      ...(customPictograms.get(board.id) || []),
      ...remote.filter(item => item.imageUrl).map(item => normalizeRemote(item))
    ]));
    replaceBoardPages(page, board);
  } catch {
    page.classList.remove("loading-pictograms");
  }
}
function openAddDialog(board, mode) {
  document.querySelector("#predefined-add-board-id").value = board.id;
  document.querySelector("#predefined-add-mode").value = mode;
  document.querySelector("#predefined-add-title").textContent = mode === "group" ? "Agregar grupo semántico de pictogramas" : "Agregar pictograma";
  document.querySelector("#predefined-add-help").textContent = mode === "group"
    ? "Escribe varios conceptos. Se crearán todas las páginas necesarias, agrupadas en el orden indicado."
    : "Escribe un concepto para agregar un pictograma.";
  document.querySelector("#predefined-add-terms").placeholder = mode === "group"
    ? "Ejemplo:\nfrío\ncalor\ncobija\nventilador"
    : "Ejemplo: Cobija";
  addDialog.showModal();
  document.querySelector("#predefined-add-terms").focus();
}

async function addRequestedPictograms(event) {
  event.preventDefault();
  const boardId = document.querySelector("#predefined-add-board-id").value;
  const mode = document.querySelector("#predefined-add-mode").value;
  const status = document.querySelector("#predefined-add-status");
  const board = subboards.find(item => item.id === boardId);
  const terms = document.querySelector("#predefined-add-terms").value.split(/[\n,;]+/).map(term => term.trim()).filter(Boolean);
  if (!board || !terms.length) {
    status.textContent = "Escribe al menos un concepto.";
    return;
  }

  const requested = mode === "single" ? terms.slice(0, 1) : terms;
  const additions = [];
  status.textContent = "Buscando todos los pictogramas relacionados…";
  for (const term of requested) {
    const found = await searchAllProviders([term], "es", mode === "single" ? 12 : 40);
    const related = found
      .filter(item => item.imageUrl)
      .map(item => ({ ...normalizeRemote(item, term), semanticGroup: sentenceCase(term) }));
    if (mode === "single") {
      if (related[0]) additions.push(related[0]);
    } else {
      additions.push(...related);
    }
  }

  const previous = customPictograms.get(boardId) || [];
  customPictograms.set(boardId, deduplicate([...previous, ...additions]));
  addDialog.close();
  renderSingle(board);
}

function boardPagesHtml(board, pagePrefix = "Página", loading = false) {
  const pages = chunk(boardPictograms(board), 16);
  return pages.map((selected, index) => {
    const groups = [...new Set(selected.map(item => item.semanticGroup).filter(Boolean))];
    const groupLabel = groups.length ? `Grupo semántico: ${groups.join(" · ")}` : "";
    return `<section class="predefined-generated-page">
      <div class="predefined-page-tools no-print">
        <span>${escapeHtml(pagePrefix)} · Página ${index + 1} de ${pages.length}${groupLabel ? ` · ${escapeHtml(groupLabel)}` : ""}</span>
      </div>
      ${boardPageHtml(board, selected, loading && index === 0, groupLabel)}
    </section>`;
  }).join("");
}
function chunk(items, size) {
  const pages = [];
  for (let index = 0; index < items.length; index += size) pages.push(items.slice(index, index + size));
  return pages.length ? pages : [[]];
}

function normalizeRemote(item, fallback = "") {
  return {
    term: item.label || fallback,
    imageUrl: item.imageUrl,
    source: item.providerOriginal || providerName(item.provider),
    license: item.license || "Licencia del proveedor",
    remote: true
  };
}

function replaceBoardPages(page, board) {
  const wrapper = page.closest(".predefined-page-wrapper, #predefined-detail-content");
  if (!wrapper) return;
  if (wrapper.id === "predefined-detail-content") {
    renderSingle(board);
    activeDetailPage = document.querySelector("#predefined-detail-content .predefined-letter-page");
    return;
  }
  const label = wrapper.querySelector(".predefined-page-tools span")?.textContent?.split(" · ")[0] || "Tablero";
  wrapper.innerHTML = boardPagesHtml(board, label, false);
}
function boardPictograms(board) {
  return deduplicate([...findRelated(board), ...(customPictograms.get(board.id) || [])]);
}

function semanticQueries(board) {
  return [...new Set([
    ...board.semanticKeywords,
    ...board.naturalPhrases,
    board.title,
    board.description.replace(/^Subtablero para comunicar:\s*/i, "")
  ].flatMap(expandQuery))].filter(Boolean).slice(0, 24);
}
function expandQuery(value = "") {
  const clean = value.replace(/[.;:]+$/g, "").trim();
  if (!clean) return [];
  const parts = clean.split(/[,;]+/).map(item => item.trim()).filter(Boolean);
  return parts.length > 1 ? [clean, ...parts] : [clean];
}
function boardPageHtml(board, selected, loading = false, groupLabel = "") {
  return `<section class="predefined-letter-page${loading ? " loading-pictograms" : ""}" data-board-id="${escapeAttr(board.id)}" aria-label="Tablero ${escapeHtml(board.title)}">
    <header class="predefined-letter-header">
      ${institutionalHeaderHtml(escapeHtml(board.title), "predefined-board-brand-image")}
      <span>${escapeHtml(board.description)}</span>
      ${groupLabel ? `<small class="semantic-page-label">${escapeHtml(groupLabel)}</small>` : ""}
    </header>
    <div class="predefined-pictogram-grid">${selected.map(item => `<article class="predefined-pictogram-card">
      <img src="${item.imageUrl || `./assets/pictograms/${escapeAttr(item.group)}/${slug(item.term)}.png`}" alt="${escapeAttr(item.term)}">
      <strong>${escapeHtml(sentenceCase(item.term))}</strong>
      <small>${escapeHtml(item.source || item.provider || "ARASAAC")}</small>
    </article>`).join("")}${Array.from({ length: Math.max(0, 16 - selected.length) }, () => '<div class="predefined-empty-cell" aria-hidden="true"></div>').join("")}</div>
    <footer>${escapeHtml(INSTITUTIONAL_FOOTER)}</footer>
  </section>`;
}

function printBoardPage(page) {
  printTarget = page;
  page.classList.add("print-target");
  document.body.classList.add("print-predefined");
  requestAnimationFrame(() => window.print());
}

function deduplicate(items) {
  return deduplicatePictograms(items.filter(item => item.term));
}
function providerName(provider) { return ({ arasaac: "ARASAAC", globalsymbols: "Global Symbols", opensymbols: "OpenSymbols", symbotalk: "SymboTalk" })[provider] || provider; }
function findRelated(board) {
  const terms = board.semanticKeywords.map(normalize);
  return metadata.map(item => {
    const text = normalize(`${item.term} ${item.group || ""}`);
    const score = terms.reduce((sum, term) => sum + (text.includes(term) || term.includes(text) ? 10 : term.split(" ").some(word => word.length > 3 && text.includes(word)) ? 3 : 0), 0);
    return { ...item, score };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score);
}
function normalize(value = "") { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function slug(value = "") { return normalize(value).replace(/\s+/g, "-"); }
function sentenceCase(value = "") { return value ? value.charAt(0).toLocaleUpperCase("es") + value.slice(1) : ""; }
function escapeHtml(value = "") { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
function escapeAttr(value = "") { return escapeHtml(value); }
