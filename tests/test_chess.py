import unittest
import sys
import os

# Ensure the parent directory is in the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chess.board import Board
from chess.piece import Piece
from chess.constants import WHITE, BLACK, PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING
from chess.rules import is_square_attacked, is_king_in_check, get_legal_moves, is_insufficient_material
from chess.game import Game


class TestChessEngine(unittest.TestCase):

    def test_board_initial_setup(self):
        board = Board()
        # Check initial pieces
        self.assertEqual(board.get_piece(0, 0).piece_type, ROOK)
        self.assertEqual(board.get_piece(0, 0).color, BLACK)
        self.assertEqual(board.get_piece(7, 4).piece_type, KING)
        self.assertEqual(board.get_piece(7, 4).color, WHITE)

    def test_king_in_check(self):
        board = Board()
        # Clear grid for custom setup
        board.grid = [[None for _ in range(8)] for _ in range(8)]
        # Place white king and black rook on same column
        board.set_piece(7, 4, Piece(WHITE, KING))
        board.set_piece(0, 4, Piece(BLACK, ROOK))
        self.assertTrue(is_king_in_check(board, WHITE))

    def test_king_not_in_check_blocked(self):
        board = Board()
        board.grid = [[None for _ in range(8)] for _ in range(8)]
        board.set_piece(7, 4, Piece(WHITE, KING))
        board.set_piece(0, 4, Piece(BLACK, ROOK))
        # Place blocking piece
        board.set_piece(4, 4, Piece(WHITE, PAWN))
        self.assertFalse(is_king_in_check(board, WHITE))

    def test_en_passant_legality(self):
        # Create game
        game = Game()
        # Standard moves leading to en passant
        game.make_move(6, 4, 4, 4) # e2-e4
        game.make_move(1, 0, 2, 0) # a7-a6
        game.make_move(4, 4, 3, 4) # e4-e5
        game.make_move(1, 5, 3, 5) # f7-f5 (double push)
        
        # En passant target should be set at (2, 5)
        self.assertEqual(game.en_passant_target, (2, 5))
        
        # White pawn on e5 (3, 4) should have legal move to f6 (2, 5)
        moves = game.get_legal_moves_for_square(3, 4)
        ep_move = [m for m in moves if m["row"] == 2 and m["col"] == 5]
        self.assertEqual(len(ep_move), 1)
        self.assertEqual(ep_move[0]["flag"], "en_passant")
        
        # Make the en passant move
        res = game.make_move(3, 4, 2, 5)
        self.assertTrue(res["success"])
        # Black pawn on f5 (3, 5) should be captured/removed
        self.assertIsNone(game.board.get_piece(3, 5))

    def test_kingside_castling(self):
        game = Game()
        # Clear path for castling
        game.board.remove_piece(7, 5) # Remove white bishop
        game.board.remove_piece(7, 6) # Remove white knight
        
        moves = game.get_legal_moves_for_square(7, 4)
        castle_move = [m for m in moves if m["row"] == 7 and m["col"] == 6]
        self.assertEqual(len(castle_move), 1)
        self.assertEqual(castle_move[0]["flag"], "castle_kingside")
        
        # Execute castling
        res = game.make_move(7, 4, 7, 6)
        self.assertTrue(res["success"])
        # Check king and rook positions
        self.assertEqual(game.board.get_piece(7, 6).piece_type, KING)
        self.assertEqual(game.board.get_piece(7, 5).piece_type, ROOK)

    def test_castling_blocked_by_check(self):
        game = Game()
        # Clear path
        game.board.remove_piece(7, 5)
        game.board.remove_piece(7, 6)
        # Remove blocking pawn at e2 (6, 4)
        game.board.remove_piece(6, 4)
        # Put white king in check
        game.board.set_piece(3, 4, Piece(BLACK, ROOK))
        # Ensure castling is not in legal moves
        moves = game.get_legal_moves_for_square(7, 4)
        castle_moves = [m for m in moves if m["flag"] in ("castle_kingside", "castle_queenside")]
        self.assertEqual(len(castle_moves), 0)

    def test_pawn_promotion(self):
        game = Game()
        game.board.grid = [[None for _ in range(8)] for _ in range(8)]
        # White pawn almost promoting
        game.board.set_piece(1, 4, Piece(WHITE, PAWN))
        game.board.set_piece(7, 0, Piece(BLACK, KING)) # Opponent king to keep board valid
        game.board.set_piece(0, 7, Piece(WHITE, KING))
        
        res = game.make_move(1, 4, 0, 4)
        self.assertTrue(res["success"])
        self.assertTrue(res["needs_promotion"])
        
        # Promote to Queen
        res_promo = game.promote(QUEEN)
        self.assertTrue(res_promo["success"])
        self.assertEqual(game.board.get_piece(0, 4).piece_type, QUEEN)

    def test_insufficient_material_k_k(self):
        board = Board()
        board.grid = [[None for _ in range(8)] for _ in range(8)]
        board.set_piece(0, 0, Piece(WHITE, KING))
        board.set_piece(7, 7, Piece(BLACK, KING))
        self.assertTrue(is_insufficient_material(board))

    def test_insufficient_material_k_b_k(self):
        board = Board()
        board.grid = [[None for _ in range(8)] for _ in range(8)]
        board.set_piece(0, 0, Piece(WHITE, KING))
        board.set_piece(7, 7, Piece(BLACK, KING))
        board.set_piece(3, 3, Piece(WHITE, BISHOP))
        self.assertTrue(is_insufficient_material(board))

    def test_undo_redo(self):
        game = Game({"undo_enabled": True})
        # Make a move
        game.make_move(6, 4, 4, 4) # e2-e4
        self.assertEqual(game.board.get_piece(4, 4).piece_type, PAWN)
        
        # Undo 1
        undo_res = game.undo()
        self.assertTrue(undo_res["success"])
        self.assertEqual(game.takebacks_remaining["white"], 1)
        
        # Redo
        game.redo()
        
        # Undo 2
        undo_res2 = game.undo()
        self.assertTrue(undo_res2["success"])
        self.assertEqual(game.takebacks_remaining["white"], 0)
        
        # Redo again
        game.redo()
        
        # Undo 3 - should fail due to 2 chances limit
        undo_res3 = game.undo()
        self.assertFalse(undo_res3["success"])


if __name__ == '__main__':
    unittest.main()
