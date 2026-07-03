/*
 * Konversi rekaman fitur per-frame (36 dim, format word-features.ts) menjadi
 * WordClip untuk peragaan avatar. Logika sama dengan
 * scripts/build_word_clips.mjs: pangkas tepi tanpa tangan, isi celah
 * deteksi, resample, posisi wrist relatif anchor dada.
 */

import type { ClipFrame, WordClip } from "./vocabulary";

const MAX_FRAMES = 42;
const CLIP_FPS = 12;
const ANCHOR_Y = 0.08;

function clampOffset(v: number): number {
  return Math.max(-0.35, Math.min(0.4, v));
}

function hasHand(f: Float32Array | number[]): boolean {
  return f[30] > 0.5 || f[31] > 0.5;
}

function resample<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr;
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(arr[Math.round((i / (n - 1)) * (arr.length - 1))]);
  }
  return out;
}

export function framesToClip(
  word: string,
  captured: Float32Array[],
): WordClip | null {
  let start = captured.findIndex(hasHand);
  if (start < 0) return null;
  let end = captured.length - 1;
  while (end > start && !hasHand(captured[end])) end--;
  const trimmed = captured.slice(start, end + 1);

  const filled: Float32Array[] = [];
  let last: Float32Array | null = null;
  for (const f of trimmed) {
    if (hasHand(f)) {
      last = f;
      filled.push(f);
    } else if (last) {
      filled.push(last);
    }
  }
  if (filled.length < 6) return null;

  const sampled = resample(filled, MAX_FRAMES);
  const frames: ClipFrame[] = sampled.map((f) => {
    const leftPresent = f[30] > 0.5;
    const rightPresent = f[31] > 0.5;
    return {
      left: leftPresent
        ? Array.from(f.slice(0, 15)).map((v) => +v.toFixed(3))
        : null,
      right: rightPresent
        ? Array.from(f.slice(15, 30)).map((v) => +v.toFixed(3))
        : null,
      leftWrist: leftPresent
        ? [
            +clampOffset(f[32]).toFixed(3),
            +clampOffset(f[33] - ANCHOR_Y).toFixed(3),
          ]
        : null,
      rightWrist: rightPresent
        ? [
            +clampOffset(f[34]).toFixed(3),
            +clampOffset(f[35] - ANCHOR_Y).toFixed(3),
          ]
        : null,
    };
  });

  const twoHandedFrames = frames.filter((f) => f.left && f.right).length;
  return {
    word,
    frames,
    fps: CLIP_FPS,
    twoHanded: twoHandedFrames / frames.length >= 0.4,
  };
}
