// src/mcp.js
// MCP tool definitions exposed to Claude + executor

import { runQuery, listViews, describeTable, getJsonbKeys } from './db.js'

// ── Tool definitions (sent to Claude API) ────────────────────
// These tell Claude what tools it can call and how to use them.
export const MCP_TOOLS = [
  {
    name: 'run_query',
    description: `Execute a read-only SELECT query against the PostgreSQL database.
Use this to answer any question about store performance, sales, issues, or trends.
Always use the flattened views (prefixed v_) rather than raw tables when available.
Return results as-is; you will summarize them in your response.`,
    input_schema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'A valid PostgreSQL SELECT statement. No INSERT/UPDATE/DELETE allowed.',
        },
        description: {
          type: 'string',
          description: 'One-line description of what this query is fetching (for logging).',
        },
      },
      required: ['sql', 'description'],
    },
  },
  {
    name: 'list_views',
    description: 'List all available tables and views in the database. Call this first if unsure what data is available.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'describe_table',
    description: 'Get the column names and data types for a specific table or view.',
    input_schema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'The name of the table or view to describe.',
        },
      },
      required: ['table_name'],
    },
  },
  {
    name: 'get_jsonb_keys',
    description: 'List all keys found inside a JSONB column. Use this before querying raw tables with JSONB columns.',
    input_schema: {
      type: 'object',
      properties: {
        table_name: { type: 'string', description: 'Table name containing the JSONB column.' },
        column_name: { type: 'string', description: 'Name of the JSONB column.' },
      },
      required: ['table_name', 'column_name'],
    },
  },
]

// ── Tool executor ────────────────────────────────────────────
// Called when Claude decides to use a tool.
export async function executeTool(toolName, toolInput, queryLog) {
  const start = Date.now()

  try {
    let result

    switch (toolName) {
      case 'run_query': {
        const { sql, description } = toolInput
        console.log(`[MCP] run_query: ${description}`)
        console.log(`[MCP] SQL: ${sql.trim()}`)
        result = await runQuery(sql)
        // Log for audit trail
        queryLog.push({
          tool: 'run_query',
          description,
          sql: sql.trim(),
          rowCount: result.rowCount,
          durationMs: Date.now() - start,
        })
        break
      }

      case 'list_views': {
        console.log('[MCP] list_views')
        result = await listViews()
        break
      }

      case 'describe_table': {
        console.log(`[MCP] describe_table: ${toolInput.table_name}`)
        result = await describeTable(toolInput.table_name)
        break
      }

      case 'get_jsonb_keys': {
        console.log(`[MCP] get_jsonb_keys: ${toolInput.table_name}.${toolInput.column_name}`)
        result = await getJsonbKeys(toolInput.table_name, toolInput.column_name)
        break
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }

    return { success: true, result }

  } catch (err) {
    console.error(`[MCP] Tool error (${toolName}):`, err.message)
    return { success: false, error: err.message }
  }
}
