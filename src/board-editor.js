import { INSTITUTIONAL_FOOTER } from "./config.js";
import { getPictogramImageUrl } from "./arasaac-api.js";
import { BOARD_HEADER_IMAGE, BOARD_INSTITUTION_LINES, institutionalHeaderHtml } from "./board-branding.js";
import { searchAllProviders } from "./providers/provider-registry.js";
import { deduplicatePictograms, hasPictogramDuplicate, removeBoardDuplicates } from "./pictogram-identity.js";

const STORAGE_KEY = "arasaac-custom-boards-v1";
const editor = document.querySelector("#board-editor");
const picker = document.querySelector("#pictogram-picker");
const page = document.querySelector("#editor-page");
const list = document.querySelector("#board-list");
const titleInput = document.querySelector("#editor-title");
const semanticDialog = document.querySelector("#editor-semantic-dialog");
let boards = loadBoards();
let activeId = boards[0].id;
let replaceIndex = null;
let draggedIndex = null;
let selectedPickerId = null;
let selectedPickerImage = null;
let externalSelection = null;

export function initBoardEditor() {
  document.querySelector("#open-editor-button").addEventListener("click", () => { render(); editor.showModal(); });
  document.querySelector("#close-editor-button").addEventListener("click", () => editor.close());
  document.querySelector("#new-board-button").addEventListener("click", createBoard);
  document.querySelector("#duplicate-board-button").addEventListener("click", duplicateBoard);
  document.querySelector("#delete-board-button").addEventListener("click", deleteBoard);
  document.querySelector("#close-picker-button").addEventListener("click", () => picker.close());
  document.querySelector("#print-current-button").addEventListener("click", printBoard);
  document.querySelector("#export-pdf-button").addEventListener("click", () => exportBinary("pdf"));
  document.querySelector("#export-docx-button").addEventListener("click", () => exportBinary("docx"));
  document.querySelector("#export-image-button").addEventListener("click", () => exportBinary("png"));
  document.querySelector("#open-editable-button").addEventListener("click", openEditableBoardDialog);
  document.querySelector("#open-editable-input").addEventListener("change", openEditableBoard);
  document.querySelector("#picker-search").addEventListener("submit", searchPicker);
  document.querySelector("#png-file-input").addEventListener("change", selectPngFile);
  document.querySelector("#picker-label").addEventListener("blur", event => {
    event.target.value = sentenceCase(event.target.value);
  });
  document.querySelector("#back-to-results-button").addEventListener("click", showPickerResults);
  document.querySelector("#confirm-pictogram-button").addEventListener("click", confirmPictogram);
  document.querySelector("#editor-add-semantic-group").addEventListener("click", openEditorSemanticDialog);
  document.querySelector("#close-editor-semantic").addEventListener("click", () => semanticDialog.close());
  document.querySelector("#clear-editor-semantic").addEventListener("click", () => {
    document.querySelector("#editor-semantic-terms").value = "";
    document.querySelector("#editor-semantic-status").textContent = "";
    document.querySelector("#editor-semantic-terms").focus();
  });
  document.querySelector("#editor-semantic-form").addEventListener("submit", addSemanticGroupToEditor);
  titleInput.addEventListener("input", updateProperties);
  window.addEventListener("afterprint", () => document.body.classList.remove("print-editor"));
}

export function openPredefinedBoardEditor(predefinedBoard) {
  const existing = boards.find(board => board.predefinedId === predefinedBoard.id);
  if (existing) {
    activeId = existing.id;
  } else {
    const board = {
      id: uid(),
      predefinedId: predefinedBoard.id,
      title: predefinedBoard.title,
      cells: Array(16).fill(null)
    };
    boards.push(board);
    activeId = board.id;
    save();
  }
  render();
  editor.showModal();
}

export function choosePictogramForConcept({ term, groupId, onSelected }) {
  externalSelection = { term, groupId, onSelected };
  replaceIndex = null;
  document.querySelector("#picker-query").value = term;
  document.querySelector("#picker-label").value = "";
  document.querySelector("#picker-results").replaceChildren();
  document.querySelector("#picker-results").hidden = false;
  document.querySelector("#picker-confirmation").hidden = true;
  document.querySelector("#picker-status").textContent = `Busca una imagen adecuada para “${term}”.`;
  selectedPickerId = null;
  selectedPickerImage = null;
  document.querySelector("#png-file-input").value = "";
  picker.showModal();
  document.querySelector("#picker-query").focus();
}

