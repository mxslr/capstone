/*
 * Latih model pengenalan kata WL-BISINDO dari sekuens fitur landmark.
 * Input [48 frame x 36 fitur], model Conv1D kecil, disimpan sebagai
 * TFJS Layers ke public/models/bisindo-words/.
 * Split signer-independent: satu signer disisihkan untuk validasi.
 */

import fs from "node:fs";
import path from "node:path";
import * as tf from "@tensorflow/tfjs";

const WINDOW = 48;
const FEAT = 36;
const dataDir = path.join(process.cwd(), "data");
const outDir = path.join(process.cwd(), "public", "models", "bisindo-words");

const seqs = JSON.parse(
  fs.readFileSync(path.join(dataDir, "word_seqs.json"), "utf8"),
);
const labelWords = JSON.parse(
  fs.readFileSync(path.join(dataDir, "word_labels.json"), "utf8"),
);

const labels = [...new Set(seqs.map((s) => s.label))].sort(
  (a, b) => Number(a) - Number(b),
);
const labelIdx = new Map(labels.map((l, i) => [l, i]));
const words = labels.map((l) => labelWords[l] ?? `kata-${l}`);
console.log(`${seqs.length} sekuens, ${labels.length} kelas`);

function resample(seq, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (seq.length - 1);
    const lo = Math.floor(t);
    const hi = Math.min(seq.length - 1, lo + 1);
    const a = t - lo;
    const row = new Array(FEAT);
    for (let f = 0; f < FEAT; f++) {
      row[f] = seq[lo][f] * (1 - a) + seq[hi][f] * a;
    }
    out.push(row);
  }
  return out;
}

function mirror(frames) {
  // tukar tangan kiri-kanan dan balik sumbu x wrist
  return frames.map((f) => {
    const g = new Array(FEAT).fill(0);
    for (let i = 0; i < 15; i++) {
      g[i] = f[15 + i];
      g[15 + i] = f[i];
    }
    g[30] = f[31];
    g[31] = f[30];
    g[32] = -f[34];
    g[33] = f[35];
    g[34] = -f[32];
    g[35] = f[33];
    return g;
  });
}

function jitter(frames) {
  // pangkas acak 0-12% dari awal/akhir lalu resample lagi
  const cutStart = Math.floor(frames.length * Math.random() * 0.12);
  const cutEnd = Math.floor(frames.length * Math.random() * 0.12);
  const sliced = frames.slice(cutStart, frames.length - cutEnd);
  return sliced.length >= 8 ? resample(sliced, WINDOW) : frames;
}

const signers = [...new Set(seqs.map((s) => s.signer))].sort();
const valSigner = signers[signers.length - 1];
console.log(`Signer: ${signers.join(", ")}, validasi: ${valSigner}`);

const train = { x: [], y: [] };
const val = { x: [], y: [] };
let skipped = 0;
for (const s of seqs) {
  const hasHands = s.seq.some((f) => f[30] > 0 || f[31] > 0);
  if (!hasHands || s.seq.length < 8) {
    skipped++;
    continue;
  }
  const base = resample(s.seq, WINDOW);
  const yi = labelIdx.get(s.label);
  if (s.signer === valSigner) {
    val.x.push(base);
    val.y.push(yi);
  } else {
    train.x.push(base);
    train.y.push(yi);
    train.x.push(mirror(base));
    train.y.push(yi);
    train.x.push(jitter(base));
    train.y.push(yi);
  }
}
console.log(
  `Train ${train.x.length} (dengan augmentasi), Val ${val.x.length}, dilewati ${skipped}`,
);

const xTrain = tf.tensor3d(train.x);
const yTrain = tf.oneHot(tf.tensor1d(train.y, "int32"), labels.length);
const xVal = tf.tensor3d(val.x);
const yVal = tf.oneHot(tf.tensor1d(val.y, "int32"), labels.length);

/* Checkpoint berkala: simpan bobot tiap CKPT_EVERY epoch ke folder
 * checkpoint, dan lanjutkan dari sana bila run sebelumnya terputus. */
const CKPT_EVERY = 5;
const ckptDir = path.join(outDir, "checkpoint");

