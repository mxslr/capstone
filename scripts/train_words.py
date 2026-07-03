"""Latih model kata WL-BISINDO di TensorFlow Python (cepat), lalu ekspor
bobot ke JSON untuk disuntikkan ke arsitektur TFJS oleh inject_weights.mjs.

Pipeline identik dengan scripts/train_words.mjs dan notebook Kaggle:
fitur 48x36, split signer-independent, augmentasi mirror + jitter temporal.
"""

import json
import os

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers

WINDOW = 48
FEAT = 36
EPOCHS = int(os.environ.get("EPOCHS", "120"))
ROOT = os.path.join(os.path.dirname(__file__), "..")

with open(os.path.join(ROOT, "data", "word_seqs.json")) as f:
    seqs = json.load(f)
with open(os.path.join(ROOT, "data", "word_labels.json")) as f:
    WORD_LABELS = json.load(f)

labels = sorted({s["label"] for s in seqs}, key=int)
label_idx = {l: i for i, l in enumerate(labels)}
words = [WORD_LABELS.get(l, f"kata-{l}") for l in labels]
print(f"{len(seqs)} sekuens, {len(labels)} kelas")


def resample(seq, n=WINDOW):
    seq = np.asarray(seq, dtype=np.float32)
    idx = np.linspace(0, len(seq) - 1, n)
    lo = np.floor(idx).astype(int)
    hi = np.minimum(lo + 1, len(seq) - 1)
    a = (idx - lo)[:, None]
    return seq[lo] * (1 - a) + seq[hi] * a


def mirror(frames):
    g = frames.copy()
    g[:, 0:15], g[:, 15:30] = frames[:, 15:30].copy(), frames[:, 0:15].copy()
    g[:, 30], g[:, 31] = frames[:, 31].copy(), frames[:, 30].copy()
    g[:, 32] = -frames[:, 34]
    g[:, 33] = frames[:, 35]
    g[:, 34] = -frames[:, 32]
    g[:, 35] = frames[:, 33]
    return g


def jitter(seq, rng):
    n = len(seq)
    cs = int(n * rng.random() * 0.12)
    ce = int(n * rng.random() * 0.12)
    sliced = seq[cs : n - ce]
    return resample(sliced) if len(sliced) >= 8 else resample(seq)


rng = np.random.default_rng(42)
signers = sorted({s["signer"] for s in seqs})
val_signer = signers[-1]
print(f"Signer: {signers}, validasi: {val_signer} (signer-independent)")

x_train, y_train, x_val, y_val = [], [], [], []
skipped = 0
for s in seqs:
    arr = np.asarray(s["seq"], dtype=np.float32)
    if len(arr) < 8 or not ((arr[:, 30] > 0) | (arr[:, 31] > 0)).any():
        skipped += 1
        continue
    base = resample(arr)
    yi = label_idx[s["label"]]
    if s["signer"] == val_signer:
        x_val.append(base)
        y_val.append(yi)
    else:
        x_train += [base, mirror(base), jitter(arr, rng), jitter(arr, rng)]
        y_train += [yi] * 4

x_train = np.stack(x_train)
y_train = np.array(y_train)
x_val = np.stack(x_val)
y_val = np.array(y_val)
print(f"Train {x_train.shape}, Val {x_val.shape}, dilewati {skipped}")

model = tf.keras.Sequential(
    [
        layers.Input(shape=(WINDOW, FEAT)),
        layers.Conv1D(64, 5, strides=2, activation="relu"),
        layers.Dropout(0.3),
        layers.Conv1D(128, 3, strides=2, activation="relu"),
        layers.Dropout(0.3),
        layers.GlobalAveragePooling1D(),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(len(labels), activation="softmax"),
    ]
)
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)

best_path = os.path.join(ROOT, "data", "best_words.keras")
callbacks = [
    tf.keras.callbacks.ModelCheckpoint(
        best_path, monitor="val_accuracy", save_best_only=True, verbose=0
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_accuracy", factor=0.5, patience=10, min_lr=1e-5
    ),
]
model.fit(
    x_train,
    y_train,
    validation_data=(x_val, y_val),
    epochs=EPOCHS,
    batch_size=32,
    shuffle=True,
    callbacks=callbacks,
    verbose=2,
)

model = tf.keras.models.load_model(best_path)
val_loss, val_acc = model.evaluate(x_val, y_val, verbose=0)
print(f"\nAkurasi validasi terbaik (signer-independent): {val_acc * 100:.2f}%")

preds = model.predict(x_val, verbose=0).argmax(-1)
print("Akurasi per kata:")
for i, w in enumerate(words):
    mask = y_val == i
    if mask.any():
        ok = int((preds[mask] == i).sum())
        print(f"  {w}: {ok / mask.sum() * 100:.0f}% ({ok}/{int(mask.sum())})")

# ekspor bobot untuk disuntikkan ke tfjs (urutan = model.get_weights())
export = {
    "words": words,
    "valAccuracy": float(val_acc),
    "valSigner": val_signer,
    "weights": [w.tolist() for w in model.get_weights()],
}
out = os.path.join(ROOT, "data", "words_weights.json")
with open(out, "w") as f:
    json.dump(export, f)
print(f"Bobot terekspor ke {out}")
