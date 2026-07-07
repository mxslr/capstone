import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/reveal";

export const metadata: Metadata = {
  title: "Tentang",
  description:
    "Kenapa SAPA dibangun untuk BISINDO dan prinsip yang kami pegang: privasi on-device, cakupan jujur, validasi bersama komunitas Tuli.",
};

const principles = [
  {
    title: "BISINDO, bukan SIBI",
    body: "BISINDO adalah bahasa isyarat yang tumbuh alami di komunitas Tuli Indonesia. SAPA dibangun untuk BISINDO dan tidak memakai referensi SIBI.",
  },
  {
    title: "Privasi bukan fitur tambahan",
    body: "Semua deteksi tangan berjalan di perangkatmu. Tidak ada frame video yang dikirim ke server, dan kamera baru aktif setelah kamu setuju.",
  },
  {
    title: "Cakupan yang jujur",
    body: "SAPA mengenali 26 huruf alfabet dan 32 kosakata dasar, bukan penerjemah kalimat bebas. Kata di luar kosakata dieja huruf demi huruf.",
  },
  {
    title: "Validasi bersama komunitas",
    body: "Materi dianggap final hanya setelah divalidasi penutur BISINDO. Masukan Teman Tuli adalah bagian dari proses, bukan pelengkap.",
  },
];

const audiences = [
  "Teman Tuli yang ingin lawan bicaranya memahami kosakata dasar BISINDO.",
  "Petugas layanan publik yang ingin melayani tanpa hambatan.",
  "Pembelajar mandiri dan institusi yang melatih stafnya secara terukur.",
];

export default function TentangPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <Reveal>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Menyapa lebih dulu
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted">
          Percakapan antara Teman Tuli dan penutur dengar sering berhenti
          sebelum dimulai karena tidak ada jembatan. SAPA membangun jembatan
          itu, dimulai dari alfabet dan kosakata dasar BISINDO.
        </p>
      </Reveal>

      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {principles.map((p, i) => (
          <Reveal key={p.title} delay={(i % 2) * 80}>
            <section>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                {p.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
            </section>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-14">
        <div className="rounded-xl bg-accent-soft p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Untuk siapa SAPA dibangun
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
            {audiences.map((a) => (
              <li key={a} className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                {a}
              </li>
            ))}
          </ul>
          <Link
            href="/fitur"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Lihat semua fitur
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
