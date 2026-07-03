/*
 * Ekstraksi fitur landmark tangan, harus identik dengan
 * scripts/extract_landmarks.py yang dipakai saat training.
 *
 * Vektor 130 dimensi:
 *   [0..62]   tangan kiri, 21 titik xyz relatif wrist, dinormalisasi
 *   [63..125] tangan kanan
 *   [126]     flag tangan kiri terdeteksi
 *   [127]     flag tangan kanan terdeteksi
 *   [128,129] delta x,y antar wrist (kanan - kiri)
 */

import type {
  HandLandmarkerResult,
  NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export const FEATURE_SIZE = 130;

type Point = { x: number; y: number; z: number };

function normalize(pts: Point[]): number[] | null {
  const wrist = pts[0];
  const rel = pts.map((p) => [p.x - wrist.x, p.y - wrist.y, p.z - wrist.z]);
  let scale = 0;
  for (const [x, y] of rel) {
    const d = Math.hypot(x, y);
    if (d > scale) scale = d;
  }
  if (scale < 1e-6) return null;
  return rel.flatMap(([x, y, z]) => [x / scale, y / scale, z / scale]);
}

/* MediaPipe kadang mendeteksi tangan fisik yang sama dua kali dengan label
 * Left dan Right sekaligus (titik landmark tampak bertumpuk). Deteksi ganda
 * dibuang bila kedua wrist terlalu berdekatan, sisakan yang skornya lebih
 * tinggi. */
const DUPLICATE_WRIST_DIST = 0.08;

export function pickHands(result: HandLandmarkerResult): {
  left: NormalizedLandmark[] | null;
  right: NormalizedLandmark[] | null;
} {
  const hands: Record<string, { pts: NormalizedLandmark[]; score: number }> =
    {};
  for (let i = 0; i < result.landmarks.length; i++) {
    const handedness = result.handedness[i]?.[0];
    if (!handedness) continue;
    const label = handedness.categoryName;
    if (!hands[label] || handedness.score > hands[label].score) {
      hands[label] = { pts: result.landmarks[i], score: handedness.score };
    }
  }
  const L = hands["Left"];
  const R = hands["Right"];
  if (L && R) {
    const d = Math.hypot(L.pts[0].x - R.pts[0].x, L.pts[0].y - R.pts[0].y);
    if (d < DUPLICATE_WRIST_DIST) {
      if (L.score >= R.score) return { left: L.pts, right: null };
      return { left: null, right: R.pts };
    }
  }
  return { left: L?.pts ?? null, right: R?.pts ?? null };
}

/* Kanonikalisasi satu tangan: bila hanya tangan kiri yang ada, cerminkan ke
 * slot kanan supaya huruf satu tangan punya representasi tunggal, tidak
 * tergantung tangan mana yang dipakai penutur. Transformasi yang sama
 * diterapkan saat training (scripts/train_alphabet.py). */
function mirrorInto(feat: Float32Array) {
  for (let i = 0; i < 21; i++) {
    feat[63 + i * 3] = -feat[i * 3];
    feat[63 + i * 3 + 1] = feat[i * 3 + 1];
    feat[63 + i * 3 + 2] = feat[i * 3 + 2];
  }
  feat.fill(0, 0, 63);
  feat[126] = 0;
  feat[127] = 1;
}

export function featuresFromResult(
  result: HandLandmarkerResult,
): Float32Array | null {
  const { left, right } = pickHands(result);
  if (!left && !right) return null;

  const feat = new Float32Array(FEATURE_SIZE);
  if (left) {
    const n = normalize(left);
    if (n) {
      feat.set(n, 0);
      feat[126] = 1;
    }
  }
  if (right) {
    const n = normalize(right);
    if (n) {
      feat.set(n, 63);
      feat[127] = 1;
    }
  }
  if (left && right) {
    feat[128] = right[0].x - left[0].x;
    feat[129] = right[0].y - left[0].y;
  } else if (feat[126] === 1 && feat[127] === 0) {
    mirrorInto(feat);
  }
  return feat;
}

export function handCount(result: HandLandmarkerResult): number {
  const { left, right } = pickHands(result);
  return (left ? 1 : 0) + (right ? 1 : 0);
}
