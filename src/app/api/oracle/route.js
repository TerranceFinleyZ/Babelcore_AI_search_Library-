import { NextResponse } from "next/server";
import { getOracleConnection } from "@/lib/oracle";

export async function GET() {
  let connection;
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(
      `SELECT 'CORE LINKED TO ORACLE' AS message FROM dual`
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    return NextResponse.json(
      { error: "Oracle connection failed", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
