# Data dan artefak training

Folder ini menyimpan data mentah dan hasil antara proses training. Sebagian
besar berkas di sini tidak di-commit karena besar dan dapat dibuat ulang. Yang
di-commit hanya `word_labels.json` (pemetaan label kata ke teks) dan berkas
ini.

Model siap pakai untuk aplikasi berada di `public/models`, bukan di sini.

## Berkas yang tidak di-commit

| Berkas | Isi | Cara membuat ulang |
| --- | --- | --- |
| `hand_landmarker.task` | Model MediaPipe tangan | Terunduh otomatis saat script ekstraksi berjalan |
| `pose_landmarker_lite.task` | Model MediaPipe pose | Terunduh otomatis saat ekstraksi v2 berjalan |
| `landmarks_train.json`, `landmarks_val.json` | Fitur landmark alfabet | `python scripts/extract_landmarks.py` |
| `word_seqs.json` | Fitur kata tanpa lengan | `python scripts/extract_word_features.py` |
| `word_seqs_v2.json` | Fitur kata dengan lengan | `python scripts/extract_word_features_v2.py` |
| `*_weights.json`, `best_*.keras` | Bobot dan checkpoint hasil training | Script training terkait |

## Prasyarat regenerasi

Dataset diunduh dari Kaggle memakai `kagglehub`:

```bash
pip install kagglehub mediapipe opencv-python tensorflow-cpu
```

Ekstraksi mengunduh dataset ke cache kagglehub lokal secara otomatis saat
script dijalankan.

## Alur melatih ulang model

Alfabet:

```bash
python scripts/extract_landmarks.py     # buat landmarks_*.json
python scripts/train_alphabet.py        # latih, ekspor alphabet_weights.json
node scripts/inject_alphabet.mjs        # suntik ke public/models/bisindo-alphabet
node scripts/build_poses.mjs            # bangun ulang pose huruf
```

Kata (versi dengan deteksi lengan yang sedang dipakai):

```bash
python scripts/extract_word_features_v2.py  # buat word_seqs_v2.json
python scripts/train_words_v3.py            # latih, ekspor words_weights_v3.json
node scripts/inject_weights_v3.mjs          # suntik ke public/models/bisindo-words
node scripts/build_word_clips.mjs           # bangun ulang klip kata bawaan
```

Ekstraksi fitur video memakan waktu cukup lama. Script ekstraksi kata menyimpan
checkpoint parsial secara berkala, sehingga proses yang terputus dapat
dilanjutkan tanpa mengulang dari awal.

Definisi fitur di script Python harus tetap identik dengan padanannya di
`src/lib` agar inferensi di browser konsisten dengan training. Perubahan pada
satu sisi wajib diikuti sisi lainnya.
