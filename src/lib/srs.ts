/*
 * Spaced repetition sederhana berbasis SM-2 untuk item belajar BISINDO.
 * Kualitas jawaban dipetakan ke skala SM-2 0..5:
 *   salah = 2, benar lambat = 4, benar cepat = 5
 * Item dengan riwayat sering salah mendapat interval lebih pendek dan
 * ease factor lebih rendah, sehingga dijadwalkan ulang lebih cepat.
 */

export type SrsState = {
  itemId: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: number; // epoch ms
  lapses: number;
};

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_EASE = 1.3;

export function initialState(itemId: string, now: number): SrsState {
  return {
    itemId,
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: now,
    lapses: 0,
  };
}

export function review(
  state: SrsState,
  quality: ReviewQuality,
  now: number,
): SrsState {
  const next = { ...state };

  if (quality < 3) {
    // gagal: ulang dari awal, jatuh tempo 10 menit lagi supaya diulang
    // di sesi yang sama
    next.repetitions = 0;
    next.intervalDays = 0;
    next.lapses = state.lapses + 1;
    next.dueAt = now + 10 * 60 * 1000;
  } else {
    next.repetitions = state.repetitions + 1;
    if (next.repetitions === 1) next.intervalDays = 1;
    else if (next.repetitions === 2) next.intervalDays = 3;
    else next.intervalDays = Math.round(state.intervalDays * state.easeFactor);
    next.dueAt = now + next.intervalDays * DAY_MS;
  }

  const ef =
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  next.easeFactor = Math.max(MIN_EASE, ef);

  return next;
}

/* Urutkan item untuk sesi belajar: yang sudah jatuh tempo dulu
 * (paling telat paling depan), lalu sisanya berdasarkan dueAt terdekat. */
export function sessionQueue(states: SrsState[]): SrsState[] {
  return [...states].sort((a, b) => a.dueAt - b.dueAt);
}

export function dueItems(states: SrsState[], now: number): SrsState[] {
  return sessionQueue(states).filter((s) => s.dueAt <= now);
}
