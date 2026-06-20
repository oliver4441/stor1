#!/usr/bin/env node
const https = require("https");

// Config from env vars
const SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY || "";

if (!SECRET_KEY) {
  console.error("paystack-mcp: PAYSTACK_SECRET_KEY env var is required");
  process.exit(1);
}

// HTTPS helper
function req(url, method = "GET", headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const r = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        "Authorization": `Bearer ${SECRET_KEY}`,
        "Content-Type": "application/json",
        ...headers
      }
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

// ── Paystack API helpers ──

async function getBalance() {
  return req("https://api.paystack.co/balance");
}

async function getTransactions(page = 1, perPage = 20) {
  return req(`https://api.paystack.co/transaction?page=${page}&perPage=${perPage}`);
}

async function getTransaction(id) {
  return req(`https://api.paystack.co/transaction/${id}`);
}

async function verifyTransaction(reference) {
  return req(`https://api.paystack.co/transaction/verify/${reference}`);
}

async function getCustomers(page = 1, perPage = 20) {
  return req(`https://api.paystack.co/customer?page=${page}&perPage=${perPage}`);
}

async function createCustomer(email, firstName = "", lastName = "", phone = "") {
  return req("https://api.paystack.co/customer", "POST", {}, {
    email, first_name: firstName, last_name: lastName, phone
  });
}

async function createCharge(email, amount, metadata = {}) {
  return req("https://api.paystack.co/transaction/initialize", "POST", {}, {
    email, amount: amount * 100, // Paystack uses kobo
    metadata
  });
}

async function listBanks() {
  return req("https://api.paystack.co/bank");
}

async function resolveAccountNumber(accountNumber, bankCode) {
  return req(`https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`);
}

async function createTransferRecipient(name, accountNumber, bankCode) {
  return req("https://api.paystack.co/transferrecipient", "POST", {}, {
    type: "nuban",
    name,
    account_number: accountNumber,
    bank_code: bankCode,
    currency: "NGN"
  });
}

async function initiateTransfer(amount, recipient, reason = "") {
  return req("https://api.paystack.co/transfer", "POST", {}, {
    source: "balance",
    amount: amount * 100,
    recipient,
    reason,
    currency: "NGN"
  });
}

async function getTransfer(id) {
  return req(`https://api.paystack.co/transfer/${id}`);
}

async function listTransfers(page = 1, perPage = 20) {
  return req(`https://api.paystack.co/transfer?page=${page}&perPage=${perPage}`);
}

// ── MCP Tool definitions ──

const tools = [
  {
    name: "paystack_get_balance",
    description: "Get your Paystack account balance (available balance, pending balance, total in kobo)",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "paystack_get_transactions",
    description: "List recent transactions on your Paystack account",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Items per page (default 20, max 100)" }
      }
    }
  },
  {
    name: "paystack_get_transaction",
    description: "Get details of a specific transaction by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "Transaction ID or reference" }
      },
      required: ["id"]
    }
  },
  {
    name: "paystack_verify_transaction",
    description: "Verify a transaction by its reference code",
    inputSchema: {
      type: "object",
      properties: {
        reference: { type: "string", description: "Transaction reference" }
      },
      required: ["reference"]
    }
  },
  {
    name: "paystack_get_customers",
    description: "List customers on your Paystack account",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Items per page (default 20, max 100)" }
      }
    }
  },
  {
    name: "paystack_create_customer",
    description: "Create a new customer on Paystack",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Customer email address" },
        first_name: { type: "string", description: "First name" },
        last_name: { type: "string", description: "Last name" },
        phone: { type: "string", description: "Phone number" }
      },
      required: ["email"]
    }
  },
  {
    name: "paystack_initialize_charge",
    description: "Initialize a payment charge (creates a payment link for customer)",
    inputSchema: {
      type: "object",
      properties: {
        email: { type: "string", description: "Customer email" },
        amount: { type: "number", description: "Amount in NGN" },
        metadata: { type: "object", description: "Custom metadata" }
      },
      required: ["email", "amount"]
    }
  },
  {
    name: "paystack_list_banks",
    description: "List all supported banks for transfers",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "paystack_resolve_account",
    description: "Resolve a bank account number to get the account name",
    inputSchema: {
      type: "object",
      properties: {
        account_number: { type: "string", description: "Bank account number" },
        bank_code: { type: "string", description: "Bank code" }
      },
      required: ["account_number", "bank_code"]
    }
  },
  {
    name: "paystack_create_transfer_recipient",
    description: "Create a transfer recipient for bank transfers",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Recipient name" },
        account_number: { type: "string", description: "Bank account number" },
        bank_code: { type: "string", description: "Bank code" }
      },
      required: ["name", "account_number", "bank_code"]
    }
  },
  {
    name: "paystack_initiate_transfer",
    description: "Send money to a transfer recipient",
    inputSchema: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Amount in NGN" },
        recipient: { type: "string", description: "Recipient code" },
        reason: { type: "string", description: "Transfer reason/note" }
      },
      required: ["amount", "recipient"]
    }
  },
  {
    name: "paystack_list_transfers",
    description: "List recent transfers",
    inputSchema: {
      type: "object",
      properties: {
        page: { type: "number", description: "Page number (default 1)" },
        per_page: { type: "number", description: "Items per page (default 20)" }
      }
    }
  }
];

// ── Request handler ──

async function handleRequest(req) {
  switch (req.method) {
    case "initialize":
      return {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: { name: "paystack-mcp", version: "1.0.0" }
      };

    case "notifications/initialized":
      return null; // no-op

    case "tools/list":
      return { tools };

    case "tools/call": {
      const { name, arguments: args } = req.params;
      let result;

      try {
        switch (name) {
          case "paystack_get_balance":
            result = await getBalance();
            break;
          case "paystack_get_transactions":
            result = await getTransactions(args?.page || 1, args?.per_page || 20);
            break;
          case "paystack_get_transaction":
            result = await getTransaction(args.id);
            break;
          case "paystack_verify_transaction":
            result = await verifyTransaction(args.reference);
            break;
          case "paystack_get_customers":
            result = await getCustomers(args?.page || 1, args?.per_page || 20);
            break;
          case "paystack_create_customer":
            result = await createCustomer(args.email, args.first_name, args.last_name, args.phone);
            break;
          case "paystack_initialize_charge":
            result = await createCharge(args.email, args.amount, args.metadata);
            break;
          case "paystack_list_banks":
            result = await listBanks();
            break;
          case "paystack_resolve_account":
            result = await resolveAccountNumber(args.account_number, args.bank_code);
            break;
          case "paystack_create_transfer_recipient":
            result = await createTransferRecipient(args.name, args.account_number, args.bank_code);
            break;
          case "paystack_initiate_transfer":
            result = await initiateTransfer(args.amount, args.recipient, args.reason);
            break;
          case "paystack_list_transfers":
            result = await listTransfers(args?.page || 1, args?.per_page || 20);
            break;
          default:
            return { error: { code: -32601, message: `Unknown tool: ${name}` } };
        }

        const data = result.json || result;
        return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
      } catch (e) {
        return { content: [{ type: "text", text: JSON.stringify({ error: e.message }) }] };
      }
    }
  }
}

// ── Stdio loop ──

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
      if (res !== null) {
        process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: req.id, ...res }) + "\n");
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: 0, error: { code: -32700, message: e.message } }) + "\n");
    }
  }
});
process.stdin.resume();
console.error("paystack-mcp: ready");
