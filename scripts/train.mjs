/*
 * Latih klasifikasi alfabet BISINDO dari fitur landmark (130 dim) dengan
 * @tensorflow/tfjs murni di Node, lalu simpan sebagai model TFJS Layers
 * ke public/models/bisindo-alphabet/ untuk inferensi di browser.
 */

import fs from "node:fs";
import path from "node:path";
import * as tf from "@tensorflow/tfjs";

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1"));
const dataDir = path.join(root, "..", "data");
const outDir = path.join(root, "..", "public", "models", "bisindo-alphabet");

function load(name) {
  const { X, y, letters } = JSON.parse(
    fs.readFileSync(path.join(dataDir, name), "utf8"),
  );
  return {
    xs: tf.tensor2d(X),
    ys: tf.oneHot(tf.tensor1d(y, "int32"), 26),
    letters,
    n: X.length,
  };
}

const train = load("landmarks_train.json");
const val = load("landmarks_val.json");
console.log(`Train: ${train.n} sampel, Val: ${val.n} sampel`);

const model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [130], units: 128, activation: "relu" }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.dense({ units: 64, activation: "relu" }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 26, activation: "softmax" }),
  ],
});
model.compile({
  optimizer: tf.train.adam(1e-3),
  loss: "categoricalCrossentropy",
  metrics: ["accuracy"],
});

await model.fit(train.xs, train.ys, {
  epochs: 80,
  batchSize: 64,
  shuffle: true,
  validationData: [val.xs, val.ys],
  callbacks: {
    onEpochEnd: (epoch, logs) => {
      if ((epoch + 1) % 10 === 0) {
        console.log(
          `epoch ${epoch + 1}: loss=${logs.loss.toFixed(4)} acc=${logs.acc.toFixed(4)} val_acc=${logs.val_acc.toFixed(4)}`,
        );
      }
    },
  },
});

const evalRes = model.evaluate(val.xs, val.ys, { batchSize: 256 });
const valAcc = (await evalRes[1].data())[0];
console.log(`\nAkurasi validasi akhir: ${(valAcc * 100).toFixed(2)}%`);

// akurasi per huruf
const preds = model.predict(val.xs).argMax(-1);
const truth = val.ys.argMax(-1);
const predArr = await preds.data();
const truthArr = await truth.data();
const perLetter = Array.from({ length: 26 }, () => ({ ok: 0, total: 0 }));
for (let i = 0; i < predArr.length; i++) {
  perLetter[truthArr[i]].total++;
  if (predArr[i] === truthArr[i]) perLetter[truthArr[i]].ok++;
}
console.log("\nAkurasi per huruf (validasi):");
perLetter.forEach((s, i) => {
  const pct = s.total ? ((s.ok / s.total) * 100).toFixed(0) : "-";
  console.log(`  ${String.fromCharCode(65 + i)}: ${pct}% (${s.ok}/${s.total})`);
});

// simpan model TFJS layers-format tanpa converter
fs.mkdirSync(outDir, { recursive: true });
await model.save(
  tf.io.withSaveHandler(async (artifacts) => {
    const weightsBin = Buffer.from(artifacts.weightData);
    fs.writeFileSync(path.join(outDir, "weights.bin"), weightsBin);
    const modelJson = {
      modelTopology: artifacts.modelTopology,
      format: "layers-model",
      generatedBy: "tfjs-node-train",
      convertedBy: null,
      weightsManifest: [
        { paths: ["./weights.bin"], weights: artifacts.weightSpecs },
      ],
    };
    fs.writeFileSync(
      path.join(outDir, "model.json"),
      JSON.stringify(modelJson),
    );
    return { modelArtifactsInfo: { dateSaved: new Date(), modelTopologyType: "JSON" } };
  }),
);

fs.writeFileSync(
  path.join(outDir, "metadata.json"),
  JSON.stringify(
    {
      letters: train.letters,
      inputSize: 130,
      valAccuracy: valAcc,
      trainSamples: train.n,
      valSamples: val.n,
      datasets: [
        "kaggle:agungmrf/indonesian-sign-language-bisindo",
        "kaggle:achmadnoer/alfabet-bisindo",
      ],
      trainedAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);
console.log(`\nModel tersimpan di ${outDir}`);
