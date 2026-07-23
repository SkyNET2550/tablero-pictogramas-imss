const fs = require("fs");
const path = require("path");
const modules = process.env.CODEX_NODE_MODULES;
const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, AlignmentType, VerticalAlign, BorderStyle, PageOrientation } = require(path.join(modules, "docx"));

const [input, output, root] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(input, "utf8"));
const board = payload.board;
const imagePath = path.join(root, payload.headerImage.replace(/^\.\//, ""));
const children = [];
if (fs.existsSync(imagePath)) children.push(new Paragraph({ children: [new ImageRun({ data: fs.readFileSync(imagePath), transformation: { width: 460, height: 111 }, type: "jpg" })], alignment: AlignmentType.LEFT, spacing: { after: 40 } }));
children.push(new Paragraph({ children: [new TextRun({ text: "TABLERO DE COMUNICACIÓN POR PICTOGRAMAS", bold: true, color: "004B93", size: 22 })], alignment: AlignmentType.CENTER }));
children.push(new Paragraph({ children: [new TextRun({ text: board.title.toUpperCase(), bold: true, color: "004B93", size: 42 })], alignment: AlignmentType.CENTER, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "004B93" } }, spacing: { after: 120 } }));
const cells = [...board.cells];
while (cells.length < 16) cells.push(null);
const rows = [];
for (let r = 0; r < 4; r++) {
  const row = [];
  for (let c = 0; c < 4; c++) row.push(makeCell(cells[r * 4 + c]));
  rows.push(new TableRow({ children: row, height: { value: 1700, rule: "atLeast" } }));
}
children.push(new Table({ rows, width: { size: 9360, type: WidthType.DXA }, columnWidths: [2340,2340,2340,2340] }));
children.push(new Paragraph({ children: [new TextRun({ text: payload.footer, size: 9, color: "555555" })], alignment: AlignmentType.CENTER, spacing: { before: 80 } }));
const doc = new Document({ sections: [{ properties: { page: { size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT }, margin: { top: 238, right: 680, bottom: 680, left: 680 } } }, children }] });
Packer.toBuffer(doc).then(buffer => fs.writeFileSync(output, buffer));

function makeCell(cell) {
  const content = [];
  if (cell) {
    const data = loadImage(cell);
    if (data) content.push(new Paragraph({ children: [new ImageRun({ data, transformation: { width: 130, height: 120 }, type: imageType(cell) })], alignment: AlignmentType.CENTER }));
    content.push(new Paragraph({ children: [new TextRun({ text: cell.label, bold: true, size: 25 })], alignment: AlignmentType.CENTER }));
  }
  return new TableCell({ children: content.length ? content : [new Paragraph("")], width: { size: 2340, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, margins: { top: 80, bottom: 80, left: 80, right: 80 }, borders: allBorders() });
}
function allBorders(){const b={style:BorderStyle.SINGLE,size:12,color:"0057B8"};return{top:b,bottom:b,left:b,right:b};}
function loadImage(cell){try{if(cell.imageData)return Buffer.from(cell.imageData.split(",")[1],"base64");if(cell.imageUrl&&cell.imageUrl.startsWith("./"))return fs.readFileSync(path.join(root,cell.imageUrl.replace(/^\.\//,"")));return null;}catch{return null;}}
function imageType(cell){if(cell.imageData?.startsWith("data:image/jpeg"))return"jpg";return"png";}
