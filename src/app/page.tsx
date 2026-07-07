import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Camera,
  Check,
  MessageSquareText,
  PersonStanding,
  ShieldCheck,
} from "lucide-react";
import { AbbiIntro } from "@/components/abbi-intro";
import { AnimatedHand } from "@/components/animated-hand";
import { HowItWorks } from "@/components/how-it-works";
import { Reveal } from "@/components/reveal";

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
    body: "Suara ke isyarat dan isyarat ke suara, langsung di browser.",
    href: "/terjemah",
  },
  {
    icon: CalendarClock,
    title: "Kuis harian",
    body: "Spaced repetition, materi yang salah kembali lebih cepat.",
    href: "/belajar/kuis",
  },
];

const stats = [
  { value: "26", label: "huruf alfabet" },
  { value: "32", label: "kosakata inti" },
  { value: "21", label: "titik tangan terbaca" },
  { value: "100%", label: "diproses di perangkatmu" },
];

const plans = [
  {
    name: "Gratis",
    price: "Rp0",
    period: "selamanya",
    tagline: "Untuk mulai mengenal BISINDO.",
    features: ["Belajar alfabet dengan avatar", "Practice Arena 26 huruf", "Kuis harian"],
    cta: "Mulai gratis",
    href: "/daftar",
    highlight: false,
  },
  {
    name: "Pro",
    price: "Rp49.000",
    period: "per bulan",
    tagline: "Semua fitur, coba gratis 7 hari.",
    features: [
      "Semua fitur Gratis",
      "Penerjemah dua arah",
      "Roleplay percakapan",
      "Statistik progres lengkap",
    ],
    cta: "Coba 7 hari gratis",
    href: "/daftar",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Kustom",
    period: "per organisasi",
    tagline: "Untuk institusi dan pelatihan staf.",
    features: [
      "Dashboard institusi",
      "Manajemen anggota",
      "Pelatihan staf terukur",
      "Dukungan prioritas",
    ],
    cta: "Hubungi kami",
    href: "mailto:halo@kawantuli.id",
    highlight: false,
  },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="flex min-h-[calc(100dvh-4rem)] items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 sm:grid-cols-[1.2fr_1fr] sm:px-6">
          <Reveal>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl">
              Belajar <span className="text-accent">BISINDO</span> langsung dari browser
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
              Latih alfabet dengan kamera, belajar dari avatar pemandu, dan
              terjemahkan kosakata dua arah. Tanpa instal apa pun.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/daftar"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-strong hover:shadow-lg hover:shadow-cyan-900/15"
              >
                Coba gratis
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <Link
                href="/#harga"
                className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                Lihat paket
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <ShieldCheck size={16} className="text-accent" aria-hidden="true" />
              Video tidak pernah meninggalkan perangkatmu.
            </p>
          </Reveal>
          <Reveal delay={150} className="mx-auto hidden w-56 sm:block sm:w-full sm:max-w-xs">
            <AnimatedHand className="w-full" />
            <p className="mt-3 text-center text-xs text-muted">
              21 titik tangan, dideteksi secara real time
            </p>
          </Reveal>
        </div>
      </section>

      {/* Cara kerja */}
      <section id="cara-kerja" className="flex min-h-[calc(100dvh-4rem)] items-center border-y border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              Cara kerjanya
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted sm:text-base">
              Tiga langkah, langsung dari browser.
            </p>
          </Reveal>
          <div className="mt-10">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* Perkenalan Abbi */}
      <section className="flex min-h-[calc(100dvh-4rem)] items-center">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_420px]">
          <Reveal>
            <p className="text-sm font-medium text-accent">Avatar Belajar Bahasa Isyarat</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Kenalkan, Abbi
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Abbi memperagakan tiap huruf dan kosakata dengan gerakan yang
              jelas. Ulangi sesukamu, perlambat kapan saja, dan berlatih tanpa
              rasa sungkan.
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
              Di sampingnya, Abbi sedang menyapamu: H, A, L, O.
            </p>
            <Link
              href="/belajar"
              className="group mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-strong hover:shadow-lg hover:shadow-cyan-900/15"
            >
              Belajar bersama Abbi
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
          <Reveal delay={120}>
            <AbbiIntro />
          </Reveal>
        </div>
      </section>

      {/* Fitur */}
      <section className="flex min-h-[calc(100dvh-4rem)] items-center border-t border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              Empat cara berlatih
            </h2>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
            {stats.map((s, i) => (
              <Reveal key={s.label} delay={i * 60}>
                <div>
                  <p className="font-display text-4xl font-semibold text-accent">{s.value}</p>
                  <p className="mt-1.5 text-sm text-muted">{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <Link
                  href={f.href}
                  className="group block rounded-xl border border-border p-6 transition-all hover:-translate-y-0.5 hover:border-accent-bright hover:shadow-lg hover:shadow-cyan-900/5"
                >
                  <f.icon size={24} className="text-accent" aria-hidden="true" />
                  <h3 className="mt-4 text-base font-medium group-hover:text-accent">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Harga */}
      <section id="harga" className="flex min-h-[calc(100dvh-4rem)] items-center border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-4xl">
              Paket untuk setiap kebutuhan
            </h2>
            <p className="mt-2 max-w-md text-sm text-muted sm:text-base">
              Mulai gratis, tingkatkan kapan saja.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {plans.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 80}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border bg-background p-7 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-900/10 ${
                    plan.highlight ? "border-accent shadow-lg shadow-cyan-900/10" : "border-border"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                      Terpopuler
                    </span>
                  )}
                  <h3 className="text-base font-medium">{plan.name}</h3>
                  <p className="mt-3">
                    <span className="font-display text-3xl font-semibold">{plan.price}</span>
                    <span className="ml-1.5 text-sm text-muted">{plan.period}</span>
                  </p>
                  <p className="mt-2 text-sm text-muted">{plan.tagline}</p>
                  <ul className="mt-5 flex-1 space-y-2.5">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex gap-2.5 text-sm">
                        <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`mt-7 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                      plan.highlight
                        ? "bg-accent text-white hover:bg-accent-strong"
                        : "border border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA akhir */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-center border-t border-border">
        <div className="relative mx-auto w-full max-w-3xl px-4 py-14 text-center sm:px-6">
          <Reveal>
            <svg
              viewBox="0 0 120 24"
              className="mx-auto w-20"
              aria-hidden="true"
            >
              <path
                d="M6 16C24 6 40 6 58 13C76 20 94 20 114 9"
                stroke="#22d3ee"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
                opacity="0.8"
              />
            </svg>
            <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-5xl">
              Mulai dari huruf pertamamu
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base text-muted">
              Buat akun dan sapa Teman Tuli dengan bahasanya.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/daftar"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-7 py-3 text-sm font-medium text-white transition-all hover:bg-accent-strong hover:shadow-lg hover:shadow-cyan-900/15"
              >
                Coba gratis
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/masuk"
                className="inline-flex items-center justify-center rounded-lg border border-border px-7 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                Sudah punya akun
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted">
              <span className="flex items-center gap-2">
                <Check size={15} className="text-accent" aria-hidden="true" />
                26 huruf alfabet
              </span>
              <span className="flex items-center gap-2">
                <Check size={15} className="text-accent" aria-hidden="true" />
                32 kosakata inti
              </span>
              <span className="flex items-center gap-2">
                <Check size={15} className="text-accent" aria-hidden="true" />
                100% di perangkatmu
              </span>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
