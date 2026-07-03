import Link from "next/link";
import { HandSkeleton } from "@/components/hand-skeleton";
import {
  IconArrowRight,
  IconAvatar,
  IconCamera,
  IconCheck,
  IconHand,
  IconMessage,
  IconRepeat,
  IconShield,
} from "@/components/icons";

const steps = [
  {
    title: "Aktifkan kamera dengan persetujuan",
    body: "Kamu memutuskan kapan kamera menyala. Video tidak pernah meninggalkan perangkatmu, semua pemrosesan terjadi di browser.",
  },
  {
    title: "Peragakan huruf, dapatkan umpan balik",
    body: "SAPA mendeteksi 21 titik tangan dan mengenali huruf alfabet BISINDO yang kamu peragakan, lalu memberi tahu benar atau belum.",
  },
  {
    title: "Ulangi yang masih sulit",
    body: "Huruf yang sering keliru dijadwalkan muncul lebih sering, jadi waktu latihanmu terpakai untuk hal yang paling perlu.",
  },
];

const features = [
  {
    icon: IconCamera,
    title: "Practice Arena",
    body: "Latihan alfabet BISINDO langsung di browser dengan umpan balik dari deteksi tangan.",
  },
  {
    icon: IconAvatar,
    title: "Avatar pemandu",
    body: "Avatar 3D memperagakan tiap huruf dan kosakata, bisa diulang dan diperlambat.",
  },
  {
    icon: IconMessage,
    title: "Penerjemah dua arah",
    body: "Suara ke isyarat dan isyarat ke suara untuk kosakata dasar, dengan ejaan jari untuk kata di luar cakupan.",
  },
  {
    icon: IconRepeat,
    title: "Pengulangan terjadwal",
    body: "Kuis harian dengan spaced repetition, materi yang sering salah kembali lebih cepat.",
  },
];

export default function Home() {
  return (
    <>
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
        <div className="grid items-center gap-10 sm:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
              <IconHand width={14} height={14} className="text-accent" />
              Versi awal, mendukung alfabet dan kosakata dasar BISINDO
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Belajar BISINDO, langsung dari browser
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
              SAPA membantu Teman Tuli dan penutur dengar saling menyapa. Latih
              alfabet BISINDO dengan kamera, belajar dari avatar pemandu, dan
              terjemahkan kosakata dasar dua arah. Tanpa video yang dikirim ke
              server.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/latihan"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                Mulai belajar
                <IconArrowRight width={16} height={16} />
              </Link>
              <Link
                href="/tentang"
                className="inline-flex items-center justify-center rounded-md border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
              >
                Kenapa BISINDO
              </Link>
            </div>
          </div>
          <div className="mx-auto w-56 sm:w-full sm:max-w-xs">
            <HandSkeleton className="w-full" />
            <p className="mt-2 text-center text-xs text-muted">
              21 titik landmark tangan, dideteksi di perangkatmu
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Cara kerjanya
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title}>
                <p className="font-mono text-xs text-accent">Langkah {i + 1}</p>
                <h3 className="mt-2 text-base font-medium">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Satu platform, dua kebutuhan
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
          Untuk yang sedang belajar BISINDO dan untuk percakapan sehari-hari di
          layanan publik.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-border p-5 transition-colors hover:border-accent"
            >
              <f.icon className="text-accent" />
              <h3 className="mt-3 text-base font-medium">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6 sm:py-20">
          <div>
            <IconShield className="text-accent" />
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Kameramu tidak ke mana-mana
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Pengenalan isyarat berjalan sepenuhnya di browser dengan MediaPipe
              dan TensorFlow.js. Tidak ada frame video yang dikirim ke server,
              dan kamera hanya aktif setelah kamu memberi persetujuan.
            </p>
          </div>
          <div>
            <IconCheck className="text-accent" />
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Kami jujur soal cakupan
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Saat ini SAPA mengenali 26 huruf alfabet dan 32 kosakata dasar
              BISINDO dari dataset publik, bukan penerjemah kalimat bebas.
              Materi masih menunggu validasi komunitas Tuli, dan kami menampilkan
              batas itu apa adanya di setiap fitur.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
