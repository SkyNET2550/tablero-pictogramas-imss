import { INSTITUTIONAL_FOOTER } from "./config.js";
import { getPictogramImageUrl, resolvePictogram } from "./arasaac-api.js";
import { recordMetadata, recordMissing } from "./metadata-store.js";
import { institutionalHeaderHtml } from "./board-branding.js";
import { pictogramKey } from "./pictogram-identity.js";

const capitalize = text => {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean ? clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1) : "";
};

export async function buildBoardPage(group, selections, language = "es") {
  const page = document.createElement("section");
  page.className = "page";
  page.dataset.group = group.id;
  page.innerHTML = `<header class="board-header">${institutionalHeaderHtml(group.titulo)}<p class="board-description">${group.descripcion || "Tablero de comunicación alternativa por pictogramas"}</p></header>`;
  const grid = document.createElement("main");
  grid.className = "grid";
  const usedPictograms = new Set();

  for (const term of group.conceptos) {
    const cell = document.createElement("article");
    cell.className = "cell";
    const result = await resolvePictogram(term, selections, language);
    const duplicate = result && usedPictograms.has(pictogramKey(result));
    if (result && !duplicate) usedPictograms.add(pictogramKey(result));
    if (result?.imageData && !duplicate) {
      cell.innerHTML = `<img src="${result.imageData}" alt="${result.label || term}"><div class="cell-label">${capitalize(result.label || term)}</div>`;
    } else if (result?._id && !duplicate) {
      const localUrl = `./assets/pictograms/${group.id}/${slug(term)}.png`;
      const remoteUrl = result.imageUrl || getPictogramImageUrl(result._id);
      cell.innerHTML = `<img src="${localUrl}" data-fallback="${remoteUrl}" alt="${term}"><div class="cell-label">${capitalize(term)}</div>`;
      const image = cell.querySelector("img");
      image.addEventListener("error", () => {
        if (image.src !== remoteUrl) image.src = remoteUrl;
      }, { once: true });
      recordMetadata({ term, group: group.id, id: result._id, source: "ARASAAC", author: "Sergio Palao", license: "CC BY-NC-SA", url: remoteUrl, date: new Date().toISOString(), manual: Boolean(result.manual) });
    } else {
      cell.classList.add("missing-cell");
      cell.innerHTML = `<button class="missing-pictogram" type="button" aria-label="Elegir pictograma para ${term}"><span>${duplicate ? "Pictograma repetido" : "Sin pictograma"}</span><small>Elegir o sustituir</small></button><div class="cell-label">${capitalize(term)}</div>`;
      cell.querySelector("button").addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("choose-missing-pictogram", { detail: { term, groupId: group.id, cell } }));
      });
      recordMissing(group.id, term);
    }
    grid.appendChild(cell);
  }
  page.append(grid);
  const footer = document.createElement("footer");
  footer.className = "license";
  footer.textContent = INSTITUTIONAL_FOOTER;
  page.append(footer);
  return page;
}

function slug(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
