import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const PAYMENT_LINK = "https://buy.stripe.com/dRmeVd6ai4eH3QZ3Pj2sM00";

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Stripe Payment Links accept client_reference_id as a query param —
  // it's forwarded unchanged in the checkout.session.completed webhook event.
  const url = `${PAYMENT_LINK}?client_reference_id=${encodeURIComponent(userId)}`;
  return NextResponse.json({ url });
}
