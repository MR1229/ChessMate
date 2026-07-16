import React, { useState, useEffect } from "react";
import Lobby from "./components/Lobby/Lobby";
import Board from "./components/Board/Board";
import Piece from "./components/Board/Piece";
import GamePanel from "./components/GamePanel/GamePanel";
import PromotionModal from "./components/PromotionModal/PromotionModal";
import ResultModal from "./components/ResultModal/ResultModal";
import ThemeToggle from "./components/ThemeToggle/ThemeToggle";
import boardStyles from "./components/Board/Board.module.css";
import { useGame } from "./hooks/useGame";
import { useTimer } from "./hooks/useTimer";
import { audio } from "./utils/audio";

// SVG Pawn matching board piece vectors precisely
const LogoPawn = () => (
  <svg
    viewBox="0 0 45 45"
    className="brand-logo-svg"
    style={{
      width: "38px",
      height: "38px",
      marginRight: "2px",
      filter: "drop-shadow(0 0 10px rgba(96,165,250,0.4))",
    }}
  >
    <g
      fill="var(--color-logo-pieces)"
      stroke="var(--color-logo-stroke, #111827)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 12,36 C 12,36 12,38 14,38 L 31,38 C 33,38 33,36 33,36 C 33,36 33,34 31,34 L 14,34 C 12,34 12,36 12,36 z" stroke="var(--color-logo-stroke, #111827)" />
      <path d="M 16,34 C 16,34 18,24 20,20 C 18.5,19 17.5,17 17.5,15 C 17.5,12 20,9.5 22.5,9.5 C 25,9.5 27.5,12 27.5,15 C 27.5,17 26.5,19 25,20 C 27,24 29,34 29,34" stroke="var(--color-logo-stroke, #111827)" />
    </g>
  </svg>
);

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

// Scholar's Mate checkmate scene layout (Queen on h5 ready to mate f7)
const createMidGameBoard = () => {
  const grid = Array(8).fill(null).map(() => Array(8).fill(null));
  // White pieces
  grid[7][0] = { type: "rook", color: "white" };
  grid[7][1] = { type: "knight", color: "white" };
  grid[7][2] = { type: "bishop", color: "white" };
  grid[7][4] = { type: "king", color: "white" };
  grid[7][5] = { type: "bishop", color: "white" };
  grid[7][6] = { type: "knight", color: "white" };
  grid[7][7] = { type: "rook", color: "white" };
  grid[6][0] = { type: "pawn", color: "white" };
  grid[6][1] = { type: "pawn", color: "white" };
  grid[6][2] = { type: "pawn", color: "white" };
  grid[6][3] = { type: "pawn", color: "white" };
  grid[6][5] = { type: "pawn", color: "white" };
  grid[6][6] = { type: "pawn", color: "white" };
  grid[6][7] = { type: "pawn", color: "white" };
  grid[4][4] = { type: "pawn", color: "white" }; // e4 pawn
  grid[4][7] = { type: "queen", color: "white" }; // Queen on h5 (row 4, col 7)
  grid[5][2] = { type: "bishop", color: "white" }; // Bishop on c4 (row 5, col 2)

  // Black pieces
  grid[0][0] = { type: "rook", color: "black" };
  grid[0][1] = { type: "knight", color: "black" };
  grid[0][2] = { type: "bishop", color: "black" };
  grid[0][3] = { type: "queen", color: "black" };
  grid[0][4] = { type: "king", color: "black" };
  grid[0][5] = { type: "bishop", color: "black" };
  grid[0][6] = { type: "knight", color: "black" };
  grid[0][7] = { type: "rook", color: "black" };
  grid[1][0] = { type: "pawn", color: "black" };
  grid[1][1] = { type: "pawn", color: "black" };
  grid[1][2] = { type: "pawn", color: "black" };
  grid[1][3] = { type: "pawn", color: "black" };
  grid[1][5] = { type: "pawn", color: "black" }; // f7 pawn
  grid[1][6] = { type: "pawn", color: "black" };
  grid[1][7] = { type: "pawn", color: "black" };
  grid[3][4] = { type: "pawn", color: "black" }; // e5 pawn
  grid[2][2] = { type: "knight", color: "black" }; // Knight on c6 (row 2, col 2)
  return grid;
};

