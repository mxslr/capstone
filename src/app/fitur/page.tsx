import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Camera,
  MessagesSquare,
  Mic,
  PersonStanding,
  Volume2,
} from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Fitur",
  description:
    "Practice Arena alfabet BISINDO, avatar pemandu, penerjemah dua arah, kuis harian, roleplay, dan dashboard institusi dalam satu platform.",
};

const features = [
  {
    icon: Camera,
    href: "/latihan",
    title: "Practice Arena",
    scope: "26 huruf alfabet",
    body: "Peragakan huruf di depan kamera, umpan balik langsung di browser.",
  },
  {
    icon: PersonStanding,
    href: "/belajar",
    title: "Belajar bersama avatar",
    scope: "Alfabet dan kosakata dasar",
    body: "Avatar 3D memperagakan tiap isyarat, bisa diulang dan diperlambat.",
  },
  {
    icon: CalendarClock,
    href: "/belajar/kuis",
    title: "Kuis harian",
    scope: "Berbasis riwayat latihanmu",
    body: "Spaced repetition, materi yang sering keliru kembali lebih cepat.",
  },
  {
    icon: Mic,
    href: "/terjemah",
    title: "Suara ke isyarat",
    scope: "32 kosakata plus ejaan jari",
    body: "Ucapan menjadi peragaan avatar, kata di luar kosakata dieja per huruf.",
  },
  {
    icon: Volume2,
    href: "/terjemah",
    title: "Isyarat ke suara",
    scope: "32 kosakata dasar",
    body: "Isyarat yang dikenali kamera dibacakan sebagai suara.",
  },
  {
    icon: MessagesSquare,
    href: "/latihan/roleplay",
    title: "Roleplay",
    scope: "Skenario apotek",
    body: "Latihan percakapan terarah dari kosakata yang sudah kamu kuasai.",
  },
  {
    icon: BarChart3,
    href: "/institusi",
    title: "Dashboard institusi",
    scope: "Untuk pelatihan staf",
    body: "Pantau progres pelatihan BISINDO staf layanan publik.",
  },
];

export default function FiturPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <Reveal>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Semua fitur KawanTuli
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Satu platform untuk belajar, berlatih, dan berkomunikasi dengan
          BISINDO, langsung dari browser.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 80}>
            <Link
              href={f.href}
              className="group flex h-full flex-col rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-bright hover:shadow-lg hover:shadow-cyan-900/5"
            >
              <f.icon size={24} className="text-accent" aria-hidden="true" />
              <h2 className="mt-4 text-base font-medium group-hover:text-accent">
                {f.title}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-accent">{f.scope}</p>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{f.body}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent">
                Coba sekarang
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
