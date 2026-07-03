import { describe, expect, it } from "vitest";
import {
  dueItems,
  initialState,
  MIN_EASE,
  review,
  sessionQueue,
  type ReviewQuality,
} from "./srs";

const T0 = Date.UTC(2026, 0, 1);
const DAY = 24 * 60 * 60 * 1000;

function simulate(itemId: string, qualities: ReviewQuality[], start = T0) {
  let state = initialState(itemId, start);
  let now = start;
  for (const q of qualities) {
    state = review(state, q, now);
    // review berikutnya terjadi saat item jatuh tempo
    now = state.dueAt;
  }
  return state;
}

describe("SM-2 review", () => {
  it("jawaban benar pertama memberi interval 1 hari, kedua 3 hari", () => {
    let s = review(initialState("A", T0), 5, T0);
    expect(s.intervalDays).toBe(1);
    expect(s.dueAt).toBe(T0 + DAY);
    s = review(s, 5, s.dueAt);
    expect(s.intervalDays).toBe(3);
  });

  it("jawaban salah mereset repetisi dan menjadwalkan ulang 10 menit", () => {
    let s = review(initialState("B", T0), 5, T0);
    s = review(s, 5, s.dueAt);
    const failedAt = s.dueAt;
    s = review(s, 2, failedAt);
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(0);
    expect(s.lapses).toBe(1);
    expect(s.dueAt).toBe(failedAt + 10 * 60 * 1000);
  });

  it("ease factor tidak pernah turun di bawah minimum", () => {
    let s = initialState("C", T0);
    for (let i = 0; i < 20; i++) s = review(s, 0, T0);
    expect(s.easeFactor).toBeGreaterThanOrEqual(MIN_EASE);
  });

  it("item yang sering salah dijadwalkan ulang lebih cepat daripada yang selalu benar", () => {
    // huruf X: sering salah, huruf Y: selalu benar, jumlah review sama
    const often_wrong = simulate("X", [5, 2, 3, 2, 3]);
    const always_right = simulate("Y", [5, 5, 5, 5, 5]);

    // interval berikutnya untuk item bermasalah harus jauh lebih pendek
    expect(often_wrong.intervalDays).toBeLessThan(always_right.intervalDays);
    // dan ease factor-nya lebih rendah, jadi pertumbuhan interval lebih lambat
    expect(often_wrong.easeFactor).toBeLessThan(always_right.easeFactor);
    // jatuh temponya juga lebih awal secara absolut
    expect(often_wrong.dueAt).toBeLessThan(always_right.dueAt);
  });

  it("antrean sesi menaruh item paling telat di depan", () => {
    const now = T0 + 10 * DAY;
    const a = { ...initialState("A", T0), dueAt: T0 + 2 * DAY };
    const b = { ...initialState("B", T0), dueAt: T0 + 5 * DAY };
    const c = { ...initialState("C", T0), dueAt: now + DAY };
    const queue = sessionQueue([c, b, a]);
    expect(queue.map((s) => s.itemId)).toEqual(["A", "B", "C"]);
    expect(dueItems([c, b, a], now).map((s) => s.itemId)).toEqual(["A", "B"]);
  });

  it("setelah salah lalu benar lagi, interval tumbuh lebih lambat karena ease turun", () => {
    // dua item sampai repetisi ke-3 setelah pemulihan
    const recovered = simulate("R", [5, 2, 5, 5, 5]);
    const clean = simulate("S", [5, 5, 5]);
    // keduanya di repetisi ke-3, tapi yang pernah gagal punya interval lebih pendek
    expect(recovered.repetitions).toBe(3);
    expect(clean.repetitions).toBe(3);
    expect(recovered.intervalDays).toBeLessThan(clean.intervalDays);
  });
});
