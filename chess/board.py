from chess.piece import Piece
from chess.constants import WHITE, BLACK, PAWN, KING, BOARD_SIZE, BACK_RANK_ORDER


def _clone_piece(piece):
    if piece is None:
        return None
    cloned = Piece.__new__(Piece)
    cloned.color = piece.color
    cloned.piece_type = piece.piece_type
    cloned.has_moved = piece.has_moved
    return cloned


class Board:
    def __init__(self):
        self.grid = [[None for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]
        self.setup_starting_position()

    def setup_starting_position(self):
        for col in range(BOARD_SIZE):
            self.grid[0][col] = Piece(BLACK, BACK_RANK_ORDER[col])
            self.grid[1][col] = Piece(BLACK, PAWN)
            self.grid[6][col] = Piece(WHITE, PAWN)
            self.grid[7][col] = Piece(WHITE, BACK_RANK_ORDER[col])

    def get_piece(self, row, col):
        if self.is_on_board(row, col):
            return self.grid[row][col]
        return None

    def set_piece(self, row, col, piece):
        self.grid[row][col] = piece

    def remove_piece(self, row, col):
        piece = self.grid[row][col]
        self.grid[row][col] = None
        return piece

    def move_piece(self, from_row, from_col, to_row, to_col):
        moving_piece = self.remove_piece(from_row, from_col)
        captured_piece = self.remove_piece(to_row, to_col)
        self.set_piece(to_row, to_col, moving_piece)
        if moving_piece is not None:
            moving_piece.has_moved = True
        return captured_piece

    @staticmethod
    def is_on_board(row, col):
        return 0 <= row < BOARD_SIZE and 0 <= col < BOARD_SIZE

    def find_king(self, color):
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                piece = self.grid[row][col]
                if piece and piece.color == color and piece.piece_type == KING:
                    return row, col
        return None

    def to_dict(self):
        board_state = []
        for row in range(BOARD_SIZE):
            row_state = []
            for col in range(BOARD_SIZE):
                piece = self.grid[row][col]
                if piece:
                    row_state.append({"color": piece.color, "type": piece.piece_type})
                else:
                    row_state.append(None)
            board_state.append(row_state)
        return board_state

    def position_hash(self):
        parts = []
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                piece = self.grid[row][col]
                if piece:
                    parts.append(f"{row}{col}{piece.color[0]}{piece.piece_type[0:2]}")
                else:
                    parts.append(f"{row}{col}__")
        return "|".join(parts)

    def clone(self):
        new_board = Board.__new__(Board)
        new_board.grid = [
            [_clone_piece(cell) for cell in row]
            for row in self.grid
        ]
        return new_board

    def get_all_pieces(self, color):
        pieces = []
        for row in range(BOARD_SIZE):
            for col in range(BOARD_SIZE):
                piece = self.grid[row][col]
                if piece and piece.color == color:
                    pieces.append((row, col, piece))
        return pieces
