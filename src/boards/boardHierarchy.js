import { mainBoards, childrenOf } from "../data/boards/seedBoards.js";

export function initBoardHierarchy({ onSelectSubboard, onEditSubboard, onSelectHeaderTheme }) {
  const section = document.querySelector("#board-hierarchy");
  const globalContainer = document.querySelector("#global-board-types");
  const groupsContainer = document.querySelector("#predefined-board-groups");
  const headerThemes = document.querySelector("#header-theme-labels");

  for (const board of mainBoards) {
    const themeButton = document.createElement("button");
    themeButton.type = "button";
    themeButton.textContent = board.title;
    themeButton.setAttribute("aria-label", `Mostrar todos los tableros de ${board.title}`);
    themeButton.addEventListener("click", () => onSelectHeaderTheme(board));
    globalContainer.append(themeButton);

    const headerButton = document.createElement("button");
    headerButton.type = "button";
    headerButton.className = "header-theme-label";
    headerButton.setAttribute("role", "link");
    headerButton.textContent = board.title;
    headerButton.setAttribute("aria-label", `Abrir tableros de ${board.title}`);
    headerButton.addEventListener("click", () => {
      location.hash = "tableros-predefinidos";
      document.querySelectorAll(".home-view").forEach(element => element.hidden = true);
      document.querySelector("#predefined-view").hidden = false;
      requestAnimationFrame(() => onSelectHeaderTheme(board));
    });
    headerThemes.append(headerButton);

    const group = document.createElement("section");
    group.id = `theme-${board.slug}`;
    group.className = "predefined-theme";
    group.innerHTML = `<header><h3>${escapeHtml(board.title)}</h3><p>${escapeHtml(board.description)}</p></header>`;
    const grid = document.createElement("div");
    grid.className = "hierarchy-subboards";
    for (const subboard of childrenOf(board.id)) grid.append(makeSubboardCard(subboard, board, onSelectSubboard, onEditSubboard));
    group.append(grid);
    groupsContainer.append(group);
  }
  section.hidden = false;
  return { section };
}

function makeSubboardCard(subboard, parent, onSelect, onEdit) {
  const article = document.createElement("article");
  article.className = "subboard-card";
  article.setAttribute("aria-label", subboard.accessibility.ariaLabel);
  article.innerHTML = `<strong>${escapeHtml(subboard.title)}</strong><span>${escapeHtml(subboard.description)}</span>${subboard.requiresManualReview ? '<small>Revisión humana obligatoria</small>' : ""}<div class="subboard-actions"><button type="button" data-action="view">Ver pictogramas</button><button type="button" data-action="edit">Editar tablero</button></div>`;
  article.querySelector('[data-action="view"]').addEventListener("click", () => onSelect(subboard, parent));
  article.querySelector('[data-action="edit"]').addEventListener("click", () => onEdit(subboard, parent));
  return article;
}
function escapeHtml(value = "") { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]); }
