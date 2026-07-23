export const BOARD_HEADER_IMAGE = "./assets/institutional/encabezado-gobierno-imss.jpg";
export const BOARD_INSTITUTION_LINES = [
  "Dirección Jurídica",
  "Unidad de Derechos Humanos",
  "Coordinación de Igualdad, Género e Inclusión",
  "División para el Fortalecimiento de la Cultura de Inclusión"
];

export function institutionalHeaderHtml(title, imageClass = "board-brand-image", titleClass = "") {
  return `<div class="board-header-top">
      <img class="${imageClass}" src="${BOARD_HEADER_IMAGE}" alt="Gobierno de México e Instituto Mexicano del Seguro Social">
    </div>
    <div class="board-title-block">
      <p class="board-kicker">Tablero de comunicación por pictogramas</p>
      <div class="board-title-separator" aria-hidden="true"></div>
      <h1${titleClass ? ` class="${titleClass}"` : ""}>${title}</h1>
    </div>`;
}
