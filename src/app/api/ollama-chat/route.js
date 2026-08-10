import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [{ role: "user", content: query }],
      }),
    });

    if (!groqRes.ok) {
      throw new Error(`Groq request failed: ${groqRes.statusText}`);
    }

    const data = await groqRes.json();
    return NextResponse.json({ response: data.choices[0].message.content });
  } catch (error) {
    return NextResponse.json(
      { error: "Groq request failed", details: error.message },
      { status: 500 }
    );
  }
}

