const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "API Request failed");
  }
  return response.json();
};

export const API = {
  async getState() {
    const response = await fetch("/api/state");
    return handleResponse(response);
  },

  async newGame(config) {
    const response = await fetch("/api/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    return handleResponse(response);
  },

  async getLegalMoves(row, col) {
    const response = await fetch("/api/legal-moves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row, col }),
    });
    return handleResponse(response);
  },

  async makeMove(fromRow, fromCol, toRow, toCol) {
    const response = await fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol,
      }),
    });
    return handleResponse(response);
  },

  async promote(pieceType) {
    const response = await fetch("/api/promote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ piece_type: pieceType }),
    });
    return handleResponse(response);
  },

  async resign(color) {
    const response = await fetch("/api/resign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ color }),
    });
    return handleResponse(response);
  },

  async undo() {
    const response = await fetch("/api/undo", { method: "POST" });
    return handleResponse(response);
  },

  async redo() {
    const response = await fetch("/api/redo", { method: "POST" });
    return handleResponse(response);
  },

  async tick() {
    const response = await fetch("/api/tick", { method: "POST" });
    return handleResponse(response);
  },

  async reset() {
    const response = await fetch("/api/reset", { method: "POST" });
    return handleResponse(response);
  },
};
