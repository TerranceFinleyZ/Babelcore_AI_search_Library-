import { NextRequest, NextResponse } from "next/server";

const HS_CONTACTS = "https://api.hubapi.com/crm/v3/objects/contacts";
const HS_SEND = "https://api.hubapi.com/marketing/v3/transactional/single-email/send";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const token = process.env.HUBSPOT_ACCESS_TOKEN;
  const emailId = process.env.HUBSPOT_NEWSLETTER_EMAIL_ID;

  if (!token || !emailId) {
    return NextResponse.json({ error: "Newsletter service not configured." }, { status: 503 });
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = typeof (body as Record<string, unknown>)?.email === "string"
    ? String((body as Record<string, unknown>).email).trim().toLowerCase()
    : "";

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  try {
    // Upsert the contact so they appear in HubSpot CRM
    const contactRes = await fetch(HS_CONTACTS, {
      method: "POST",
      headers,
      body: JSON.stringify({ properties: { email } }),
      signal: AbortSignal.timeout(8000),
    });

    // 409 = contact already exists — that's fine, continue to send email
    if (!contactRes.ok && contactRes.status !== 409) {
      return NextResponse.json({ error: "Could not register subscriber." }, { status: 502 });
    }

    // Send the Babelcore newsletter email via HubSpot transactional single-send
    const sendRes = await fetch(HS_SEND, {
      method: "POST",
      headers,
      body: JSON.stringify({
        emailId: Number(emailId),
        message: { to: email },
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!sendRes.ok) {
      const err = await sendRes.json().catch(() => ({})) as Record<string, unknown>;
      return NextResponse.json(
        { error: String(err.message ?? "Failed to send confirmation email.") },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    return NextResponse.json(
      { error: isTimeout ? "HubSpot timed out." : "Failed to subscribe. Please try again." },
      { status: 503 }
    );
  }
}
