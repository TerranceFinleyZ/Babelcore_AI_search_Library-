import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

// Runtime require keeps Turbopack from statically tracing the ffmpeg binaries
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpeg = require("fluent-ffmpeg") as typeof import("fluent-ffmpeg");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ffmpegStatic = require("ffmpeg-static") as string | null;

// Point fluent-ffmpeg at the bundled binary
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Reject filenames that attempt path traversal or are absolute paths. */
function isSafeFilename(filename: string): boolean {
  if (!filename || filename.includes("..") || path.isAbsolute(filename)) {
    return false;
  }
  // Only allow a plain filename with a safe extension — no subdirectory separators
  return /^[\w\- ().]+\.[a-zA-Z0-9]+$/.test(filename);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).filename !== "string"
  ) {
    return NextResponse.json(
      { error: "Request body must include a 'filename' string" },
      { status: 400 }
    );
  }

  const filename = ((body as Record<string, string>).filename).trim();

  if (!isSafeFilename(filename)) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
  }

  const inputPath = path.join(PUBLIC_DIR, filename);

  if (!fs.existsSync(inputPath)) {
    return NextResponse.json(
      { error: `File '${filename}' not found in public/` },
      { status: 404 }
    );
  }

  // Build output filename: replace extension with .mp3
  const baseName = path.basename(filename, path.extname(filename));
  const outputFilename = `${baseName}_audio.mp3`;
  const outputPath = path.join(PUBLIC_DIR, outputFilename);

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .noVideo()
        .audioCodec("libmp3lame")
        .audioQuality(2) // VBR quality 0 (best) – 9 (worst)
        .on("error", reject)
        .on("end", resolve)
        .save(outputPath);
    });
  } catch (err) {
    console.error("ffmpeg error:", err);
    return NextResponse.json(
      { error: "Audio extraction failed", detail: String(err) },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: "Audio extracted successfully",
    audioFile: `/${outputFilename}`,
  });
}