function activeBoard() { return boards.find(board => board.id === activeId); }
function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function loadBoards() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved.map(normalizeBoard);
  } catch {}
  return [{ id: uid(), title: "Mi tablero", cells: Array(16).fill(null) }];
}
function normalizeBoard(board) {
  const cells = Array.isArray(board.cells) ? board.cells.slice(0, 16) : [];
  while (cells.length < 16) cells.push(null);
  return { ...board, cells: removeBoardDuplicates(cells) };
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(boards)); }

function createBoard() {
  const board = { id: uid(), title: `Tablero ${boards.length + 1}`, cells: Array(16).fill(null) };
  boards.push(board); activeId = board.id; save(); render();
}
function duplicateBoard() {
  const source = activeBoard();
  const copy = structuredClone(source);
  copy.id = uid(); copy.title += " (copia)";
  boards.push(copy); activeId = copy.id; save(); render();
}
function deleteBoard() {
  if (boards.length === 1) {
    boards[0] = { id: uid(), title: "Mi tablero", cells: Array(16).fill(null) };
  } else boards = boards.filter(board => board.id !== activeId);
  activeId = boards[0].id; save(); render();
}
function updateProperties() {
  const board = activeBoard();
  board.title = titleInput.value || "Sin título";
  save(); renderPage(); renderList();
}

function openEditorSemanticDialog() {
  document.querySelector("#editor-semantic-terms").value = "";
  document.querySelector("#editor-semantic-status").textContent = "";
  semanticDialog.showModal();
  document.querySelector("#editor-semantic-terms").focus();
}

async function addSemanticGroupToEditor(event) {
  event.preventDefault();
  const terms = document.querySelector("#editor-semantic-terms").value.split(/[\n,;]+/).map(term => term.trim()).filter(Boolean);
  const status = document.querySelector("#editor-semantic-status");
  if (!terms.length) {
    status.textContent = "Integra al menos una palabra en la lista.";
    return;
  }
  status.textContent = "Buscando y agrupando pictogramas…";
  const collected = [];
  for (const term of terms) {
    const results = await searchAllProviders([term], "es", 40);
    for (const result of results) {
      if (!result.imageUrl) continue;
      collected.push({
        id: result.remoteId,
        imageUrl: result.imageUrl,
        label: sentenceCase(result.label || term),
        source: providerName(result.provider),
        provider: result.provider,
        providerOriginal: result.providerOriginal,
        license: result.license,
        author: result.author,
        attribution: result.attribution,
        semanticGroup: sentenceCase(term),
        validated: false
      });
    }
  }
  const unique = deduplicatePictograms(collected);
  if (!unique.length) {
    status.textContent = "No se encontraron pictogramas para esta lista.";
    return;
  }
  const base = activeBoard();
  for (let index = 0; index < unique.length; index += 16) {
    const cells = unique.slice(index, index + 16);
    const target = index === 0 ? base : {
      id: uid(),
      title: `${base.title} · Página ${Math.floor(index / 16) + 1}`,
      semanticParentId: base.id,
      cells: Array(16).fill(null)
    };
    target.cells = [...cells, ...Array(Math.max(0, 16 - cells.length)).fill(null)];
    if (index > 0) boards.push(target);
  }
  activeId = base.id;
  save();
  semanticDialog.close();
  render();
}

