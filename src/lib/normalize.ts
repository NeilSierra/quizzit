/**
 * Normalizes a string for answer comparison by trimming, collapsing whitespace,
 * optionally lowercasing, and stripping diacritics and punctuation.
 */
export function normalize(input: string, caseSensitive = false): string {
  let s = input.trim().replace(/\s+/g, " ");
  if (!caseSensitive) s = s.toLowerCase();
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

/**
 * Computes Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j];
    }
  }
  return prev[b.length];
}

/**
 * Checks if user input matches a target answer, optionally allowing minor typos
 * (edit distance <= 1 for 6-11 chars, <= 2 for 12+ chars).
 */
export function isTypoMatch(
  input: string,
  target: string,
  caseSensitive = false
): boolean {
  const normIn = normalize(input, caseSensitive);
  const normTarget = normalize(target, caseSensitive);
  if (!normIn || !normTarget) return false;
  if (normIn === normTarget) return true;

  const len = normTarget.length;
  const maxDist = len >= 12 ? 2 : len >= 6 ? 1 : 0;
  if (maxDist === 0) return false;
  return levenshtein(normIn, normTarget) <= maxDist;
}
