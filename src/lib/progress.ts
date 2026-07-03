/*
 * Penyimpanan progres belajar: state SRS dan log latihan.
 * Sumber kebenaran lokal (localStorage) supaya tetap berfungsi offline,
 * disinkronkan ke Supabase saat tersedia.
 */

import { initialState, review, type ReviewQuality, type SrsState } from "./srs";
import { getDeviceId, getSupabase } from "./supabase";

const STORE_KEY = "sapa-srs-v1";

export type ItemProgress = Record<string, SrsState>;

export function loadProgress(): ItemProgress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveProgress(p: ItemProgress) {
  localStorage.setItem(STORE_KEY, JSON.stringify(p));
}

export function getOrInitState(
  progress: ItemProgress,
  itemId: string,
  now: number,
): SrsState {
  return progress[itemId] ?? initialState(itemId, now);
}

export async function recordReview(
  itemId: string,
  quality: ReviewQuality,
  source: string,
  latencyMs?: number,
): Promise<SrsState> {
  const now = Date.now();
  const progress = loadProgress();
  const next = review(getOrInitState(progress, itemId, now), quality, now);
  progress[itemId] = next;
  saveProgress(progress);

  const supabase = getSupabase();
  if (supabase) {
    const deviceId = getDeviceId();
    // builder supabase-js baru mengeksekusi saat then/await dipanggil;
    // gagal sinkron tidak boleh mengganggu sesi belajar
    supabase
      .from("practice_logs")
      .insert({
        device_id: deviceId,
        item_id: itemId,
        correct: quality >= 3,
        quality,
        source,
        latency_ms: latencyMs ?? null,
      })
      .then(({ error }) => {
        if (error) console.warn("sync practice_logs gagal:", error.message);
      });
    supabase
      .from("srs_state")
      .upsert({
        device_id: deviceId,
        item_id: itemId,
        repetitions: next.repetitions,
        ease_factor: next.easeFactor,
        interval_days: next.intervalDays,
        due_at: new Date(next.dueAt).toISOString(),
        lapses: next.lapses,
        updated_at: new Date(now).toISOString(),
      })
      .then(({ error }) => {
        if (error) console.warn("sync srs_state gagal:", error.message);
      });
  }
  return next;
}
