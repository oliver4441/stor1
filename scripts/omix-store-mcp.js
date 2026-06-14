#!/usr/bin/env node
/**
 * Omix Store MCP Server — unified access to the entire stack
 * 
 * Covers:
 *   1. Supabase Database — run SQL, manage tables, policies, functions
 *   2. Supabase REST — query any table via PostgREST (service_role)
 *   3. Render Frontend — deploy, check status, manage stor1-web
 *   4. Render Backend/API — deploy, check status, manage stor1-api
 * 
 * Environment variables:
 *   SUPABASE_PAT          Supabase Personal Access Token
 *   SUPABASE_PROJECT_REF  Project ref (xmdyovfcjogkarwxiyhb)
 *   SUPABASE_URL          Supabase URL (https://xmdyovfcjogkarwxiyhb.supabase.co)
 *   SUPABASE_SERVICE_KEY  Supabase service_role key (for REST queries)
 *   RENDER_API_KEY        Render API key
 *   RENDER_FRONTEND_SERVICE_ID  stor1-web service ID
 *   RENDER_BACKEND_SERVICE_ID   stor1-api service ID
 */

const https = require("https");
const http = require("http");

// ── Config ──────────────────────────────────────────────────────
const SUPABASE_PAT       = process.env.SUPABASE_PAT;
const PROJECT_REF        = process.env.SUPABASE_PROJECT_REF || "xmdyovfcjogkarwxiyhb";
const SUPABASE_URL       = process.env.SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const SUPABASE_SR_KEY    = process.env.SUPABASE_SERVICE_KEY || "";
const RENDER_API_KEY     = process.env.RENDER_API_KEY || "";
const RENDER_FRONTEND_ID = process.env.RENDER_FRONTEND_SERVICE_ID || "";
const RENDER_BACKEND_ID  = process.env.RENDER_BACKEND_SERVICE_ID || "";

const MGMT_API = "https://api.supabase.com";
const RENDER_API = "https://api.render.com";

// ── HTTP helpers ────────────────────────────────────────────────

