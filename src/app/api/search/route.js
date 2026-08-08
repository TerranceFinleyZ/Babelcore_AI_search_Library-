import { NextResponse } from "next/server";
import { getOracleConnection, oracledb } from "@/lib/oracle";
import { getEmbeddingFromOllama } from "@/lib/embeddings";

export async function POST(request) {
  let connection;
  try {
    const { query, limit = 5 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const queryEmbedding = await getEmbeddingFromOllama(query);

    connection = await getOracleConnection();

    const result = await connection.execute(
      `SELECT d.id,
              d.title,
              d.content,
              VECTOR_DISTANCE(e.embedding, :queryVec, COSINE) AS score
       FROM   core_embeddings e
       JOIN   core_documents  d ON e.document_id = d.id
       ORDER  BY score ASC
       FETCH  FIRST :lim ROWS ONLY`,
      {
        queryVec: { type: oracledb.DB_TYPE_VECTOR, val: queryEmbedding },
        lim: limit,
      },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    return NextResponse.json({ results: result.rows });
  } catch (error) {
    return NextResponse.json(
      { error: "Vector search failed", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try { await connection.close(); } catch (_) {}
    }
  }
}
