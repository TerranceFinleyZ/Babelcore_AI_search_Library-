import { NextRequest, NextResponse } from "next/server";

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/tickets";

const CATEGORY_LABELS: Record<string, string> = {
  "sexual-content": "Sexual Content",
  "glitch": "Glitch / Bug",
  "error": "Error",
  "other": "General Issue",
};

// Pipeline stage 1 = "New" on the default support pipeline
const HS_PIPELINE = "0";
const HS_PIPELINE_STAGE = "1";

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Reporting service not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).category !== "string" ||
    typeof (body as Record<string, unknown>).description !== "string"
  ) {
    return NextResponse.json({ error: "category and description are required." }, { status: 400 });
  }

  const { category, description } = body as { category: string; description: string };

  const safeCategory = CATEGORY_LABELS[category] ?? "General Issue";
  const safeDesc = String(description).slice(0, 1000).trim();

  if (!safeDesc) {
    return NextResponse.json({ error: "Description cannot be empty." }, { status: 400 });
  }

  const payload = {
    properties: {
      subject: `User Report: ${safeCategory}`,
      content: safeDesc,
      hs_pipeline: HS_PIPELINE,
      hs_pipeline_stage: HS_PIPELINE_STAGE,
    },
  };

  try {
    const hs = await fetch(HUBSPOT_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });

    if (!hs.ok) {
      const err = await hs.json().catch(() => ({}));
      const msg = (err as Record<string, unknown>).message ?? "HubSpot rejected the request.";
      return NextResponse.json({ error: String(msg) }, { status: 502 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "HubSpot timed out." : "Failed to submit report." },
      { status: 503 }
    );
  }
}
