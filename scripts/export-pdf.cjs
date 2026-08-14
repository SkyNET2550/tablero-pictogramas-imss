const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const [inputPath, outputPath, appRoot] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const board = payload.board || {};
const temporaryHtml = `${outputPath}.html`;

const CELLS_PER_PAGE = 20;
const isLandscape = board.orientation === "horizontal";
const columns = isLandscape ? 5 : 4;
const rows = isLandscape ? 4 : 5;
const pageSize = isLandscape ? { width: "297mm", height: "210mm" } : { width: "210mm", height: "297mm" };
const cells = Array.from({ length: CELLS_PER_PAGE }, (_, index) => {
  const pictogram = board.cells?.[index] || board.pictograms?.[index];
  if (!pictogram) return '<div class="cell empty"></div>';
  return `<div class="cell"><img src="${escapeHtml(resolveImage(pictogram.imageUrl || pictogram.image))}" alt=""><strong>${escapeHtml(pictogram.label || pictogram.term || "")}</strong></div>`;
}).join("");
const brand = pathToFileURL(path.join(appRoot, "assets", "institutional", "encabezado-gobierno-imss.jpg")).href;
const headingCss = isLandscape
  ? ".heading{display:grid;grid-template-columns:48% 1fr;grid-template-areas:'brand title' 'rule rule';align-items:center;gap:10px;margin-bottom:6px}.brand{grid-area:brand;width:100%;height:.72in;object-fit:contain;object-position:left center}.title{grid-area:title;text-align:left}.kicker{font-size:14px;font-weight:700;color:#004b93;letter-spacing:1px}h1{font-size:25px;text-transform:uppercase;margin:0;color:#0757a5}.rule{grid-area:rule;height:3px;background:#0757a5}"
  : ".heading{text-align:center;margin-bottom:6px}.brand{width:58%;height:.72in;object-fit:contain;object-position:left center}.kicker{font-size:14px;font-weight:700;color:#004b93;letter-spacing:1px}h1{font-size:24px;text-align:center;text-transform:uppercase;margin:4px 0 8px;border-bottom:3px solid #0757a5;padding-bottom:6px}.rule{display:none}";
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@page{size:A4 ${isLandscape ? "landscape" : "portrait"};margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#082f61}
.page{width:${pageSize.width};height:${pageSize.height};padding:.22in .34in .25in;display:flex;flex-direction:column;background:#fff}
${headingCss}
.grid{display:grid;grid-template-columns:repeat(${columns},1fr);grid-template-rows:repeat(${rows},1fr);gap:6px;flex:1}
.cell{border:2px solid #0757a5;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8px;overflow:hidden}
.cell.empty{border-style:dashed;border-color:#9ab0c5}.cell img{width:100%;height:calc(100% - 28px);object-fit:contain}.cell strong{font-size:16px;text-align:center;color:#111}
footer{font-size:6px;line-height:1.1;text-align:center;margin-top:5px;color:#444}
</style></head><body><section class="page"><header class="heading"><img class="brand" src="${brand}" alt=""><div class="title"><div class="kicker">TABLERO DE COMUNICACIÓN POR PICTOGRAMAS</div><h1>${escapeHtml(board.title || "Tablero de comunicación")}</h1></div><div class="rule"></div></header><div class="grid">${cells}</div><footer>Material institucional del Instituto Mexicano del Seguro Social con fines informativos, accesibles y no comerciales. Los pictogramas provienen de repositorios abiertos de comunicación aumentativa y alternativa, conforme a sus respectivas licencias.</footer></section></body></html>`;
fs.writeFileSync(temporaryHtml, html);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(temporaryHtml).href, { waitUntil: "networkidle" });
    await page.pdf({ path: outputPath, format: "A4", landscape: isLandscape, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  } finally {
    await browser.close();
    fs.rmSync(temporaryHtml, { force: true });
  }
})().catch(error => { fs.rmSync(temporaryHtml, { force: true }); throw error; });
function resolveImage(value = "") {
  if (/^(data:|https?:|file:)/i.test(value)) return value;
  return pathToFileURL(path.join(appRoot, value.replace(/^\.\//, "").replace(/\//g, path.sep))).href;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
