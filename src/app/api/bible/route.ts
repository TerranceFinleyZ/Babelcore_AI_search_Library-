import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TRANSLATIONS = new Set(["kjv", "web", "asv", "bbe", "darby", "ylt", "niv", "esv"]);
const BIBLE_API_BASE = "https://bible-api.com";
const MAX_REF_LENGTH = 100;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawRef = searchParams.get("reference")?.trim() ?? "";
  const translation = searchParams.get("translation")?.toLowerCase().trim() ?? "kjv";

  if (!rawRef) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  if (rawRef.length > MAX_REF_LENGTH) {
    return NextResponse.json({ error: "Reference too long" }, { status: 400 });
  }

  // Whitelist translation to prevent injection
  const safeTranslation = ALLOWED_TRANSLATIONS.has(translation) ? translation : "kjv";

  // Only allow alphanumeric, spaces, colons, hyphens, commas and plus signs (valid reference chars)
  const safeRef = rawRef.replace(/[^a-zA-Z0-9\s:,+\-]/g, "").trim();
  if (!safeRef) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }

  const encodedRef = encodeURIComponent(safeRef);
  const url = `${BIBLE_API_BASE}/${encodedRef}?translation=${safeTranslation}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      // 5-second timeout
      signal: AbortSignal.timeout(5000),
    });

    if (!upstream.ok) {
      if (upstream.status === 404) {
        return NextResponse.json({ error: "Verse not found. Check the reference and try again." }, { status: 404 });
      }
      return NextResponse.json({ error: "Bible API error" }, { status: upstream.status });
    }

    const data: unknown = await upstream.json();

    // Validate the shape we expect
    if (
      typeof data !== "object" ||
      data === null ||
      !("text" in data) ||
      !("reference" in data)
    ) {
      return NextResponse.json({ error: "Unexpected response from Bible API" }, { status: 502 });
    }

    const { text, reference, translation_id, translation_name, verses } = data as {
      text: string;
      reference: string;
      translation_id: string;
      translation_name: string;
      verses: Array<{ book_name: string; chapter: number; verse: number; text: string }>;
    };

    return NextResponse.json({
      text: String(text).trim(),
      reference: String(reference),
      translation_id: String(translation_id ?? safeTranslation),
      translation_name: String(translation_name ?? ""),
      verses: Array.isArray(verses)
        ? verses.map((v) => ({
            book_name: String(v.book_name),
            chapter: Number(v.chapter),
            verse: Number(v.verse),
            text: String(v.text).trim(),
          }))
        : [],
    });
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "Bible API timed out" : "Failed to fetch Bible verse" },
      { status: 503 }
    );
  }
}
