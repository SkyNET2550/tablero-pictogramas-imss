export function createBoard({ id, title = "Nuevo tablero", subtitle = "", columns = 4, rows = 4, orientation = "portrait" } = {}) {
  const now = new Date().toISOString();
  return { board_id: id || `board_${Date.now()}`, version: "1.0.0", created_at: now, updated_at: now, validated: false, validated_by: "", change_log: [], title, subtitle, page_size: "letter", orientation, columns, rows, pages: [{ page_number: 1, theme: "", cells: Array(columns * rows).fill(null) }] };
}