function req(hostname, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const mod = hostname.startsWith("https://") ? https : http;
    const h = new URL(hostname + path).hostname;
    const p = new URL(hostname + path).pathname + new URL(hostname + path).search;
    const r = (hostname.startsWith("https") ? https : http).request({
      hostname: h, path: p, method,
      headers: { "Content-Type": "application/json", "Accept": "application/json", ...headers },
    }, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, text: d }); }
      });
    });
    r.on("error", reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

// ── Supabase: SQL via Management API ────────────────────────────

async function supabaseSQL(query) {
  if (!SUPABASE_PAT) return { error: "SUPABASE_PAT not set" };
  const r = await req(MGMT_API, `/v1/projects/${PROJECT_REF}/database/query`, "POST",
    { "Authorization": `Bearer ${SUPABASE_PAT}` }, { query });
  if (r.status >= 400) return { error: r.json?.message || r.text };
  return r.json;
}

// ── Supabase: REST (PostgREST) ──────────────────────────────────

async function supabaseREST(table, params = {}) {
  if (!SUPABASE_SR_KEY) return { error: "SUPABASE_SERVICE_KEY not set" };
  const qs = new URLSearchParams(params).toString();
  const path = `/rest/v1/${table}${qs ? "?" + qs : ""}`;
  return req(SUPABASE_URL, path, "GET",
    { "apikey": SUPABASE_SR_KEY, "Authorization": `Bearer ${SUPABASE_SR_KEY}` });
}

async function supabaseInsert(table, data) {
  if (!SUPABASE_SR_KEY) return { error: "SUPABASE_SERVICE_KEY not set" };
  return req(SUPABASE_URL, `/rest/v1/${table}`, "POST",
    { "apikey": SUPABASE_SR_KEY, "Authorization": `Bearer ${SUPABASE_SR_KEY}`,
      "Prefer": "return=representation" }, data);
}

async function supabaseUpdate(table, data, filter) {
  if (!SUPABASE_SR_KEY) return { error: "SUPABASE_SERVICE_KEY not set" };
  return req(SUPABASE_URL, `/rest/v1/${table}?${filter}`, "PATCH",
    { "apikey": SUPABASE_SR_KEY, "Authorization": `Bearer ${SUPABASE_SR_KEY}`,
      "Prefer": "return=representation" }, data);
}

async function supabaseDelete(table, filter) {
  if (!SUPABASE_SR_KEY) return { error: "SUPABASE_SERVICE_KEY not set" };
  return req(SUPABASE_URL, `/rest/v1/${table}?${filter}`, "DELETE",
    { "apikey": SUPABASE_SR_KEY, "Authorization": `Bearer ${SUPABASE_SR_KEY}` });
}

// ── Render: API calls ───────────────────────────────────────────

async function renderRequest(resourcePath, method = "GET", body = null) {
  if (!RENDER_API_KEY) return { error: "RENDER_API_KEY not set" };
  return req(RENDER_API, resourcePath, method,
    { "Authorization": `Bearer ${RENDER_API_KEY}`, "Accept": "application/json" }, body);
}

async function renderListServices() {
  return renderRequest("/v1/services");
}

async function renderGetService(serviceId) {
  if (!serviceId) return { error: "No service ID" };
  return renderRequest(`/v1/services/${serviceId}`);
}

async function renderDeploy(serviceId, clearCache = false) {
  if (!serviceId) return { error: "No service ID" };
  const qs = clearCache ? "?clearCache=true" : "";
  return renderRequest(`/v1/services/${serviceId}/deploys${qs}`, "POST");
}

async function renderDeploys(serviceId) {
  if (!serviceId) return { error: "No service ID" };
  return renderRequest(`/v1/services/${serviceId}/deploys?limit=5`);
}

async function renderEnvVars(serviceId) {
  if (!serviceId) return { error: "No service ID" };
  return renderRequest(`/v1/services/${serviceId}/env-vars`);
}

async function renderSetEnvVar(serviceId, key, value) {
  if (!serviceId) return { error: "No service ID" };
  return renderRequest(`/v1/services/${serviceId}/env-vars`, "POST", { key, value });
}

async function renderLogs(serviceId) {
  if (!serviceId) return { error: "No service ID" };
  return renderRequest(`/v1/services/${serviceId}/logs?limit=50`);
}

// ── MCP Tools ───────────────────────────────────────────────────

const tools = [
  // ── Supabase SQL ──
  {
    name: "db_query",
    description: "Run any SQL query against the Supabase database (SELECT, INSERT, UPDATE, DELETE, DDL). Full service_role privileges.",
    inputSchema: { type: "object", properties: { sql: { type: "string" } }, required: ["sql"] },
  },
  {
    name: "db_tables",
    description: "List all public tables with row counts and RLS policy counts.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "db_describe",
    description: "Get column definitions for a table.",
    inputSchema: { type: "object", properties: { table: { type: "string" } }, required: ["table"] },
  },
  {
    name: "db_policies",
    description: "List RLS policies. Optionally filter by table.",
    inputSchema: { type: "object", properties: { table: { type: "string" } } },
  },
  // ── Supabase REST — read ──
  {
    name: "db_select",
    description: "Read rows from a Supabase table via PostgREST (bypasses RLS with service_role).",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        columns: { type: "string", description: "Comma-separated columns, or *" },
        filter: { type: "string", description: "PostgREST filter, e.g. 'id.eq.5'" },
        limit: { type: "number", default: 10 },
        order: { type: "string", description: "Column to order by" },
      },
      required: ["table"],
    },
  },
  {
    name: "db_insert",
    description: "Insert a row into a Supabase table.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        data: { type: "object", description: "Key-value pairs to insert" },
      },
      required: ["table", "data"],
    },
  },
  {
    name: "db_update",
    description: "Update rows in a Supabase table.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        data: { type: "object" },
        filter: { type: "string", description: "PostgREST filter, e.g. 'id.eq.5'" },
      },
      required: ["table", "data", "filter"],
    },
  },
  {
    name: "db_delete",
    description: "Delete rows from a Supabase table.",
    inputSchema: {
      type: "object",
      properties: {
        table: { type: "string" },
        filter: { type: "string", description: "PostgREST filter, e.g. 'id.eq.5'" },
      },
      required: ["table", "filter"],
    },
  },
  // ── Render: services ──
  {
    name: "render_services",
    description: "List all Render services.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "render_status",
    description: "Get status of a Render service (frontend or backend).",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["frontend", "backend"], description: "Which service" },
      },
      required: ["service"],
    },
  },
  {
    name: "render_deploy",
    description: "Trigger a deploy on Render (frontend or backend).",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["frontend", "backend"] },
        clear_cache: { type: "boolean", default: false },
      },
      required: ["service"],
    },
  },
  {
    name: "render_deploys",
    description: "List recent deploys for a Render service.",
    inputSchema: {
      type: "object",
      properties: { service: { type: "string", enum: ["frontend", "backend"] } },
      required: ["service"],
    },
  },
  {
    name: "render_env",
    description: "List environment variables for a Render service.",
    inputSchema: {
      type: "object",
      properties: { service: { type: "string", enum: ["frontend", "backend"] } },
      required: ["service"],
    },
  },
  {
    name: "render_set_env",
    description: "Set an environment variable on a Render service.",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["frontend", "backend"] },
        key: { type: "string" },
        value: { type: "string" },
      },
      required: ["service", "key", "value"],
    },
  },
  {
    name: "render_logs",
    description: "Get recent logs from a Render service.",
    inputSchema: {
      type: "object",
      properties: {
        service: { type: "string", enum: ["frontend", "backend"] },
        limit: { type: "number", default: 50 },
      },
      required: ["service"],
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
          serverInfo: { name: "omix-store", version: "1.0.0" },
        };

      case "tools/list":
        return { tools };

      case "tools/call": {
        const { name, arguments: args } = req.params;
        let result;

        switch (name) {
          // ── SQL ──
          case "db_query":
            result = await supabaseSQL(args.sql);
            break;
          case "db_tables":
            result = await supabaseSQL(
              "SELECT t.table_name, (SELECT count(*) FROM information_schema.columns c WHERE c.table_name=t.table_name AND c.table_schema='public') as columns, (SELECT count(*) FROM pg_policies p WHERE p.tablename=t.table_name AND p.schemaname='public') as policies FROM information_schema.tables t WHERE t.table_schema='public' AND t.table_type='BASE TABLE' ORDER BY t.table_name"
            );
            break;
          case "db_describe":
            result = await supabaseSQL(
              `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='${args.table.replace(/'/g, "''")}' ORDER BY ordinal_position`
            );
            break;
          case "db_policies":
            result = await supabaseSQL(
              args.table
                ? `SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE schemaname='public' AND tablename='${args.table.replace(/'/g, "''")}' ORDER BY policyname`
                : `SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname='public' ORDER BY tablename, policyname`
            );
            break;

          // ── REST read ──
          case "db_select": {
            const params = { limit: args.limit || 10 };
            if (args.columns) params.select = args.columns;
            if (args.filter) {
              const [col, op, val] = args.filter.split(".");
              params[`${col}`] = `${op}.${val}`;
            }
            if (args.order) params.order = args.order;
            const r = await supabaseREST(args.table, params);
            result = r.json || r;
            break;
          }
          case "db_insert": {
            const r = await supabaseInsert(args.table, args.data);
            result = r.json || r;
            break;
          }
          case "db_update": {
            const r = await supabaseUpdate(args.table, args.data, args.filter);
            result = r.json || r;
            break;
          }
          case "db_delete": {
            const r = await supabaseDelete(args.table, args.filter);
            result = r.json || r;
            break;
          }

          // ── Render ──
          case "render_services":
            result = await renderListServices();
            result = result.json || result;
            break;
          case "render_status": {
            const sid = args.service === "frontend" ? RENDER_FRONTEND_ID : RENDER_BACKEND_ID;
            const r = await renderGetService(sid);
            result = r.json || r;
            break;
          }
          case "render_deploy": {
            const sid = args.service === "frontend" ? RENDER_FRONTEND_ID : RENDER_BACKEND_ID;
            const r = await renderDeploy(sid, args.clear_cache);
            result = r.json || r;
            break;
          }
          case "render_deploys": {
            const sid = args.service === "frontend" ? RENDER_FRONTEND_ID : RENDER_BACKEND_ID;
            const r = await renderDeploys(sid);
            result = r.json || r;
            break;
          }
          case "render_env": {
            const sid = args.service === "frontend" ? RENDER_FRONTEND_ID : RENDER_BACKEND_ID;
            const r = await renderEnvVars(sid);
            result = r.json || r;
            break;
          }
          case "render_set_env": {
            const sid = args.service === "frontend" ? RENDER_FRONTEND_ID : RENDER_BACKEND_ID;
            const r = await renderSetEnvVar(sid, args.key, args.value);
            result = r.json || r;
            break;
          }
          case "render_logs": {
            const sid = args.service === "frontend" ? RENDER_FRONTEND_ID : RENDER_BACKEND_ID;
            const r = await renderLogs(sid);
            result = r.json || r;
            break;
          }

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

// ── Stdio loop ─────────────────────────────────────────────────

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

console.error(`omix-store-mcp: ready (project: ${PROJECT_REF})`);