function render() {
  renderList(); renderPage();
  const board = activeBoard();
  titleInput.value = board.title;
}
function renderList() {
  list.replaceChildren();
  boards.forEach(board => {
    const button = document.createElement("button");
    button.type = "button"; button.textContent = board.title;
    if (board.id === activeId) button.className = "active";
    button.addEventListener("click", () => { activeId = board.id; render(); });
    list.append(button);
  });
}
function renderPage() {
  const board = activeBoard();
  page.replaceChildren();
  const header = document.createElement("header");
  header.className = "editor-board-header";
  header.innerHTML = institutionalHeaderHtml(escapeHtml(board.title), "editor-board-brand-image");
  const grid = document.createElement("div");
  grid.className = "editor-grid";
  board.cells.forEach((cell, index) => grid.append(cell ? makeCell(cell, index) : makeEmptySlot(index)));
  const footer = document.createElement("footer");
  footer.className = "editor-license"; footer.textContent = INSTITUTIONAL_FOOTER;
  page.append(header, grid, footer);
}
function makeCell(cell, index) {
  const article = document.createElement("article");
  article.className = `editor-cell${cell.validated ? " validated" : ""}`;
  article.draggable = true;
  article.tabIndex = 0;
  article.setAttribute("role", "group");
  article.setAttribute("aria-label", `${cell.label}. Posición ${index + 1} de 16. Use flechas izquierda y derecha para intercambiar.`);
  if (cell.imageData && !cell.normalized) normalizeStoredPng(cell);
  article.innerHTML = `<img src="${cell.imageData || cell.imageUrl || getPictogramImageUrl(cell.id)}" alt="${escapeHtml(cell.label)}"><strong>${escapeHtml(cell.label)}</strong><div class="cell-actions"><button data-action="left" aria-label="Mover a la izquierda">←</button><button data-action="right" aria-label="Mover a la derecha">→</button><button data-action="validate">${cell.validated ? "Quitar validación" : "Validar"}</button><button data-action="replace">Sustituir</button><button data-action="delete">Eliminar</button></div>`;
  article.addEventListener("click", event => {
    document.querySelectorAll(".editor-cell.selected").forEach(item => item.classList.remove("selected"));
    article.classList.add("selected");
    const action = event.target.dataset.action;
    if (action === "validate") { cell.validated = !cell.validated; save(); renderPage(); }
    if (action === "replace") openPicker(index);
    if (action === "left") swapSlots(index, Math.max(0, index - 1));
    if (action === "right") swapSlots(index, Math.min(15, index + 1));
    if (action === "delete") { activeBoard().cells[index] = null; save(); renderPage(); }
  });
  article.addEventListener("dragstart", () => { draggedIndex = index; });
  article.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") { event.preventDefault(); swapSlots(index, Math.max(0, index - 1)); }
    if (event.key === "ArrowRight") { event.preventDefault(); swapSlots(index, Math.min(15, index + 1)); }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      document.querySelectorAll(".editor-cell.selected").forEach(item => item.classList.remove("selected"));
      article.classList.add("selected");
    }
  });
  article.addEventListener("dragover", event => event.preventDefault());
  article.addEventListener("drop", event => {
    event.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    swapSlots(draggedIndex, index);
  });
  return article;
}

function makeEmptySlot(index) {
  const empty = document.createElement("button");
  empty.type = "button";
  empty.className = "empty-slot";
  empty.dataset.index = index;
  empty.setAttribute("aria-label", `Agregar pictograma en la posición ${index + 1} de 16`);
  empty.innerHTML = "<span>+ Agregar<br>pictograma</span>";
  empty.addEventListener("click", () => openPicker(index));
  empty.addEventListener("dragover", event => {
    event.preventDefault();
    empty.classList.add("drag-target");
  });
  empty.addEventListener("dragleave", () => empty.classList.remove("drag-target"));
  empty.addEventListener("drop", event => {
    event.preventDefault();
    empty.classList.remove("drag-target");
    if (draggedIndex !== null) swapSlots(draggedIndex, index);
  });
  return empty;
}

function swapSlots(from, to) {
  if (from === null || from === to) return;
  const cells = activeBoard().cells;
  [cells[from], cells[to]] = [cells[to], cells[from]];
  draggedIndex = null;
  save();
  renderPage();
}