const makeCheckmateMove = (grid) => {
  const newGrid = grid.map(row => [...row]);
  const queen = newGrid[4][7];
  newGrid[4][7] = null;
  newGrid[1][5] = queen; // Queen lands on f7 (checkmate)
  return newGrid;
};

const reconstructBoardAtMove = (moveHistory, targetIndex) => {
  const grid = createInitialBoard();
  for (let i = 0; i <= targetIndex; i++) {
    const move = moveHistory[i];
    if (!move) continue;
    const [fromRow, fromCol] = move.from;
    const [toRow, toCol] = move.to;
    const piece = grid[fromRow]?.[fromCol];
    if (!piece) continue;

    if (move.flag === "castle_kingside") {
      grid[toRow][toCol] = piece;
      grid[fromRow][fromCol] = null;
      const rook = grid[toRow][7];
      if (rook) {
        grid[toRow][5] = rook;
        grid[toRow][7] = null;
      }
    } else if (move.flag === "castle_queenside") {
      grid[toRow][toCol] = piece;
      grid[fromRow][fromCol] = null;
      const rook = grid[toRow][0];
      if (rook) {
        grid[toRow][3] = rook;
        grid[toRow][0] = null;
      }
    } else if (move.flag === "en_passant") {
      grid[toRow][toCol] = piece;
      grid[fromRow][fromCol] = null;
      grid[fromRow][toCol] = null;
    } else if (move.promoted_to) {
      grid[toRow][toCol] = { type: move.promoted_to, color: piece.color };
      grid[fromRow][fromCol] = null;
    } else {
      grid[toRow][toCol] = piece;
      grid[fromRow][fromCol] = null;
    }
  }
  return grid;
};

