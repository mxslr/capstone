/*
 * Suntikkan bobot model alfabet hasil training Python ke arsitektur TFJS,
 * verifikasi pada set validasi (dengan pembersihan dan kanonikalisasi yang
 * sama), lalu simpan ke public/models/bisindo-alphabet/.
 */

import fs from "node:fs";
import path from "node:path";
import * as tf from "@tensorflow/tfjs";

const root = process.cwd();
const outDir = path.join(root, "public", "models", "bisindo-alphabet");

const exp = JSON.parse(
  fs.readFileSync(path.join(root, "data", "alphabet_weights.json"), "utf8"),
);
const { letters, weights, valAccuracy, twoHanded } = exp;
console.log(`Akurasi Python: ${(valAccuracy * 100).toFixed(2)}%, dua tangan: ${twoHanded.join("")}`);

const model = tf.sequential({
  layers: [
    tf.layers.dense({ inputShape: [130], units: 192, activation: "relu" }),
    tf.layers.dropout({ rate: 0.3 }),
    tf.layers.dense({ units: 96, activation: "relu" }),
    tf.layers.dropout({ rate: 0.2 }),
    tf.layers.dense({ units: 26, activation: "softmax" }),
  ],
});
model.setWeights(weights.map((w) => tf.tensor(w)));

// verifikasi dengan transformasi yang sama seperti training
const val = JSON.parse(
  fs.readFileSync(path.join(root, "data", "landmarks_val.json"), "utf8"),
);
const twoSet = new Set(twoHanded.map((l) => letters.indexOf(l)));

function canonicalize(row) {
  const f = [...row];
  const onlyLeft = f[126] > 0.5 && f[127] < 0.5;
  if (onlyLeft) {
    for (let i = 0; i < 21; i++) {
      f[63 + i * 3] = -f[i * 3];
      f[63 + i * 3 + 1] = f[i * 3 + 1];
      f[63 + i * 3 + 2] = f[i * 3 + 2];
    }
    for (let i = 0; i < 63; i++) f[i] = 0;
    f[126] = 0;
    f[127] = 1;
  }
  return f;
}

const xs = [];
const ys = [];
for (let i = 0; i < val.X.length; i++) {
  const row = val.X[i];
  const both = row[126] > 0.5 && row[127] > 0.5;
  if (twoSet.has(val.y[i]) && !both) continue;
  xs.push(canonicalize(row));
  ys.push(val.y[i]);
}
const preds = tf.tidy(() => model.predict(tf.tensor2d(xs)).argMax(-1).dataSync());
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
        generatedBy: "python-tf-inject",
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
      letters,
      inputSize: 130,
      valAccuracy: acc,
      twoHanded,
      canonicalized: true,
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
console.log(`Model tersimpan di ${outDir}`);
