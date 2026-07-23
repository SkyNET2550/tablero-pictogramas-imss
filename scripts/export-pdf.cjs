const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { pathToFileURL } = require("url");

const [inputPath, outputPath, appRoot] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const board = payload.board || {};
const temporaryHtml = `${outputPath}.html`;
const chrome = [
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
].filter(Boolean).find(candidate => fs.existsSync(candidate));
if (!chrome) throw new Error("No se encontró Chrome o Microsoft Edge para generar el PDF.");

const cells = Array.from({ length: 16 }, (_, index) => {
  const pictogram = board.cells?.[index] || board.pictograms?.[index];
  if (!pictogram) return '<div class="cell empty"></div>';
  return `<div class="cell"><img src="${escapeHtml(resolveImage(pictogram.imageUrl || pictogram.image))}" alt=""><strong>${escapeHtml(pictogram.label || pictogram.term || "")}</strong></div>`;
}).join("");
const brand = pathToFileURL(path.join(appRoot, "assets", "institutional", "encabezado-gobierno-imss.jpg")).href;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@page{size:letter portrait;margin:0}*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif;color:#082f61}
.page{width:8.5in;height:11in;padding:.22in .34in .25in;display:flex;flex-direction:column;background:#fff}
.brand{width:58%;height:.72in;object-fit:contain;object-position:left center}
h1{font-size:24px;text-align:center;text-transform:uppercase;margin:4px 0 8px;border-bottom:3px solid #0757a5;padding-bottom:6px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:6px;flex:1}
.cell{border:2px solid #0757a5;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:8px;overflow:hidden}
.cell.empty{border-style:dashed;border-color:#9ab0c5}.cell img{width:100%;height:calc(100% - 28px);object-fit:contain}.cell strong{font-size:16px;text-align:center;color:#111}
footer{font-size:6px;line-height:1.1;text-align:center;margin-top:5px;color:#444}
</style></head><body><section class="page"><img class="brand" src="${brand}" alt=""><h1>${escapeHtml(board.title || "Tablero de comunicación")}</h1><div class="grid">${cells}</div><footer>Material institucional del Instituto Mexicano del Seguro Social con fines informativos, accesibles y no comerciales. Los pictogramas provienen de repositorios abiertos de comunicación aumentativa y alternativa, conforme a sus respectivas licencias.</footer></section></body></html>`;
fs.writeFileSync(temporaryHtml, html);
try {
  execFileSync(chrome, ["--headless", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${outputPath}`, pathToFileURL(temporaryHtml).href], { stdio: "pipe", timeout: 120000 });
} finally {
  fs.rmSync(temporaryHtml, { force: true });
}
function resolveImage(value = "") {
  if (/^(data:|https?:|file:)/i.test(value)) return value;
  return pathToFileURL(path.join(appRoot, value.replace(/^\.\//, "").replace(/\//g, path.sep))).href;
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
}
