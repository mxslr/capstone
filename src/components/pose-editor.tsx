"use client";

/*
 * Pose Studio: alat admin untuk membentuk pose isyarat avatar per huruf.
 * Slider per sendi jari, orientasi arah jari dan putaran telapak, posisi
 * tangan (slider atau drag langsung di kanvas), lalu simpan. Penyimpanan
 * menulis scripts/pose_overrides.json dan meregenerasi pose sehingga
 * dipakai konsisten oleh belajar, kuis, terjemah, dan roleplay.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AvatarViewer, type HandPose, type LetterPose } from "@/components/avatar-viewer";
import { IconCheck, IconRepeat } from "@/components/icons";
import {
  anglesFromDir,
  dirFromAngles,
  normalFromRoll,
  rollFromNormal,
  type Vec3,
} from "@/lib/pose-editor-math";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const FINGERS = ["thumb", "index", "middle", "ring", "pinky"] as const;
const FINGER_LABEL: Record<(typeof FINGERS)[number], string> = {
  thumb: "Jempol",
  index: "Telunjuk",
  middle: "Tengah",
  ring: "Manis",
  pinky: "Kelingking",
};
const PRESETS: { label: string; curls: [number, number, number] }[] = [
  { label: "Lurus", curls: [0, 0, 0] },
  { label: "Tekuk", curls: [0.8, 0.9, 0.5] },
  { label: "Genggam", curls: [1.5, 1.6, 1.0] },
];

type HandState = {
  enabled: boolean;
  fingers: Record<(typeof FINGERS)[number], [number, number, number]>;
  az: number;
  el: number;
  roll: number;
  useOrientation: boolean;
  wrist: [number, number];
};

type EditorState = {
  right: HandState;
  left: HandState;
};

function defaultHand(enabled: boolean): HandState {
  return {
    enabled,
    fingers: {
      thumb: [0.9, 0.7, 0.5],
      index: [0, 0, 0],
      middle: [1.5, 1.6, 1.0],
      ring: [1.5, 1.6, 1.0],
      pinky: [1.5, 1.6, 1.0],
    },
    az: 10,
    el: 70,
    roll: 0,
    useOrientation: true,
    wrist: [0, 0],
  };
}

function handFromPose(
  hand: HandPose | null | undefined,
  wrist: [number, number] | null | undefined,
): HandState {
  if (!hand) return { ...defaultHand(false) };
  const fingers = {} as HandState["fingers"];
  for (const f of FINGERS) {
    const c = hand[f] ?? [0, 0, 0];
    fingers[f] = [c[0] ?? 0, c[1] ?? 0, c[2] ?? 0];
  }
  let az = 10;
  let el = 70;
  let roll = 0;
  let useOrientation = false;
  if (hand.fingerDir) {
    useOrientation = true;
    const a = anglesFromDir(hand.fingerDir as Vec3);
    az = Math.round(a.az);
    el = Math.round(a.el);
    if (hand.palmNormal) {
      roll = Math.round(
        rollFromNormal(hand.fingerDir as Vec3, hand.palmNormal as Vec3),
      );
    }
  }
  return {
    enabled: true,
    fingers,
    az,
    el,
    roll,
    useOrientation,
    wrist: [wrist?.[0] ?? 0, wrist?.[1] ?? 0],
  };
}

function handToPose(h: HandState): HandPose | null {
  if (!h.enabled) return null;
  const pose: HandPose = {
    thumb: h.fingers.thumb,
    index: h.fingers.index,
    middle: h.fingers.middle,
    ring: h.fingers.ring,
    pinky: h.fingers.pinky,
    usage: 1,
  };
  if (h.useOrientation) {
    const dir = dirFromAngles(h.az, h.el);
    pose.fingerDir = dir;
    pose.palmNormal = normalFromRoll(dir, h.roll);
  }
  return pose;
}

export function PoseEditor() {
  const [letter, setLetter] = useState("A");
  const [poses, setPoses] = useState<Record<string, LetterPose> | null>(null);
  const [state, setState] = useState<EditorState | null>(null);
  const [activeHand, setActiveHand] = useState<"right" | "left">("right");
  const [status, setStatus] = useState<string>("");
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const loadPoses = useCallback(async () => {
    const r = await fetch(`/poses/alphabet.json?t=${Date.now()}`);
    const data = (await r.json()) as Record<string, LetterPose>;
    setPoses(data);
    return data;
  }, []);

  const loadLetter = useCallback(
    (l: string, data: Record<string, LetterPose>) => {
      const p = data[l];
      setState({
        right: handFromPose(p?.right, p?.rightWrist ?? null),
        left: handFromPose(p?.left, p?.leftWrist ?? null),
      });
    },
    [],
  );

  useEffect(() => {
    void loadPoses().then((d) => loadLetter(letter, d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickLetter = (l: string) => {
    setLetter(l);
    setStatus("");
    if (poses) loadLetter(l, poses);
  };

  const livePose: LetterPose | null = useMemo(() => {
    if (!state) return null;
    const right = handToPose(state.right);
    const left = handToPose(state.left);
    return {
      right,
      left,
      samples: 0,
      forceTwoHanded: !!(right && left),
      rightWrist: state.right.enabled ? state.right.wrist : null,
      leftWrist: state.left.enabled ? state.left.wrist : null,
    };
  }, [state]);

  const patchHand = (side: "right" | "left", patch: Partial<HandState>) => {
    setState((s) => (s ? { ...s, [side]: { ...s[side], ...patch } } : s));
  };

  const setCurl = (
    side: "right" | "left",
    finger: (typeof FINGERS)[number],
    joint: number,
    value: number,
  ) => {
    setState((s) => {
      if (!s) return s;
      const fingers = { ...s[side].fingers };
      const curls = [...fingers[finger]] as [number, number, number];
      curls[joint] = value;
      fingers[finger] = curls;
      return { ...s, [side]: { ...s[side], fingers } };
    });
  };

  const save = async (override: unknown) => {
    setStatus("Menyimpan...");
    const r = await fetch("/api/admin/pose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ letter, override }),
    });
    if (r.ok) {
      setStatus(override === null ? "Kembali ke pose data" : "Tersimpan");
      const d = await loadPoses();
      loadLetter(letter, d);
    } else {
      const e = await r.json().catch(() => ({ error: "gagal" }));
      setStatus(`Gagal: ${e.error}`);
    }
  };

  const buildOverride = () => {
    if (!state) return null;
    const sideOverride = (h: HandState) => {
      if (!h.enabled) return undefined;
      const o: Record<string, unknown> = {
        fingers: Object.fromEntries(
          FINGERS.map((f) => [f, h.fingers[f].map((v) => +v.toFixed(2))]),
        ),
      };
      if (h.useOrientation) {
        const dir = dirFromAngles(h.az, h.el);
        o.fingerDir = dir.map((v) => +v.toFixed(3));
        o.palmNormal = normalFromRoll(dir, h.roll).map((v) => +v.toFixed(3));
      }
      return o;
    };
    const layout: Record<string, unknown> = {};
    if (state.right.enabled)
      layout.rightWrist = state.right.wrist.map((v) => +v.toFixed(3));
    if (state.left.enabled)
      layout.leftWrist = state.left.wrist.map((v) => +v.toFixed(3));
    return {
      twoHanded: state.right.enabled && state.left.enabled,
      disableRight: !state.right.enabled || undefined,
      disableLeft: !state.left.enabled || undefined,
      right: sideOverride(state.right),
      left: sideOverride(state.left),
      layout,
    };
  };

  // drag di kanvas menggeser posisi tangan aktif
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !state) return;
    const dx = (e.clientX - dragRef.current.x) / 600;
    const dy = (e.clientY - dragRef.current.y) / 600;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const h = state[activeHand];
    patchHand(activeHand, {
      wrist: [
        Math.max(-0.4, Math.min(0.4, h.wrist[0] + dx)),
        Math.max(-0.5, Math.min(0.4, h.wrist[1] + dy)),
      ],
    });
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  if (!state) {
    return <p className="text-sm text-muted">Memuat pose...</p>;
  }

  const hand = state[activeHand];

  return (
    <div>
      <div className="flex flex-wrap gap-1">
        {LETTERS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => pickLetter(l)}
            className={
              letter === l
                ? "h-8 w-8 rounded-md bg-accent text-sm font-semibold text-white"
                : "h-8 w-8 rounded-md border border-border text-sm font-medium hover:border-accent"
            }
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div
            className="relative aspect-[4/3] cursor-move overflow-hidden rounded-lg border border-border bg-surface sm:aspect-[16/10]"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <AvatarViewer pose={livePose} transitionSpeed={10} viaNeutral={false} />
            <p className="absolute bottom-3 left-3 rounded-md bg-background/90 px-2.5 py-1 text-xs text-muted">
              Drag untuk menggeser tangan {activeHand === "right" ? "kanan" : "kiri"}
            </p>
            <span className="absolute left-3 top-3 rounded-md bg-background/90 px-3 py-1.5 text-2xl font-semibold text-accent">
              {letter}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => save(buildOverride())}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
            >
              <IconCheck width={15} height={15} />
              Simpan pose {letter}
            </button>
            <button
              type="button"
              onClick={() => save(null)}
              className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-surface"
            >
              <IconRepeat width={15} height={15} />
              Reset ke pose data
            </button>
            {status && <span className="text-sm text-muted">{status}</span>}
          </div>
        </div>

        <div>
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {(["right", "left"] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setActiveHand(side)}
                className={
                  activeHand === side
                    ? "flex-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white"
                    : "flex-1 rounded-md px-3 py-1.5 text-sm text-muted hover:text-foreground"
                }
              >
                Tangan {side === "right" ? "kanan" : "kiri"}
              </button>
            ))}
          </div>

          <label className="mt-3 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hand.enabled}
              onChange={(e) => patchHand(activeHand, { enabled: e.target.checked })}
              className="accent-[var(--accent)]"
            />
            Tangan ini dipakai
          </label>

          {hand.enabled && (
            <>
              <p className="mt-4 text-sm font-medium">Jari</p>
              <div className="mt-2 space-y-3">
                {FINGERS.map((f) => (
                  <div key={f} className="rounded-md border border-border p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{FINGER_LABEL[f]}</span>
                      <span className="flex gap-1">
                        {PRESETS.map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() =>
                              setState((s) => {
                                if (!s) return s;
                                const fingers = {
                                  ...s[activeHand].fingers,
                                  [f]: [...p.curls] as [number, number, number],
                                };
                                return {
                                  ...s,
                                  [activeHand]: { ...s[activeHand], fingers },
                                };
                              })
                            }
                            className="rounded border border-border px-1.5 py-0.5 text-xs text-muted hover:border-accent hover:text-accent"
                          >
                            {p.label}
                          </button>
                        ))}
                      </span>
                    </div>
                    <div className="mt-1.5 flex gap-2">
                      {[0, 1, 2].map((j) => (
                        <input
                          key={j}
                          type="range"
                          min={0}
                          max={2}
                          step={0.05}
                          value={hand.fingers[f][j]}
                          onChange={(e) =>
                            setCurl(activeHand, f, j, Number(e.target.value))
                          }
                          className="w-full accent-[var(--accent)]"
                          aria-label={`${FINGER_LABEL[f]} sendi ${j + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={hand.useOrientation}
                  onChange={(e) =>
                    patchHand(activeHand, { useOrientation: e.target.checked })
                  }
                  className="accent-[var(--accent)]"
                />
                Atur orientasi tangan
              </label>
              {hand.useOrientation && (
                <div className="mt-2 space-y-2.5 rounded-md border border-border p-2.5">
                  {(
                    [
                      ["Arah jari kiri-kanan", "az", -180, 180],
                      ["Arah jari atas-bawah", "el", -90, 90],
                      ["Putar telapak", "roll", -180, 180],
                    ] as [string, "az" | "el" | "roll", number, number][]
                  ).map(([label, key, min, max]) => (
                    <div key={key}>
                      <label className="flex justify-between text-xs text-muted">
                        <span>{label}</span>
                        <span className="font-mono">{hand[key]}°</span>
                      </label>
                      <input
                        type="range"
                        min={min}
                        max={max}
                        step={1}
                        value={hand[key]}
                        onChange={(e) =>
                          patchHand(activeHand, { [key]: Number(e.target.value) })
                        }
                        className="w-full accent-[var(--accent)]"
                      />
                    </div>
                  ))}
                </div>
              )}

              <p className="mt-4 text-sm font-medium">Posisi tangan</p>
              <div className="mt-2 space-y-2.5 rounded-md border border-border p-2.5">
                {(
                  [
                    ["Geser kiri-kanan", 0, -0.4, 0.4],
                    ["Geser atas-bawah", 1, -0.5, 0.4],
                  ] as [string, number, number, number][]
                ).map(([label, idx, min, max]) => (
                  <div key={label}>
                    <label className="flex justify-between text-xs text-muted">
                      <span>{label}</span>
                      <span className="font-mono">{hand.wrist[idx].toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={0.01}
                      value={hand.wrist[idx]}
                      onChange={(e) => {
                        const wrist = [...hand.wrist] as [number, number];
                        wrist[idx] = Number(e.target.value);
                        patchHand(activeHand, { wrist });
                      }}
                      className="w-full accent-[var(--accent)]"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
