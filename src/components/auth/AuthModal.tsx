"use client";

import { useState, type FormEvent } from "react";
import { KeyRound, Lock, LogIn, Mail, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { sound } from "@/lib/sound";
import { useAuth } from "@/store/useAuth";

export function AuthModal() {
  const open = useAuth((s) => s.authModalOpen);
  const close = useAuth((s) => s.closeAuthModal);
  const configured = useAuth((s) => s.configured);
  const signInWithEmail = useAuth((s) => s.signInWithEmail);
  const signUpWithEmail = useAuth((s) => s.signUpWithEmail);
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSubmitting(true);

    if (password.length < 8) {
      sound.playWrong();
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    if (mode === "signin") {
      const res = await signInWithEmail(email.trim(), password);
      if (!res.ok) {
        sound.playWrong();
        setError(res.error ?? "Could not sign in.");
      } else {
        sound.playCorrect();
      }
    } else {
      const res = await signUpWithEmail(email.trim(), password);
      if (!res.ok) {
        sound.playWrong();
        setError(res.error ?? "Could not create account.");
      } else if (res.needsConfirmation) {
        sound.playCorrect();
        setInfo("Check your email for a confirmation link to finish signing up.");
      } else {
        sound.playCorrect();
      }
    }
    setSubmitting(false);
  };

  const handleGoogle = async () => {
    setError(null);
    const res = await signInWithGoogle();
    if (!res.ok) {
      sound.playWrong();
      setError(res.error ?? "Could not start Google sign-in.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={mode === "signin" ? "Sign In to Quizzit" : "Create Private Account"}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 rounded-xl bg-brand-tint px-3 py-2 text-xs font-bold text-brand-text">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            Your quizzes, attempts, and badges are private to your account.
          </span>
        </div>

        {!configured ? (
          <p className="text-sm font-semibold text-text-muted">
            Cloud sync is not configured yet. Add{" "}
            <code className="font-mono text-text">
              NEXT_PUBLIC_SUPABASE_URL
            </code>{" "}
            and{" "}
            <code className="font-mono text-text">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </code>{" "}
            to enable accounts.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
                className={`focus-ring flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-extrabold uppercase tracking-wide ${
                  mode === "signin"
                    ? "border-brand-fill bg-brand-tint text-brand-text"
                    : "border-border bg-surface text-text-muted"
                }`}
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setMode("signup");
                  setError(null);
                  setInfo(null);
                }}
                className={`focus-ring flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-extrabold uppercase tracking-wide ${
                  mode === "signup"
                    ? "border-brand-fill bg-brand-tint text-brand-text"
                    : "border-border bg-surface text-text-muted"
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Sign Up</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 bottom-3.5 h-5 w-5 text-text-muted"
                  aria-hidden="true"
                />
                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-11"
                />
              </div>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3.5 bottom-3.5 h-5 w-5 text-text-muted"
                  aria-hidden="true"
                />
                <Input
                  label="Password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pl-11"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-danger-bg px-3 py-2 text-xs font-bold text-danger">
                  {error}
                </p>
              )}
              {info && (
                <p className="rounded-xl bg-success-bg px-3 py-2 text-xs font-bold text-success">
                  {info}
                </p>
              )}

              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={submitting}
              >
                {submitting ? (
                  "Please wait..."
                ) : mode === "signin" ? (
                  <>
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" aria-hidden="true" />
                    <span>Create Account</span>
                  </>
                )}
              </Button>
            </form>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t-2 border-border" />
              <span className="mx-3 text-xs font-extrabold uppercase text-text-faint">
                or
              </span>
              <div className="flex-grow border-t-2 border-border" />
            </div>

            <Button variant="secondary" fullWidth onClick={handleGoogle}>
              <svg
                className="h-[18px] w-[18px] shrink-0"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>Continue with Google</span>
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
