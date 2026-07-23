import test from "node:test";
import assert from "node:assert/strict";
import { createBoard } from "../src/boards/boardBuilder.js";
import { setCell, swapCells } from "../src/boards/boardCellManager.js";
import { validateBoard } from "../src/boards/boardValidator.js";
test("crea tablero carta 4x4 e intercambia celdas", () => {
  const board = createBoard({ title: "Bienvenida" });
  assert.equal(board.pages[0].cells.length, 16);
  let page = setCell(board.pages[0], 0, { label: "Hola" });
  page = swapCells(page, 0, 1);
  assert.equal(page.cells[1].label, "Hola");
  assert.equal(validateBoard(board).valid, true);
});
