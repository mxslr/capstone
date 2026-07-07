import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

/* Tukar kode OAuth (Google) menjadi sesi, lalu kembali ke halaman tujuan. */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/belajar";

  if (code) {
    const supabase = await getSupabaseServer();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/belajar"}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/masuk?error=oauth`);
}
