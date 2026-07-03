/*
 * Bangun pose tangan avatar per huruf dari data landmark dataset BISINDO.
 * Untuk tiap huruf, ambil median sudut tekuk (curl) tiap sendi jari dari
 * seluruh sampel train, supaya pose avatar berakar pada data asli, bukan
 * karangan. Keluaran: public/poses/alphabet.json
 */

import fs from "node:fs";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "landmarks_train.json");
const outPath = path.join(process.cwd(), "public", "poses", "alphabet.json");

const { X, y, letters } = JSON.parse(fs.readFileSync(dataPath, "utf8"));

// rantai landmark per jari: [root..tip]
const FINGERS = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};

function getPoint(feat, handOffset, idx) {
  return [
    feat[handOffset + idx * 3],
    feat[handOffset + idx * 3 + 1],
    feat[handOffset + idx * 3 + 2],
  ];
}

function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function angleBetween(u, v) {
  const du = Math.hypot(...u);
  const dv = Math.hypot(...v);
  if (du < 1e-6 || dv < 1e-6) return 0;
  const cos = (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (du * dv);
  return Math.acos(Math.min(1, Math.max(-1, cos)));
}

/* Sudut tekuk pada 3 sendi jari: pangkal (wrist/CMC -> MCP -> PIP),
 * tengah (MCP -> PIP -> DIP), ujung (PIP -> DIP -> TIP). */
function fingerCurls(feat, handOffset, chain) {
  const wrist = getPoint(feat, handOffset, 0);
  const pts = chain.map((i) => getPoint(feat, handOffset, i));
  const joints = [wrist, ...pts];
  const curls = [];
  for (let j = 1; j <= 3; j++) {
    const v1 = sub(joints[j], joints[j - 1]);
    const v2 = sub(joints[j + 1], joints[j]);
    curls.push(angleBetween(v1, v2));
  }
  return curls;
}

function median(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

const overrides = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "scripts", "pose_overrides.json"),
    "utf8",
  ),
);

function applyOverride(pose, ov) {
  if (!ov) return pose;
  if (ov.disableLeft) pose.left = null;
  if (ov.disableRight) pose.right = null;
  for (const side of ["left", "right"]) {
    if (side === "left" && ov.disableLeft) continue;
    if (side === "right" && ov.disableRight) continue;
    const o = ov[side];
    if (!o) continue;
    if (!pose[side]) pose[side] = { usage: 1 };
    if (o.fingers) {
      for (const [finger, curls] of Object.entries(o.fingers)) {
        pose[side][finger] = curls;
      }
    }
    if (o.fingerDir) pose[side].fingerDir = o.fingerDir;
    if (o.palmNormal) pose[side].palmNormal = o.palmNormal;
  }
  if (ov.twoHanded) {
    if (pose.left) pose.left.usage = 1;
    if (pose.right) pose.right.usage = 1;
  }
  if (ov.layout) {
    if (ov.layout.rightWrist) pose.rightWrist = ov.layout.rightWrist;
    if (ov.layout.leftWrist) pose.leftWrist = ov.layout.leftWrist;
  }
  return pose;
}

const poses = {};
for (let li = 0; li < letters.length; li++) {
  const samples = [];
  for (let i = 0; i < y.length; i++) {
    if (y[i] === li) samples.push(X[i]);
  }
  const hand = (offset, flagIdx) => {
    const present = samples.filter((f) => f[flagIdx] > 0.5);
    if (present.length < 10) return null;
    const out = {};
    for (const [name, chain] of Object.entries(FINGERS)) {
      const per = [[], [], []];
      for (const f of present) {
        const c = fingerCurls(f, offset, chain);
        c.forEach((v, k) => per[k].push(v));
      }
      out[name] = per.map((a) => +median(a).toFixed(4));
    }

    /* Orientasi tangan: arah jari (wrist -> MCP jari tengah) dan normal
     * telapak (cross MCP telunjuk x MCP kelingking, keduanya dari wrist).
     * Median per komponen, lalu dipetakan ke sumbu dunia avatar:
     * (x, y, z) gambar -> (x, -y, -z) dunia. */
    const dirs = { fx: [], fy: [], fz: [], nx: [], ny: [], nz: [] };
    for (const f of present) {
      const middle = getPoint(f, offset, 9);
      const index = getPoint(f, offset, 5);
      const pinky = getPoint(f, offset, 17);
      dirs.fx.push(middle[0]);
      dirs.fy.push(middle[1]);
      dirs.fz.push(middle[2]);
      const n = [
        index[1] * pinky[2] - index[2] * pinky[1],
        index[2] * pinky[0] - index[0] * pinky[2],
        index[0] * pinky[1] - index[1] * pinky[0],
      ];
      const ln = Math.hypot(...n);
      if (ln > 1e-6) {
        dirs.nx.push(n[0] / ln);
        dirs.ny.push(n[1] / ln);
        dirs.nz.push(n[2] / ln);
      }
    }
    const toWorld = (x, y, z) => {
      const len = Math.hypot(x, y, z);
      return len < 1e-6
        ? null
        : [+(x / len).toFixed(3), +(-y / len).toFixed(3), +(-z / len).toFixed(3)];
    };
    out.fingerDir = toWorld(median(dirs.fx), median(dirs.fy), median(dirs.fz));
    out.palmNormal = toWorld(median(dirs.nx), median(dirs.ny), median(dirs.nz));

    out.usage = +(present.length / samples.length).toFixed(3);
    return out;
  };
  poses[letters[li]] = applyOverride(
    {
      left: hand(0, 126),
      right: hand(63, 127),
      samples: samples.length,
    },
    overrides[letters[li]],
  );
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(poses));
const twoHanded = Object.entries(poses).filter(([, p]) => p.left && p.right);
console.log(
  `Tersimpan ${Object.keys(poses).length} pose ke ${outPath}, ` +
    `${twoHanded.length} huruf terdeteksi dua tangan`,
);
for (const [l, p] of Object.entries(poses)) {
  console.log(
    `${l}: kiri=${p.left ? p.left.usage : "-"} kanan=${p.right ? p.right.usage : "-"} (${p.samples} sampel)`,
  );
}
