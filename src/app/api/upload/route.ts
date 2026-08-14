import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "File too large (max 20 MB)" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name;
  const mime = file.type;

  try {
    if (mime === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
      const pdfParseModule = await import("pdf-parse");
      // pdf-parse may export as default or as the function itself depending on the build
      const pdfParse = (pdfParseModule as unknown as { default?: unknown }).default ?? pdfParseModule;
      const data = await (pdfParse as (buf: Buffer) => Promise<{ text: string }>)(buffer);
      return NextResponse.json({ type: "document", name, text: data.text.trim() });
    }

    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime === "application/msword" ||
      name.toLowerCase().endsWith(".docx") ||
      name.toLowerCase().endsWith(".doc")
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ type: "document", name, text: result.value.trim() });
    }

    if (
      mime === "text/plain" ||
      mime === "text/markdown" ||
      name.toLowerCase().endsWith(".txt") ||
      name.toLowerCase().endsWith(".md")
    ) {
      return NextResponse.json({ type: "document", name, text: buffer.toString("utf-8") });
    }

    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to extract content", detail: (err as Error).message },
      { status: 500 }
    );
  }
}
