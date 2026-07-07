# SAPA Redesign + Auth

Tanggal: 2026-07-07. Status: disetujui user.

## Tujuan

Restyle seluruh tampilan SAPA ke tema cyan muda profesional dan menambah autentikasi (Google + email/password) dengan setting akun dan reset password OTP. Logika ML, avatar, dan kamera tidak diubah.

## Sistem visual

- Background putih polos. Palet cyan: `--accent #0E7490` (tombol, link), `--accent-bright #22D3EE` (highlight), `--accent-soft #ECFEFF` (latar section).
- Larangan keras: em dash, emoji, border neon, aksen border-kiri, pill berlebihan, copy bertele-tele, kalimat "tahap pengembangan".
- Icon: lucide-react, tanpa border/lingkaran pembungkus.
- Animasi: hover tombol/kartu, dropdown header bertransisi, reveal saat scroll di landing. Hormati `prefers-reduced-motion`.
- Logo: simbol gelombang sapaan (SVG kustom, gradasi cyan) di header, footer, halaman auth, favicon.
- Uji 375px. Cakupan jujur: alfabet + 32 kosakata.

## Auth (Supabase Auth)

- Halaman baru: `/masuk`, `/daftar`, `/lupa-password` (OTP 6 digit via email, verifikasi `verifyOtp type=recovery`, set password baru), `/akun` (profil, ganti password, logout).
- Login Google OAuth + email/password. Avatar: foto Google bila ada, selain itu icon orang abu generik (bukan inisial).
- Gate `/belajar`, `/latihan`, `/terjemah` via middleware Next.js. Publik: `/`, `/fitur`, `/tentang`, `/institusi`, halaman auth.
- Skema: kolom `user_id` di `practice_logs` dan `srs_state` + RLS.
- Konfigurasi manual dashboard Supabase (di luar kode): aktifkan provider Google, ubah template email recovery agar memuat `{{ .Token }}`.

## Cakupan restyle

Landing, /fitur, /tentang, /belajar, /belajar/kuis, /latihan, /latihan/roleplay, /terjemah, /institusi, header, footer. Halaman /admin tidak disentuh.

## Urutan implementasi

1. Design system (globals.css) + lucide-react + logo + favicon.
2. Header (dropdown animasi) + footer.
3. Restyle semua halaman publik dan fitur.
4. Supabase Auth: skema + RLS, halaman auth, middleware, /akun.
5. Verifikasi via dev server, uji 375px, build.
