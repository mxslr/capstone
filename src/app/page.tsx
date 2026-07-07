import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Camera,
  MessageSquareText,
  PersonStanding,
  ShieldCheck,
} from "lucide-react";
import { HandSkeleton } from "@/components/hand-skeleton";
import { Reveal } from "@/components/reveal";

const steps = [
  {
    title: "Nyalakan kamera",
    body: "Kamera aktif hanya setelah kamu setuju. Video tidak pernah meninggalkan perangkatmu.",
  },
  {
    title: "Peragakan isyarat",
    body: "SAPA membaca 21 titik tanganmu dan langsung memberi tahu benar atau belum.",
  },
  {
    title: "Ulangi yang sulit",
    body: "Huruf yang sering keliru dijadwalkan muncul lebih sering di kuis harianmu.",
  },
];

const features = [
  {
    icon: Camera,
    title: "Practice Arena",
    body: "Latihan alfabet dengan umpan balik langsung dari kamera.",
    href: "/latihan",
  },
  {
    icon: PersonStanding,
    title: "Avatar pemandu",
    body: "Avatar 3D memperagakan tiap huruf dan kata, bisa diperlambat.",
    href: "/belajar",
  },
  {
    icon: MessageSquareText,
    title: "Penerjemah dua arah",
    body: "Suara ke isyarat dan isyarat ke suara untuk kosakata dasar.",
    href: "/terjemah",
  },
  {
    icon: CalendarClock,
    title: "Kuis harian",
    body: "Spaced repetition, materi yang salah kembali lebih cepat.",
    href: "/belajar/kuis",
  },
];

function WaveUnderline() {
  return (
    <svg
      viewBox="0 0 200 14"
      className="absolute -bottom-2 left-0 w-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M2 10C30 2 55 2 80 8C105 14 140 14 198 4"
        stroke="#22D3EE"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="grid items-center gap-12 sm:grid-cols-[1.2fr_1fr]">
          <Reveal>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Belajar{" "}
              <span className="relative inline-block text-accent">
                BISINDO
                <WaveUnderline />
              </span>{" "}
              langsung dari browser
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Latih alfabet dengan kamera, belajar dari avatar pemandu, dan
              terjemahkan kosakata dasar dua arah. Tanpa video yang dikirim ke
              server.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/latihan"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-strong hover:shadow-lg hover:shadow-cyan-900/15"
              >
                Mulai belajar
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/terjemah"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                Coba penerjemah
              </Link>
            </div>
          </Reveal>
          <Reveal delay={150} className="mx-auto w-56 sm:w-full sm:max-w-xs">
            <HandSkeleton className="w-full" />
            <p className="mt-3 text-center text-xs text-muted">
              21 titik tangan, dideteksi di perangkatmu
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Cara kerjanya
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 100}>
                <li>
                  <span className="font-display text-3xl font-semibold text-accent-bright">
                    {i + 1}
                  </span>
                  <h3 className="mt-3 text-base font-medium">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Empat cara berlatih
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <Link
                href={f.href}
                className="group block rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-bright hover:shadow-lg hover:shadow-cyan-900/5"
              >
                <f.icon size={24} className="text-accent" aria-hidden="true" />
                <h3 className="mt-4 text-base font-medium group-hover:text-accent">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-2 sm:px-6 sm:py-20">
          <Reveal>
            <ShieldCheck size={26} className="text-accent" aria-hidden="true" />
            <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">
              Kameramu tidak ke mana-mana
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              Pengenalan isyarat berjalan sepenuhnya di browser. Tidak ada frame
              video yang dikirim ke server.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <p className="font-display text-3xl font-semibold text-accent">26 + 32</p>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight">
              Cakupan yang jujur
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
              26 huruf alfabet dan 32 kosakata dasar BISINDO, bukan penerjemah
              kalimat bebas. Batas itu kami tampilkan apa adanya.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="bg-accent-soft">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Mulai dari huruf pertamamu
            </h2>
            <p className="mt-2 text-sm text-muted">
              Gratis, langsung dari browser, tanpa instal apa pun.
            </p>
          </Reveal>
          <Link
            href="/daftar"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-strong hover:shadow-lg hover:shadow-cyan-900/15"
          >
            Buat akun
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}
