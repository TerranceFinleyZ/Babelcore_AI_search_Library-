import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET — list all reports (newest first)
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data ?? [] });
}

// PATCH — update report status (e.g. resolve / dismiss)
export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, status } = await req.json() as { id: string; status: string };
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });

  const { error } = await getSupabase()
    .from("reports")
    .update({ status })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE — delete the reported message and mark report resolved
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { msgId, reportId } = await req.json() as { msgId: string; reportId: string };

  const sb = getSupabase();
  if (msgId) await sb.from("messages").delete().eq("id", msgId);
  if (reportId) await sb.from("reports").update({ status: "resolved" }).eq("id", reportId);

  return NextResponse.json({ ok: true });
}
