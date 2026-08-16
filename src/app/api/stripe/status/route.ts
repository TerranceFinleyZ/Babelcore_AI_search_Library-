import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy init so module evaluation during build doesn't fail on missing env vars
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ isPro: false });

  const supabase = getSupabase();
  const { data } = await supabase
    .from("pro_users")
    .select("is_active")
    .eq("user_id", userId)
    .single();

  return NextResponse.json({ isPro: data?.is_active === true });
}
