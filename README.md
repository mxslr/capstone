# SAPA

SAPA adalah platform aksesibilitas BISINDO (Bahasa Isyarat Indonesia) yang
menggabungkan penerjemah komunikasi dua arah dengan sistem belajar berbasis
avatar. Sasarannya adalah Teman Tuli, penutur dengar di layanan publik, dan
pembelajar BISINDO baik mandiri maupun institusi.

Versi ini adalah tahap awal. Cakupan pengenalan dan peragaan dibatasi pada
alfabet dan kosakata dasar dari dataset publik, bukan penerjemah kalimat
bebas, dan materinya belum melalui validasi linguistik menyeluruh oleh
komunitas Tuli.

## Batasan yang dipegang

- SAPA memakai BISINDO, bukan SIBI. Tidak ada dataset atau referensi SIBI yang
  dipakai.
- Cakupan saat ini: 26 huruf alfabet dan 32 kosakata dasar. Kata di luar
  kosakata dieja huruf demi huruf.
- Inferensi kamera berjalan sepenuhnya di browser. Tidak ada frame video yang
  dikirim ke server, dan kamera hanya aktif setelah pengguna memberi
  persetujuan.
- Peragaan avatar adalah aproksimasi, bukan pengganti belajar dari penutur
  BISINDO langsung.

## Fitur

| Halaman | Isi | Cakupan |
| --- | --- | --- |
| `/latihan` | Practice Arena, latihan alfabet dengan kamera | 26 huruf |
| `/belajar` | Belajar alfabet dengan avatar pemandu | 26 huruf |
| `/belajar/kuis` | Kuis harian dengan spaced repetition (SM-2) | 26 huruf |
| `/terjemah` | Penerjemah dua arah, suara ke isyarat dan isyarat ke suara | 32 kata plus ejaan jari |
| `/latihan/roleplay` | Skenario percakapan tetap di apotek | Alur terbatas |
| `/institusi` | Dashboard progres pelatihan staf | Per perangkat |

Selain itu ada dua alat admin yang hanya berjalan di mesin pengembangan lokal:

- `/admin/pose` (Pose Studio): membentuk pose isyarat huruf.
- `/admin/clip` (Clip Studio): merekam ulang gerakan isyarat kata lewat webcam.

## Teknologi

- Next.js dan React dengan Tailwind CSS
- react-three-fiber dan Three.js untuk avatar
- MediaPipe Hand Landmarker dan Pose Landmarker untuk deteksi di browser
- Model klasifikasi ringan yang diekspor ke TensorFlow.js untuk inferensi
  on-device
- Web Speech API untuk konversi suara
- Supabase untuk basis data log latihan dan progres

## Menjalankan secara lokal

Prasyarat: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Aplikasi berjalan di `http://localhost:3000`.

Untuk fitur log latihan dan dashboard institusi, buat berkas `.env.local` dan
isi kredensial Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Perintah lain:

```bash
npm run build   # build produksi
npx vitest run  # menjalankan test
```

## Sumber data

Model dilatih dari dataset publik berikut:

- Alfabet: `achmadnoer/alfabet-bisindo` dan
  `agungmrf/indonesian-sign-language-bisindo` (Kaggle)
- Kata: `glennleonali/wl-bisindo` (Kaggle, CC BY-NC 4.0), 32 kata dari lima
  penutur wilayah Banten

Data mentah dan artefak training tidak disimpan di repositori karena besar dan
dapat dibuat ulang. Lihat `data/README.md` untuk cara regenerasi.

## Panduan tim: mengedit peragaan avatar

Peragaan avatar terbagi dua jenis, dan masing-masing punya alatnya sendiri.
Kedua alat hanya berfungsi saat aplikasi dijalankan lokal dengan `npm run dev`,
karena keduanya menulis berkas di repositori. Semua halaman pengguna membaca
berkas yang sama, jadi satu kali edit langsung berlaku konsisten di halaman
belajar, kuis, penerjemah, dan roleplay.

### 1. Pose huruf (statis) lewat Pose Studio

Untuk memperbaiki bentuk tangan sebuah huruf alfabet.

1. Jalankan `npm run dev`, buka `http://localhost:3000/admin/pose`.
2. Pilih huruf. Pose saat ini langsung dimuat ke editor dan tampil di avatar.
3. Sesuaikan:
   - Lipat tiap sendi jari dengan slider, atau pakai preset Lurus, Tekuk,
     Genggam per jari.
   - Atur orientasi tangan dengan slider arah jari dan putar telapak.
   - Geser posisi tangan dengan slider, atau seret langsung pada kanvas.
   - Centang atau lepas "Tangan ini dipakai" untuk mode satu atau dua tangan.
4. Klik Simpan pose. Perubahan ditulis ke `scripts/pose_overrides.json` dan
   pose diregenerasi otomatis.
5. Untuk membatalkan koreksi sebuah huruf, klik Reset ke pose data.

Acuan bentuk yang benar diambil dari foto dataset alfabet. Konvensi arah dan
catatan tiap koreksi ada di bagian atas berkas `scripts/pose_overrides.json`.

### 2. Gerakan kata (dinamis) lewat Clip Studio

Untuk memperbaiki gerakan sebuah isyarat kata. Klip bawaan dihasilkan otomatis
dari video dataset dan kualitasnya bervariasi, jadi merekam ulang dengan
gerakan yang benar akan meningkatkan akurasi peragaan.

1. Jalankan `npm run dev`, buka `http://localhost:3000/admin/clip`.
2. Pilih kata dari daftar.
3. Untuk sekadar menggeser letak klip yang sudah ada, klik Edit klip lama.
   Kamera tidak perlu dinyalakan.
4. Untuk merekam gerakan baru, klik Saya setuju, aktifkan kamera, lalu Rekam 4
   detik dan peragakan isyarat di depan kamera. Deteksi berjalan di perangkat,
   video tidak dikirim ke mana pun, hanya lintasan sendi yang disimpan.
5. Tinjau hasil di avatar. Atur letak dan skala gerakan tiap tangan dengan
   slider. Perubahan langsung terlihat di pratinjau.
6. Klik Simpan klip. Klip ditulis ke `public/clips/words.json` dan langsung
   dipakai penerjemah serta roleplay.

### Catatan penting untuk tim

- Selalu jalankan alat ini di lingkungan lokal, bukan di situs yang sudah
  ter-deploy. Di produksi berkas bersifat hanya-baca dan penyimpanan ditolak.
- Setelah selesai mengedit, commit berkas yang berubah
  (`scripts/pose_overrides.json`, `public/poses/alphabet.json`,
  `public/clips/words.json`) agar hasil edit ikut ter-deploy.
- Jangan mengubah huruf yang sudah dinyatakan benar tanpa alasan. Riwayat
  koreksi terdokumentasi di `scripts/pose_overrides.json`.

## Struktur proyek

```
src/app         Halaman dan route Next.js
src/components   Komponen React, termasuk avatar dan kedua studio
src/lib          Ekstraksi fitur, SRS, integrasi Supabase
scripts          Ekstraksi landmark, training model, pembangun pose dan klip
public/models    Model TensorFlow.js untuk inferensi di browser
public/poses     Pose huruf hasil Pose Studio
public/clips     Klip kata hasil Clip Studio
data             Data mentah dan artefak training (tidak di-commit)
```

## Status

Proyek dalam pengembangan. Materi isyarat belum melalui validasi linguistik
menyeluruh oleh komunitas Tuli dan sebaiknya dianggap sebagai versi awal.
