#!/usr/bin/env node
/**
 * Supabase SQL MCP Server
 * 
 * Runs SQL queries against Supabase using the service_role key.
 * Uses a helper RPC function `exec_sql` that must be created in the database first.
 * 
 * Usage: node supabase-sql-mcp.js
 * 
 * Configure in hermes config.yaml:
 *   mcp:
 *     servers:
 *       supabase-sql:
 *         command: node
 *         args: ["/home/oliver/omix/scripts/supabase-sql-mcp.js"]
 *         env:
 *           SUPABASE_URL: "https://xmdyovfcjogkarwxiyhb.supabase.co"
 *           SUPABASE_SERVICE_KEY: "eyJ..."
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const https = require("https");

const SUPABASE_URL = process.env.SUPABASE_URL || "https://xmdyovfcjogkarwxiyhb.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error("SUPABASE_SERVICE_KEY env var required");
  process.exit(1);
}

function supabaseRequest(path, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method,
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSql(query) {
  // Use the exec_sql RPC function (must be created in DB first)
  const result = await supabaseRequest("/rest/v1/rpc/exec_sql", "POST", { query });
  if (result.status >= 400) {
    // If exec_sql doesn't exist, return error with instructions
    if (result.data?.code === "PGRST202") {
      return {
        error: "exec_sql function not found. Run this in Supabase SQL Editor first:\n" +
          "CREATE OR REPLACE FUNCTION public.exec_sql(text) RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$ DECLARE result json; BEGIN EXECUTE format('SELECT json_agg(t) FROM (%s) AS t', $1) INTO result; RETURN result; END; $$;"
      };
    }
    return { error: result.data?.message || JSON.stringify(result.data) };
  }
  return result.data;
}

const server = new Server(
  { name: "supabase-sql", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "run_sql",
      description: "Run a SQL query against the Supabase database. Returns results as JSON.",
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
      description: "List all public tables in the database",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "describe_table",
      description: "Get column info for a table",
      inputSchema: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table name" },
        },
        required: ["table"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "run_sql": {
        const result = await runSql(args.query);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "list_tables": {
        const result = await runSql(
          "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename"
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      case "describe_table": {
        const result = await runSql(
          `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = '${args.table}' ORDER BY ordinal_position`
        );
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (err) {
    return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error("Supabase SQL MCP server running");
});
