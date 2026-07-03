"use client";

/*
 * Penerjemah dua arah SAPA.
 * Suara ke isyarat: Web Speech API (atau ketik teks), kata dalam kosakata
 * diperagakan sebagai klip, kata lain dieja huruf demi huruf.
 * Isyarat ke suara: ada di komponen sign-to-voice (kamera on-device).
 */

import { useEffect, useRef, useState } from "react";
import type { LetterPose } from "@/components/avatar-viewer";
import { IconMic } from "@/components/icons";
import { SignStage, useSignPlayer, type PlayItem } from "@/components/sign-player";
import { tokenize, type WordClip } from "@/lib/vocabulary";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function getRecognizer(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, new () => SpeechRecognitionLike>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export function Translator({
  alphabet,
  clips,
}: {
  alphabet: Record<string, LetterPose>;
  clips: Record<string, WordClip>;
}) {
  const { pose, status, play, stop, speed, setSpeed } = useSignPlayer(alphabet);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [sttSupported, setSttSupported] = useState(true);
  const [lastTokens, setLastTokens] = useState<
    { word: string; inVocab: boolean }[]
  >([]);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSttSupported(getRecognizer() !== null);
    return stop;
  }, [stop]);

  const translate = (input: string) => {
    const raw = tokenize(input);
    if (!raw.length) return;
    // gabungkan frasa dua kata yang ada di kosakata, misal "terima kasih"
    const tokens: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      const merged = raw[i] + (raw[i + 1] ?? "");
      if (raw[i + 1] && clips[merged]) {
        tokens.push(merged);
        i++;
      } else {
        tokens.push(raw[i]);
      }
    }
    const items: PlayItem[] = tokens.map((w) =>
      clips[w]
        ? { kind: "word", word: w, clip: clips[w] }
        : { kind: "spell", word: w },
    );
    setLastTokens(tokens.map((w) => ({ word: w, inVocab: !!clips[w] })));
    void play(items);
  };

  const toggleMic = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = getRecognizer();
    if (!rec) return;
    recRef.current = rec;
    rec.lang = "id-ID";
    rec.interimResults = false;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from({ length: e.results.length })
        .map((_, i) => e.results[i][0].transcript)
        .join(" ");
      setText(transcript);
      translate(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const vocabCount = Object.keys(clips).length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <SignStage pose={pose} status={status} transitionSpeed={9} />
        {lastTokens.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {lastTokens.map((t, i) => (
              <span
                key={`${t.word}-${i}`}
                className={
                  t.inVocab
                    ? "rounded-full border border-accent px-2.5 py-0.5 text-xs font-medium text-accent"
                    : "rounded-full border border-border px-2.5 py-0.5 text-xs text-muted"
                }
              >
                {t.word}
                {!t.inVocab && ", dieja"}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="ucapan" className="text-sm font-medium">
          Ucapan atau teks
        </label>
        <textarea
          id="ucapan"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Contoh: halo, apa kabar"
          className="mt-2 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => translate(text)}
            disabled={status.playing}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            Peragakan
          </button>
          {sttSupported && (
            <button
              type="button"
              onClick={toggleMic}
              className={
                listening
                  ? "inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
                  : "inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
              }
            >
              <IconMic width={15} height={15} />
              {listening ? "Mendengarkan..." : "Bicara"}
            </button>
          )}
          {status.playing && (
            <button
              type="button"
              onClick={stop}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
            >
              Berhenti
            </button>
          )}
        </div>
        <div className="mt-4">
          <label htmlFor="kecepatan" className="text-xs text-muted">
            Kecepatan peragaan: {speed.toFixed(1)}x
          </label>
          <input
            id="kecepatan"
            type="range"
            min={0.5}
            max={1.5}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mt-1 w-full accent-[var(--accent)]"
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted">
          Kosakata klip saat ini {vocabCount} kata dari dataset publik
          WL-BISINDO. Kata di luar itu dieja huruf demi huruf. Pengenalan suara
          memakai layanan browser (Web Speech API).
        </p>
      </div>
    </div>
  );
}
