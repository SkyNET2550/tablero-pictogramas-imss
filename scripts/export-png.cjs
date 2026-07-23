const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const os = require("os");
const [input, output, root] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(input, "utf8"));
const board = payload.board;

(() => {
  const cells = [...board.cells];
  while (cells.length < 16) cells.push(null);
  const cards = cells.map(cell => cell ? `<article class="cell"><img src="${resolveImage(cell)}"><strong>${esc(cell.label)}</strong></article>` : `<article class="cell empty"></article>`).join("");
  const headerPath = path.join(root, payload.headerImage.replace(/^\.\//, ""));
  const header = fs.existsSync(headerPath) ? `data:image/jpeg;base64,${fs.readFileSync(headerPath).toString("base64")}` : "";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial}.page{position:relative;width:816px;height:1056px;padding:16px 45px 45px;background:#fff;overflow:hidden}
  .brand{width:58.4%;height:111px;object-fit:contain;object-position:left top}.k{text-align:center;color:#004b93;font-weight:700;font-size:14px;letter-spacing:1px}.rule{width:80%;height:2px;background:#004b93;margin:4px auto}.title{text-align:center;color:#004b93;font-size:30px;font-weight:800;margin:0 0 8px}
  .grid{height:795px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:7px}.cell{border:2.5px solid #0757a5;border-radius:10px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:space-between}.cell img{width:100%;height:calc(100% - 28px);object-fit:contain}.cell strong{font-size:16px;text-align:center}.empty{border-style:dashed;border-color:#aaa}
  footer{position:absolute;left:45px;right:45px;bottom:18px;border-top:1px solid #777;padding-top:4px;font-size:6px;text-align:center}</style></head><body>
  <section class="page">${header ? `<img class="brand" src="${header}">` : ""}<div class="k">TABLERO DE COMUNICACIÓN POR PICTOGRAMAS</div><div class="rule"></div><h1 class="title">${esc(board.title.toUpperCase())}</h1><main class="grid">${cards}</main><footer>${esc(payload.footer)}</footer></section></body></html>`;
  const tempHtml = path.join(os.tmpdir(), `board-${Date.now()}.html`);
  fs.writeFileSync(tempHtml, html);
  const chrome = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  execFileSync(chrome, ["--headless", "--disable-gpu", "--hide-scrollbars", "--window-size=816,1056", "--force-device-scale-factor=2", `--screenshot=${output}`, `file:///${tempHtml.replace(/\\/g,"/")}`], { timeout: 120000, stdio: "pipe" });
  fs.unlinkSync(tempHtml);
})();

function resolveImage(cell) {
  if (cell.imageData) return cell.imageData;
  if (cell.imageUrl?.startsWith("./")) {
    const file = path.join(root, cell.imageUrl.replace(/^\.\//, ""));
    if (fs.existsSync(file)) return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
  }
  return cell.imageUrl || "";
}
function esc(value=""){return String(value).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
