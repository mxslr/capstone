/*
 * Kosakata isyarat kata-level KawanTuli.
 * Sumber: dataset publik WL-BISINDO (glennleonali/wl-bisindo, CC BY-NC 4.0),
 * 32 kata isolasi dari 5 penutur wilayah Banten.
 * Kata di luar daftar ini dieja huruf demi huruf (fingerspelling).
 */

export type WordClip = {
  word: string;
  /* urutan frame pose tangan, format sama dengan LetterPose per frame */
  frames: ClipFrame[];
  fps: number;
  twoHanded: boolean;
};

export type ClipFrame = {
  left: number[] | null; // 15 curl (5 jari x 3 sendi)
  right: number[] | null;
  // posisi wrist ternormalisasi relatif frame [x,y] untuk gerakan tangan
  leftWrist?: [number, number] | null;
  rightWrist?: [number, number] | null;
};

export function normalizeWord(w: string): string {
  return w
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z]/g, "");
}

export function tokenize(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

