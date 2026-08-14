const fs = require("fs");
const path = require("path");
const os = require("os");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");
const [input, output, root] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(input, "utf8"));
const board = payload.board || {};

(async () => {
  const isLandscape = board.orientation === "horizontal";
  const columns = isLandscape ? 5 : 4;
  const rows = isLandscape ? 4 : 5;
  const viewport = isLandscape ? { width: 1123, height: 794 } : { width: 794, height: 1123 };
  const gridHeight = isLandscape ? 555 : 850;
  const cells = [...(board.cells || [])];
  while (cells.length < 20) cells.push(null);
  const cards = cells.map(cell => cell ? `<article class="cell"><img src="${resolveImage(cell)}"><strong>${esc(cell.label)}</strong></article>` : `<article class="cell empty"></article>`).join("");
  const headerPath = path.join(root, payload.headerImage.replace(/^\.\//, ""));
  const header = fs.existsSync(headerPath) ? `data:image/jpeg;base64,${fs.readFileSync(headerPath).toString("base64")}` : "";
  const heading = isLandscape
    ? `<header class="heading horizontal">${header ? `<img class="brand" src="${header}">` : ""}<div class="titlebox"><div class="k">TABLERO DE COMUNICACIÓN POR PICTOGRAMAS</div><h1 class="title">${esc(board.title.toUpperCase())}</h1></div><div class="rule"></div></header>`
    : `<header class="heading vertical">${header ? `<img class="brand" src="${header}">` : ""}<div class="k">TABLERO DE COMUNICACIÓN POR PICTOGRAMAS</div><div class="rule"></div><h1 class="title">${esc(board.title.toUpperCase())}</h1></header>`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial}.page{position:relative;width:${viewport.width}px;height:${viewport.height}px;padding:16px 45px 45px;background:#fff;overflow:hidden}
  .heading.vertical{text-align:center}.heading.horizontal{display:grid;grid-template-columns:48% 1fr;grid-template-areas:'brand title' 'rule rule';align-items:center;gap:10px;margin-bottom:7px}.brand{width:58.4%;height:84px;object-fit:contain;object-position:left top}.heading.horizontal .brand{grid-area:brand;width:100%;height:69px;object-position:left center}.titlebox{grid-area:title;text-align:left}.k{color:#004b93;font-weight:700;font-size:14px;letter-spacing:1px}.rule{width:80%;height:2px;background:#004b93;margin:4px auto}.heading.horizontal .rule{grid-area:rule;width:100%;margin:4px 0}.title{color:#004b93;font-size:30px;font-weight:800;margin:0 0 8px}.heading.horizontal .title{margin:0;font-size:29px;text-align:left}
  .grid{height:${gridHeight}px;display:grid;grid-template-columns:repeat(${columns},1fr);grid-template-rows:repeat(${rows},1fr);gap:7px}.cell{border:2.5px solid #0757a5;border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between}.cell img{width:100%;height:calc(100% - 28px);object-fit:contain}.cell strong{font-size:16px;text-align:center}.empty{border-style:dashed;border-color:#aaa}
  footer{position:absolute;left:45px;right:45px;bottom:18px;border-top:1px solid #777;padding-top:4px;font-size:6px;text-align:center}</style></head><body>
  <section class="page">${heading}<main class="grid">${cards}</main><footer>${esc(payload.footer)}</footer></section></body></html>`;
  const tempHtml = path.join(os.tmpdir(), `board-${Date.now()}.html`);
  fs.writeFileSync(tempHtml, html);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(tempHtml).href, { waitUntil: "networkidle" });
    await page.screenshot({ path: output, fullPage: false });
  } finally {
    await browser.close();
    fs.rmSync(tempHtml, { force: true });
  }
})().catch(error => { throw error; });

function resolveImage(cell) {
  if (cell.imageData) return cell.imageData;
  if (cell.imageUrl?.startsWith("./")) {
    const file = path.join(root, cell.imageUrl.replace(/^\.\//, ""));
    if (fs.existsSync(file)) return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
  }
  return cell.imageUrl || "";
}
function esc(value=""){return String(value).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
