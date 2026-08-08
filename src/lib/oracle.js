/*
-- ============================================================
-- CORE DATABASE SCHEMA (Oracle 23ai / 26ai)
-- ============================================================

-- USERS
CREATE TABLE core_users (
  id VARCHAR2(64) PRIMARY KEY,
  email VARCHAR2(255),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- DOCUMENTS
CREATE TABLE core_documents (
  id VARCHAR2(64) PRIMARY KEY,
  user_id VARCHAR2(64),
  title VARCHAR2(255),
  content CLOB,
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- EMBEDDINGS
CREATE TABLE core_embeddings (
  id VARCHAR2(64) PRIMARY KEY,
  document_id VARCHAR2(64),
  model VARCHAR2(128),
  embedding VECTOR(1536),
  created_at TIMESTAMP DEFAULT SYSTIMESTAMP
);

-- VECTOR INDEX
CREATE INDEX core_embeddings_vec_idx
ON core_embeddings (embedding)
INDEXTYPE IS VECTOR_INDEX;
*/

import oracledb from "oracledb";

let poolInitialized = false;

async function initPool() {
  if (!poolInitialized) {
    await oracledb.createPool({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      poolAlias: "default",
    });
    poolInitialized = true;
  }
}

export async function getOracleConnection() {
  await initPool();
  return oracledb.getConnection("default");
}

export { oracledb };
