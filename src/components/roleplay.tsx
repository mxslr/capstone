"use client";

/*
 * Roleplay pendaftaran di apotek: alur tanya jawab deterministik.
 * Avatar memperagakan kata kunci tiap ucapan petugas, pilihan pengguna
 * juga diperagakan sebelum lanjut. Progres dicatat sebagai latihan.
 */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LetterPose } from "@/components/avatar-viewer";
import { IconArrowRight, IconCheck, IconRepeat } from "@/components/icons";
import { SignStage, useSignPlayer, type PlayItem } from "@/components/sign-player";
import { recordReview } from "@/lib/progress";
import { APOTEK_SCENARIO, SCENARIO_START } from "@/lib/roleplay";
import type { WordClip } from "@/lib/vocabulary";

export function Roleplay({
  alphabet,
  clips,
}: {
  alphabet: Record<string, LetterPose>;
  clips: Record<string, WordClip>;
}) {
  const { pose, status, play, stop, speed, setSpeed } = useSignPlayer(alphabet);
  const [stepId, setStepId] = useState(SCENARIO_START);
  const [exchanges, setExchanges] = useState(0);
  const playedFor = useRef<string>("");

  const step = APOTEK_SCENARIO[stepId];
  const done = step.options.length === 0;

  const toItems = (signs: string[]): PlayItem[] =>
    signs.map((w) =>
      clips[w]
        ? { kind: "word", word: w, clip: clips[w] }
        : { kind: "spell", word: w },
    );

  // peragakan ucapan petugas sekali per langkah
  useEffect(() => {
    if (playedFor.current === stepId) return;
    playedFor.current = stepId;
    void play(toItems(step.officerSigns));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  useEffect(() => stop, [stop]);

  const choose = (opt: (typeof step.options)[number]) => {
    setExchanges((n) => n + 1);
    // setiap kata kosakata yang dipakai dicatat sebagai latihan ringan
    for (const w of opt.signs) {
      if (clips[w]) void recordReview(w, 4, "roleplay");
    }
    void play(toItems(opt.signs)).then(() => {
      if (opt.next) setStepId(opt.next);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div>
        <SignStage pose={pose} status={status} transitionSpeed={9} />
        <div className="mt-3">
          <label htmlFor="kecepatan-rp" className="text-xs text-muted">
            Kecepatan peragaan: {speed.toFixed(1)}x
          </label>
          <input
            id="kecepatan-rp"
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--accent)]"
          />
        </div>
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-accent">
          Petugas apotek
        </p>
        <p className="mt-1 text-base leading-relaxed">{step.officer}</p>
        <p className="mt-1.5 text-xs text-muted">
          Kata yang diperagakan: {step.officerSigns.join(", ")}
        </p>

        {!done ? (
          <div className="mt-5">
            <p className="text-sm font-medium">Balasanmu</p>
            <div className="mt-2 flex flex-col gap-2">
              {step.options.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  disabled={status.playing}
                  onClick={() => choose(opt)}
                  className="rounded-md border border-border px-4 py-2.5 text-left text-sm transition-colors hover:border-accent disabled:opacity-50"
                >
                  {opt.label}
                  <span className="mt-0.5 block text-xs text-muted">
                    isyarat: {opt.signs.join(", ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-border bg-surface p-4">
            <p className="inline-flex items-center gap-2 text-sm font-medium">
              <IconCheck width={16} height={16} className="text-accent" />
              Skenario selesai, {exchanges} percakapan
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Kosakata yang kamu pakai tercatat di jadwal pengulanganmu.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  playedFor.current = "";
                  setExchanges(0);
                  setStepId(SCENARIO_START);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
              >
                <IconRepeat width={15} height={15} />
                Ulangi skenario
              </button>
              <Link
                href="/terjemah"
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
              >
                Ke penerjemah
                <IconArrowRight width={15} height={15} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