function openPicker(index) {
  externalSelection = null;
  replaceIndex = index;
  document.querySelector("#picker-query").value = index === null || !activeBoard().cells[index] ? "" : activeBoard().cells[index].label;
  document.querySelector("#picker-label").value = "";
  document.querySelector("#picker-results").replaceChildren();
  document.querySelector("#picker-results").hidden = false;
  document.querySelector("#picker-confirmation").hidden = true;
  selectedPickerId = null;
  selectedPickerImage = null;
  document.querySelector("#png-file-input").value = "";
  document.querySelector("#picker-status").textContent = "Escribe un concepto para ver alternativas.";
  picker.showModal();
  document.querySelector("#picker-query").focus();
}
async function searchPicker(event) {
  event.preventDefault();
  const query = document.querySelector("#picker-query").value.trim();
  const resultsBox = document.querySelector("#picker-results");
  const pickerStatus = document.querySelector("#picker-status");
  pickerStatus.textContent = "Buscando alternativas…"; resultsBox.replaceChildren();
  try {
    const results = await searchAllProviders([query], "es", 12);
    pickerStatus.textContent = results.length ? `${results.length} opciones encontradas. Revisa y elige una.` : "No se encontraron pictogramas.";
    results.forEach(result => {
      const keywords = result.label || query;
      const source = `${providerName(result.provider)}${result.providerOriginal ? ` · ${sentenceCase(result.providerOriginal)}` : ""}`;
      const card = document.createElement("article");
      card.className = "picker-card";
      card.innerHTML = `<img src="${result.imageUrl}" alt="${escapeHtml(keywords)}"><p>${escapeHtml(keywords)}</p><small>${escapeHtml(source)}</small><button type="button">Elegir esta imagen</button>`;
      card.querySelector("button").addEventListener("click", () => selectPickerResult(result));
      resultsBox.append(card);
    });
  } catch (error) { pickerStatus.textContent = `No fue posible buscar: ${error.message}`; }
}
function selectPickerResult(result) {
  selectedPickerId = result;
  selectedPickerImage = null;
  document.querySelector("#selected-pictogram-image").src = result.imageUrl;
  document.querySelector("#selected-pictogram-image").alt = result.label;
  document.querySelector("#picker-label").value = sentenceCase(replaceIndex === null || !activeBoard().cells[replaceIndex] ? result.label.split(",")[0] : activeBoard().cells[replaceIndex].label);
  document.querySelector("#picker-results").hidden = true;
  document.querySelector("#picker-confirmation").hidden = false;
  document.querySelector("#picker-status").textContent = "Imagen seleccionada. Ahora escribe la etiqueta conveniente.";
  document.querySelector("#picker-label").focus();
  document.querySelector("#picker-label").select();
}
function selectPngFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.type !== "image/png" && !file.name.toLowerCase().endsWith(".png")) {
    document.querySelector("#picker-status").textContent = "El archivo debe estar en formato PNG.";
    event.target.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    const image = new Image();
    image.addEventListener("load", () => {
      selectedPickerId = null;
      selectedPickerImage = fitPngToPictogram(image);
      const preview = document.querySelector("#selected-pictogram-image");
      preview.src = selectedPickerImage;
      preview.alt = file.name.replace(/\.png$/i, "");
      document.querySelector("#picker-label").value = sentenceCase(file.name.replace(/\.png$/i, "").replace(/[-_]+/g, " "));
      document.querySelector("#picker-results").hidden = true;
      document.querySelector("#picker-confirmation").hidden = false;
      document.querySelector("#picker-status").textContent = "PNG preparado. Ahora escribe la etiqueta conveniente.";
      document.querySelector("#picker-label").focus();
      document.querySelector("#picker-label").select();
    });
    image.src = reader.result;
  });
  reader.readAsDataURL(file);
}
function fitPngToPictogram(image) {
  const source = document.createElement("canvas");
  source.width = image.naturalWidth;
  source.height = image.naturalHeight;
  const sourceContext = source.getContext("2d", { willReadFrequently: true });
  sourceContext.drawImage(image, 0, 0);
  const pixels = sourceContext.getImageData(0, 0, source.width, source.height);
  const bounds = findContentBounds(pixels);
  const canvas = document.createElement("canvas");
  canvas.width = 500; canvas.height = 500;
  const context = canvas.getContext("2d");
  const maximum = 480;
  const scale = Math.min(maximum / bounds.width, maximum / bounds.height);
  const width = Math.round(bounds.width * scale);
  const height = Math.round(bounds.height * scale);
  context.clearRect(0, 0, 500, 500);
  context.drawImage(source, bounds.x, bounds.y, bounds.width, bounds.height, Math.round((500 - width) / 2), Math.round((500 - height) / 2), width, height);
  return canvas.toDataURL("image/png");
}
function findContentBounds(imageData) {
  const { data, width, height } = imageData;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const alpha = data[offset + 3];
      const nearWhite = data[offset] > 248 && data[offset + 1] > 248 && data[offset + 2] > 248;
      if (alpha > 12 && !nearWhite) {
        left = Math.min(left, x); right = Math.max(right, x);
        top = Math.min(top, y); bottom = Math.max(bottom, y);
      }
    }
  }
  return right >= left
    ? { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
    : { x: 0, y: 0, width, height };
}
function normalizeStoredPng(cell) {
  cell.normalized = true;
  const image = new Image();
  image.addEventListener("load", () => {
    cell.imageData = fitPngToPictogram(image);
    save();
    renderPage();
  }, { once: true });
  image.src = cell.imageData;
}
function showPickerResults() {
  document.querySelector("#picker-confirmation").hidden = true;
  document.querySelector("#picker-results").hidden = false;
  document.querySelector("#picker-status").textContent = "Elige una de las alternativas encontradas.";
  selectedPickerId = null;
  selectedPickerImage = null;
}
function confirmPictogram() {
  const labelInput = document.querySelector("#picker-label");
  const label = sentenceCase(labelInput.value);
  labelInput.value = label;
  if ((!selectedPickerId && !selectedPickerImage) || !label) {
    document.querySelector("#picker-status").textContent = "Escribe una etiqueta para integrar el pictograma.";
    document.querySelector("#picker-label").focus();
    return;
  }
  const selection = selectedPickerImage
    ? { imageData: selectedPickerImage, label, source: "Imagen PNG local" }
    : { id: selectedPickerId.remoteId, imageUrl: selectedPickerId.imageUrl, label, source: providerName(selectedPickerId.provider), provider: selectedPickerId.provider, providerOriginal: selectedPickerId.providerOriginal, license: selectedPickerId.license, author: selectedPickerId.author, attribution: selectedPickerId.attribution };
  if (externalSelection) {
    saveConceptSelection(externalSelection.term, selection);
    externalSelection.onSelected?.(selection);
    externalSelection = null;
    picker.close();
    return;
  }
  choosePictogram(selection);
}
function choosePictogram(selection) {
  const cell = { ...selection, validated: false };
  if (hasPictogramDuplicate(activeBoard().cells, cell, replaceIndex ?? -1)) {
    document.querySelector("#picker-status").textContent = "Este pictograma ya está incluido en el tablero. Elige una imagen diferente.";
    return;
  }
  if (replaceIndex === null) {
    const emptyIndex = activeBoard().cells.findIndex(item => item === null);
    if (emptyIndex < 0) return;
    activeBoard().cells[emptyIndex] = cell;
  } else activeBoard().cells[replaceIndex] = cell;
  save(); renderPage(); picker.close();
}
function printBoard() {
  const previousTitle = document.title;
  document.title = activeBoard().title;
  document.body.classList.add("print-editor");
  window.addEventListener("afterprint", () => { document.title = previousTitle; }, { once: true });
  requestAnimationFrame(() => window.print());
}
async function openEditableBoardDialog() {
  try {
    const response = await fetch("/api/native-dialog/open", { method: "POST" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Error ${response.status}`);
    if (result.cancelled) return;
    const file = new File([result.content], result.filename || "tablero.json", { type: "application/json" });
    await importEditableFile(file);
  } catch (error) {
    alert(`No se pudo abrir el tablero: ${error.message}`);
  }
}
async function openEditableBoard(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  await importEditableFile(file);
  event.target.value = "";
}
async function importEditableFile(file) {
  try {
    const imported = normalizeBoard(JSON.parse(await file.text()));
    imported.id = uid();
    imported.title = imported.title || "Tablero importado";
    boards.push(imported);
    activeId = imported.id;
    save();
    render();
  } catch {
    alert("La copia editable no contiene un tablero válido.");
  }
}
async function exportBinary(format) {
  const board = activeBoard();
  const button = document.querySelector(`#export-${format}-button`);
  const original = button.textContent;
  button.disabled = true;
  button.textContent = `Generando ${format === "docx" ? "DOCX" : "imagen"}…`;
  try {
    const response = await fetch(`/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board, headerImage: BOARD_HEADER_IMAGE, footer: INSTITUTIONAL_FOOTER })
    });
    if (!response.ok) throw new Error((await response.json()).error || `Error ${response.status}`);
    const blob = await response.blob();
    await saveWithNativeDialog(blob, `${safeName(board.title)}.${format}`, [{
      description: format === "docx" ? "Documento de Word editable" : format === "pdf" ? "Documento PDF" : "Imagen",
      accept: format === "docx"
        ? { "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"] }
        : format === "pdf" ? { "application/pdf": [".pdf"] } : { "image/png": [".png"] }
    }]);
  } catch (error) {
    alert(`No se pudo exportar: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}
async function exportBoardHtml() {
  const board = activeBoard();
  const cells = board.cells.map(cell => cell ? `
    <article class="cell">
      <img src="${cell.imageData || cell.imageUrl || getPictogramImageUrl(cell.id)}" alt="${escapeHtml(cell.label)}">
      <strong>${escapeHtml(cell.label)}</strong>
    </article>` : '<div class="empty"></div>').join("");
  const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${escapeHtml(board.title)}</title><style>
@page{size:letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}
.page{position:relative;width:8.5in;height:11in;padding:4.2mm 12mm 12mm;display:grid;grid-template-rows:auto 1fr;overflow:hidden}
.heading{min-height:150px;padding-bottom:5px;border-bottom:3px solid #004b93;text-align:center}.header-top{width:calc(100% + 20mm);margin:-2mm -10mm 3px;display:block}.brand-image{display:block;width:58.4%;height:1.16in;object-fit:contain;object-position:left top}.title-block{padding-top:3px;text-align:center}.kicker{margin:0 0 1px;color:#004b93;font-size:11pt;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.title-separator{width:80%;height:2px;margin:3px auto 4px;background:#004b93}h1{color:#004b93;margin:0;font-size:23pt;line-height:1;text-transform:uppercase}.grid{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px;min-height:0}
.cell,.empty{min-height:0;border:2.5px solid #0757a5;border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;text-align:center}
.empty{border-style:dashed;border-color:#aaa}.cell img{width:100%;height:calc(100% - 32px);object-fit:contain}.cell strong{font-size:15pt;line-height:1.05}
footer{position:absolute;left:12mm;right:12mm;bottom:5mm;padding-top:4px;border-top:1px solid #777;font-size:4.5pt;line-height:1.15;text-align:center;background:#fff}
@media print{body{margin:0}.page{margin:0}}</style></head><body><section class="page"><header class="heading"><div class="header-top"><img class="brand-image" src="${BOARD_HEADER_IMAGE}" alt="Gobierno de México e Instituto Mexicano del Seguro Social"></div><div class="title-block"><p class="kicker">Tablero de comunicación por pictogramas</p><div class="title-separator"></div><h1>${escapeHtml(board.title)}</h1></div></header>
<main class="grid">${cells}</main><footer>${escapeHtml(INSTITUTIONAL_FOOTER)}</footer></section>
<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),300));<\/script></body></html>`;
  try {
    await saveWithNativeDialog(
      new Blob([html], { type: "text/html;charset=utf-8" }),
      `${safeName(board.title)}-carta.html`,
      [{ description: "Documento HTML", accept: { "text/html": [".html"] } }]
    );
  } catch (error) {
    if (error.name !== "AbortError") alert(`No se pudo exportar: ${error.message}`);
  }
}

async function saveWithNativeDialog(blob, suggestedName, types) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  const response = await fetch("/api/native-dialog/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      suggestedName,
      filter: windowsFileFilter(types, suggestedName),
      base64: btoa(binary)
    })
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || `Error ${response.status}`);
  return !result.cancelled;
}

function windowsFileFilter(types, suggestedName) {
  const extension = `.${suggestedName.split(".").pop()}`;
  const description = types?.[0]?.description || "Archivo";
  return `${description} (*${extension})|*${extension}|Todos los archivos (*.*)|*.*`;
}
function safeName(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tablero";
}
function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function sentenceCase(value = "") {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean ? clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1) : "";
}
function providerName(provider) {
  return ({ arasaac: "ARASAAC", symbotalk: "SymboTalk", opensymbols: "OpenSymbols", globalsymbols: "Global Symbols" })[provider] || provider;
}

function saveConceptSelection(term, selection) {
  const key = "arasaac-concept-selections-v1";
  let selections = {};
  try { selections = JSON.parse(localStorage.getItem(key)) || {}; } catch {}
  selections[term.toLocaleLowerCase("es")] = selection;
  localStorage.setItem(key, JSON.stringify(selections));
}
