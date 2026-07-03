import type { Metadata } from "next";
import Link from "next/link";
import { IconArrowRight } from "@/components/icons";

export const metadata: Metadata = {
  title: "Tentang",
  description:
    "Kenapa SAPA dibangun untuk BISINDO, bukan SIBI, dan prinsip yang kami pegang: privasi on-device, cakupan jujur, dan validasi bersama komunitas Tuli.",
};

const principles = [
  {
    title: "BISINDO, bukan SIBI",
    body: "BISINDO adalah bahasa isyarat yang tumbuh alami di komunitas Tuli Indonesia. SIBI adalah sistem buatan yang mengikuti tata bahasa Indonesia formal dan bukan bahasa sehari-hari komunitas. SAPA dibangun untuk BISINDO dan tidak memakai dataset atau referensi SIBI.",
  },
  {
    title: "Privasi bukan fitur tambahan",
    body: "Kamera adalah data sensitif. Semua deteksi tangan dan pengenalan isyarat berjalan di perangkatmu lewat browser. Tidak ada frame video yang dikirim ke server, dan kamera baru aktif setelah kamu memberi persetujuan eksplisit.",
  },
  {
    title: "Cakupan yang jujur",
    body: "Dataset publik BISINDO yang tersedia saat ini berupa gambar alfabet dan video 32 kosakata dasar. Karena itu SAPA membatasi klaimnya ke situ, bukan penerjemah kalimat bebas. Kata di luar kosakata dieja huruf demi huruf, dan batas ini kami tampilkan di setiap fitur.",
  },
  {
    title: "Validasi bersama komunitas",
    body: "Model yang dilatih dari dataset publik belum tentu akurat secara budaya dan linguistik. Kami menganggap semua materi sebagai versi awal sampai divalidasi penutur BISINDO, dan masukan dari Teman Tuli adalah bagian dari proses pengembangan, bukan pelengkap.",
  },
];

export default function TentangPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="text-xs font-medium uppercase tracking-wide text-accent">
        Tentang
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        Menyapa lebih dulu
      </h1>
      <p className="mt-4 text-base leading-relaxed text-muted">
        SAPA lahir dari satu pengamatan sederhana: percakapan antara Teman Tuli
        dan penutur dengar sering berhenti sebelum dimulai, bukan karena tidak
        ada niat, tapi karena tidak ada jembatan. Kami membangun jembatan itu
        pelan-pelan, dimulai dari alfabet dan kosakata dasar BISINDO yang
        dikerjakan dengan sungguh-sungguh.
      </p>

      <div className="mt-12 space-y-10">
        {principles.map((p) => (
          <section key={p.title}>
            <h2 className="text-lg font-semibold tracking-tight">{p.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{p.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-14 rounded-lg border border-border bg-surface p-6">
        <h2 className="text-base font-medium">Untuk siapa SAPA dibangun</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            Teman Tuli yang ingin lawan bicaranya memahami kosakata dasar
            BISINDO.
          </li>
          <li>
            Petugas layanan publik, apotek, puskesmas, atau loket yang ingin
            melayani tanpa hambatan.
          </li>
          <li>
            Pembelajar mandiri dan institusi yang ingin melatih stafnya secara
            terukur.
          </li>
        </ul>
        <Link
          href="/fitur"
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-strong"
        >
          Lihat semua fitur
          <IconArrowRight width={16} height={16} />
        </Link>
      </div>
    </div>
  );
}
