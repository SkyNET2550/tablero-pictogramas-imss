const fs = require("fs");
const path = require("path");

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
} = require("docx");

const [input, output, root] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(input, "utf8").replace(/^\uFEFF/, ""));
const board = payload.board;
const imagePath = path.join(root, payload.headerImage.replace(/^\.\//, ""));

const isLandscape = board.orientation === "horizontal";
const PAGE_WIDTH = isLandscape ? 16838 : 11906;   // A4 landscape/portrait
const PAGE_HEIGHT = isLandscape ? 11906 : 16838;  // A4 landscape/portrait
const MARGIN_TOP = 317;     // 0.22 in, igual que impresiÃ³n/PDF
const MARGIN_RIGHT = 490;   // 0.34 in
const MARGIN_BOTTOM = 360;  // 0.25 in
const MARGIN_LEFT = 490;    // 0.34 in
const TABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const CELLS_PER_PAGE = 20;
const COLUMNS_PER_PAGE = isLandscape ? 5 : 4;
const ROWS_PER_PAGE = isLandscape ? 4 : 5;
const COLUMN_WIDTH = Math.floor(TABLE_WIDTH / COLUMNS_PER_PAGE);
const ROW_HEIGHT = isLandscape ? 1410 : 1740;
const BLUE = "0757A5";

const children = [];

if (fs.existsSync(imagePath)) {
  children.push(new Paragraph({
    children: [new ImageRun({
      data: fs.readFileSync(imagePath),
      transformation: { width: isLandscape ? 445 : 445, height: 69 },
      type: "jpg"
    })],
    alignment: AlignmentType.LEFT,
    spacing: { after: 35 }
  }));
}

children.push(new Paragraph({
  children: [new TextRun({
    text: "TABLERO DE COMUNICACIÃ“N POR PICTOGRAMAS",
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
while (cells.length < CELLS_PER_PAGE) cells.push(null);

const rows = [];
for (let r = 0; r < ROWS_PER_PAGE; r += 1) {
  const row = [];
  for (let c = 0; c < COLUMNS_PER_PAGE; c += 1) {
    row.push(makeCell(cells[r * COLUMNS_PER_PAGE + c]));
  }
  rows.push(new TableRow({
    children: row,
    height: { value: ROW_HEIGHT, rule: HeightRule.EXACT }
  }));
}

children.push(new Table({
  rows,
  width: { size: TABLE_WIDTH, type: WidthType.DXA },
  columnWidths: Array(COLUMNS_PER_PAGE).fill(COLUMN_WIDTH)
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
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
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
          transformation: { width: isLandscape ? 118 : 112, height: isLandscape ? 78 : 94 },
          type: imageType(cell)
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 16 }
      }));
    }
    content.push(new Paragraph({
      children: [new TextRun({ text: cell.label, bold: true, size: 20 })],
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 0 }
    }));
  }

  return new TableCell({
    children: content.length ? content : [new Paragraph("")],
    width: { size: COLUMN_WIDTH, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 55, bottom: 55, left: 70, right: 70 },
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





