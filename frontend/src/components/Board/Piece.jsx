import React from "react";
import styles from "./Piece.module.css";

const PIECE_SYMBOLS = {
  white: {
    pawn: "\u2659",
    knight: "\u2658",
    bishop: "\u2657",
    rook: "\u2656",
    queen: "\u2655",
    king: "\u2654",
  },
  black: {
    pawn: "\u265F",
    knight: "\u265E",
    bishop: "\u265D",
    rook: "\u265C",
    queen: "\u265B",
    king: "\u265A",
  },
};

export default function Piece({ type, color }) {
  const symbol = PIECE_SYMBOLS[color]?.[type] || "";
  const isWhite = color === "white";

  return (
    <span
      className={`${styles.pieceText} ${
        isWhite ? styles.pieceWhite : styles.pieceBlack
      }`}
    >
      {symbol}
    </span>
  );
}
