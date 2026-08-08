import { NextResponse } from "next/server";

const SYMBOLS = [
  "AAPL","MSFT","NVDA","GOOGL","TSLA","AMZN","META","BRK-B",
  "JPM","V","UNH","JNJ","XOM","WMT","PG","MA","HD","CVX",
  "MRK","ABBV","LLY","PEP","KO","COST","AVGO","ORCL","CSCO",
  "ACN","MCD","CRM","BAC","NFLX","ADBE","AMD","INTC","QCOM","TXN",
  "IBM","GE","BA","CAT","MMM","GS","MS","C","WFC","PYPL","UBER",
];

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept": "application/json",
  "Accept-Language": "en-US,en;q=0.9",
};

async function fetchQuote(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  const price: number = meta.regularMarketPrice ?? 0;
  const prev: number = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    symbol: meta.symbol,
    shortName: meta.shortName ?? meta.longName ?? symbol,
    regularMarketPrice: price,
    regularMarketChange: change,
    regularMarketChangePercent: changePct,
    regularMarketPreviousClose: prev,
    regularMarketOpen: meta.regularMarketOpen ?? prev,
    regularMarketDayHigh: meta.regularMarketDayHigh ?? price,
    regularMarketDayLow: meta.regularMarketDayLow ?? price,
    regularMarketVolume: meta.regularMarketVolume ?? 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? price,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? price,
    marketCap: meta.marketCap ?? 0,
  };
}

export async function GET() {
  try {
    const results = await Promise.allSettled(SYMBOLS.map(fetchQuote));
    const quotes = results
      .filter((r): r is PromiseFulfilledResult<NonNullable<Awaited<ReturnType<typeof fetchQuote>>>> =>
        r.status === "fulfilled" && r.value !== null)
      .map(r => r.value);
    return NextResponse.json({ quotes });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
