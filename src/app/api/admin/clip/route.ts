/*
 * API penyimpanan klip kata untuk Clip Studio (alat authoring lokal).
 * Menimpa entri kata di public/clips/words.json. Dev-only.
 */

import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const CLIPS_PATH = path.join(process.cwd(), "public", "clips", "words.json");

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Clip Studio hanya untuk lingkungan pengembangan lokal" },
      { status: 403 },
    );
  }
  try {
    const { word, clip } = await req.json();
    if (typeof word !== "string" || !/^[a-z]+$/.test(word)) {
      return NextResponse.json({ error: "Kata tidak valid" }, { status: 400 });
    }
    const clips = JSON.parse(fs.readFileSync(CLIPS_PATH, "utf8"));
    if (clip === null) {
      return NextResponse.json(
        { error: "Klip kosong tidak bisa disimpan" },
        { status: 400 },
      );
    }
    clips[word] = clip;
    fs.writeFileSync(CLIPS_PATH, JSON.stringify(clips), "utf8");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan klip" }, { status: 500 });
  }
}
