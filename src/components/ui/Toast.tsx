"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ToastProps {
  message: string | null;
  icon?: string;
}

export function Toast({ message, icon = "✨" }: ToastProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.96 }}
          transition={{ duration: 0.2 }}
          className="fixed top-20 left-1/2 z-40 -translate-x-1/2 rounded-full border-2 border-brand-fill bg-surface-raised px-5 py-2.5 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <span className="flex items-center gap-2 text-sm font-extrabold text-brand-text">
            <span>{icon}</span>
            <span>{message}</span>
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
