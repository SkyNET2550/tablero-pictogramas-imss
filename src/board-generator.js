import { INSTITUTIONAL_FOOTER } from "./config.js";
import { getPictogramImageUrl, resolvePictogram } from "./arasaac-api.js";
import { recordMetadata, recordMissing } from "./metadata-store.js";
import { institutionalHeaderHtml } from "./board-branding.js";
import { escapeHtml, setSafeImage, safeImageUrl } from "./security.js";

const capitalize = text => {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean ? clean.charAt(0).toLocaleUpperCase("es") + clean.slice(1) : "";
};

export async function buildBoardPage(group, selections, language = "es") {
  const page = document.createElement("section");
  page.className = "page";
  page.dataset.group = group.id;
  page.innerHTML = `<header class="board-header">${institutionalHeaderHtml(escapeHtml(group.titulo))}<p class="board-description">${escapeHtml(group.descripcion || "Tablero de comunicación alternativa por pictogramas")}</p></header>`;
  const grid = document.createElement("main");
  grid.className = "grid";
  for (const term of group.conceptos) {
    const cell = document.createElement("article");
    cell.className = "cell";
    const result = await resolvePictogram(term, selections, language);
    if (result?.imageData) {
      const image = document.createElement("img"); setSafeImage(image, result.imageData, result.label || term);
      const label = document.createElement("div"); label.className = "cell-label"; label.textContent = capitalize(result.label || term);
      cell.append(image, label);
    } else if (result?._id) {
      const localUrl = `./assets/pictograms/${group.id}/${slug(term)}.png`;
      const remoteUrl = result.imageUrl || getPictogramImageUrl(result._id);
      const image = document.createElement("img"); setSafeImage(image, localUrl, term); image.dataset.fallback = safeImageUrl(remoteUrl);
      const label = document.createElement("div"); label.className = "cell-label"; label.textContent = capitalize(term);
      cell.append(image, label);
      image.addEventListener("error", () => {
        const fallback = safeImageUrl(remoteUrl);
        if (fallback && image.src !== fallback) image.src = fallback;
      }, { once: true });
      recordMetadata({ term, group: group.id, id: result._id, source: "ARASAAC", author: "Sergio Palao", license: "CC BY-NC-SA", url: remoteUrl, date: new Date().toISOString(), manual: Boolean(result.manual) });
    } else {
      cell.classList.add("missing-cell");
      const button = document.createElement("button"); button.className = "missing-pictogram"; button.type = "button"; button.setAttribute("aria-label", `Elegir pictograma para ${term}`);
      const state = document.createElement("span"); state.textContent = "Sin pictograma";
      const help = document.createElement("small"); help.textContent = "Elegir o sustituir"; button.append(state, help);
      const label = document.createElement("div"); label.className = "cell-label"; label.textContent = capitalize(term); cell.append(button, label);
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
