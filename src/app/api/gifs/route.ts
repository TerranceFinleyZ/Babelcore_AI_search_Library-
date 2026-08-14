import { NextRequest, NextResponse } from "next/server";

const BASE = "https://tenor.googleapis.com/v2";

export async function GET(req: NextRequest) {
  const KEY = process.env.TENOR_API_KEY;
  if (!KEY) {
    return NextResponse.json({ error: "GIF service not configured." }, { status: 503 });
  }

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const endpoint = q
    ? `${BASE}/search?q=${encodeURIComponent(q)}&key=${KEY}&limit=24&media_filter=gif,tinygif`
    : `${BASE}/featured?key=${KEY}&limit=24&media_filter=gif,tinygif`;

  try {
    const res = await fetch(endpoint);
    if (!res.ok) {
      return NextResponse.json({ error: "Tenor request failed.", results: [] }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to reach Tenor.", results: [] }, { status: 502 });
  }
}
