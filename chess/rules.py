from chess.constants import (
    WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, BOARD_SIZE,
    STATUS_ONGOING, STATUS_CHECK, STATUS_CHECKMATE, STATUS_STALEMATE,
    STATUS_DRAW_50_MOVE, STATUS_DRAW_THREEFOLD, STATUS_DRAW_INSUFFICIENT,
)
from chess.moves import get_pseudo_legal_moves


def is_square_attacked(board, row, col, by_color):
    for dr, dc in ((-2, -1), (-2, 1), (-1, -2), (-1, 2),
                   (1, -2), (1, 2), (2, -1), (2, 1)):
        piece = board.get_piece(row + dr, col + dc)
        if piece and piece.color == by_color and piece.piece_type == KNIGHT:
            return True

    pawn_row = row + (1 if by_color == WHITE else -1)
    for dc in (-1, 1):
        piece = board.get_piece(pawn_row, col + dc)
        if piece and piece.color == by_color and piece.piece_type == PAWN:
            return True

    for dr in (-1, 0, 1):
        for dc in (-1, 0, 1):
            if dr == 0 and dc == 0:
                continue
            piece = board.get_piece(row + dr, col + dc)
            if piece and piece.color == by_color and piece.piece_type == KING:
                return True

    for dr, dc in ((-1, -1), (-1, 1), (1, -1), (1, 1)):
        r, c = row + dr, col + dc
        while board.is_on_board(r, c):
            piece = board.get_piece(r, c)
            if piece:
                if piece.color == by_color and piece.piece_type in (BISHOP, QUEEN):
                    return True
                break
            r += dr
            c += dc

    for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
        r, c = row + dr, col + dc
        while board.is_on_board(r, c):
            piece = board.get_piece(r, c)
            if piece:
                if piece.color == by_color and piece.piece_type in (ROOK, QUEEN):
                    return True
                break
            r += dr
            c += dc

    return False


def is_king_in_check(board, color):
    king_position = board.find_king(color)
    if king_position is None:
        return False
    king_row, king_col = king_position
    opponent_color = BLACK if color == WHITE else WHITE
    return is_square_attacked(board, king_row, king_col, opponent_color)


def get_legal_moves(board, row, col, en_passant_target=None):
    piece = board.get_piece(row, col)
    if piece is None:
        return []

    legal_moves = []
    for target_row, target_col, flag in get_pseudo_legal_moves(board, row, col, en_passant_target):
        simulated_board = board.clone()

        if flag == "en_passant":
            direction = -1 if piece.color == WHITE else 1
            simulated_board.remove_piece(row, target_col)
        simulated_board.move_piece(row, col, target_row, target_col)

        if not is_king_in_check(simulated_board, piece.color):
            legal_moves.append((target_row, target_col, flag))

    if piece.piece_type == KING:
        legal_moves.extend(_castling_moves(board, row, col, piece))

    return legal_moves


def _castling_moves(board, row, col, piece):
    if piece.has_moved:
        return []
    if is_king_in_check(board, piece.color):
        return []

    moves = []
    opponent = BLACK if piece.color == WHITE else WHITE

    rook_ks = board.get_piece(row, 7)
    if (rook_ks and rook_ks.piece_type == ROOK and not rook_ks.has_moved
            and board.get_piece(row, 5) is None
            and board.get_piece(row, 6) is None
            and not is_square_attacked(board, row, 5, opponent)
            and not is_square_attacked(board, row, 6, opponent)):
        moves.append((row, 6, "castle_kingside"))

    rook_qs = board.get_piece(row, 0)
    if (rook_qs and rook_qs.piece_type == ROOK and not rook_qs.has_moved
            and board.get_piece(row, 1) is None
            and board.get_piece(row, 2) is None
            and board.get_piece(row, 3) is None
            and not is_square_attacked(board, row, 2, opponent)
            and not is_square_attacked(board, row, 3, opponent)):
        moves.append((row, 2, "castle_queenside"))

    return moves


def has_any_legal_moves(board, color, en_passant_target=None):
    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            piece = board.get_piece(row, col)
            if piece and piece.color == color:
                if get_legal_moves(board, row, col, en_passant_target):
                    return True
    return False


def is_insufficient_material(board):
    white_pieces = []
    black_pieces = []

    for row in range(BOARD_SIZE):
        for col in range(BOARD_SIZE):
            piece = board.get_piece(row, col)
            if piece is None:
                continue
            if piece.piece_type == KING:
                continue
            if piece.piece_type in (PAWN, ROOK, QUEEN):
                return False
            if piece.color == WHITE:
                white_pieces.append((piece.piece_type, row, col))
            else:
                black_pieces.append((piece.piece_type, row, col))

    wc = len(white_pieces)
    bc = len(black_pieces)

    if wc == 0 and bc == 0:
        return True
    if wc == 0 and bc == 1 and black_pieces[0][0] in (KNIGHT, BISHOP):
        return True
    if bc == 0 and wc == 1 and white_pieces[0][0] in (KNIGHT, BISHOP):
        return True
    if (wc == 1 and bc == 1
            and white_pieces[0][0] == BISHOP
            and black_pieces[0][0] == BISHOP):
        w_square_color = (white_pieces[0][1] + white_pieces[0][2]) % 2
        b_square_color = (black_pieces[0][1] + black_pieces[0][2]) % 2
        if w_square_color == b_square_color:
            return True

    return False


def get_game_status(board, current_turn, en_passant_target=None,
                    halfmove_clock=0, position_counts=None):
    if is_insufficient_material(board):
        return STATUS_DRAW_INSUFFICIENT

    if halfmove_clock >= 100:
        return STATUS_DRAW_50_MOVE

    if position_counts:
        current_hash = board.position_hash()
        if position_counts.get(current_hash, 0) >= 3:
            return STATUS_DRAW_THREEFOLD

    in_check = is_king_in_check(board, current_turn)
    has_moves = has_any_legal_moves(board, current_turn, en_passant_target)

    if in_check and not has_moves:
        return STATUS_CHECKMATE
    if not in_check and not has_moves:
        return STATUS_STALEMATE
    if in_check:
        return STATUS_CHECK

    return STATUS_ONGOING
