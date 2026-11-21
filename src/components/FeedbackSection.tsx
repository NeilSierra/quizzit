"use client";

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  Bug,
  CheckCircle2,
  Heart,
  Lightbulb,
  MessageSquare,
  Send,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { sound } from "@/lib/sound";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/store/useAuth";

const LIKE_ID_KEY = "quizapp:like-id";
const LIKED_KEY = "quizapp:liked";

function getOrCreateLikeId(): string {
  if (typeof window === "undefined") return "guest";
  let id = window.localStorage.getItem(LIKE_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `like-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    window.localStorage.setItem(LIKE_ID_KEY, id);
  }
  return id;
}

export function FeedbackSection() {
  const user = useAuth((s) => s.user);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [liked, setLiked] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [category, setCategory] = useState<"idea" | "bug" | "praise">("idea");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLiked(window.localStorage.getItem(LIKED_KEY) === "true");
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    supabase
      .from("app_likes")
      .select("id", { count: "exact", head: true })
      .then(({ count, error: err }) => {
        if (!err && typeof count === "number") {
          setLikeCount(count);
        }
      });
  }, []);

  const toggleLike = async () => {
    if (likeBusy) return;
    setLikeBusy(true);

    const nextLiked = !liked;
    const likeId = getOrCreateLikeId();

    if (nextLiked) {
      sound.playCorrect();
      setLiked(true);
      setLikeCount((c) => c + 1);
    } else {
      sound.playClick();
      setLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LIKED_KEY, String(nextLiked));
    }

    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      if (nextLiked) {
        await supabase.from("app_likes").upsert({
          id: likeId,
          user_id: user?.id ?? null,
        });
      } else {
        await supabase.from("app_likes").delete().eq("id", likeId);
      }
    }

    setLikeBusy(false);
  };

  const handleSubmitFeedback = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError(null);
    setSubmitting(true);

    const supabase = createSupabaseBrowserClient();
    if (supabase) {
      const { error: insertErr } = await supabase.from("user_feedback").insert({
        user_id: user?.id ?? null,
        category,
        rating,
        message: message.trim(),
      });
      if (insertErr) {
        sound.playWrong();
        setError(insertErr.message);
        setSubmitting(false);
        return;
      }
    }

    sound.playCorrect();
    setSubmitting(false);
    setSubmitted(true);
    setMessage("");
  };

  return (
    <>
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-text">
            Enjoying Quizzit?
          </h2>
          <p className="text-sm font-semibold text-text-muted">
            Leave a like or share feedback to help improve the app.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 w-full sm:w-auto">
          <motion.button
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={toggleLike}
            aria-pressed={liked}
            className={`focus-ring inline-flex min-h-[52px] w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border-2 px-4 sm:px-5 font-extrabold text-sm uppercase tracking-wide transition-colors ${
              liked
                ? "border-danger bg-danger-bg text-danger shadow-[0_3px_0_var(--danger)]"
                : "border-border bg-surface text-text shadow-[0_3px_0_var(--border)] hover:border-border-strong"
            }`}
          >
            <Heart
              className={`h-5 w-5 shrink-0 ${liked ? "fill-danger text-danger" : ""}`}
            />
            <span>{liked ? "Liked" : "Like"}</span>
            <span className="rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-extrabold tabular-nums text-text">
              {likeCount}
            </span>
          </motion.button>

          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => {
              setSubmitted(false);
              setError(null);
              setRating(0);
              setFeedbackOpen(true);
            }}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            Feedback
          </Button>
        </div>
      </Card>

      <Modal
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        title="Send Feedback"
      >
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <CheckCircle2 className="h-12 w-12 text-success" />
            <div>
              <h3 className="text-xl font-extrabold text-text">
                Thank you!
              </h3>
              <p className="mt-1 text-sm font-semibold text-text-muted">
                Your feedback has been received and helps make Quizzit better.
              </p>
            </div>
            <Button
              variant="primary"
              fullWidth
              onClick={() => setFeedbackOpen(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitFeedback} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
                Category
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "idea", label: "Idea", icon: Lightbulb },
                    { id: "bug", label: "Bug", icon: Bug },
                    { id: "praise", label: "Love it", icon: Heart },
                  ] as const
                ).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setCategory(id);
                    }}
                    className={`focus-ring flex items-center justify-center gap-1.5 rounded-xl border-2 py-2 text-xs font-extrabold uppercase ${
                      category === id
                        ? "border-brand-fill bg-brand-tint text-brand-text"
                        : "border-border bg-surface text-text-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-text-muted">
                Rating
              </span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => {
                      sound.playClick();
                      setRating(n);
                    }}
                    aria-label={`${n} stars`}
                    className="focus-ring flex h-10 w-10 items-center justify-center rounded-xl hover:bg-bg-subtle"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        n <= rating
                          ? "fill-xp text-xp"
                          : "text-border-strong"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="feedback-message"
                className="text-xs font-extrabold uppercase tracking-wider text-text-muted"
              >
                Your Message
              </label>
              <textarea
                id="feedback-message"
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a suggestion, bug report, or what you like..."
                className="w-full rounded-xl border-2 border-border bg-bg-subtle dark:bg-surface p-3 text-sm font-semibold text-text placeholder:text-text-faint focus:border-brand-fill focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-xl bg-danger-bg px-3 py-2 text-xs font-bold text-danger">
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={submitting || !message.trim()}
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending..." : "Submit Feedback"}
            </Button>
          </form>
        )}
      </Modal>
    </>
  );
}
