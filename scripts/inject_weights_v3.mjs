/*
 * Suntikkan bobot model kata v3 (fitur tangan + lengan, 84 dim dengan delta)
 * ke arsitektur TFJS, verifikasi pada set validasi yang sama, simpan ke
 * public/models/bisindo-words/ menimpa model lama.
 */

import fs from "node:fs";
import path from "node:path";
import * as tf from "@tensorflow/tfjs";

const WINDOW = 48;
const FEAT = 42;
const root = process.cwd();
const outDir = path.join(root, "public", "models", "bisindo-words");

const exp = JSON.parse(
  fs.readFileSync(path.join(root, "data", "words_weights_v3.json"), "utf8"),
);
const { words, weights, valAccuracy, valSigner } = exp;
console.log(`${words.length} kata, akurasi Python v3: ${(valAccuracy * 100).toFixed(2)}%`);

const model = tf.sequential({
  layers: [
    tf.layers.conv1d({
      inputShape: [WINDOW, FEAT * 2],
      filters: 96,
      kernelSize: 5,
      strides: 2,
      activation: "relu",
    }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.conv1d({ filters: 192, kernelSize: 3, strides: 2, activation: "relu" }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.conv1d({ filters: 192, kernelSize: 3, activation: "relu" }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.globalAveragePooling1d({}),
    tf.layers.dense({ units: 96, activation: "relu" }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: words.length, activation: "softmax" }),
  ],
});
model.setWeights(weights.map((w) => tf.tensor(w)));

const seqs = JSON.parse(
  fs.readFileSync(path.join(root, "data", "word_seqs_v2.json"), "utf8"),
);
const labels = [...new Set(seqs.map((s) => s.label))].sort(
  (a, b) => Number(a) - Number(b),
);
const labelIdx = new Map(labels.map((l, i) => [l, i]));

function resample(seq, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (seq.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(seq.length - 1, lo + 1);
    const a = t - lo;
    const row = new Array(FEAT);
    for (let f = 0; f < FEAT; f++) row[f] = seq[lo][f] * (1 - a) + seq[hi][f] * a;
    out.push(row);
  }
  return out;
}

function withDeltas(frames) {
  return frames.map((row, i) => {
    const prev = frames[Math.max(0, i - 1)];
    return [...row, ...row.map((v, f) => v - prev[f])];
  });
}

const xs = [];
const ys = [];
for (const s of seqs) {
  if (s.signer !== valSigner) continue;
  const arr = s.seq;
  if (arr.length < 8 || !arr.some((f) => f[30] > 0 || f[31] > 0)) continue;
  xs.push(withDeltas(resample(arr, WINDOW)));
  ys.push(labelIdx.get(s.label));
}
const preds = tf.tidy(() => model.predict(tf.tensor3d(xs)).argMax(-1).dataSync());
let ok = 0;
for (let i = 0; i < ys.length; i++) if (preds[i] === ys[i]) ok++;
const acc = ok / ys.length;
console.log(`Verifikasi TFJS: ${(acc * 100).toFixed(2)}% (${ok}/${ys.length})`);
if (Math.abs(acc - valAccuracy) > 0.02) throw new Error("Akurasi menyimpang");

fs.mkdirSync(outDir, { recursive: true });
await model.save(
  tf.io.withSaveHandler(async (artifacts) => {
    fs.writeFileSync(
      path.join(outDir, "weights.bin"),
      Buffer.from(artifacts.weightData),
    );
    fs.writeFileSync(
      path.join(outDir, "model.json"),
      JSON.stringify({
        modelTopology: artifacts.modelTopology,
        format: "layers-model",
        generatedBy: "python-tf-inject-v3",
        convertedBy: null,
        weightsManifest: [
          { paths: ["./weights.bin"], weights: artifacts.weightSpecs },
        ],
      }),
    );
    return {
      modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" },
    };
  }),
);
fs.writeFileSync(
  path.join(outDir, "metadata.json"),
  JSON.stringify(
    {
      words,
      window: WINDOW,
      featureSize: FEAT * 2,
      deltas: true,
      pose: true,
      valAccuracy: acc,
      valSigner,
      dataset: "kaggle:glennleonali/wl-bisindo (CC BY-NC 4.0)",
      trainedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(`Model v3 tersimpan di ${outDir}`);
