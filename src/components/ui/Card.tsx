import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  elevation?: "default" | "hero" | "subtle";
  children: ReactNode;
}

export function Card({
  selected = false,
  elevation = "default",
  className = "",
  children,
  ...props
}: CardProps) {
  const surfaceStyle = selected
    ? "border-brand-fill bg-brand-tint shadow-[0_2px_0_var(--brand-fill)]"
    : elevation === "hero"
      ? "border-border-strong/70 bg-surface shadow-[0_4px_0_var(--border)]"
      : elevation === "subtle"
        ? "border-border bg-bg-subtle/60 shadow-none"
        : "border-border bg-surface shadow-[0_2px_0_var(--border)]";

  return (
    <div
      className={`min-w-0 rounded-2xl border-2 p-4 sm:p-5 transition-colors ${surfaceStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
