import { useState, useEffect, useRef } from "react";

export function useTimer({
  timeWhite,
  timeBlack,
  activeColor,
  isGameActive,
  onTimeout,
  onTick,
}) {
  const [timeLeftWhite, setTimeLeftWhite] = useState(timeWhite);
  const [timeLeftBlack, setTimeLeftBlack] = useState(timeBlack);

  const activeColorRef = useRef(activeColor);
  const isGameActiveRef = useRef(isGameActive);
  const onTimeoutRef = useRef(onTimeout);
  const onTickRef = useRef(onTick);

  useEffect(() => {
    activeColorRef.current = activeColor;
    isGameActiveRef.current = isGameActive;
    onTimeoutRef.current = onTimeout;
    onTickRef.current = onTick;
  }, [activeColor, isGameActive, onTimeout, onTick]);

  // Sync state with incoming props (e.g. from api updates, undo/redo)
  useEffect(() => {
    setTimeLeftWhite(timeWhite);
  }, [timeWhite]);

  useEffect(() => {
    setTimeLeftBlack(timeBlack);
  }, [timeBlack]);

  useEffect(() => {
    if (!isGameActive || timeWhite === null || timeBlack === null) return;

    let lastTimestamp = performance.now();
    let intervalId = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (!isGameActiveRef.current) return;

      if (activeColorRef.current === "white") {
        setTimeLeftWhite((prev) => {
          const next = Math.max(0, prev - delta);
          if (next <= 0 && prev > 0) {
            onTimeoutRef.current("white");
          }
          return next;
        });
      } else {
        setTimeLeftBlack((prev) => {
          const next = Math.max(0, prev - delta);
          if (next <= 0 && prev > 0) {
            onTimeoutRef.current("black");
          }
          return next;
        });
      }
      
      if (onTickRef.current) {
        onTickRef.current();
      }
    }, 100);

    return () => clearInterval(intervalId);
  }, [isGameActive, timeWhite, timeBlack]);

  const formatTime = (timeInSeconds) => {
    if (timeInSeconds === null || timeInSeconds === undefined) return "∞";
    if (timeInSeconds <= 0) return "0.0";
    
    if (timeInSeconds < 10) {
      return timeInSeconds.toFixed(1);
    }
    
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return {
    timeLeftWhite,
    timeLeftBlack,
    formatTime,
  };
}
