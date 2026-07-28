const fs = require("fs");
const path = require("path");

const modules = process.env.CODEX_NODE_MODULES;
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  VerticalAlign,
  BorderStyle,
  PageOrientation,
  HeightRule
} = require(path.join(modules, "docx"));

const [input, output, root] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(input, "utf8").replace(/^\uFEFF/, ""));
const board = payload.board;
const imagePath = path.join(root, payload.headerImage.replace(/^\.\//, ""));

const PAGE_WIDTH = 12240;   // Carta: 8.5 in
const PAGE_HEIGHT = 15840;  // Carta: 11 in
const MARGIN_TOP = 317;     // 0.22 in, igual que impresión/PDF
const MARGIN_RIGHT = 490;   // 0.34 in
const MARGIN_BOTTOM = 360;  // 0.25 in
const MARGIN_LEFT = 490;    // 0.34 in
const TABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const COLUMN_WIDTH = Math.floor(TABLE_WIDTH / 4);
const ROW_HEIGHT = 2250;
const BLUE = "0757A5";

const children = [];

if (fs.existsSync(imagePath)) {
  children.push(new Paragraph({
    children: [new ImageRun({
      data: fs.readFileSync(imagePath),
      transformation: { width: 445, height: 69 },
      type: "jpg"
    })],
    alignment: AlignmentType.LEFT,
    spacing: { after: 35 }
  }));
}

children.push(new Paragraph({
  children: [new TextRun({
    text: "TABLERO DE COMUNICACIÓN POR PICTOGRAMAS",
    bold: true,
    color: "004B93",
    size: 22
  })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 0, after: 20 }
}));

children.push(new Paragraph({
  children: [new TextRun({
    text: board.title.toUpperCase(),
    bold: true,
    color: "004B93",
    size: 40
  })],
  alignment: AlignmentType.CENTER,
  border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "004B93" } },
  spacing: { before: 0, after: 80 }
}));

const cells = [...(board.cells || [])];
while (cells.length < 16) cells.push(null);

const rows = [];
for (let r = 0; r < 4; r += 1) {
  const row = [];
  for (let c = 0; c < 4; c += 1) {
    row.push(makeCell(cells[r * 4 + c]));
  }
  rows.push(new TableRow({
    children: row,
    height: { value: ROW_HEIGHT, rule: HeightRule.EXACT }
  }));
}

children.push(new Table({
  rows,
  width: { size: TABLE_WIDTH, type: WidthType.DXA },
  columnWidths: [COLUMN_WIDTH, COLUMN_WIDTH, COLUMN_WIDTH, COLUMN_WIDTH]
}));

children.push(new Paragraph({
  children: [new TextRun({ text: payload.footer, size: 8, color: "555555" })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 55 }
}));

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: PageOrientation.PORTRAIT },
        margin: { top: MARGIN_TOP, right: MARGIN_RIGHT, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT }
      }
    },
    children
  }]
});

Packer.toBuffer(doc).then(buffer => fs.writeFileSync(output, buffer));

function makeCell(cell) {
  const content = [];
  if (cell) {
    const data = loadImage(cell);
    if (data) {
      content.push(new Paragraph({
        children: [new ImageRun({
          data,
          transformation: { width: 132, height: 118 },
          type: imageType(cell)
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 25 }
      }));
    }
    content.push(new Paragraph({
      children: [new TextRun({ text: cell.label, bold: true, size: 24 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 }
    }));
  }

  return new TableCell({
    children: content.length ? content : [new Paragraph("")],
    width: { size: COLUMN_WIDTH, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 90, bottom: 90, left: 90, right: 90 },
    borders: allBorders()
  });
}

function allBorders() {
  const b = { style: BorderStyle.SINGLE, size: 12, color: BLUE };
  return { top: b, bottom: b, left: b, right: b };
}

function loadImage(cell) {
  try {
    if (cell.imageData) return Buffer.from(cell.imageData.split(",")[1], "base64");
    if (cell.imageUrl && cell.imageUrl.startsWith("./")) {
      return fs.readFileSync(path.join(root, cell.imageUrl.replace(/^\.\//, "")));
    }
    return null;
  } catch {
    return null;
  }
}

function imageType(cell) {
  if (cell.imageData?.startsWith("data:image/jpeg")) return "jpg";
  return "png";
}
