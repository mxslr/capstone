/*
 * Skenario roleplay tetap: pendaftaran di apotek.
 * Alur tanya jawab terbatas, semua kosakata isyarat diambil dari 32 kata
 * WL-BISINDO yang dikuasai, sisanya dieja jari. Tidak ada AI generatif,
 * alurnya deterministik supaya bisa divalidasi manusia.
 */

export type RoleplayStep = {
  id: string;
  /* ucapan petugas apotek (ditampilkan sebagai teks dan diperagakan avatar) */
  officer: string;
  /* kata kunci yang diperagakan avatar dari ucapan petugas */
  officerSigns: string[];
  /* pilihan respons pengguna, kata di kosakata diperagakan saat dipilih */
  options: { label: string; signs: string[]; next: string | null }[];
};

export const APOTEK_SCENARIO: Record<string, RoleplayStep> = {
  mulai: {
    id: "mulai",
    officer: "Selamat pagi, ada yang bisa dibantu?",
    officerSigns: ["pagi", "apa"],
    options: [
      {
        label: "Saya mau cari obat",
        signs: ["saya", "cari"],
        next: "tanya-keluhan",
      },
      {
        label: "Saya mau tanya jam buka",
        signs: ["saya", "apa", "kapan"],
        next: "jam-buka",
      },
    ],
  },
  "tanya-keluhan": {
    id: "tanya-keluhan",
    officer: "Obat untuk siapa dan keluhannya apa?",
    officerSigns: ["siapa", "apa"],
    options: [
      {
        label: "Untuk saya, kepala pusing dari pagi",
        signs: ["saya", "pagi"],
        next: "resep",
      },
      {
        label: "Untuk keluarga di rumah",
        signs: ["keluarga", "rumah"],
        next: "resep",
      },
    ],
  },
  resep: {
    id: "resep",
    officer: "Baik, apakah ada resep dari dokter, atau obat bebas saja?",
    officerSigns: ["apa"],
    options: [
      {
        label: "Obat bebas saja",
        signs: ["lagi"],
        next: "aturan-pakai",
      },
      {
        label: "Saya lupa bawa resep",
        signs: ["saya", "ingat"],
        next: "aturan-pakai",
      },
    ],
  },
  "aturan-pakai": {
    id: "aturan-pakai",
    officer: "Ini obatnya. Diminum setelah makan, pagi dan malam, dengan air putih.",
    officerSigns: ["makan", "pagi", "malam", "air"],
    options: [
      {
        label: "Terima kasih, saya mengerti",
        signs: ["terimakasih", "saya"],
        next: "selesai",
      },
      {
        label: "Tolong ulangi lagi",
        signs: ["lagi"],
        next: "aturan-pakai",
      },
    ],
  },
  "jam-buka": {
    id: "jam-buka",
    officer: "Apotek buka dari pagi sampai malam setiap hari.",
    officerSigns: ["pagi", "malam", "hari"],
    options: [
      {
        label: "Terima kasih",
        signs: ["terimakasih"],
        next: "selesai",
      },
      {
        label: "Kalau begitu saya mau cari obat sekalian",
        signs: ["saya", "cari"],
        next: "tanya-keluhan",
      },
    ],
  },
  selesai: {
    id: "selesai",
    officer: "Sama-sama, semoga lekas sembuh. Sampai jumpa.",
    officerSigns: ["datang", "lagi"],
    options: [],
  },
};

export const SCENARIO_START = "mulai";
