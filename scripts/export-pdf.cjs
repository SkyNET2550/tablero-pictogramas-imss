const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

const [inputPath, outputPath, appRoot] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8").replace(/^\uFEFF/, ""));
const board = payload.board || {};
const temporaryHtml = `${outputPath}.html`;
const landscape = board.orientation === "landscape";
const columns = landscape ? 6 : 4;
const rowsCount = landscape ? 3 : 4;
const pageSize = landscape ? "letter landscape" : "letter portrait";
const pageWidth = landscape ? "11in" : "8.5in";
const pageHeight = landscape ? "8.5in" : "11in";

const cells = Array.from({ length: columns * rowsCount }, (_, index) => {
  const pictogram = board.cells?.[index] || board.pictograms?.[index];
  if (!pictogram) return '<div class="cell empty"></div>';
  return `<div class="cell"><img src="${escapeHtml(resolveImage(pictogram.imageData || pictogram.imageUrl || pictogram.image))}" alt=""><strong>${escapeHtml(pictogram.label || pictogram.term || "")}</strong></div>`;
}).join("");

const brand = pathToFileURL(path.join(appRoot, "assets", "institutional", "encabezado-gobierno-imss.jpg")).href;
const templateStyle = board.template?.imageData
  ? `background-image:url("${board.template.imageData}");background-size:100% 100%;background-position:center;background-repeat:no-repeat;`
  : "";
const brandVisibility = board.template?.imageData ? "visibility:hidden;" : "";

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@page{size:${pageSize};margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#082f61}
.page{width:${pageWidth};height:${pageHeight};padding:.2in .2in .22in;display:flex;flex-direction:column;background:#fff;${templateStyle}}
.heading{display:grid;grid-template-columns:${landscape ? "40%" : "58%"} 1fr;gap:.16in;align-items:end;border-bottom:${board.template?.imageData ? "0" : "3px solid #0757a5"};margin-bottom:8px;padding-bottom:5px}
.brand{width:100%;height:${landscape ? ".95in" : ".72in"};object-fit:contain;object-position:left center;${brandVisibility}}
.kicker{margin:0 0 2px;color:#004b93;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}.title-block{text-align:left}
h1{font-size:${landscape ? 26 : 24}px;text-transform:uppercase;margin:0;color:#004b93;line-height:1}
.grid{display:grid;grid-template-columns:repeat(${columns},1fr);grid-template-rows:repeat(${rowsCount},1fr);gap:6px;flex:1}
.cell{border:2px solid #0757a5;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8px;overflow:hidden;background:#fff}
.cell.empty{border-style:dashed;border-color:#9ab0c5;background:transparent}.cell img{width:100%;height:calc(100% - 28px);object-fit:contain}.cell strong{font-size:16px;text-align:center;color:#111}
footer{font-size:6px;line-height:1.1;text-align:center;margin-top:5px;color:#444}
</style></head><body><section class="page"><div class="heading"><img class="brand" src="${brand}" alt=""><div class="title-block"><p class="kicker">Tablero de comunicación por pictogramas</p><h1>${escapeHtml(board.title || "Tablero de comunicación")}</h1></div></div><div class="grid">${cells}</div><footer>Material institucional del Instituto Mexicano del Seguro Social con fines informativos, accesibles y no comerciales. Los pictogramas provienen de repositorios abiertos de comunicación aumentativa y alternativa, conforme a sus respectivas licencias.</footer></section></body></html>`;

fs.writeFileSync(temporaryHtml, html);
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(temporaryHtml).href, { waitUntil: "networkidle" });
    await page.pdf({ path: outputPath, format: "Letter", landscape, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
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
