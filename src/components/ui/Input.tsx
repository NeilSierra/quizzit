"use client";

import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-bold text-text-muted uppercase tracking-wide"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`h-12 w-full rounded-xl border-2 px-4 text-base font-semibold text-text bg-bg-subtle dark:bg-surface placeholder:text-text-faint transition-colors focus:outline-none ${
          error
            ? "border-danger focus:border-danger"
            : "border-border focus:border-brand-fill"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm font-bold text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
