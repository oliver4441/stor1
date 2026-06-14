#!/usr/bin/env node
/**
 * Supabase SQL MCP Server
 * 
 * Provides direct SQL access to Supabase via the Management API.
 * Uses a Supabase Personal Access Token (PAT) for authentication.
 * 
 * Setup:
 *   1. Get PAT from https://supabase.com/dashboard/account/tokens
 *   2. Set environment variable: SUPABASE_PAT=sb_...
 *   3. Set environment variable: SUPABASE_PROJECT_REF=xmdyovfcjogkarwxiyhb
 * 
 * Add to hermes config.yaml:
 *   tools:
 *     mcp:
 *       servers:
 *         supabase:
 *           command: node
 *           args: ["/home/oliver/omix/scripts/supabase-mcp.js"]
 *           env:
 *             SUPABASE_PAT: "sbp_..."
 *             SUPABASE_PROJECT_REF: "xmdyovfcjogkarwxiyhb"
 *             SUPABASE_URL: "https://xmdyovfcjogkarwxiyhb.supabase.co"
 */

const https = require("https");

const PAT = process.env.SUPABASE_PAT;
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || "xmdyovfcjogkarwxiyhb";
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const MGMT_API = "https://api.supabase.com";

if (!PAT) {
  console.error("SUPABASE_PAT env var required");
  process.exit(1);
}

function httpsRequest(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname, path, method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...headers,
      },
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, text: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSQL(query) {
  const r = await httpsRequest(
    new URL(MGMT_API).hostname,
    `/v1/projects/${PROJECT_REF}/database/query`,
    "POST",
    { "Authorization": `Bearer ${PAT}` },
    { query }
  );
  if (r.status >= 400) return { error: r.json?.message || r.text };
  return r.json;
}

async function restRequest(path, method = "GET", body = null) {
  return httpsRequest(
    new URL(SUPABASE_URL).hostname,
    path, method,
    {
      "apikey": PAT,
      "Authorization": `Bearer ${PAT}`,
    },
    body
  );
}

// ── MCP Tools ──────────────────────────────────────────────────

const tools = [
  {
    name: "exec_sql",
    description: "Execute any SQL query (SELECT, INSERT, UPDATE, DELETE, DDL) against the Supabase database. Returns results as JSON array. Uses the Supabase Management API with full privileges.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "SQL query to execute" },
      },
      required: ["query"],
    },
  },
  {
    name: "list_tables",
    description: "List all tables in the public schema with their RLS policy count.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "describe_table",
    description: "Get column definitions, types, and defaults for a table.",
    inputSchema: {
      type: "object",
      properties: { table: { type: "string", description: "Table name" } },
      required: ["table"],
    },
  },
  {
    name: "list_policies",
    description: "List RLS policies. Optionally filter by table name.",
    inputSchema: {
      type: "object",
      properties: { table: { type: "string", description: "Optional table name filter" } },
    },
  },
  {
    name: "list_functions",
    description: "List all functions in the public schema.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_table_data",
    description: "Get data from a table (bypasses RLS). Use with caution.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string", description: "Table name" },
        limit: { type: "number", description: "Max rows (default 10)", default: 10 },
      },
      required: ["table"],
    },
  },
];

// ── MCP Protocol ───────────────────────────────────────────────

async function handleRequest(req) {
  try {
    switch (req.method) {
      case "initialize":
        return {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "supabase-sql", version: "1.0.0" },
        };

      case "tools/list":
        return { tools };

      case "tools/call": {
        const { name, arguments: args } = req.params;
        let result;

        switch (name) {
          case "exec_sql":
            result = await runSQL(args.query);
            break;
          case "list_tables":
            result = await runSQL(
              "SELECT tablename, (SELECT count(*) FROM pg_policies p WHERE p.tablename=t.tablename AND p.schemaname='public') as policies FROM pg_tables t WHERE schemaname='public' ORDER BY tablename"
            );
            break;
          case "describe_table":
            result = await runSQL(
              `SELECT column_name, data_type, is_nullable, column_default
               FROM information_schema.columns
               WHERE table_schema='public' AND table_name='${args.table.replace(/'/g, "''")}'
               ORDER BY ordinal_position`
            );
            break;
          case "list_policies":
            result = await runSQL(
              args.table
                ? `SELECT tablename, policyname, cmd, qual, with_check
                   FROM pg_policies
                   WHERE schemaname='public' AND tablename='${args.table.replace(/'/g, "''")}'
                   ORDER BY policyname`
                : `SELECT tablename, policyname, cmd
                   FROM pg_policies
                   WHERE schemaname='public'
                   ORDER BY tablename, policyname`
            );
            break;
          case "list_functions":
            result = await runSQL(
              `SELECT routine_name, data_type, routine_type
               FROM information_schema.routines
               WHERE routine_schema='public'
               ORDER BY routine_name`
            );
            break;
          case "get_table_data":
            result = await runSQL(
              `SELECT * FROM ${args.table.replace(/[^a-z0-9_]/gi, '')} LIMIT ${args.limit || 10}`
            );
            break;
          default:
            return { error: { code: -32601, message: `Unknown tool: ${name}` } };
        }

        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      default:
        return { error: { code: -32601, message: `Unknown method: ${req.method}` } };
    }
  } catch (e) {
    return { content: [{ type: "text", text: `Error: ${e.message}` }], isError: true };
  }
}

// ── Stdio event loop ───────────────────────────────────────────

let buf = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", async chunk => {
  buf += chunk;
  while (true) {
    const idx = buf.indexOf("\n");
    if (idx === -1) break;
    const line = buf.slice(0, idx).trim();
    buf = buf.slice(idx + 1);
    if (!line) continue;
    try {
      const req = JSON.parse(line);
      const res = await handleRequest(req);
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, ...res }) + "\n");
    } catch (e) {
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: 0, error: { code: -32700, message: e.message } }) + "\n");
    }
  }
});
process.stdin.resume();

console.error(`supabase-mcp: ready (project: ${PROJECT_REF})`);
