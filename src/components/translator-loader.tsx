"use client";

import { useEffect, useState } from "react";
import type { LetterPose } from "@/components/avatar-viewer";
import { Translator } from "@/components/translator";
import { SignToVoice } from "@/components/sign-to-voice";
import type { WordClip } from "@/lib/vocabulary";

type Tab = "ke-isyarat" | "ke-suara";

export function TranslatorLoader() {
  const [alphabet, setAlphabet] = useState<Record<string, LetterPose> | null>(
    null,
  );
  const [clips, setClips] = useState<Record<string, WordClip> | null>(null);
  const [tab, setTab] = useState<Tab>("ke-isyarat");
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setAlphabet)
      .catch(() => setError(true));
    // klip kata opsional, tanpa file ini semua kata dieja
    fetch(`/clips/words.json?v=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then(setClips)
      .catch(() => setClips({}));
  }, []);

  if (error) {
    return (
      <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
        Data pose gagal dimuat. Muat ulang halaman untuk mencoba lagi.
      </p>
    );
  }
  if (!alphabet || !clips) {
    return <p className="text-sm text-muted">Memuat data isyarat...</p>;
  }

  return (
    <div>
      <div role="tablist" aria-label="Arah terjemahan" className="flex gap-1 rounded-lg border border-border p-1">
        {(
          [
            ["ke-isyarat", "Suara ke isyarat"],
            ["ke-suara", "Isyarat ke suara"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            aria-selected={tab === value}
            type="button"
            onClick={() => setTab(value)}
            className={
              tab === value
                ? "flex-1 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
                : "flex-1 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
            }
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tab === "ke-isyarat" ? (
          <Translator alphabet={alphabet} clips={clips} />
        ) : (
          <SignToVoice clips={clips} />
        )}
      </div>
    </div>
  );
}
