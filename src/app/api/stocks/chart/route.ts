import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1mo`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) return NextResponse.json({ error: "upstream error" }, { status: 502 });
    const data = await res.json();
    const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    const timestamps: number[] = data?.chart?.result?.[0]?.timestamp ?? [];
    const meta = data?.chart?.result?.[0]?.meta ?? {};
    return NextResponse.json({ closes, timestamps, meta });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
