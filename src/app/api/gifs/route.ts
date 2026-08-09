import { NextRequest, NextResponse } from "next/server";

const KEY  = process.env.TENOR_API_KEY;
const BASE = "https://tenor.googleapis.com/v2";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const endpoint = q
    ? `${BASE}/search?q=${encodeURIComponent(q)}&key=${KEY}&limit=24&media_filter=gif,tinygif`
    : `${BASE}/featured?key=${KEY}&limit=24&media_filter=gif,tinygif`;
  const res  = await fetch(endpoint);
  const data = await res.json();
  return NextResponse.json(data);
}
