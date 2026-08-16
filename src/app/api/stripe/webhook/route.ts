import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Lazy init so module evaluation during build doesn't fail on missing env vars
function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // Payment Links forward client_reference_id; API-created sessions use metadata.userId
    const userId = session.client_reference_id ?? session.metadata?.userId;
    if (userId) {
      const supabase = getSupabase();
      await supabase.from("pro_users").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string | null,
        stripe_session_id: session.id,
        is_active: true,
      });
    }
  }

  return NextResponse.json({ received: true });
}
