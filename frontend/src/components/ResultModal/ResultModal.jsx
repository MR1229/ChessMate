import React from "react";
import styles from "./ResultModal.module.css";

const STATUS_TITLES = {
  checkmate: "Checkmate!",
  stalemate: "Stalemate",
  draw_50_move: "Draw (50-Move Rule)",
  draw_threefold: "Draw (Threefold Repetition)",
  draw_insufficient: "Draw (Insufficient Material)",
  resigned: "Resignation",
  timeout: "Timeout",
};

export default function ResultModal({ status, winner, onPlayAgain, onBackToLobby, onClose }) {
  const getOutcomeMessage = () => {
    if (winner) {
      return `${winner.toUpperCase()} wins the match!`;
    }
    return "The game ended in a draw.";
  };

  const getSubMessage = () => {
    switch (status) {
      case "checkmate":
        return `Victory by checkmate.`;
      case "resigned":
        return `${winner === "white" ? "Black" : "White"} has resigned.`;
      case "timeout":
        return `${winner === "white" ? "Black" : "White"} ran out of time.`;
      case "stalemate":
        return "No legal moves left for the active player.";
      case "draw_50_move":
        return "50 consecutive moves played without a capture or pawn move.";
      case "draw_threefold":
        return "The same board position occurred three times.";
      case "draw_insufficient":
        return "Neither player has enough pieces to force a mate.";
      default:
        return "Game over.";
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <div className={styles.trophy}>🏆</div>
        <h2>{STATUS_TITLES[status] || "Game Over"}</h2>
        <p className={styles.outcome}>{getOutcomeMessage()}</p>
        <p className={styles.sub}>{getSubMessage()}</p>
        
        <div className={styles.btnRow}>
          <button type="button" className={styles.lobbyBtn} onClick={onBackToLobby}>
            Lobby Setup
          </button>
          <button type="button" className={styles.playAgainBtn} onClick={onPlayAgain}>
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
