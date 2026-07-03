/*
 * Bangun klip peragaan avatar per kata dari sekuens fitur WL-BISINDO.
 * Untuk tiap kata dipilih satu sampel terbaik (deteksi tangan paling
 * konsisten), lalu disimpan sebagai deretan frame curl + posisi wrist ke
 * public/clips/words.json untuk dimainkan SignPlayer.
 */

import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const outPath = path.join(process.cwd(), "public", "clips", "words.json");
const CLIP_FPS = 12;
const MAX_FRAMES = 42;

const seqs = JSON.parse(
  fs.readFileSync(path.join(dataDir, "word_seqs.json"), "utf8"),
);
const labelWords = JSON.parse(
  fs.readFileSync(path.join(dataDir, "word_labels.json"), "utf8"),
);

function score(seq) {
  // proporsi frame dengan tangan terdeteksi
  let n = 0;
  for (const f of seq) if (f[30] > 0 || f[31] > 0) n++;
  return seq.length ? n / seq.length : 0;
}

function resample(seq, n) {
  if (seq.length <= n) return seq;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(seq[Math.round((i / (n - 1)) * (seq.length - 1))]);
  }
  return out;
}

const byLabel = new Map();
for (const s of seqs) {
  if (!byLabel.has(s.label)) byLabel.set(s.label, []);
  byLabel.get(s.label).push(s);
}

const clips = {};
for (const [label, group] of byLabel) {
  const word = labelWords[label];
  if (!word) continue;
  const best = group.reduce((a, b) => (score(a.seq) >= score(b.seq) ? a : b));

  /* Pangkas frame tanpa tangan di awal/akhir (jeda sebelum/ sesudah isyarat)
   * dan isi celah deteksi di tengah dengan frame tangan terakhir, supaya
   * avatar tidak turun-naik saat deteksi sesaat hilang. */
  const hasHand = (f) => f[30] > 0.5 || f[31] > 0.5;
  let start = best.seq.findIndex(hasHand);
  let end = best.seq.length - 1;
  while (end > start && !hasHand(best.seq[end])) end--;
  if (start < 0) continue;
  const trimmed = best.seq.slice(start, end + 1);
  const filled = [];
  let lastWith = null;
  for (const f of trimmed) {
    if (hasHand(f)) {
      lastWith = f;
      filled.push(f);
    } else if (lastWith) {
      filled.push(lastWith);
    }
  }

  const sampled = resample(filled, MAX_FRAMES);

  /* Posisi wrist mentah adalah koordinat frame video (x,y relatif tengah).
   * Anchor dada penutur diasumsikan di y gambar ~0.58, jadi offset vertikal
   * = 0.08 - f[y]; nilai positif berarti tangan lebih tinggi dari dada
   * (misal isyarat makan di mulut). Di-clamp supaya IK tetap wajar. */
  const clamp = (v) => Math.max(-0.35, Math.min(0.4, v));
  const wristOf = (fx, fy) => [+clamp(fx).toFixed(3), +clamp(fy - 0.08).toFixed(3)];

  const frames = sampled.map((f) => {
    const leftPresent = f[30] > 0.5;
    const rightPresent = f[31] > 0.5;
    return {
      left: leftPresent ? f.slice(0, 15).map((v) => +v.toFixed(3)) : null,
      right: rightPresent ? f.slice(15, 30).map((v) => +v.toFixed(3)) : null,
      leftWrist: leftPresent ? wristOf(f[32], f[33]) : null,
      rightWrist: rightPresent ? wristOf(f[34], f[35]) : null,
    };
  });
  const twoHandedFrames = frames.filter((f) => f.left && f.right).length;
  clips[word] = {
    word,
    frames,
    fps: CLIP_FPS,
    twoHanded: twoHandedFrames / frames.length >= 0.4,
  };
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(clips));
console.log(
  `Tersimpan ${Object.keys(clips).length} klip kata: ${Object.keys(clips).join(", ")}`,
);
