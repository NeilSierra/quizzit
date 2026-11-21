"use client";

import { sound } from "@/lib/sound";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: ToggleProps) {
  return (
    <label
      className={`flex min-h-14 items-center justify-between gap-4 rounded-xl px-2 -mx-2 py-2.5 transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-bg-subtle/60"
      }`}
    >
      <div className="flex flex-col">
        <span className="text-base font-bold text-text">{label}</span>
        {description && (
          <span className="text-sm font-semibold text-text-muted">
            {description}
          </span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          sound.playClick();
          onChange(!checked);
        }}
        className={`focus-ring relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors ${
          checked
            ? "border-brand-fill bg-brand-fill"
            : "border-border-strong bg-disabled-bg"
        }`}
      >
        <span
          className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
