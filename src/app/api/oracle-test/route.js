import { NextResponse } from "next/server";
import { getOracleConnection } from "@/lib/oracle";

export async function GET() {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT 'CORE CONNECTED TO ORACLE' AS message FROM dual`
    );
    return NextResponse.json({ message: result.rows[0][0] });
  } catch (error) {
    return NextResponse.json(
      { error: "Oracle connection failed", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try { await connection.close(); } catch {}
    }
  }
}
