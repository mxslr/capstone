"use client";

/*
 * Clip Studio: rekam gerakan isyarat kata lewat webcam admin, tinjau
 * hasilnya di avatar, lalu simpan menimpa klip kata. Deteksi tangan
 * berjalan on-device, tidak ada video yang dikirim ke server, hanya
 * lintasan sendi yang disimpan.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconCamera, IconCheck, IconRepeat, IconShield } from "@/components/icons";
import {
  clipFrameToPose,
  SignStage,
  useSignPlayer,
  type PlayItem,
} from "@/components/sign-player";
import type { LetterPose } from "@/components/avatar-viewer";
import { framesToClip } from "@/lib/clip-capture";
import type { WordClip } from "@/lib/vocabulary";
import { wordFrameFeatures } from "@/lib/word-features";

const RECORD_MS = 4000;
const CAPTURE_FPS = 15;

type Phase = "consent" | "loading" | "ready" | "recording" | "error";

export function ClipStudio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const capturedRef = useRef<Float32Array[]>([]);
  const recordingRef = useRef(false);
  const lastCaptureRef = useRef(0);

  const [phase, setPhase] = useState<Phase>("consent");
  const [error, setError] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [clips, setClips] = useState<Record<string, WordClip>>({});
  const [alphabet, setAlphabet] = useState<Record<string, LetterPose>>({});
  const [word, setWord] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const [draft, setDraft] = useState<WordClip | null>(null);
  const [status, setStatus] = useState("");
  /* penyesuaian posisi gerakan per tangan setelah rekam: offset dan skala */
  const defaultAdjust = {
    right: { off: [0, 0] as [number, number], scale: 1 },
    left: { off: [0, 0] as [number, number], scale: 1 },
  };
  const [adjust, setAdjust] = useState(defaultAdjust);

  const adjustedDraft = useMemo<WordClip | null>(() => {
    if (!draft) return null;
    const clampOff = (v: number) => Math.max(-0.45, Math.min(0.45, v));
    const tx = (
      w: [number, number] | null | undefined,
      a: { off: [number, number]; scale: number },
    ): [number, number] | null =>
      w
        ? [clampOff(w[0] * a.scale + a.off[0]), clampOff(w[1] * a.scale + a.off[1])]
        : null;
    return {
      ...draft,
      frames: draft.frames.map((f) => ({
        ...f,
        rightWrist: tx(f.rightWrist, adjust.right),
        leftWrist: tx(f.leftWrist, adjust.left),
      })),
    };
  }, [draft, adjust]);

  const player = useSignPlayer(alphabet);

  useEffect(() => {
    fetch(`/clips/words.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then((c: Record<string, WordClip>) => {
        setClips(c);
        const list = Object.keys(c).sort();
        setWords(list);
        setWord(list[0] ?? "");
      });
    fetch(`/poses/alphabet.json?v=${Date.now()}`)
      .then((r) => r.json())
      .then(setAlphabet);
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("consent");
  }, []);

  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    setPhase("loading");
    setError("");
    try {
      const { FilesetResolver, HandLandmarker, DrawingUtils } = await import(
        "@mediapipe/tasks-vision"
      );
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm",
      );
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task",
          delegate: "GPU",
        },
        numHands: 2,
        runningMode: "VIDEO",
        minHandDetectionConfidence: 0.4,
      });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play();
      setPhase("ready");

      let lastVideoTime = -1;
      const loop = () => {
        rafRef.current = requestAnimationFrame(loop);
        const v = videoRef.current;
        const c = canvasRef.current;
        if (!v || !c || v.currentTime === lastVideoTime) return;
        lastVideoTime = v.currentTime;
        const now = performance.now();
        const result = landmarker.detectForVideo(v, now);

        c.width = v.videoWidth;
        c.height = v.videoHeight;
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, c.width, c.height);
        const du = new DrawingUtils(ctx);
        for (const lms of result.landmarks) {
          du.drawConnectors(lms, HandLandmarker.HAND_CONNECTIONS, {
            color: "#0f766e",
            lineWidth: 2,
          });
        }

        if (recordingRef.current && now - lastCaptureRef.current >= 1000 / CAPTURE_FPS) {
          lastCaptureRef.current = now;
          capturedRef.current.push(wordFrameFeatures(result));
        }
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "Izin kamera ditolak. Beri izin kamera lalu coba lagi."
          : "Gagal memuat model atau kamera.",
      );
      setPhase("error");
    }
  }, []);

  const record = useCallback(() => {
    if (!word) return;
    setDraft(null);
    setAdjust(defaultAdjust);
    setStatus("");
    capturedRef.current = [];
    setPhase("recording");
    // hitung mundur 3 detik sebelum merekam
    let n = 3;
    setCountdown(n);
    const tick = setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n === 0) {
        clearInterval(tick);
        recordingRef.current = true;
        setTimeout(() => {
          recordingRef.current = false;
          setPhase("ready");
          const clip = framesToClip(word, capturedRef.current);
          if (!clip) {
            setStatus("Tangan tidak terdeteksi cukup lama, coba rekam ulang.");
            return;
          }
          setDraft(clip);
          setStatus(
            `Terekam ${clip.frames.length} frame (${clip.twoHanded ? "dua tangan" : "satu tangan"}). Tinjau lalu simpan.`,
          );
        }, RECORD_MS);
      }
    }, 1000);
  }, [word]);

  const preview = (clip: WordClip) => {
    const item: PlayItem = { kind: "word", word: clip.word, clip };
    void player.play([item]);
  };

  /* pratinjau statis: saat tidak sedang memutar, avatar menampilkan frame
   * tengah klip yang sedang diatur sehingga efek slider langsung terlihat */
  const stagePose = useMemo(() => {
    if (player.status.playing) return player.pose;
    if (adjustedDraft) {
      const mid =
        adjustedDraft.frames[Math.floor(adjustedDraft.frames.length / 2)];
      return clipFrameToPose(mid, adjustedDraft.twoHanded);
    }
    return player.pose;
  }, [player.status.playing, player.pose, adjustedDraft]);

  const save = async () => {
    if (!adjustedDraft) return;
    setStatus("Menyimpan...");
    const r = await fetch("/api/admin/clip", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ word, clip: adjustedDraft }),
    });
    if (r.ok) {
      setStatus(`Klip "${word}" tersimpan dan dipakai semua menu.`);
      setClips((c) => ({ ...c, [word]: adjustedDraft }));
      setDraft(null);
      setAdjust(defaultAdjust);
    } else {
      const e = await r.json().catch(() => ({ error: "gagal" }));
      setStatus(`Gagal: ${e.error}`);
    }
  };

  const cameraActive =
    phase === "ready" || phase === "recording" || phase === "loading";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="kata" className="text-sm font-medium">
            Kata:
          </label>
          <select
            id="kata"
            value={word}
            onChange={(e) => {
              setWord(e.target.value);
              setDraft(null);
              setStatus("");
            }}
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-accent"
          >
            {words.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (!clips[word]) return;
              setDraft(clips[word]);
              setAdjust(defaultAdjust);
              setStatus(
                "Klip lama dimuat, atur letaknya di panel kanan lalu simpan.",
              );
            }}
            disabled={!clips[word] || phase === "recording"}
            className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-surface disabled:opacity-50"
          >
            Edit klip lama
          </button>
        </div>

        {!cameraActive ? (
          <div className="mt-3 rounded-lg border border-border p-6">
            <IconShield className="text-accent" width={24} height={24} />
            <h2 className="mt-3 text-lg font-semibold tracking-tight">
              Rekam gerakan dengan kameramu
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li>
                Deteksi tangan berjalan di perangkat ini. Video tidak dikirim
                ke mana pun, yang disimpan hanya lintasan sendi tangan.
              </li>
              <li>
                Peragakan isyarat kata selama 4 detik, tinjau di avatar, lalu
                simpan. Untuk sekadar menggeser letak klip lama, kamera tidak
                perlu dinyalakan, pakai tombol Edit klip lama di atas.
              </li>
            </ul>
            {phase === "error" && (
              <p className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={start}
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
            >
              <IconCamera width={16} height={16} />
              Saya setuju, aktifkan kamera
            </button>
          </div>
        ) : (
          <>
            <div className="relative mt-3 overflow-hidden rounded-lg border border-border bg-surface">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 h-full w-full -scale-x-100"
              />
              {phase === "loading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <p className="text-sm text-muted">Memuat model dan kamera...</p>
                </div>
              )}
              {phase === "recording" && (
                <div className="absolute left-3 top-3 rounded-md bg-background/90 px-3 py-1.5 text-sm font-semibold">
                  {countdown > 0 ? `Mulai dalam ${countdown}...` : "MEREKAM"}
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={record}
                disabled={phase !== "ready"}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
              >
                <IconCamera width={15} height={15} />
                Rekam 4 detik
              </button>
              <button
                type="button"
                onClick={stop}
                className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-surface"
              >
                Hentikan kamera
              </button>
            </div>
          </>
        )}
        {status && <p className="mt-2 text-sm text-muted">{status}</p>}
      </div>

      <div>
        <p className="text-sm font-medium">Tinjauan avatar</p>
        <div className="mt-2">
          <SignStage pose={stagePose} status={player.status} transitionSpeed={9} />
        </div>
        {draft && (
          <div className="mt-3 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Atur letak gerakan</p>
            {(["right", "left"] as const).map((side) => (
              <div key={side} className="mt-2">
                <p className="text-xs font-medium text-muted">
                  Tangan {side === "right" ? "kanan" : "kiri"}
                </p>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {(
                    [
                      ["Kiri-kanan", "off", 0, -0.3, 0.3, 0.01],
                      ["Atas-bawah", "off", 1, -0.3, 0.3, 0.01],
                      ["Skala gerak", "scale", -1, 0.4, 2, 0.05],
                    ] as [string, "off" | "scale", number, number, number, number][]
                  ).map(([label, kind, idx, min, max, step]) => {
                    const value =
                      kind === "scale" ? adjust[side].scale : adjust[side].off[idx];
                    return (
                      <div key={label}>
                        <label className="flex justify-between text-xs text-muted">
                          <span>{label}</span>
                          <span className="font-mono">{value.toFixed(2)}</span>
                        </label>
                        <input
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={value}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setAdjust((a) => {
                              const s = { ...a[side] };
                              if (kind === "scale") s.scale = v;
                              else {
                                const off = [...s.off] as [number, number];
                                off[idx] = v;
                                s.off = off;
                              }
                              return { ...a, [side]: s };
                            });
                          }}
                          className="w-full accent-[var(--accent)]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="mt-2 text-xs text-muted">
              Perubahan diterapkan saat kamu memutar pratinjau dan ikut
              tersimpan.
            </p>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => adjustedDraft && preview(adjustedDraft)}
            disabled={!adjustedDraft}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
          >
            <IconRepeat width={15} height={15} />
            Putar rekaman baru
          </button>
          <button
            type="button"
            onClick={() => clips[word] && preview(clips[word])}
            disabled={!clips[word]}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface disabled:opacity-50"
          >
            Putar klip lama
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!draft}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong disabled:opacity-50"
          >
            <IconCheck width={15} height={15} />
            Simpan klip {word}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Simpan menimpa klip kata ini di public/clips/words.json dan langsung
          dipakai penerjemah serta roleplay. Rekam ulang kapan saja kalau belum
          puas, klip lama tetap ada sampai kamu menyimpan yang baru.
        </p>
      </div>
    </div>
  );
}
