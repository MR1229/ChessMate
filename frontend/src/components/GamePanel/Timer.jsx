import React from "react";
import styles from "./Timer.module.css";

export default function Timer({ time, formatTime, isActive }) {
  if (time === null) {
    return (
      <div className={`${styles.timer} ${styles.infinite}`}>
        <span>∞</span>
      </div>
    );
  }

  const isLowTime = time < 30;
  const isCriticalTime = time < 10;

  let timerClass = styles.timer;
  if (isActive) timerClass += ` ${styles.active}`;
  if (isActive && isLowTime) timerClass += ` ${styles.lowTime}`;
  if (isActive && isCriticalTime) timerClass += ` ${styles.criticalTime}`;

  return (
    <div className={timerClass}>
      <span className={styles.timeStr}>{formatTime(time)}</span>
    </div>
  );
}
