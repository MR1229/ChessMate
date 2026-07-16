import React from "react";
import styles from "./GamePanel.module.css";
import Timer from "./Timer";

const PIECE_ICONS = {
  pawn: "♙",
  knight: "♘",
  bishop: "♗",
  rook: "♖",
  queen: "♕",
  king: "♔",
};

export default function GamePanel({
  gameState,
  timeLeftWhite,
  timeLeftBlack,
  formatTime,
  onUndo,
  onRedo,
  onResign,
  onResetToLobby,
  viewingMoveIndex,
  onSelectMove,
}) {
  const {
    currentTurn,
    status,
    winner,
    check,
    moveHistory,
    capturedPieces,
    materialAdvantage,
    undoEnabled,
    canUndo,
    canRedo,
  } = gameState;

  // Format captured pieces to show nicely
  const renderCaptured = (color) => {
    const list = capturedPieces[color] || [];
    return (
      <div className={styles.capturedTray}>
        {list.map((piece, i) => (
          <span key={i} className={styles.capturedPiece} title={piece}>
            {PIECE_ICONS[piece] || piece[0].toUpperCase()}
          </span>
        ))}
      </div>
    );
  };

  // Group move history into pairs
  const renderHistory = () => {
    const pairs = [];
    for (let i = 0; i < moveHistory.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: moveHistory[i],
        black: moveHistory[i + 1],
      });
    }

    if (pairs.length === 0) {
      return <div className={styles.emptyHistory}>No moves played yet.</div>;
    }

    const colToChar = (col) => String.fromCharCode(97 + col);
    const rowToRank = (row) => 8 - row;

    return (
      <div className={styles.historyList}>
        {pairs.map((pair) => {
          const wIdx = (pair.num - 1) * 2;
          const bIdx = (pair.num - 1) * 2 + 1;
          const isWhiteActive = viewingMoveIndex === wIdx;
          const isBlackActive = viewingMoveIndex === bIdx;

          return (
            <div key={pair.num} className={styles.historyRow}>
              <span className={styles.moveNum}>{pair.num}.</span>
              
              {/* White Move */}
              <span
                className={`${styles.moveNotation} ${isWhiteActive ? styles.activeMove : ""}`}
                title={`${pair.white.piece} from ${colToChar(pair.white.from[1])}${rowToRank(pair.white.from[0])} to ${colToChar(pair.white.to[1])}${rowToRank(pair.white.to[0])}`}
                onClick={() => onSelectMove?.(wIdx)}
                style={{ cursor: "pointer" }}
              >
                {pair.white.notation}
                <span className={styles.tooltip}>
                  {pair.white.piece}: {colToChar(pair.white.from[1])}{rowToRank(pair.white.from[0])} → {colToChar(pair.white.to[1])}{rowToRank(pair.white.to[0])}
                </span>
              </span>

              {/* Black Move */}
              {pair.black ? (
                <span
                  className={`${styles.moveNotation} ${isBlackActive ? styles.activeMove : ""}`}
                  title={`${pair.black.piece} from ${colToChar(pair.black.from[1])}${rowToRank(pair.black.from[0])} to ${colToChar(pair.black.to[1])}${rowToRank(pair.black.to[0])}`}
                  onClick={() => onSelectMove?.(bIdx)}
                  style={{ cursor: "pointer" }}
                >
                  {pair.black.notation}
                  <span className={styles.tooltip}>
                    {pair.black.piece}: {colToChar(pair.black.from[1])}{rowToRank(pair.black.from[0])} → {colToChar(pair.black.to[1])}{rowToRank(pair.black.to[0])}
                  </span>
                </span>
              ) : (
                <span className={styles.moveNotationEmpty} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <aside className={styles.panel}>
      {/* Game Header */}
      <div className={styles.panelHeader}>
        <span className={styles.lobbyLink} onClick={onResetToLobby}>
          ← Back to Lobby
        </span>
        <div className={styles.modeTag}>
          {gameState.timer_mode ? `${gameState.timer_mode} Chess` : "Casual Game"}
        </div>
      </div>

      {/* Timers and captured pieces */}
      <div className={styles.playersStatus}>
        {/* Opponent Player (Black) */}
        <div className={styles.playerBar}>
          <div className={styles.playerInfo}>
            <span className={`${styles.playerDot} ${styles.dotBlack}`} />
            <span className={styles.playerName}>Black</span>
            {materialAdvantage < 0 && (
              <span className={styles.advantage}>+{Math.abs(materialAdvantage)}</span>
            )}
          </div>
          {renderCaptured("black")}
          <Timer
            time={timeLeftBlack}
            formatTime={formatTime}
            isActive={currentTurn === "black" && status === "ongoing"}
          />
        </div>

        {/* Local Player (White) */}
        <div className={styles.playerBar}>
          <div className={styles.playerInfo}>
            <span className={`${styles.playerDot} ${styles.dotWhite}`} />
            <span className={styles.playerName}>White</span>
            {materialAdvantage > 0 && (
              <span className={styles.advantage}>+{materialAdvantage}</span>
            )}
          </div>
          {renderCaptured("white")}
          <Timer
            time={timeLeftWhite}
            formatTime={formatTime}
            isActive={currentTurn === "white" && status === "ongoing"}
          />
        </div>
      </div>

      {/* Move History */}
      <div className={styles.historyCard}>
        <div className={styles.sectionLabel}>Move Log</div>
        {renderHistory()}
      </div>

      {/* Game Actions */}
      <div className={styles.actionCard}>
        {undoEnabled && (
          <>
            <div className={styles.takebackStatus}>
              <span>Takebacks Left:</span>
              <span className={styles.countBadge}>W: {gameState.takebacks_remaining?.white ?? 0}</span>
              <span className={styles.countBadge}>B: {gameState.takebacks_remaining?.black ?? 0}</span>
            </div>
            <div className={styles.undoRow}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={onUndo}
                disabled={!canUndo || (moveHistory.length > 0 && gameState.takebacks_remaining?.[moveHistory[moveHistory.length - 1].color] <= 0)}
                title="Undo Move"
              >
                ⟲ Undo
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo Move"
              >
                ⟳ Redo
              </button>
            </div>
          </>
        )}
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.resignBtn}`}
          onClick={onResign}
          disabled={status !== "ongoing" && status !== "check"}
        >
          🏳 Resign
        </button>
      </div>
    </aside>
  );
}
