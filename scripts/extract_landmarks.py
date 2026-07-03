"""Ekstrak landmark tangan MediaPipe dari dataset alfabet BISINDO.

Sumber:
  - agungmrf/indonesian-sign-language-bisindo (train/val, ~440 gambar per huruf)
  - achmadnoer/alfabet-bisindo (12 gambar per huruf, ditambahkan ke train)

Keluaran: data/landmarks_train.json dan data/landmarks_val.json berisi
vektor fitur 130 dimensi per gambar:
  [tangan_kiri 21*3 relatif wrist ternormalisasi,
   tangan_kanan 21*3,
   flag_kiri, flag_kanan,
   dx, dy antar wrist ternormalisasi]
"""

import json
import os
import sys
import urllib.request

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

HOME = os.path.expanduser("~")
DS_MAIN = os.path.join(
    HOME, ".cache", "kagglehub", "datasets", "agungmrf",
    "indonesian-sign-language-bisindo", "versions", "1", "bisindo", "images",
)
DS_SMALL = os.path.join(
    HOME, ".cache", "kagglehub", "datasets", "achmadnoer",
    "alfabet-bisindo", "versions", "2", "Citra BISINDO",
)
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODEL_PATH = os.path.join(OUT_DIR, "hand_landmarker.task")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/"
    "hand_landmarker/float16/latest/hand_landmarker.task"
)

LETTERS = [chr(ord("A") + i) for i in range(26)]


def ensure_model():
    os.makedirs(OUT_DIR, exist_ok=True)
    if not os.path.exists(MODEL_PATH):
        print("Mengunduh hand_landmarker.task ...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)


def make_detector():
    base = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    opts = vision.HandLandmarkerOptions(
        base_options=base,
        num_hands=2,
        min_hand_detection_confidence=0.3,
        running_mode=vision.RunningMode.IMAGE,
    )
    return vision.HandLandmarker.create_from_options(opts)


def features_from_result(result):
    """130-dim: kiri(63) + kanan(63) + flags(2) + delta wrist(2)."""
    hands = {}
    for lms, handedness in zip(result.hand_landmarks, result.handedness):
        label = handedness[0].category_name  # "Left"/"Right" dari sudut pandang gambar
        pts = np.array([[p.x, p.y, p.z] for p in lms], dtype=np.float32)
        # sebuah label bisa dobel, simpan yang confidence tertinggi saja
        score = handedness[0].score
        if label not in hands or score > hands[label][1]:
            hands[label] = (pts, score)

    def norm(pts):
        rel = pts - pts[0]
        scale = np.max(np.linalg.norm(rel[:, :2], axis=1))
        if scale < 1e-6:
            return None
        return rel / scale

    left = hands.get("Left", (None, 0))[0]
    right = hands.get("Right", (None, 0))[0]
    if left is None and right is None:
        return None

    feat = np.zeros(130, dtype=np.float32)
    if left is not None:
        n = norm(left)
        if n is not None:
            feat[0:63] = n.flatten()
            feat[126] = 1.0
    if right is not None:
        n = norm(right)
        if n is not None:
            feat[63:126] = n.flatten()
            feat[127] = 1.0
    if left is not None and right is not None:
        feat[128] = right[0][0] - left[0][0]
        feat[129] = right[0][1] - left[0][1]
    return feat


def process_split(detector, roots, out_path):
    X, y, skipped = [], [], 0
    for letter_idx, letter in enumerate(LETTERS):
        count = 0
        for root in roots:
            d = os.path.join(root, letter)
            if not os.path.isdir(d):
                continue
            for fname in sorted(os.listdir(d)):
                img = cv2.imread(os.path.join(d, fname))
                if img is None:
                    skipped += 1
                    continue
                # kecilkan supaya cepat, landmark tetap relatif
                h, w = img.shape[:2]
                if max(h, w) > 640:
                    s = 640 / max(h, w)
                    img = cv2.resize(img, (int(w * s), int(h * s)))
                rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                result = detector.detect(mp_img)
                feat = features_from_result(result)
                if feat is None:
                    skipped += 1
                    continue
                X.append(feat.tolist())
                y.append(letter_idx)
                count += 1
        print(f"{letter}: {count} sampel", flush=True)
    with open(out_path, "w") as f:
        json.dump({"X": X, "y": y, "letters": LETTERS}, f)
    print(f"Tersimpan {len(X)} sampel ke {out_path}, dilewati {skipped}")


def main():
    ensure_model()
    detector = make_detector()
    split = sys.argv[1] if len(sys.argv) > 1 else "all"
    if split in ("train", "all"):
        process_split(
            detector,
            [os.path.join(DS_MAIN, "train"), DS_SMALL],
            os.path.join(OUT_DIR, "landmarks_train.json"),
        )
    if split in ("val", "all"):
        process_split(
            detector,
            [os.path.join(DS_MAIN, "val")],
            os.path.join(OUT_DIR, "landmarks_val.json"),
        )


if __name__ == "__main__":
    main()
