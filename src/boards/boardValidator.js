export function validateBoard(board) {
  const errors = [];
  if (!board?.title) errors.push("El tablero requiere título.");
  if (!Array.isArray(board?.pages) || !board.pages.length) errors.push("El tablero requiere al menos una página.");
  return { valid: errors.length === 0, errors };
}
