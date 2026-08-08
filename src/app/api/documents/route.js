import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getOracleConnection, oracledb } from "@/lib/oracle";
import { getEmbeddingFromOllama } from "@/lib/embeddings";

export async function POST(request) {
  let connection;
  try {
    const { userId, title, content } = await request.json();

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: "userId, title, and content are required" },
        { status: 400 }
      );
    }

    const documentId = randomUUID();
    const embeddingId = randomUUID();

    connection = await getOracleConnection();

    await connection.execute(
      `INSERT INTO core_documents (id, user_id, title, content)
       VALUES (:id, :userId, :title, :content)`,
      { id: documentId, userId, title, content },
      { autoCommit: false }
    );

    const embedding = await getEmbeddingFromOllama(content);

    await connection.execute(
      `INSERT INTO core_embeddings (id, document_id, model, embedding)
       VALUES (:id, :documentId, :model, :embedding)`,
      {
        id: embeddingId,
        documentId,
        model: "hermes3",
        embedding: { type: oracledb.DB_TYPE_VECTOR, val: embedding },
      },
      { autoCommit: false }
    );

    await connection.commit();

    return NextResponse.json({ status: "success", documentId });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (_) {}
    }
    return NextResponse.json(
      { error: "Document ingestion failed", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}
