export async function getEmbeddingFromOllama(text) {
  const response = await fetch("http://localhost:11434/api/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "hermes3", prompt: text }),
  });

  if (!response.ok) {
    throw new Error(`Ollama embedding request failed: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new Error("Invalid embedding response from Ollama");
  }

  return data.embedding;
}
