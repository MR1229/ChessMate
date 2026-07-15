BOARD_SIZE = 8

WHITE = "white"
BLACK = "black"

PAWN = "pawn"
KNIGHT = "knight"
BISHOP = "bishop"
ROOK = "rook"
QUEEN = "queen"
KING = "king"

BACK_RANK_ORDER = [ROOK, KNIGHT, BISHOP, QUEEN, KING, BISHOP, KNIGHT, ROOK]

PROMOTION_PIECES = [QUEEN, ROOK, BISHOP, KNIGHT]

STATUS_ONGOING = "ongoing"
STATUS_CHECK = "check"
STATUS_CHECKMATE = "checkmate"
STATUS_STALEMATE = "stalemate"
STATUS_DRAW_50_MOVE = "draw_50_move"
STATUS_DRAW_THREEFOLD = "draw_threefold"
STATUS_DRAW_INSUFFICIENT = "draw_insufficient"
STATUS_RESIGNED = "resigned"
STATUS_TIMEOUT = "timeout"

PIECE_SYMBOLS = {
    (WHITE, PAWN): "\u2659",
    (WHITE, KNIGHT): "\u2658",
    (WHITE, BISHOP): "\u2657",
    (WHITE, ROOK): "\u2656",
    (WHITE, QUEEN): "\u2655",
    (WHITE, KING): "\u2654",
    (BLACK, PAWN): "\u265F",
    (BLACK, KNIGHT): "\u265E",
    (BLACK, BISHOP): "\u265D",
    (BLACK, ROOK): "\u265C",
    (BLACK, QUEEN): "\u265B",
    (BLACK, KING): "\u265A",
}

PIECE_VALUES = {
    PAWN: 1,
    KNIGHT: 3,
    BISHOP: 3,
    ROOK: 5,
    QUEEN: 9,
    KING: 0,
}
