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
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  ctx: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType = "triangle",
  gainPeak = 0.34,
  endFreq?: number
) {
  const now = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (endFreq !== undefined) {
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration);
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.03);
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
    const jitter = 520 + Math.random() * 45;
    playTone(ctx, jitter, 0, 0.06, "triangle", 0.24);
  },

  playNav() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 440, 0, 0.07, "triangle", 0.22);
  },

  playStart() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 523.25, 0, 0.12, "triangle", 0.34);
    playTone(ctx, 783.99, 0.08, 0.22, "triangle", 0.38);
  },

  playHint() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 783.99, 0, 0.11, "sine", 0.3); // G5
    playTone(ctx, 987.77, 0.07, 0.18, "sine", 0.32); // B5
  },

  playMilestone() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 659.25, 0, 0.11, "triangle", 0.32); // E5
    playTone(ctx, 783.99, 0.08, 0.11, "triangle", 0.32); // G5
    playTone(ctx, 987.77, 0.16, 0.22, "triangle", 0.36); // B5
  },

  playCorrect() {
    const ctx = getContext();
    if (!ctx) return;
    const pattern =
      CORRECT_PATTERNS[Math.floor(Math.random() * CORRECT_PATTERNS.length)];
    playTone(ctx, pattern[0], 0, 0.12, "triangle", 0.34);
    playTone(ctx, pattern[1], 0.075, 0.14, "triangle", 0.34);
    playTone(ctx, pattern[2], 0.15, 0.24, "triangle", 0.38);
  },

  playWrong() {
    const ctx = getContext();
    if (!ctx) return;
    const pattern =
      WRONG_PATTERNS[Math.floor(Math.random() * WRONG_PATTERNS.length)];
    playTone(ctx, pattern[0], 0, 0.15, "sawtooth", 0.16);
    playTone(ctx, pattern[1], 0.11, 0.24, "sawtooth", 0.15);
  },

  playBadge() {
    const ctx = getContext();
    if (!ctx) return;
    playTone(ctx, 523.25, 0.4, 0.12, "triangle", 0.3);
    playTone(ctx, 659.25, 0.48, 0.12, "triangle", 0.3);
    playTone(ctx, 783.99, 0.56, 0.12, "triangle", 0.32);
    playTone(ctx, 987.77, 0.64, 0.14, "triangle", 0.34);
    playTone(ctx, 1046.5, 0.73, 0.36, "triangle", 0.38);
  },

  playCelebration(score: number) {
    const ctx = getContext();
    if (!ctx) return;
    if (score >= 50) {
      // Triumphant pass fanfare
      playTone(ctx, 523.25, 0, 0.13, "triangle", 0.34); // C5
      playTone(ctx, 659.25, 0.09, 0.13, "triangle", 0.34); // E5
      playTone(ctx, 783.99, 0.18, 0.13, "triangle", 0.36); // G5
      playTone(ctx, 1046.5, 0.27, 0.42, "triangle", 0.4); // C6
      if (score >= 75) {
        // Extra harmony chord on high score
        playTone(ctx, 659.25, 0.27, 0.4, "sine", 0.22);
        playTone(ctx, 783.99, 0.27, 0.4, "sine", 0.22);
      }
    } else {
      // Sad descending "wah-wah" trombone cue on fail (< 50%)
      playTone(ctx, 329.63, 0, 0.22, "sawtooth", 0.18, 311.13); // E4 -> Eb4
      playTone(ctx, 311.13, 0.22, 0.22, "sawtooth", 0.18, 293.66); // Eb4 -> D4
      playTone(ctx, 293.66, 0.44, 0.22, "sawtooth", 0.17, 277.18); // D4 -> C#4
      playTone(ctx, 261.63, 0.66, 0.48, "sawtooth", 0.18, 233.08); // C4 -> Bb3
    }
  },
};
