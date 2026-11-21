"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  completed?: boolean;
}

export function ProgressBar({
  current,
  total,
  completed = false,
}: ProgressBarProps) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div
      className="relative h-4 w-full overflow-hidden rounded-full bg-border"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Question progress: ${current} of ${total}`}
    >
      <div
        className={`relative h-full rounded-full transition-all duration-200 ease-out ${
          completed ? "bg-success" : "bg-brand-fill"
        }`}
        style={{ width: `${pct}%` }}
      >
        {/* 4px inner glossy highlight */}
        <div className="absolute inset-x-1.5 top-1 h-1 rounded-full bg-white/25" />
      </div>
    </div>
  );
}
