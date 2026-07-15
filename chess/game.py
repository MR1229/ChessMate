import time
from chess.board import Board
from chess.piece import Piece
from chess.rules import get_legal_moves, is_king_in_check, get_game_status
from chess.constants import (
    WHITE, BLACK, PAWN, QUEEN, KING, ROOK,
    PROMOTION_PIECES, PIECE_VALUES,
    STATUS_ONGOING, STATUS_CHECK, STATUS_CHECKMATE,
    STATUS_RESIGNED, STATUS_TIMEOUT,
)

FILES = ["a", "b", "c", "d", "e", "f", "g", "h"]
PIECE_NOTATION = {
    "knight": "N", "bishop": "B", "rook": "R", "queen": "Q", "king": "K",
}


class Game:
    def __init__(self, config=None):
        config = config or {}
        self.board = Board()
        self.current_turn = WHITE
        self.move_history = []
        self.en_passant_target = None
        self.halfmove_clock = 0
        self.position_counts = {}
        self.status = STATUS_ONGOING
        self.winner = None
        self.pending_promotion = None
        self.captured_pieces = {WHITE: [], BLACK: []}

        self.undo_enabled = config.get("undo_enabled", False)
        self.undo_stack = []
        self.redo_stack = []
        self.takebacks_remaining = {WHITE: 2, BLACK: 2}

        self.timer_mode = config.get("timer_mode", None)
        self.time_white = config.get("time_seconds", None)
        self.time_black = config.get("time_seconds", None)
        self.increment = config.get("increment", 0)
        self.last_move_timestamp = None

        self._record_position()

    def _record_position(self):
        h = self.board.position_hash()
        self.position_counts[h] = self.position_counts.get(h, 0) + 1

    def get_legal_moves_for_square(self, row, col):
        if self.status not in (STATUS_ONGOING, STATUS_CHECK):
            return []
        if self.pending_promotion is not None:
            return []
        piece = self.board.get_piece(row, col)
        if piece is None or piece.color != self.current_turn:
            return []
        moves = get_legal_moves(self.board, row, col, self.en_passant_target)
        return [{"row": r, "col": c, "flag": f} for r, c, f in moves]

    def make_move(self, from_row, from_col, to_row, to_col):
        if self.status not in (STATUS_ONGOING, STATUS_CHECK):
            return {"success": False, "error": "Game is already over"}
        if self.pending_promotion is not None:
            return {"success": False, "error": "Must complete promotion first"}

        piece = self.board.get_piece(from_row, from_col)
        if piece is None or piece.color != self.current_turn:
            return {"success": False, "error": "No piece of the current player on that square"}

        legal = get_legal_moves(self.board, from_row, from_col, self.en_passant_target)
        matching = [(r, c, f) for r, c, f in legal if r == to_row and c == to_col]
        if not matching:
            return {"success": False, "error": "That move is not legal"}

        _, _, flag = matching[0]

        if self.undo_enabled:
            self._save_undo_state()
            self.redo_stack.clear()

        if self.time_white is not None:
            self._tick_timer()

        captured = self._execute_move(from_row, from_col, to_row, to_col, flag, piece)

        if flag == "promotion":
            self.pending_promotion = {
                "row": to_row, "col": to_col,
                "color": piece.color,
                "from": [from_row, from_col], "to": [to_row, to_col],
                "captured": captured,
            }
            return {"success": True, "needs_promotion": True, **self.get_state()}

        self._finalize_move(from_row, from_col, to_row, to_col, piece, captured, flag)
        return {"success": True, **self.get_state()}

    def promote(self, piece_type):
        if self.pending_promotion is None:
            return {"success": False, "error": "No pending promotion"}
        if piece_type not in PROMOTION_PIECES:
            return {"success": False, "error": f"Invalid promotion piece: {piece_type}"}

        promo = self.pending_promotion
        new_piece = Piece(promo["color"], piece_type)
        new_piece.has_moved = True
        self.board.set_piece(promo["row"], promo["col"], new_piece)

        from_row, from_col = promo["from"]
        to_row, to_col = promo["to"]
        original_piece = Piece(promo["color"], PAWN)
        self.pending_promotion = None

        self._finalize_move(from_row, from_col, to_row, to_col, original_piece,
                           promo["captured"], "promotion", promoted_to=piece_type)
        return {"success": True, **self.get_state()}

    def _execute_move(self, from_row, from_col, to_row, to_col, flag, piece):
        captured = None

        if flag == "en_passant":
            captured_pawn = self.board.remove_piece(from_row, to_col)
            if captured_pawn:
                self.captured_pieces[piece.color].append(captured_pawn.piece_type)
            self.board.move_piece(from_row, from_col, to_row, to_col)
            return captured_pawn

        if flag == "castle_kingside":
            self.board.move_piece(from_row, from_col, to_row, to_col)
            rook = self.board.remove_piece(from_row, 7)
            rook.has_moved = True
            self.board.set_piece(from_row, 5, rook)
            return None

        if flag == "castle_queenside":
            self.board.move_piece(from_row, from_col, to_row, to_col)
            rook = self.board.remove_piece(from_row, 0)
            rook.has_moved = True
            self.board.set_piece(from_row, 3, rook)
            return None

        captured_piece = self.board.move_piece(from_row, from_col, to_row, to_col)
        if captured_piece:
            self.captured_pieces[piece.color].append(captured_piece.piece_type)
        return captured_piece

    def _finalize_move(self, from_row, from_col, to_row, to_col, piece, captured, flag,
                       promoted_to=None):
        if piece.piece_type == PAWN and abs(to_row - from_row) == 2:
            direction = -1 if piece.color == WHITE else 1
            self.en_passant_target = (from_row + direction, from_col)
        else:
            self.en_passant_target = None

        if piece.piece_type == PAWN or captured is not None:
            self.halfmove_clock = 0
        else:
            self.halfmove_clock += 1

        notation = self._build_notation(from_row, from_col, to_row, to_col, piece,
                                         captured, flag, promoted_to)

        self.move_history.append({
            "piece": piece.piece_type,
            "color": piece.color,
            "from": [from_row, from_col],
            "to": [to_row, to_col],
            "captured": captured.piece_type if hasattr(captured, 'piece_type') and captured else (
                captured if isinstance(captured, str) else None
            ),
            "flag": flag,
            "promoted_to": promoted_to,
            "notation": notation,
        })

        if self.time_white is not None and self.increment > 0:
            if piece.color == WHITE:
                self.time_white += self.increment
            else:
                self.time_black += self.increment

        self.current_turn = BLACK if self.current_turn == WHITE else WHITE

        self._record_position()

        self.status = get_game_status(
            self.board, self.current_turn, self.en_passant_target,
            self.halfmove_clock, self.position_counts
        )

        if self.status == STATUS_CHECKMATE:
            self.winner = piece.color

    def _build_notation(self, from_row, from_col, to_row, to_col, piece,
                        captured, flag, promoted_to=None):
        if flag == "castle_kingside":
            return "O-O"
        if flag == "castle_queenside":
            return "O-O-O"

        notation = ""
        if piece.piece_type != PAWN:
            notation += PIECE_NOTATION.get(piece.piece_type, "")
        elif captured:
            notation += FILES[from_col]

        if captured:
            notation += "x"

        notation += FILES[to_col] + str(8 - to_row)

        if promoted_to:
            notation += "=" + PIECE_NOTATION.get(promoted_to, "Q")

        return notation

    def resign(self, color):
        if self.status not in (STATUS_ONGOING, STATUS_CHECK):
            return {"success": False, "error": "Game is already over"}
        self.status = STATUS_RESIGNED
        self.winner = BLACK if color == WHITE else WHITE
        return {"success": True, **self.get_state()}

    def timeout(self, color):
        if self.status not in (STATUS_ONGOING, STATUS_CHECK):
            return {"success": False, "error": "Game is already over"}
        self.status = STATUS_TIMEOUT
        self.winner = BLACK if color == WHITE else WHITE
        return {"success": True, **self.get_state()}

    def _tick_timer(self):
        if len(self.move_history) == 0:
            self.last_move_timestamp = None
            return
        if self.last_move_timestamp is None:
            self.last_move_timestamp = time.time()
            return
        now = time.time()
        elapsed = now - self.last_move_timestamp
        if self.current_turn == WHITE:
            self.time_white = max(0, self.time_white - elapsed)
        else:
            self.time_black = max(0, self.time_black - elapsed)
        self.last_move_timestamp = now

    def _save_undo_state(self):
        self.undo_stack.append({
            "board": self.board.clone(),
            "current_turn": self.current_turn,
            "en_passant_target": self.en_passant_target,
            "halfmove_clock": self.halfmove_clock,
            "position_counts": dict(self.position_counts),
            "status": self.status,
            "winner": self.winner,
            "move_history": list(self.move_history),
            "captured_pieces": {
                WHITE: list(self.captured_pieces[WHITE]),
                BLACK: list(self.captured_pieces[BLACK]),
            },
        })

    def undo(self):
        if not self.undo_enabled:
            return {"success": False, "error": "Undo is not enabled"}
        if not self.undo_stack:
            return {"success": False, "error": "Nothing to undo"}
        if not self.move_history:
            return {"success": False, "error": "No moves to undo"}

        last_move = self.move_history[-1]
        color = last_move["color"]
        if self.takebacks_remaining[color] <= 0:
            return {"success": False, "error": f"No takebacks remaining for {color}"}

        self.takebacks_remaining[color] -= 1

        self.redo_stack.append({
            "board": self.board.clone(),
            "current_turn": self.current_turn,
            "en_passant_target": self.en_passant_target,
            "halfmove_clock": self.halfmove_clock,
            "position_counts": dict(self.position_counts),
            "status": self.status,
            "winner": self.winner,
            "move_history": list(self.move_history),
            "captured_pieces": {
                WHITE: list(self.captured_pieces[WHITE]),
                BLACK: list(self.captured_pieces[BLACK]),
            },
        })

        state = self.undo_stack.pop()
        self._restore_state(state)
        return {"success": True, **self.get_state()}

    def redo(self):
        if not self.undo_enabled:
            return {"success": False, "error": "Redo is not enabled"}
        if not self.redo_stack:
            return {"success": False, "error": "Nothing to redo"}

        self._save_undo_state()
        state = self.redo_stack.pop()
        self._restore_state(state)
        return {"success": True, **self.get_state()}

    def _restore_state(self, state):
        self.board = state["board"]
        self.current_turn = state["current_turn"]
        self.en_passant_target = state["en_passant_target"]
        self.halfmove_clock = state["halfmove_clock"]
        self.position_counts = state["position_counts"]
        self.status = state["status"]
        self.winner = state["winner"]
        self.move_history = state["move_history"]
        self.captured_pieces = state["captured_pieces"]

    def get_state(self):
        if self.time_white is not None and self.status in (STATUS_ONGOING, STATUS_CHECK):
            self._tick_timer()

        material = self._calculate_material_advantage()

        return {
            "board": self.board.to_dict(),
            "current_turn": self.current_turn,
            "status": self.status,
            "winner": self.winner,
            "check": is_king_in_check(self.board, self.current_turn),
            "move_history": self.move_history,
            "en_passant_target": list(self.en_passant_target) if self.en_passant_target else None,
            "halfmove_clock": self.halfmove_clock,
            "pending_promotion": self.pending_promotion is not None,
            "captured_pieces": self.captured_pieces,
            "material_advantage": material,
            "undo_enabled": self.undo_enabled,
            "can_undo": self.undo_enabled and len(self.undo_stack) > 0,
            "can_redo": self.undo_enabled and len(self.redo_stack) > 0,
            "time_white": round(self.time_white, 1) if self.time_white is not None else None,
            "time_black": round(self.time_black, 1) if self.time_black is not None else None,
            "timer_mode": self.timer_mode,
            "increment": self.increment,
            "takebacks_remaining": self.takebacks_remaining,
        }

    def _calculate_material_advantage(self):
        white_total = 0
        black_total = 0
        for row in range(8):
            for col in range(8):
                piece = self.board.get_piece(row, col)
                if piece:
                    val = PIECE_VALUES.get(piece.piece_type, 0)
                    if piece.color == WHITE:
                        white_total += val
                    else:
                        black_total += val
        return white_total - black_total

    def reset(self, config=None):
        self.__init__(config)
