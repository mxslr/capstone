"""Ekstraksi fitur v2 (dengan lengan) dari video WL-BISINDO.

42 dimensi per frame, harus identik dengan wordFrameFeaturesV2 di
src/lib/word-features.ts:
  [0..14]  curl 5 jari x 3 sendi tangan kiri
  [15..29] curl tangan kanan
  [30,31]  flag tangan kiri, kanan (hand landmarker)
  [32,33]  wrist kiri (pose) relatif tengah bahu / lebar bahu
  [34,35]  wrist kanan
  [36,37]  siku kiri relatif tengah bahu / lebar bahu
  [38,39]  siku kanan
  [40]     flag pose terdeteksi
  [41]     jarak antar wrist / lebar bahu

Checkpoint parsial tiap 50 video ke data/word_seqs_v2.partial.json.
Keluaran: data/word_seqs_v2.json
"""

import json
import math
import os
import re
import urllib.request

import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

HOME = os.path.expanduser("~")
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
HAND_MODEL = os.path.join(OUT_DIR, "hand_landmarker.task")
POSE_MODEL = os.path.join(OUT_DIR, "pose_landmarker_lite.task")
POSE_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_lite/float16/latest/pose_landmarker_lite.task"
)
TARGET_FPS = 15
FEAT = 42

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


def frame_features(hand_result, pose_result, last_pose):
    feat = np.zeros(FEAT, dtype=np.float32)
    hands = {}
    for lms, handed in zip(hand_result.hand_landmarks, hand_result.handedness):
        label, score = handed[0].category_name, handed[0].score
        if label not in hands or score > hands[label][1]:
            pts = np.array([[p.x, p.y, p.z] for p in lms], dtype=np.float32)
            hands[label] = (pts, score)
    if "Left" in hands:
        feat[0:15] = curls(hands["Left"][0])
        feat[30] = 1
    if "Right" in hands:
        feat[15:30] = curls(hands["Right"][0])
        feat[31] = 1

    pose = None
    if pose_result.pose_landmarks:
        pose = pose_result.pose_landmarks[0]
        last_pose[0] = pose
    elif last_pose[0] is not None:
        pose = last_pose[0]

    if pose is not None:
        shL, shR = pose[11], pose[12]
        elL, elR = pose[13], pose[14]
        wrL, wrR = pose[15], pose[16]
        midx, midy = (shL.x + shR.x) / 2, (shL.y + shR.y) / 2
        sw = math.hypot(shL.x - shR.x, shL.y - shR.y)
        if sw > 1e-3:
            def rel(p):
                return (p.x - midx) / sw, (p.y - midy) / sw

            feat[32], feat[33] = rel(wrL)
            feat[34], feat[35] = rel(wrR)
            feat[36], feat[37] = rel(elL)
            feat[38], feat[39] = rel(elR)
            feat[40] = 1
            feat[41] = math.hypot(wrL.x - wrR.x, wrL.y - wrR.y) / sw
    return feat


def main():
    if not os.path.exists(POSE_MODEL):
        print("Mengunduh pose_landmarker_lite.task ...", flush=True)
        urllib.request.urlretrieve(POSE_URL, POSE_MODEL)

    root = find_dataset_root()
    videos = []
    for dirpath, _, files in os.walk(root):
        for f in files:
            if f.endswith(".mp4"):
                videos.append(os.path.join(dirpath, f))
    videos.sort()
    print(f"{len(videos)} video", flush=True)

    hand_opts = vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=HAND_MODEL),
        num_hands=2,
        min_hand_detection_confidence=0.3,
        running_mode=vision.RunningMode.VIDEO,
    )
    pose_opts = vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path=POSE_MODEL),
        running_mode=vision.RunningMode.VIDEO,
    )

    ckpt_path = os.path.join(OUT_DIR, "word_seqs_v2.partial.json")
    out = []
    done = set()
    if os.path.exists(ckpt_path):
        with open(ckpt_path) as f:
            out = json.load(f)
        done = {o["file"] for o in out}
        print(f"Checkpoint: {len(out)} sekuens, dilanjutkan", flush=True)

    pat = re.compile(r"signer(\d+)_label(\d+)_sample(\d+)\.mp4$")
    for vi, path in enumerate(videos):
        fname = os.path.basename(path)
        if fname in done:
            continue
        m = pat.search(fname)
        if not m:
            continue
        hand_det = vision.HandLandmarker.create_from_options(hand_opts)
        pose_det = vision.PoseLandmarker.create_from_options(pose_opts)
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        step = max(1, round(fps / TARGET_FPS))
        seq, idx, ts = [], 0, 0
        last_pose = [None]
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
                hr = hand_det.detect_for_video(mp_img, ts)
                pr = pose_det.detect_for_video(mp_img, ts)
                seq.append(frame_features(hr, pr, last_pose).tolist())
            idx += 1
        cap.release()
        hand_det.close()
        pose_det.close()
        out.append({
            "signer": m.group(1),
            "label": m.group(2),
            "sample": m.group(3),
            "fps": TARGET_FPS,
            "seq": seq,
            "file": fname,
        })
        if (vi + 1) % 50 == 0:
            print(f"{vi + 1}/{len(videos)}", flush=True)
            tmp = ckpt_path + ".tmp"
            with open(tmp, "w") as f:
                json.dump(out, f)
            os.replace(tmp, ckpt_path)

    with open(os.path.join(OUT_DIR, "word_seqs_v2.json"), "w") as f:
        json.dump(out, f)
    if os.path.exists(ckpt_path):
        os.remove(ckpt_path)
    print("Selesai:", len(out), "sekuens", flush=True)


if __name__ == "__main__":
    main()
