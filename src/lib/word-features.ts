/*
 * Fitur per-frame untuk pengenalan isyarat kata-level, harus identik dengan
 * scripts/extract_word_features.py.
 *
 * 36 dimensi per frame:
 *   [0..14]  curl 5 jari x 3 sendi tangan kiri (0 jika tidak ada)
 *   [15..29] curl tangan kanan
 *   [30,31]  flag kiri, kanan
 *   [32,33]  posisi wrist kiri (x,y) relatif tengah frame
 *   [34,35]  posisi wrist kanan
 */

import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";

export const WORD_FEATURE_SIZE = 36;
export const WORD_WINDOW = 48;

type Pt = { x: number; y: number; z: number };

const CHAINS: number[][] = [
  [1, 2, 3, 4],
  [5, 6, 7, 8],
  [9, 10, 11, 12],
  [13, 14, 15, 16],
  [17, 18, 19, 20],
];

function angle(u: number[], v: number[]): number {
  const du = Math.hypot(u[0], u[1], u[2]);
  const dv = Math.hypot(v[0], v[1], v[2]);
  if (du < 1e-6 || dv < 1e-6) return 0;
  const c = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (du * dv);
  return Math.acos(Math.min(1, Math.max(-1, c)));
}

function curls(pts: Pt[]): number[] {
  const out: number[] = [];
  for (const chain of CHAINS) {
    const joints = [pts[0], ...chain.map((i) => pts[i])];
    for (let j = 1; j <= 3; j++) {
      const v1 = [
        joints[j].x - joints[j - 1].x,
        joints[j].y - joints[j - 1].y,
        joints[j].z - joints[j - 1].z,
      ];
      const v2 = [
        joints[j + 1].x - joints[j].x,
        joints[j + 1].y - joints[j].y,
        joints[j + 1].z - joints[j].z,
      ];
      out.push(angle(v1, v2));
    }
  }
  return out;
}

export function wordFrameFeatures(
  result: HandLandmarkerResult,
): Float32Array {
  const feat = new Float32Array(WORD_FEATURE_SIZE);
  const hands: Record<string, { pts: Pt[]; score: number }> = {};
  for (let i = 0; i < result.landmarks.length; i++) {
    const h = result.handedness[i]?.[0];
    if (!h) continue;
    if (!hands[h.categoryName] || h.score > hands[h.categoryName].score) {
      hands[h.categoryName] = { pts: result.landmarks[i], score: h.score };
    }
  }
  const left = hands["Left"]?.pts;
  const right = hands["Right"]?.pts;
  if (left) {
    feat.set(curls(left), 0);
    feat[30] = 1;
    feat[32] = left[0].x - 0.5;
    feat[33] = left[0].y - 0.5;
  }
  if (right) {
    feat.set(curls(right), 15);
    feat[31] = 1;
    feat[34] = right[0].x - 0.5;
    feat[35] = right[0].y - 0.5;
  }
  return feat;
}

/* Fitur v2 dengan lengan (42 dim), harus identik dengan
 * scripts/extract_word_features_v2.py:
 * [0..29] curl kedua tangan, [30,31] flag tangan,
 * [32..35] wrist kiri/kanan relatif tengah bahu / lebar bahu (dari pose),
 * [36..39] siku kiri/kanan, [40] flag pose, [41] jarak antar wrist. */

export const WORD_FEATURE_SIZE_V2 = 42;

type PoseLandmark = { x: number; y: number };

export function wordFrameFeaturesV2(
  handResult: HandLandmarkerResult,
  poseLandmarks: PoseLandmark[] | null,
): Float32Array {
  const base = wordFrameFeatures(handResult);
  const feat = new Float32Array(WORD_FEATURE_SIZE_V2);
  feat.set(base.slice(0, 32), 0);

  if (poseLandmarks && poseLandmarks.length > 16) {
    const shL = poseLandmarks[11];
    const shR = poseLandmarks[12];
    const elL = poseLandmarks[13];
    const elR = poseLandmarks[14];
    const wrL = poseLandmarks[15];
    const wrR = poseLandmarks[16];
    const midx = (shL.x + shR.x) / 2;
    const midy = (shL.y + shR.y) / 2;
    const sw = Math.hypot(shL.x - shR.x, shL.y - shR.y);
    if (sw > 1e-3) {
      feat[32] = (wrL.x - midx) / sw;
      feat[33] = (wrL.y - midy) / sw;
      feat[34] = (wrR.x - midx) / sw;
      feat[35] = (wrR.y - midy) / sw;
      feat[36] = (elL.x - midx) / sw;
      feat[37] = (elL.y - midy) / sw;
      feat[38] = (elR.x - midx) / sw;
      feat[39] = (elR.y - midy) / sw;
      feat[40] = 1;
      feat[41] = Math.hypot(wrL.x - wrR.x, wrL.y - wrR.y) / sw;
    }
  }
  return feat;
}
