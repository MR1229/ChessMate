import React from "react";
import Piece from "../Board/Piece";
import styles from "./PromotionModal.module.css";

const PROMOTION_CHOICES = ["queen", "rook", "bishop", "knight"];

export default function PromotionModal({ color, onSelect }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Choose Promotion Piece</h3>
        <p>Pawn has reached the promotion square.</p>
        <div className={styles.choicesGrid}>
          {PROMOTION_CHOICES.map((type) => (
            <button
              key={type}
              type="button"
              className={styles.choiceBtn}
              onClick={() => onSelect(type)}
            >
              <div className={styles.pieceWrapper}>
                <Piece type={type} color={color} />
              </div>
              <span className={styles.choiceLabel}>{type}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
