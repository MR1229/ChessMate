import { useState, useEffect, useCallback, useRef } from "react";
import { API } from "../api";
import { audio } from "../utils/audio";

const createInitialBoard = () => {
  const grid = Array(8).fill(null).map(() => Array(8).fill(null));
  const backRow = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
  for (let col = 0; col < 8; col++) {
    grid[0][col] = { type: backRow[col], color: "black" };
    grid[1][col] = { type: "pawn", color: "black" };
    grid[6][col] = { type: "pawn", color: "white" };
    grid[7][col] = { type: backRow[col], color: "white" };
  }
  return grid;
};

export function useGame() {
  const [gameState, setGameState] = useState({
    board: createInitialBoard(),
    currentTurn: "white",
    status: "ongoing",
    winner: null,
    check: false,
    moveHistory: [],
    capturedPieces: { white: [], black: [] },
    materialAdvantage: 0,
    undoEnabled: false,
    canUndo: false,
    canRedo: false,
    timeWhite: null,
    timeBlack: null,
    timerMode: null,
    increment: 0,
    pendingPromotion: false,
  });

  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [isLobby, setIsLobby] = useState(true);
  const [error, setError] = useState(null);

  const tickIntervalRef = useRef(null);

  const applyState = useCallback((state) => {
    setGameState((prev) => {
      const oldHistory = prev.moveHistory || [];
      const newHistory = state.move_history || [];
      
      if (newHistory.length > oldHistory.length) {
        const lastMove = newHistory[newHistory.length - 1];
        
        if (state.status === "checkmate") {
          audio.playCheckmate();
        } else if (state.check) {
          audio.playCheck();
        } else if (lastMove.flag === "promotion") {
          audio.playPromotion();
        } else if (lastMove.captured) {
          audio.playCapture();
        } else {
          audio.playMove();
        }
      }
      
      return {
        board: state.board || [],
        currentTurn: state.current_turn || "white",
        status: state.status || "ongoing",
        winner: state.winner || null,
        check: state.check || false,
        moveHistory: state.move_history || [],
        capturedPieces: state.captured_pieces || { white: [], black: [] },
        materialAdvantage: state.material_advantage || 0,
        undoEnabled: state.undo_enabled || false,
        canUndo: state.can_undo || false,
        canRedo: state.can_redo || false,
        timeWhite: state.time_white ?? null,
        timeBlack: state.time_black ?? null,
        timerMode: state.timer_mode || null,
        increment: state.increment || 0,
        pendingPromotion: state.pending_promotion || false,
      };
    });
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const state = await API.getState();
      applyState(state);
    } catch (err) {
      setError(err.message);
    }
  }, [applyState]);

  const startGame = async (config) => {
    try {
      const state = await API.newGame(config);
      applyState(state);
      setIsLobby(false);
      setSelectedSquare(null);
      setLegalMoves([]);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectSquare = async (row, col) => {
    try {
      setSelectedSquare({ row, col });
      const res = await API.getLegalMoves(row, col);
      setLegalMoves(res.legal_moves || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleSquareClick = async (row, col) => {
    if (gameState.status !== "ongoing" && gameState.status !== "check") return;
    if (gameState.pendingPromotion) return;

    const clickedPiece = gameState.board[row]?.[col];

    if (selectedSquare) {
      const isLegal = legalMoves.some((m) => m.row === row && m.col === col);
      if (isLegal) {
        try {
          const res = await API.makeMove(selectedSquare.row, selectedSquare.col, row, col);
          clearSelection();
          applyState(res);
        } catch (err) {
          setError(err.message);
          clearSelection();
        }
        return;
      }
    }

    if (clickedPiece && clickedPiece.color === gameState.currentTurn) {
      selectSquare(row, col);
    } else {
      clearSelection();
    }
  };

  const promotePiece = async (pieceType) => {
    try {
      const res = await API.promote(pieceType);
      applyState(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const resignGame = async () => {
    try {
      const res = await API.resign(gameState.currentTurn);
      applyState(res);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTimeout = useCallback(async (color) => {
    try {
      const state = await API.tick(); // Server validates and sets timeout status
      applyState(state);
    } catch (err) {
      setError(err.message);
    }
  }, [applyState]);

  const undoMove = async () => {
    try {
      const res = await API.undo();
      applyState(res);
      clearSelection();
    } catch (err) {
      setError(err.message);
    }
  };

  const redoMove = async () => {
    try {
      const res = await API.redo();
      applyState(res);
      clearSelection();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetToLobby = () => {
    setIsLobby(true);
    clearSelection();
  };

  // Fetch initial game state on mount
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Keep a slow poll to sync times to make sure lag/drift is minimal
  useEffect(() => {
    if (isLobby || gameState.timeWhite === null || gameState.status !== "ongoing" && gameState.status !== "check") {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    tickIntervalRef.current = setInterval(async () => {
      try {
        const state = await API.tick();
        setGameState((prev) => ({
          ...prev,
          timeWhite: state.time_white,
          timeBlack: state.time_black,
          status: state.status,
          winner: state.winner,
        }));
      } catch (err) {
        // Silently ignore background tick error
      }
    }, 5000);

    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [isLobby, gameState.timeWhite, gameState.status]);

  return {
    gameState,
    selectedSquare,
    legalMoves,
    isLobby,
    error,
    setError,
    startGame,
    handleSquareClick,
    promotePiece,
    resignGame,
    handleTimeout,
    undoMove,
    redoMove,
    handleResetToLobby,
  };
}
