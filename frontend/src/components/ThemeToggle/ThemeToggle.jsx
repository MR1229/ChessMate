import React from "react";
import { useTheme } from "../../theme/ThemeProvider";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggleBtn}
      onClick={toggleTheme}
      aria-label="Toggle Theme"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
    >
      {theme === "dark" ? (
        <span className={styles.icon}>☀️</span>
      ) : (
        <span className={styles.icon}>🌙</span>
      )}
    </button>
  );
}
