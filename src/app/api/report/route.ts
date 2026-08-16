import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/tickets";

const CATEGORY_LABELS: Record<string, string> = {
  "sexual-content": "Sexual Content",
  "glitch": "Glitch / Bug",
  "error": "Error",
  "other": "General Issue",
};

const HS_PIPELINE = "0";
const HS_PIPELINE_STAGE = "1";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body !== "object" || body === null ||
    typeof (body as Record<string, unknown>).category !== "string" ||
    typeof (body as Record<string, unknown>).description !== "string"
  ) {
    return NextResponse.json({ error: "category and description are required." }, { status: 400 });
  }

  const {
    category, description,
    source, reporterId,
    msgId, msgText, msgUserId, msgUser, attachmentUrl,
  } = body as Record<string, string | null | undefined>;

  const safeCategory = CATEGORY_LABELS[category as string] ?? "General Issue";
  const safeDesc = String(description).slice(0, 1000).trim();
  if (!safeDesc) return NextResponse.json({ error: "Description cannot be empty." }, { status: 400 });

  // ── Save to Supabase (primary) ─────────────────────────
  const sbResult = await getSupabase().from("reports").insert({
    source:         source ?? "unknown",
    category:       category,
    description:    safeDesc,
    reporter_id:    reporterId ?? null,
    msg_id:         msgId ?? null,
    msg_text:       msgText ?? null,
    msg_user_id:    msgUserId ?? null,
    msg_user:       msgUser ?? null,
    attachment_url: attachmentUrl ?? null,
    status:         "open",
  });

  if (sbResult.error) console.error("Supabase report insert error:", sbResult.error);

  // ── Forward to HubSpot (best-effort) ──────────────────
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  if (token) {
    const contextLines = [
      source     ? `Source: ${source}`          : null,
      msgUser    ? `Reported user: ${msgUser}`   : null,
      msgText    ? `Message: "${msgText?.slice(0, 300)}"` : null,
      reporterId ? `Reporter ID: ${reporterId}`  : null,
    ].filter(Boolean).join("\n");

    const payload = {
      properties: {
        subject: `User Report [${source ?? "app"}]: ${safeCategory}`,
        content: contextLines ? `${safeDesc}\n\n---\n${contextLines}` : safeDesc,
        hs_pipeline: HS_PIPELINE,
        hs_pipeline_stage: HS_PIPELINE_STAGE,
      },
    };

    try {
      await fetch(HUBSPOT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
    } catch (err) {
      console.error("HubSpot report forward error:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

