"use client";

import { useEffect, useState } from "react";
import type { LetterPose } from "@/components/avatar-viewer";
import { Roleplay } from "@/components/roleplay";
import type { WordClip } from "@/lib/vocabulary";

export function RoleplayLoader() {
  const [alphabet, setAlphabet] = useState<Record<string, LetterPose> | null>(
    null,
  );
  const [clips, setClips] = useState<Record<string, WordClip> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setAlphabet)
      .catch(() => setError(true));
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
  return <Roleplay alphabet={alphabet} clips={clips} />;
}