function saveHandlerTo(dir, extraMeta = {}) {
  return tf.io.withSaveHandler(async (artifacts) => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "weights.bin"),
      Buffer.from(artifacts.weightData),
    );
    fs.writeFileSync(
      path.join(dir, "model.json"),
      JSON.stringify({
        modelTopology: artifacts.modelTopology,
        format: "layers-model",
        generatedBy: "tfjs-node-train",
        convertedBy: null,
        weightsManifest: [
          { paths: ["./weights.bin"], weights: artifacts.weightSpecs },
        ],
      }),
    );
    if (Object.keys(extraMeta).length) {
      fs.writeFileSync(
        path.join(dir, "state.json"),
        JSON.stringify(extraMeta),
      );
    }
    return {
      modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" },
    };
  });
}

async function loadCheckpoint() {
  const mj = path.join(ckptDir, "model.json");
  const st = path.join(ckptDir, "state.json");
  if (!fs.existsSync(mj) || !fs.existsSync(st)) return null;
  const state = JSON.parse(fs.readFileSync(st, "utf8"));
  const modelJson = JSON.parse(fs.readFileSync(mj, "utf8"));
  const weights = fs.readFileSync(path.join(ckptDir, "weights.bin"));
  const m = await tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: modelJson.modelTopology,
      weightSpecs: modelJson.weightsManifest[0].weights,
      weightData: new Uint8Array(weights).buffer,
    }),
  );
  console.log(`Checkpoint ditemukan di epoch ${state.epoch}, dilanjutkan`);
  return { model: m, doneEpochs: state.epoch };
}

const resumed = await loadCheckpoint();

const model = resumed?.model ?? tf.sequential({
  layers: [
    tf.layers.conv1d({
      inputShape: [WINDOW, FEAT],
      filters: 64,
      kernelSize: 5,
      strides: 2,
      activation: "relu",
    }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.conv1d({ filters: 128, kernelSize: 3, strides: 2, activation: "relu" }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.globalAveragePooling1d({}),
    tf.layers.dense({ units: 64, activation: "relu" }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: labels.length, activation: "softmax" }),
  ],
});
model.compile({
  optimizer: tf.train.adam(1e-3),
  loss: "categoricalCrossentropy",
  metrics: ["accuracy"],
});

const TOTAL_EPOCHS = Number(process.env.EPOCHS ?? 60);
const startEpoch = resumed?.doneEpochs ?? 0;
await model.fit(xTrain, yTrain, {
  epochs: TOTAL_EPOCHS - startEpoch,
  batchSize: 32,
  shuffle: true,
  validationData: [xVal, yVal],
  callbacks: {
    onEpochEnd: async (e, logs) => {
      const epoch = startEpoch + e + 1;
      if (epoch % 1 === 0)
        console.log(
          `epoch ${epoch}: loss=${logs.loss.toFixed(3)} acc=${logs.acc.toFixed(3)} val_acc=${logs.val_acc.toFixed(3)}`,
        );
      if (epoch % CKPT_EVERY === 0 && epoch < TOTAL_EPOCHS) {
        await model.save(saveHandlerTo(ckptDir, { epoch, valAcc: logs.val_acc }));
      }
    },
  },
});

const evalRes = model.evaluate(xVal, yVal, { batchSize: 128 });
const valAcc = (await evalRes[1].data())[0];
console.log(`\nAkurasi validasi signer-independent: ${(valAcc * 100).toFixed(2)}%`);

// akurasi per kata
const preds = model.predict(xVal).argMax(-1);
const predArr = await preds.data();
const per = words.map(() => ({ ok: 0, total: 0 }));
val.y.forEach((yi, i) => {
  per[yi].total++;
  if (predArr[i] === yi) per[yi].ok++;
});
console.log("Akurasi per kata (validasi):");
per.forEach((s, i) => {
  if (s.total)
    console.log(`  ${words[i]}: ${((s.ok / s.total) * 100).toFixed(0)}% (${s.ok}/${s.total})`);
});

fs.mkdirSync(outDir, { recursive: true });
await model.save(saveHandlerTo(outDir));
// checkpoint tidak diperlukan lagi setelah model final tersimpan
fs.rmSync(ckptDir, { recursive: true, force: true });
fs.writeFileSync(
  path.join(outDir, "metadata.json"),
  JSON.stringify(
    {
      words,
      window: WINDOW,
      featureSize: FEAT,
      valAccuracy: valAcc,
      valSigner,
      dataset: "kaggle:glennleonali/wl-bisindo (CC BY-NC 4.0)",
      trainedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(`Model tersimpan di ${outDir}`);
