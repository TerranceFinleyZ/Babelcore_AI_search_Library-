import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    const ollamaRes = await fetch(`${process.env.OLLAMA_BASE_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL,
        prompt: query,
        stream: false,
      }),
    });

    if (!ollamaRes.ok) {
      throw new Error(`Ollama request failed: ${ollamaRes.statusText}`);
    }

    const data = await ollamaRes.json();
    return NextResponse.json({ response: data.response });
  } catch (error) {
    return NextResponse.json(
      { error: "Ollama request failed", details: error.message },
      { status: 500 }
    );
  }
}
