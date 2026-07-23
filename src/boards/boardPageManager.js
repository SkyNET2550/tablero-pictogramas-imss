export const addPage = board => ({ ...board, pages: [...board.pages, { page_number: board.pages.length + 1, theme: "", cells: Array(board.columns * board.rows).fill(null) }] });
