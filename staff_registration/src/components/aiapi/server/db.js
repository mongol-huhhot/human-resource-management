// src/db.js
// PostgreSQL connection pool with safety guards

import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Connection pool settings
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // SSL in production
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
})

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err.message)
})

// ── SQL safety guard ─────────────────────────────────────────
// Claude is read-only — block any write operations
const FORBIDDEN_PATTERN = /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|execute|exec|xp_|sp_)\b/i

export function validateReadOnly(sql) {
  if (FORBIDDEN_PATTERN.test(sql)) {
    throw new Error('Write operations are not permitted. SELECT only.')
  }
  // Must start with SELECT or WITH (CTEs)
  const trimmed = sql.trim().toUpperCase()
  if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
    throw new Error('Only SELECT queries are allowed.')
  }
}

// ── Safe query executor ───────────────────────────────────────
export async function runQuery(sql, params = []) {
  validateReadOnly(sql)

  const client = await pool.connect()
  try {
    // Hard row limit — never return more than 500 rows to Claude
    const limited = `SELECT * FROM (${sql}) __q LIMIT 500`
    const result = await client.query(limited, params)
    return {
      rows: result.rows,
      rowCount: result.rowCount,
      fields: result.fields.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
    }
  } finally {
    client.release()
  }
}

// ── Schema introspection ─────────────────────────────────────
export async function listViews() {
  const result = await pool.query(`
    SELECT table_name, table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type IN ('VIEW', 'BASE TABLE')
    ORDER BY table_type, table_name
  `)
  return result.rows
}

export async function describeTable(tableName) {
  // Whitelist check — only alphanumeric and underscore
  if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
    throw new Error('Invalid table name.')
  }
  const result = await pool.query(`
    SELECT
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName])
  return result.rows
}

export async function getJsonbKeys(tableName, columnName) {
  if (!/^[a-zA-Z0-9_]+$/.test(tableName) || !/^[a-zA-Z0-9_]+$/.test(columnName)) {
    throw new Error('Invalid table or column name.')
  }
  const result = await pool.query(`
    SELECT DISTINCT jsonb_object_keys(${columnName}) AS key
    FROM ${tableName}
    LIMIT 1000
  `)
  return result.rows.map(r => r.key).sort()
}

export async function testConnection() {
  const result = await pool.query('SELECT NOW() as time, current_user as user')
  return result.rows[0]
}