export default function App() {
  const {
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
  } = useGame();

  const [gameId, setGameId] = useState(0);

  const {
    timeLeftWhite,
    timeLeftBlack,
    formatTime,
  } = useTimer({
    timeWhite: gameState.timeWhite,
    timeBlack: gameState.timeBlack,
    activeColor: gameState.currentTurn,
    isGameActive: !isLobby && gameState.moveHistory.length > 0 && (gameState.status === "ongoing" || gameState.status === "check"),
    onTimeout: handleTimeout,
    onTick: null,
  });

  const [introStep, setIntroStep] = useState("middle_game");
  const [cinematicBoard, setCinematicBoard] = useState(createMidGameBoard());

  const [viewingMoveIndex, setViewingMoveIndex] = useState(null);
  const [isAutoplayActive, setIsAutoplayActive] = useState(false);
  const [isResultModalDismissed, setIsResultModalDismissed] = useState(false);

  // Staggered offsets for 3D board collapse/explosion effect
  const [randomOffsets] = useState(() => {
    return Array(64).fill(null).map(() => ({
      rx: Math.floor(Math.random() * 360) - 180,
      ry: Math.floor(Math.random() * 360) - 180,
      rz: Math.floor(Math.random() * 360) - 180,
      tx: Math.floor(Math.random() * 240) - 120,
      delay: Math.random() * 0.18,
    }));
  });

  useEffect(() => {
    // 1. Move queen to deliver checkmate at 400ms
    const timerMove = setTimeout(() => {
      setCinematicBoard((prev) => makeCheckmateMove(prev));
      setIntroStep("checkmate");
      audio.playCapture();
      setTimeout(() => {
        audio.playCheckmate();
      }, 100);
    }, 400);

    // 2. Explode/collapse board at 900ms
    const timerCollapse = setTimeout(() => {
      setIntroStep("collapse");
      audio.playCrack();
    }, 900);

    // 3. Complete intro and load interactive lobby page at 1800ms (1.8s)
    const timerComplete = setTimeout(() => {
      setIntroStep("completed");
    }, 1800);

    return () => {
      clearTimeout(timerMove);
      clearTimeout(timerCollapse);
      clearTimeout(timerComplete);
    };
  }, []);

  useEffect(() => {
    if (isLobby) {
      setIsResultModalDismissed(false);
      setViewingMoveIndex(null);
      setIsAutoplayActive(false);
    }
  }, [isLobby]);

  useEffect(() => {
    if (gameState.moveHistory.length > 0) {
      setViewingMoveIndex(gameState.moveHistory.length - 1);
    } else {
      setViewingMoveIndex(null);
    }
  }, [gameState.moveHistory.length]);

  useEffect(() => {
    if (!isAutoplayActive) return;

    const numMoves = gameState.moveHistory.length;
    const intervalDelay = Math.max(350, Math.min(1500, 16000 / (numMoves || 1)));

    const timer = setInterval(() => {
      setViewingMoveIndex((prev) => {
        const current = prev === null ? -1 : prev;
        const next = current + 1;
        if (next >= gameState.moveHistory.length) {
          setIsAutoplayActive(false);
          clearInterval(timer);
          return gameState.moveHistory.length - 1;
        }
        return next;
      });
    }, intervalDelay);

    return () => clearInterval(timer);
  }, [isAutoplayActive, gameState.moveHistory.length]);

  const isGameOver =
    !isLobby &&
    gameState.status !== "ongoing" &&
    gameState.status !== "check";

  const getKingCheckSquare = () => {
    if (!gameState.check || isLobby) return null;
    const color = gameState.currentTurn;
    const board = gameState.board;
    for (let r = 0; r < board.length; r++) {
      for (let c = 0; c < board[r].length; c++) {
        const p = board[r][c];
        if (p && p.color === color && p.type === "king") {
          return { row: r, col: c };
        }
      }
    }
    return null;
  };

  const handleRestart = () => {
    setGameId((prev) => prev + 1);
    startGame({
      timer_mode: gameState.timerMode === "Infinite" ? "Infinite" : gameState.timerMode,
      time_seconds: gameState.timeWhite,
      increment: gameState.increment,
      undo_enabled: gameState.undoEnabled,
    });
  };

  const triggerStartGame = async (config) => {
    setGameId((prev) => prev + 1);
    await startGame(config);
  };

  const triggerResetToLobby = () => {
    setGameId((prev) => prev + 1);
    handleResetToLobby();
  };

  const getActiveBoard = () => {
    if (isLobby) {
      return createInitialBoard();
    }
    if (viewingMoveIndex === null || viewingMoveIndex === gameState.moveHistory.length - 1) {
      return gameState.board;
    }
    if (viewingMoveIndex === -1) {
      return createInitialBoard();
    }
    return reconstructBoardAtMove(gameState.moveHistory, viewingMoveIndex);
  };

  const isReviewMode =
    viewingMoveIndex !== null &&
    viewingMoveIndex !== gameState.moveHistory.length - 1;

  const handleGoToStart = () => {
    setIsAutoplayActive(false);
    setViewingMoveIndex(-1);
  };

  const handleGoPrev = () => {
    setIsAutoplayActive(false);
    setViewingMoveIndex((prev) => {
      const current = prev === null ? gameState.moveHistory.length - 1 : prev;
      return Math.max(-1, current - 1);
    });
  };

  const handleGoNext = () => {
    setIsAutoplayActive(false);
    setViewingMoveIndex((prev) => {
      if (prev === null || prev === gameState.moveHistory.length - 1) return prev;
      return prev + 1;
    });
  };

  const handleGoToEnd = () => {
    setIsAutoplayActive(false);
    setViewingMoveIndex(gameState.moveHistory.length - 1);
  };

  const lastMove = gameState.moveHistory.length > 0
    ? gameState.moveHistory[gameState.moveHistory.length - 1]
    : null;

  const activeLastMove = isReviewMode
    ? (viewingMoveIndex >= 0 ? gameState.moveHistory[viewingMoveIndex] : null)
    : lastMove;

  // Render Cinematic Intro Screen
  if (introStep !== "completed") {
    return (
      <div className="app-container">
        {/* Header */}
        <header className="site-header">
          <div className="brand" style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: "36px",
                marginRight: "-2px",
                color: "var(--color-logo-pieces)",
                lineHeight: 1,
                filter: "drop-shadow(0 0 10px rgba(96,165,250,0.4))",
                userSelect: "none",
              }}
            >
              ♔
            </span>
            <span className="brand-name">
              Chess<span className="brand-accent">Mate</span>
            </span>
          </div>
        </header>

        {/* Cinematic Arena */}
        <main className="game-layout" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ overflow: "hidden", border: "none", background: "none", padding: 0, boxShadow: "none" }}>
            <div className={boardStyles.board} style={{ position: "relative", border: "none", boxShadow: "none", borderRadius: 0 }}>
              {cinematicBoard.map((rowArr, rowIndex) =>
                rowArr.map((piece, colIndex) => {
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const index = rowIndex * 8 + colIndex;
                  const offsets = randomOffsets[index];
                  const isCollapsing = introStep === "collapse";

                  let squareStyle = isCollapsing
                    ? {
                        animation: `explodeCollapse 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
                        animationDelay: `${offsets.delay}s`,
                        "--rotX": `${offsets.rx}deg`,
                        "--rotY": `${offsets.ry}deg`,
                        "--rotZ": `${offsets.rz}deg`,
                        "--transX": `${offsets.tx}px`,
                        pointerEvents: "none",
                      }
                    : {};

                  // Queen sliding path animation from h5 to f7
                  const isQueenCheckmatePiece =
                    introStep === "checkmate" &&
                    rowIndex === 1 &&
                    colIndex === 5 &&
                    piece?.type === "queen";

                  let pieceStyle = {};
                  if (isQueenCheckmatePiece) {
                    pieceStyle = {
                      animation: "queenSlide 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94) both",
                    };
                  }

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`${boardStyles.square} ${
                        isLight ? boardStyles.squareLight : boardStyles.squareDark
                      }`}
                      style={squareStyle}
                    >
                      {piece && (
                        <div className={boardStyles.pieceContainer} style={pieceStyle}>
                          <Piece type={piece.type} color={piece.color} />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Render main game interface once intro completes
  return (
    <div className="app-container">
      {/* Site Header */}
      <header className="site-header">
        <div className="brand" onClick={triggerResetToLobby} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <span
            style={{
              fontSize: "36px",
              marginRight: "-2px",
              color: "var(--color-logo-pieces)",
              lineHeight: 1,
              filter: "drop-shadow(0 0 10px rgba(96,165,250,0.4))",
              userSelect: "none",
            }}
          >
            ♔
          </span>
          <span className="brand-name">
            Chess<span className="brand-accent">Mate</span>
          </span>
        </div>
        <ThemeToggle />
      </header>

      {/* Error Alert Bar */}
      {error && (
        <div className="error-bar">
          <span>{error}</span>
          <button type="button" className="close-error" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      )}

      {/* Main Layout Area */}
      <main className="game-layout">
        <div className="game-active-area">
          {/* Board Section */}
          <div className="board-container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              {isReviewMode && (
                <div
                  style={{
                    position: "absolute",
                    top: "22px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: "rgba(245, 158, 11, 0.95)",
                    color: "#0a122c",
                    padding: "4px 12px",
                    borderRadius: "12px",
                    fontSize: "11px",
                    fontWeight: "700",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                    zIndex: 50,
                    boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                  }}
                >
                  Reviewing: Move {viewingMoveIndex + 1}/{gameState.moveHistory.length}
                </div>
              )}
              <Board
                key={gameId}
                board={getActiveBoard()}
                selectedSquare={isReviewMode ? null : selectedSquare}
                legalMoves={isReviewMode ? [] : legalMoves}
                kingInCheckSquare={isReviewMode ? null : getKingCheckSquare()}
                lastMove={
                  activeLastMove
                    ? { from: activeLastMove.from, to: activeLastMove.to }
                    : null
                }
                onSquareClick={isLobby || isReviewMode ? () => {} : handleSquareClick}
              />
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="sidebar-container">
            {isLobby ? (
              <Lobby onStartGame={triggerStartGame} />
            ) : (
              <>
                <GamePanel
                  gameState={gameState}
                  timeLeftWhite={timeLeftWhite}
                  timeLeftBlack={timeLeftBlack}
                  formatTime={formatTime}
                  onUndo={undoMove}
                  onRedo={redoMove}
                  onResign={resignGame}
                  onResetToLobby={triggerResetToLobby}
                  viewingMoveIndex={viewingMoveIndex}
                  onSelectMove={setViewingMoveIndex}
                />
                {gameState.moveHistory.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "4px",
                      width: "100%",
                      padding: "8px 10px",
                      background: "var(--color-panel)",
                      border: "1px solid var(--color-panel-border)",
                      borderRadius: "8px",
                      backdropFilter: "var(--backdrop-blur)",
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={handleGoToStart}
                      disabled={viewingMoveIndex === -1}
                      style={{ padding: "6px 12px", background: "var(--color-card)", border: "1px solid var(--color-panel-border)", borderRadius: "4px", color: "var(--color-text)", cursor: "pointer", fontSize: "16px" }}
                      title="Go to Start"
                    >
                      ⏮
                    </button>
                    <button
                      type="button"
                      onClick={handleGoPrev}
                      disabled={viewingMoveIndex === -1}
                      style={{ padding: "6px 12px", background: "var(--color-card)", border: "1px solid var(--color-panel-border)", borderRadius: "4px", color: "var(--color-text)", cursor: "pointer", fontSize: "16px" }}
                      title="Previous Move"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={handleGoNext}
                      disabled={viewingMoveIndex === null || viewingMoveIndex === gameState.moveHistory.length - 1}
                      style={{ padding: "6px 12px", background: "var(--color-card)", border: "1px solid var(--color-panel-border)", borderRadius: "4px", color: "var(--color-text)", cursor: "pointer", fontSize: "16px" }}
                      title="Next Move"
                    >
                      ▶
                    </button>
                    <button
                      type="button"
                      onClick={handleGoToEnd}
                      disabled={viewingMoveIndex === null || viewingMoveIndex === gameState.moveHistory.length - 1}
                      style={{ padding: "6px 12px", background: "var(--color-card)", border: "1px solid var(--color-panel-border)", borderRadius: "4px", color: "var(--color-text)", cursor: "pointer", fontSize: "16px" }}
                      title="Go to End"
                    >
                      ⏭
                    </button>
                    {isGameOver && (
                      <button
                        type="button"
                        onClick={() => setIsAutoplayActive(!isAutoplayActive)}
                        style={{
                          marginLeft: "auto",
                          padding: "6px 12px",
                          background: isAutoplayActive ? "var(--color-check)" : "var(--color-accent)",
                          border: "none",
                          borderRadius: "4px",
                          color: isAutoplayActive ? "#ffffff" : "#1a1a1a",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        title="Autoplay Flow of entire game in 15s"
                      >
                        {isAutoplayActive ? "⏸ Pause Flow" : "▶ Visualize Match"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Modals Layer */}
      {gameState.pendingPromotion && (
        <PromotionModal
          color={gameState.currentTurn}
          onSelect={promotePiece}
        />
      )}

      {isGameOver && !isResultModalDismissed && (
        <ResultModal
          status={gameState.status}
          winner={gameState.winner}
          onPlayAgain={handleRestart}
          onBackToLobby={triggerResetToLobby}
          onClose={() => setIsResultModalDismissed(true)}
        />
      )}
    </div>
  );
}
