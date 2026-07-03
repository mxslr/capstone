import type { Metadata } from "next";
import Link from "next/link";
import {
  IconAvatar,
  IconBook,
  IconCamera,
  IconChart,
  IconMessage,
  IconMic,
  IconRepeat,
} from "@/components/icons";

export const metadata: Metadata = {
  title: "Fitur",
  description:
    "Fitur SAPA: Practice Arena alfabet BISINDO, avatar pemandu, penerjemah kosakata dasar dua arah, kuis harian, mode roleplay, dan dashboard institusi.",
};

const features = [
  {
    icon: IconCamera,
    status: "Tersedia, versi awal",
    href: "/latihan" as string | null,
    title: "AI Practice Arena",
    scope: "26 huruf alfabet",
    body: "Peragakan huruf di depan kamera dan dapatkan umpan balik langsung. Deteksi tangan dan klasifikasi berjalan di browser, video tidak dikirim ke server, dan kamera hanya aktif setelah kamu setuju.",
  },
  {
    icon: IconAvatar,
    status: "Tersedia, versi awal",
    href: "/belajar",
    title: "Belajar bersama avatar",
    scope: "Alfabet, lalu kosakata dasar",
    body: "Avatar 3D memperagakan tiap huruf dengan jelas, bisa diulang sesukamu. Modul disusun bertahap dari huruf ke kosakata sehari-hari.",
  },
  {
    icon: IconRepeat,
    status: "Tersedia, versi awal",
    href: "/belajar/kuis",
    title: "Kuis harian dengan spaced repetition",
    scope: "Berbasis riwayat latihanmu",
    body: "Setiap jawabanmu dicatat. Huruf dan kata yang sering keliru dijadwalkan muncul lebih cepat, yang sudah lancar diberi jeda lebih panjang.",
  },
  {
    icon: IconMic,
    status: "Tersedia, versi awal",
    href: "/terjemah",
    title: "Suara ke isyarat",
    scope: "32 kosakata dasar plus ejaan jari",
    body: "Ucapan diubah menjadi peragaan avatar. Kata yang belum ada di kosakata dieja huruf demi huruf dengan ejaan jari, jadi tidak ada kata yang hilang diam-diam.",
  },
  {
    icon: IconMessage,
    status: "Tersedia, versi awal",
    href: "/terjemah",
    title: "Isyarat ke suara",
    scope: "32 kosakata dasar",
    body: "Isyarat yang dikenali kamera dibacakan sebagai suara untuk lawan bicara yang belum memahami BISINDO.",
  },
  {
    icon: IconBook,
    status: "Tersedia, versi awal",
    href: "/latihan/roleplay",
    title: "Mode roleplay",
    scope: "Satu skenario awal, pendaftaran di apotek",
    body: "Latihan percakapan terarah dengan alur tanya jawab dari kosakata yang sudah kamu kuasai, untuk membangun percaya diri sebelum percakapan sungguhan.",
  },
  {
    icon: IconChart,
    status: "Tersedia, versi awal",
    href: "/institusi",
    title: "Dashboard institusi",
    scope: "Untuk pelatihan staf layanan publik",
    body: "Institusi bisa memantau progres pelatihan BISINDO stafnya, melihat modul yang selesai dan yang masih tertinggal.",
  },
];

export default function FiturPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        Fitur
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Apa yang bisa dilakukan SAPA
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
        Setiap fitur mencantumkan cakupannya secara jujur. SAPA belum menjadi
        penerjemah kalimat bebas, fokus kami adalah alfabet dan kosakata dasar
        yang dikerjakan dengan benar.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {features.map((f) => (
          <article
            key={f.title}
            className="flex flex-col rounded-lg border border-border p-5"
          >
            <div className="flex items-start justify-between">
              <f.icon className="text-accent" />
              <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted">
                {f.status}
              </span>
            </div>
            <h2 className="mt-3 text-base font-medium">{f.title}</h2>
            <p className="mt-0.5 text-xs font-medium text-accent">{f.scope}</p>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
              {f.body}
            </p>
            {f.href && (
              <Link
                href={f.href}
                className="mt-4 text-sm font-medium text-accent hover:text-accent-strong"
              >
                Coba sekarang
              </Link>
            )}
          </article>
        ))}
      </div>

      <div className="mt-12 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-base font-medium">Catatan cakupan</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Model pengenalan SAPA dilatih dari dataset publik BISINDO untuk
          alfabet dan kosakata dasar. Materi belum melalui validasi linguistik
          menyeluruh oleh komunitas Tuli, jadi anggap semua fitur sebagai versi
          awal yang sedang dikembangkan bersama masukan pengguna.
        </p>
      </div>
    </div>
  );
}
