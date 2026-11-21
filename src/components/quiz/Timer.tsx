"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface TimerProps {
  minutes: number;
  startedAt: number;
  onExpire: () => void;
}

export function Timer({ minutes, startedAt, onExpire }: TimerProps) {
  const totalSeconds = minutes * 60;
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Math.floor((Date.now() - startedAt) / 1000);
    return Math.max(0, totalSeconds - elapsed);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const next = Math.max(0, totalSeconds - elapsed);
      setRemaining(next);
      if (next === 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, totalSeconds, onExpire]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 30;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-extrabold tabular-nums ${
        isLow
          ? "border-danger bg-danger-bg text-danger"
          : "border-border bg-surface text-text"
      }`}
      aria-label={`Time remaining: ${mins} minutes ${secs} seconds`}
    >
      <Clock className="h-4 w-4" />
      <span>
        {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
      </span>
    </div>
  );
}
