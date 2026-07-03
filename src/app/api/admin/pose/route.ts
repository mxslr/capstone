/*
 * API penyimpanan pose untuk Pose Studio (alat authoring lokal).
 * Menulis override ke scripts/pose_overrides.json lalu meregenerasi
 * public/poses/alphabet.json. Hanya berfungsi saat dev di mesin lokal,
 * di deployment produksi filesystem read-only dan route ini menolak.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const OVERRIDES_PATH = path.join(process.cwd(), "scripts", "pose_overrides.json");

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Pose Studio hanya untuk lingkungan pengembangan lokal" },
      { status: 403 },
    );
  }
  try {
    const { letter, override } = await req.json();
    if (typeof letter !== "string" || !/^[A-Z]$/.test(letter)) {
      return NextResponse.json({ error: "Huruf tidak valid" }, { status: 400 });
    }
    const overrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));
    if (override === null) {
      delete overrides[letter];
    } else {
      overrides[letter] = override;
    }
    fs.writeFileSync(
      OVERRIDES_PATH,
      JSON.stringify(overrides, null, 2),
      "utf8",
    );
    execFileSync("node", ["scripts/build_poses.mjs"], { cwd: process.cwd() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Gagal menyimpan pose" },
      { status: 500 },
    );
  }
}
