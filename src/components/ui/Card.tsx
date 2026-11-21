import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
  children: ReactNode;
}

export function Card({
  selected = false,
  className = "",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={`min-w-0 rounded-2xl border-2 p-4 sm:p-5 transition-colors ${
        selected
          ? "border-brand-fill bg-brand-tint shadow-[0_2px_0_var(--brand-fill)]"
          : "border-border bg-surface shadow-[0_2px_0_var(--border)]"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
