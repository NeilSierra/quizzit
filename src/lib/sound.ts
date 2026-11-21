"use client";

import { storage } from "./storage";

let audioCtx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!storage.getSoundEnabled()) return null;

  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;

  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => { });
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "sine",
  gainPeak = 0.14
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.02);
}

const CORRECT_PATTERNS: number[][] = [
  [523.25, 659.25, 783.99], // C5 E5 G5
  [587.33, 739.99, 880.0], // D5 F#5 A5
  [659.25, 783.99, 987.77], // E5 G5 B5
];

const WRONG_PATTERNS: number[][] = [
  [261.63, 220.0], // C4 -> A3
  [246.94, 196.0], // B3 -> G3
];

export const sound = {
  playClick() {
    const ctx = getContext();
    if (!ctx) return;
    const jitter = 500 + Math.random() * 45;
    playTone(ctx, jitter, 0, 0.055, "sine", 0.06);
  },

  playNav() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 420, 0, 0.06, "sine", 0.05);
  },

  playStart() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 523.25, 0, 0.1, "triangle", 0.12);
    playTone(ctx, 783.99, 0.08, 0.18, "triangle", 0.14);
  },

  playHint() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 783.99, 0, 0.1, "sine", 0.1); // G5
    playTone(ctx, 987.77, 0.07, 0.16, "sine", 0.11); // B5
  },

  playMilestone() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 659.25, 0, 0.1, "triangle", 0.11); // E5
    playTone(ctx, 783.99, 0.08, 0.1, "triangle", 0.11); // G5
    playTone(ctx, 987.77, 0.16, 0.2, "triangle", 0.12); // B5
  },

  playCorrect() {
    const ctx = getContext();
    if (!ctx) return;
    const pattern =
      CORRECT_PATTERNS[Math.floor(Math.random() * CORRECT_PATTERNS.length)];
    playTone(ctx, pattern[0], 0, 0.11, "triangle", 0.13);
    playTone(ctx, pattern[1], 0.075, 0.13, "triangle", 0.13);
    playTone(ctx, pattern[2], 0.15, 0.21, "triangle", 0.15);
  },

  playWrong() {
    const ctx = getContext();
    if (!ctx) return;
    const pattern =
      WRONG_PATTERNS[Math.floor(Math.random() * WRONG_PATTERNS.length)];
    playTone(ctx, pattern[0], 0, 0.13, "sine", 0.12);
    playTone(ctx, pattern[1], 0.11, 0.22, "sine", 0.11);
  },

  playBadge() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 523.25, 0.35, 0.12, "triangle", 0.12);
    playTone(ctx, 659.25, 0.43, 0.12, "triangle", 0.12);
    playTone(ctx, 783.99, 0.51, 0.12, "triangle", 0.12);
    playTone(ctx, 987.77, 0.59, 0.14, "triangle", 0.13);
    playTone(ctx, 1046.5, 0.68, 0.32, "triangle", 0.15);
  },

  playCelebration(score: number) {
    const ctx = getContext();
    if (!ctx) return;
    if (score >= 75) {
      playTone(ctx, 523.25, 0, 0.14, "triangle", 0.14); // C5
      playTone(ctx, 659.25, 0.09, 0.14, "triangle", 0.14); // E5
      playTone(ctx, 783.99, 0.18, 0.14, "triangle", 0.14); // G5
      playTone(ctx, 1046.5, 0.27, 0.38, "triangle", 0.16); // C6
    } else {
      playTone(ctx, 440.0, 0, 0.14, "sine", 0.11); // A4
      playTone(ctx, 523.25, 0.11, 0.24, "sine", 0.12); // C5
    }
  },
};
