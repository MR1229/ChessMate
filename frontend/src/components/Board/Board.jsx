import React, { useState, useEffect } from "react";
import Piece from "./Piece";
import styles from "./Board.module.css";
import { audio } from "../../utils/audio";

const FILE_LABELS = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANK_LABELS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const getEntranceDelay = (type, col) => {
  if (type === "king") return "0.1s";
  if (type === "queen") return "0.3s";
  if (type === "rook") return "0.45s";
  if (type === "bishop") return "0.6s";
  if (type === "knight") return "0.75s";
  return `${0.9 + col * 0.05}s`;
};

export default function Board({
  board,
  selectedSquare,
  legalMoves,
  kingInCheckSquare,
  lastMove,
  onSquareClick,
}) {
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [dragState, setDragState] = useState(null);
  const [shakingPiece, setShakingPiece] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroActive(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = (e, row, col, piece) => {
    // Prevent default selection text behavior
    e.preventDefault();

    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);

    setDragState({
      row,
      col,
      piece,
      startX: clientX,
      startY: clientY,
      currentX: clientX,
      currentY: clientY,
      hasMoved: false,
    });

    onSquareClick(row, col);
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      setDragState((prev) => {
        if (!prev) return null;
        const dx = Math.abs(clientX - prev.startX);
        const dy = Math.abs(clientY - prev.startY);
        const hasMoved = prev.hasMoved || dx > 6 || dy > 6;
        return {
          ...prev,
          currentX: clientX,
          currentY: clientY,
          hasMoved,
        };
      });
    };

    const handleMouseUp = (e) => {
      const clientX = e.clientX || (e.changedTouches && e.changedTouches[0].clientX) || (e.touches && e.touches[0]?.clientX);
      const clientY = e.clientY || (e.changedTouches && e.changedTouches[0].clientY) || (e.touches && e.touches[0]?.clientY);

      // Resolve targeted element using pointer location coordinates
      if (clientX !== undefined && clientY !== undefined) {
        const el = document.elementFromPoint(clientX, clientY);
        const squareEl = el?.closest('[role="gridcell"]');

        if (squareEl) {
          const targetRow = parseInt(squareEl.getAttribute("data-row"), 10);
          const targetCol = parseInt(squareEl.getAttribute("data-col"), 10);

          if (!isNaN(targetRow) && !isNaN(targetCol)) {
            if (targetRow === dragState.row && targetCol === dragState.col) {
              // Standard tap or minimum drag release, click remains registered
            } else {
              const isLegal = legalMoves.some((m) => m.row === targetRow && m.col === targetCol);
              if (isLegal) {
                onSquareClick(targetRow, targetCol);
              } else {
                audio.playIllegal();
                setShakingPiece({ row: dragState.row, col: dragState.col });
                setTimeout(() => setShakingPiece(null), 400);
              }
            }
          }
        }
      }

      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: false });
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleMouseMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [dragState, legalMoves, onSquareClick]);

  if (!board || board.length === 0) return null;

  return (
    <div className={styles.boardFrame}>
      <div className={styles.board}>
        {board.map((rowArr, rowIndex) =>
          rowArr.map((piece, colIndex) => {
            const isLight = (rowIndex + colIndex) % 2 === 0;
            const isSelected =
              selectedSquare &&
              selectedSquare.row === rowIndex &&
              selectedSquare.col === colIndex;

            const isKingInCheck =
              kingInCheckSquare &&
              kingInCheckSquare.row === rowIndex &&
              kingInCheckSquare.col === colIndex;

            const isLastMoveFrom =
              lastMove &&
              lastMove.from[0] === rowIndex &&
              lastMove.from[1] === colIndex;

            const isLastMoveTo =
              lastMove &&
              lastMove.to[0] === rowIndex &&
              lastMove.to[1] === colIndex;

            const legalMove = legalMoves.find(
              (m) => m.row === rowIndex && m.col === colIndex
            );
            const isLegalTarget = !!legalMove;
            const isCapture = isLegalTarget && piece !== null;

            let squareClass = `${styles.square} ${
              isLight ? styles.squareLight : styles.squareDark
            }`;

            if (isSelected) squareClass += ` ${styles.squareSelected}`;
            if (isLastMoveFrom) squareClass += ` ${styles.squareLastMoveFrom}`;
            if (isLastMoveTo) squareClass += ` ${styles.squareLastMoveTo}`;
            if (isKingInCheck) squareClass += ` ${styles.squareCheck}`;

            const isDraggingThis = dragState && dragState.row === rowIndex && dragState.col === colIndex;
            const isShakingThis = shakingPiece && shakingPiece.row === rowIndex && shakingPiece.col === colIndex;

            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={squareClass}
                onClick={() => onSquareClick(rowIndex, colIndex)}
                role="gridcell"
                data-row={rowIndex}
                data-col={colIndex}
              >
                {/* Chess Piece */}
                {piece && (
                  <div
                    className={`${styles.pieceContainer} ${
                      isIntroActive
                        ? piece.type === "king"
                          ? styles.kingPieceDrop
                          : styles.pieceEntrance
                        : ""
                    } ${isShakingThis ? styles.shake : ""}`}
                    style={
                      isDraggingThis
                        ? {
                            transform: `translate(${dragState.currentX - dragState.startX}px, ${dragState.currentY - dragState.startY}px) scale(1.18) rotate(5deg)`,
                            zIndex: 9999,
                            pointerEvents: "none",
                            filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.55))",
                            transition: "none",
                          }
                        : isIntroActive
                        ? { "--entrance-delay": getEntranceDelay(piece.type, colIndex) }
                        : undefined
                    }
                    onMouseDown={(e) => handleMouseDown(e, rowIndex, colIndex, piece)}
                    onTouchStart={(e) => handleMouseDown(e, rowIndex, colIndex, piece)}
                  >
                    <Piece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && (
                  <div
                    className={
                      isCapture
                        ? styles.legalCaptureIndicator
                        : styles.legalMoveIndicator
                    }
                  />
                )}

                {/* Coordinate Labels (ranks 8-1 on col 0, files a-h on row 7) */}
                {colIndex === 0 && (
                  <span className={`${styles.coordLabel} ${styles.coordRank}`}>
                    {RANK_LABELS[rowIndex]}
                  </span>
                )}
                {rowIndex === 7 && (
                  <span className={`${styles.coordLabel} ${styles.coordFile}`}>
                    {FILE_LABELS[colIndex]}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
