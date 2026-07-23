export function boardMetadata(board) { return { board_id: board.board_id || board.id, title: board.title, pages: board.pages?.length || 1, updated_at: new Date().toISOString() }; }
