export function swapCells(page, from, to) { const cells = [...page.cells]; [cells[from], cells[to]] = [cells[to], cells[from]]; return { ...page, cells }; }
export function setCell(page, position, cell) { const cells = [...page.cells]; cells[position] = cell; return { ...page, cells }; }
