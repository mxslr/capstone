"""Ekstrak fitur sekuens dari video WL-BISINDO untuk model kata-level.

Keluaran:
  data/word_seqs.json: per video, sekuens fitur 36-dim per frame
    (curl 15 kiri + 15 kanan + 2 flag + 4 posisi wrist), fps efektif,
    signer id, label kata.
  Definisi fitur harus identik dengan src/lib/word-features.ts.
"""

import json
import math
import os
import re
import sys

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

HOME = os.path.expanduser("~")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
MODEL_PATH = os.path.join(OUT_DIR, "hand_landmarker.task")
TARGET_FPS = 15

CHAINS = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]


def find_dataset_root():
    base = os.path.join(HOME, ".cache", "kagglehub", "datasets", "glennleonali", "wl-bisindo", "versions")
    for v in sorted(os.listdir(base)):
        root = os.path.join(base, v)
        for dirpath, _, files in os.walk(root):
            if any(f.endswith(".mp4") for f in files):
                return root
    raise SystemExit("dataset belum ada")


def curls(pts):
    out = []
    for chain in CHAINS:
        joints = [pts[0]] + [pts[i] for i in chain]
        for j in range(1, 4):
            v1 = joints[j] - joints[j - 1]
            v2 = joints[j + 1] - joints[j]
            d1, d2 = np.linalg.norm(v1), np.linalg.norm(v2)
            if d1 < 1e-6 or d2 < 1e-6:
                out.append(0.0)
            else:
                c = float(np.dot(v1, v2) / (d1 * d2))
                out.append(math.acos(max(-1.0, min(1.0, c))))
    return out


def frame_features(result):
    feat = np.zeros(36, dtype=np.float32)
    hands = {}
    for lms, handed in zip(result.hand_landmarks, result.handedness):
        label = handed[0].category_name
        score = handed[0].score
        if label not in hands or score > hands[label][1]:
            pts = np.array([[p.x, p.y, p.z] for p in lms], dtype=np.float32)
            hands[label] = (pts, score)
    if "Left" in hands:
        pts = hands["Left"][0]
        feat[0:15] = curls(pts)
        feat[30] = 1
        feat[32] = pts[0][0] - 0.5
        feat[33] = pts[0][1] - 0.5
    if "Right" in hands:
        pts = hands["Right"][0]
        feat[15:30] = curls(pts)
        feat[31] = 1
        feat[34] = pts[0][0] - 0.5
        feat[35] = pts[0][1] - 0.5
    return feat


def main():
    root = find_dataset_root()
    print("Dataset:", root, flush=True)

    videos = []
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.endswith(".mp4"):
                videos.append(os.path.join(dirpath, f))
    videos.sort()
    print(f"{len(videos)} video", flush=True)

    base = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
    opts = vision.HandLandmarkerOptions(
        base_options=base,
        num_hands=2,
        min_hand_detection_confidence=0.3,
        running_mode=vision.RunningMode.VIDEO,
    )

    # checkpoint: lanjutkan dari hasil parsial bila run sebelumnya terputus
    ckpt_path = os.path.join(OUT_DIR, "word_seqs.partial.json")
    out = []
    done_files = set()
    if os.path.exists(ckpt_path):
        with open(ckpt_path) as f:
            out = json.load(f)
        done_files = {o["file"] for o in out}
        print(f"Checkpoint ditemukan: {len(out)} sekuens, dilanjutkan", flush=True)

    pat = re.compile(r"signer(\d+)_label(\d+)_sample(\d+)\.mp4$")
    for vi, path in enumerate(videos):
        if os.path.basename(path) in done_files:
            continue
        m = pat.search(os.path.basename(path))
        if not m:
            # coba format lain: folder = label
            signer, label, sample = "0", os.path.basename(os.path.dirname(path)), "0"
        else:
            signer, label, sample = m.group(1), m.group(2), m.group(3)

        detector = vision.HandLandmarker.create_from_options(opts)
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        step = max(1, round(fps / TARGET_FPS))
        seq = []
        idx = 0
        ts = 0
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            if idx % step == 0:
                h, w = frame.shape[:2]
                if max(h, w) > 480:
                    s = 480 / max(h, w)
                    frame = cv2.resize(frame, (int(w * s), int(h * s)))
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
                ts += int(1000 / TARGET_FPS)
                result = detector.detect_for_video(mp_img, ts)
                seq.append(frame_features(result).tolist())
            idx += 1
        cap.release()
        detector.close()
        out.append({
            "signer": signer,
            "label": label,
            "sample": sample,
            "fps": TARGET_FPS,
            "seq": seq,
            "file": os.path.basename(path),
        })
        if (vi + 1) % 50 == 0:
            print(f"{vi + 1}/{len(videos)}", flush=True)
            # simpan checkpoint supaya run yang terputus tidak mengulang dari nol
            tmp = ckpt_path + ".tmp"
            with open(tmp, "w") as f:
                json.dump(out, f)
            os.replace(tmp, ckpt_path)

    with open(os.path.join(OUT_DIR, "word_seqs.json"), "w") as f:
        json.dump(out, f)
    if os.path.exists(ckpt_path):
        os.remove(ckpt_path)
    print("Selesai:", len(out), "sekuens", flush=True)


if __name__ == "__main__":
    main()
