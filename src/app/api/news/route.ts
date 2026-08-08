import { NextResponse } from "next/server";

const SOURCES = [
  { name: "Fox News", url: "https://feeds.foxnews.com/foxnews/latest" },
  { name: "NY Post", url: "https://nypost.com/feed/" },
  { name: "Washington Times", url: "https://www.washingtontimes.com/rss/headlines/news/" },
  { name: "Daily Signal", url: "https://www.dailysignal.com/feed/" },
  { name: "Washington Examiner", url: "https://www.washingtonexaminer.com/tag/news.rss" },
];

type Article = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
};

function extractText(xml: string, tag: string): string {
  const cdataMatch = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, "i"));
  if (cdataMatch) return cdataMatch[1].trim();
  const plainMatch = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return plainMatch ? plainMatch[1].replace(/<[^>]+>/g, "").trim() : "";
}

function extractItems(xml: string, sourceName: string): Article[] {
  const items: Article[] = [];
  const itemRegex = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractText(block, "title");
    const linkMatch = block.match(/<link>([^<]+)<\/link>/) ?? block.match(/<link[^>]+href="([^"]+)"/);
    const link = linkMatch?.[1]?.trim() ?? "";
    const pubDate = extractText(block, "pubDate");
    const description = extractText(block, "description").slice(0, 200);

    if (title && link) {
      items.push({ title, link, pubDate, description, source: sourceName });
    }
    if (items.length >= 8) break;
  }
  return items;
}

export async function GET() {
  const results = await Promise.allSettled(
    SOURCES.map(async (src) => {
      const res = await fetch(src.url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; CoreApp/1.0)" },
        next: { revalidate: 300 }, // cache 5 min
      });
      if (!res.ok) throw new Error(`${src.name}: ${res.status}`);
      const xml = await res.text();
      return extractItems(xml, src.name);
    })
  );

  const articles: Article[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") articles.push(...r.value);
  }

  // Sort by pubDate descending, most recent first
  articles.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  return NextResponse.json({ articles: articles.slice(0, 30) });
}
