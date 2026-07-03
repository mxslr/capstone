"""Retrain model alfabet dengan data yang dibersihkan.

Perbaikan dari model pertama:
1. Huruf dua-tangan: sampel yang hanya berisi satu tangan dibuang (itu
   artefak deteksi, dan membuat model mau menebak huruf dua-tangan dari
   satu tangan saja).
2. Huruf satu-tangan: dikanonikalisasi ke slot kanan (cermin bila kiri),
   sama seperti inferensi di src/lib/hand-features.ts.
3. Augmentasi cermin untuk sampel dua-tangan.

Ekspor bobot ke data/alphabet_weights.json untuk inject_alphabet.mjs.
"""

import json
import os

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers

ROOT = os.path.join(os.path.dirname(__file__), "..")
EPOCHS = int(os.environ.get("EPOCHS", "150"))
TWO_HANDED_THRESHOLD = 0.7


def load(name):
    with open(os.path.join(ROOT, "data", name)) as f:
        d = json.load(f)
    return np.asarray(d["X"], dtype=np.float32), np.asarray(d["y"]), d["letters"]


X_train, y_train, letters = load("landmarks_train.json")
X_val, y_val, _ = load("landmarks_val.json")

# tentukan huruf dua-tangan dari statistik penggunaan kedua tangan di train
usage = {}
for li in range(26):
    rows = X_train[y_train == li]
    both = ((rows[:, 126] > 0.5) & (rows[:, 127] > 0.5)).mean()
    usage[li] = both
two_handed = {li for li, u in usage.items() if u >= TWO_HANDED_THRESHOLD * 0.6}
print("Huruf dua tangan:", "".join(letters[li] for li in sorted(two_handed)))


def mirror_full(rows):
    """Cermin penuh: tukar slot kiri-kanan dan negasikan x."""
    out = rows.copy()
    left = rows[:, 0:63].reshape(-1, 21, 3).copy()
    right = rows[:, 63:126].reshape(-1, 21, 3).copy()
    left[:, :, 0] *= -1
    right[:, :, 0] *= -1
    out[:, 0:63] = right.reshape(-1, 63)
    out[:, 63:126] = left.reshape(-1, 63)
    out[:, 126] = rows[:, 127]
    out[:, 127] = rows[:, 126]
    out[:, 128] = rows[:, 128]
    out[:, 129] = -rows[:, 129] * 0 + rows[:, 129]
    # delta wrist: dx tetap positif kanan-kiri setelah tukar+negasi
    out[:, 128] = rows[:, 128]
    return out


def canonicalize(rows):
    """Bila hanya kiri yang ada, cerminkan ke slot kanan (in-place copy)."""
    out = rows.copy()
    only_left = (rows[:, 126] > 0.5) & (rows[:, 127] < 0.5)
    if only_left.any():
        sel = rows[only_left, 0:63].reshape(-1, 21, 3).copy()
        sel[:, :, 0] *= -1
        out[only_left, 63:126] = sel.reshape(-1, 63)
        out[only_left, 0:63] = 0
        out[only_left, 126] = 0
        out[only_left, 127] = 1
    return out


def clean(X, y):
    keep = np.ones(len(X), dtype=bool)
    both = (X[:, 126] > 0.5) & (X[:, 127] > 0.5)
    for li in two_handed:
        keep &= ~((y == li) & ~both)
    return canonicalize(X[keep]), y[keep], int((~keep).sum())


Xc_train, yc_train, dropped_train = clean(X_train, y_train)
Xc_val, yc_val, dropped_val = clean(X_val, y_val)
print(f"Train {len(Xc_train)} (buang {dropped_train}), Val {len(Xc_val)} (buang {dropped_val})")

# augmentasi cermin untuk sampel dua tangan
both_mask = (Xc_train[:, 126] > 0.5) & (Xc_train[:, 127] > 0.5)
Xa = np.concatenate([Xc_train, mirror_full(Xc_train[both_mask])])
ya = np.concatenate([yc_train, yc_train[both_mask]])
print(f"Setelah augmentasi: {len(Xa)}")

model = tf.keras.Sequential(
    [
        layers.Input(shape=(130,)),
        layers.Dense(192, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(96, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(26, activation="softmax"),
    ]
)
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)
best_path = os.path.join(ROOT, "data", "best_alphabet.keras")
model.fit(
    Xa,
    ya,
    validation_data=(Xc_val, yc_val),
    epochs=EPOCHS,
    batch_size=64,
    shuffle=True,
    callbacks=[
        tf.keras.callbacks.ModelCheckpoint(
            best_path, monitor="val_accuracy", save_best_only=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor="val_accuracy", factor=0.5, patience=12, min_lr=1e-5
        ),
    ],
    verbose=0,
)
model = tf.keras.models.load_model(best_path)
_, val_acc = model.evaluate(Xc_val, yc_val, verbose=0)
print(f"Akurasi validasi: {val_acc * 100:.2f}%")

preds = model.predict(Xc_val, verbose=0).argmax(-1)
print("Per huruf:")
for li, letter in enumerate(letters):
    mask = yc_val == li
    if mask.any():
        acc = (preds[mask] == li).mean() * 100
        flag = " <== perhatikan" if acc < 90 else ""
        print(f"  {letter}: {acc:.0f}% ({(preds[mask] == li).sum()}/{mask.sum()}){flag}")

# konfusi khusus B dan Q
for a, b in [("B", "Q"), ("Q", "B")]:
    ai, bi = letters.index(a), letters.index(b)
    mask = yc_val == ai
    conf = int((preds[mask] == bi).sum())
    print(f"{a} tertebak {b}: {conf}/{int(mask.sum())}")

export = {
    "letters": letters,
    "valAccuracy": float(val_acc),
    "twoHanded": ["".join(letters[li]) for li in sorted(two_handed)],
    "weights": [w.tolist() for w in model.get_weights()],
}
with open(os.path.join(ROOT, "data", "alphabet_weights.json"), "w") as f:
    json.dump(export, f)
print("Bobot terekspor")
