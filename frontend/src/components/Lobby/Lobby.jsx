import React, { useState } from "react";
import styles from "./Lobby.module.css";

const TIMER_PRESETS = [
  { id: "bullet_1", name: "1 min", category: "Bullet", time: 60, inc: 0 },
  { id: "blitz_3", name: "3 min", category: "Blitz", time: 180, inc: 0 },
  { id: "blitz_5", name: "5 min", category: "Blitz", time: 300, inc: 0 },
  { id: "rapid_10", name: "10 min", category: "Rapid", time: 600, inc: 0 },
  { id: "rapid_15_10", name: "15 + 10", category: "Rapid", time: 900, inc: 10 },
  { id: "classical_30", name: "30 min", category: "Classical", time: 1800, inc: 0 },
  { id: "infinite", name: "Unlimited", category: "Casual", time: null, inc: 0 },
];

export default function Lobby({ onStartGame }) {
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("blitz_5");
  const [undoEnabled, setUndoEnabled] = useState(true);

  const handleStart = () => {
    const preset = TIMER_PRESETS.find((p) => p.id === selectedPreset);
    onStartGame({
      timer_mode: preset.id === "infinite" ? "Infinite" : preset.category,
      time_seconds: preset.time,
      increment: preset.inc,
      undo_enabled: undoEnabled,
    });
  };

  if (!isConfiguring) {
    return (
      <div className={styles.lobbySidebar}>
        <div className={styles.header}>
          <span className={styles.gamingIcon}>♞</span>
          <h2>ChessMate</h2>
          <p className={styles.subtitle}>Sleek. Minimalist. Fast.</p>
        </div>
        <div className={styles.welcomeGraphic}>
          <div className={styles.welcomePiece}>♔</div>
        </div>
        <button
          type="button"
          className={styles.startBtn}
          onClick={() => setIsConfiguring(true)}
        >
          New Game
        </button>
      </div>
    );
  }

  return (
    <div className={styles.lobbySidebar}>
      <div className={styles.header}>
        <span className={styles.gamingIcon}>⚙️</span>
        <h2>Match Settings</h2>
        <p className={styles.subtitle}>Select clocks and takeback rules</p>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>Time Control</div>
        <div className={styles.presetsGrid}>
          {TIMER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`${styles.presetBtn} ${
                selectedPreset === preset.id ? styles.activePreset : ""
              }`}
              onClick={() => setSelectedPreset(preset.id)}
            >
              <span className={styles.presetName}>{preset.name}</span>
              <span className={styles.presetCat}>{preset.category}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.toggleRow}>
          <div className={styles.toggleInfo}>
            <span className={styles.toggleLabel}>Allow Takebacks</span>
            <span className={styles.toggleDesc}>2 chances per player</span>
          </div>
          <label className={styles.switch}>
            <input
              type="checkbox"
              checked={undoEnabled}
              onChange={(e) => setUndoEnabled(e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      <button type="button" className={styles.startBtn} onClick={handleStart}>
        Start Match
      </button>
    </div>
  );
}
