"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { sound } from "@/lib/sound";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  silent?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  success: "btn-success",
  danger: "btn-danger",
  ghost: "btn-ghost",
};

export function Button({
  variant = "primary",
  fullWidth = false,
  silent = false,
  className = "",
  children,
  type = "button",
  onClick,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={(e) => {
        if (!silent && !props.disabled) {
          sound.playClick();
        }
        onClick?.(e);
      }}
      className={`btn-tactile ${variantClass[variant]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
