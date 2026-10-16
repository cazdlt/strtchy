import { json } from "@sveltejs/kit";
import { validateBearerToken } from "$lib/api/auth";
import { validateApiKey } from "$lib/api/apiKey";
import {
  handleJsonRpcMessage,
  SERVER_INFO,
  type JsonRpcRequest,
  type McpAuthContext,
} from "$lib/mcp/server";
import type { RequestEvent } from "./$types";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, x-api-key, Mcp-Session-Id, MCP-Protocol-Version",
};

async function resolveMcpAuth(event: RequestEvent): Promise<McpAuthContext> {
  // 1. Check Authorization: Bearer strtchy_...
  const bearerResult = await validateBearerToken(event);
  if (bearerResult.user) {
    return { user: bearerResult.user };
  }

  // 2. Check x-api-key header or ?apiKey=... query param
  const headerKey = event.request.headers.get("x-api-key")?.trim();
  const queryKey = event.url.searchParams.get("apiKey")?.trim();
  const rawKey = headerKey || queryKey;

  if (rawKey) {
    const userData = await validateApiKey(rawKey);
    if (userData) {
      return { user: userData };
    }
  }

  // 3. Fallback to session user if present
  if (event.locals.user) {
    return { user: event.locals.user };
  }

  return { user: null };
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// GET /api/mcp - Server info or Streamable HTTP SSE probe
export async function GET(event: RequestEvent) {
  const accept = event.request.headers.get("accept") || "";
  // Per MCP Streamable HTTP 2025-03-26 spec: return 405 if server does not push standalone SSE streams
  if (accept.includes("text/event-stream") && !accept.includes("text/html")) {
    return new Response(null, {
      status: 405,
      headers: {
        ...CORS_HEADERS,
        Allow: "POST, DELETE, OPTIONS",
      },
    });
  }

  const ctx = await resolveMcpAuth(event);
  return json(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
      protocol: "mcp-streamable-http",
      authenticated: Boolean(ctx.user),
      endpoint: "/api/mcp",
    },
    { headers: CORS_HEADERS },
  );
}

// POST /api/mcp - JSON-RPC 2.0 Streamable HTTP handler
export async function POST(event: RequestEvent) {
  const ctx = await resolveMcpAuth(event);

  let body: unknown;
  try {
    body = await event.request.json();
  } catch {
    return json(
      {
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error: Invalid JSON" },
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (Array.isArray(body)) {
    const responses = [];
    for (const item of body) {
      const res = await handleJsonRpcMessage(item as JsonRpcRequest, ctx);
      if (res !== null) {
        responses.push(res);
      }
    }

    if (responses.length === 0) {
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }

    return json(responses, { status: 200, headers: CORS_HEADERS });
  }

  if (body && typeof body === "object") {
    const response = await handleJsonRpcMessage(body as JsonRpcRequest, ctx);
    if (response === null) {
      return new Response(null, { status: 202, headers: CORS_HEADERS });
    }
    return json(response, { status: 200, headers: CORS_HEADERS });
  }

  return json(
    {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32600, message: "Invalid Request" },
    },
    { status: 400, headers: CORS_HEADERS },
  );
}

// DELETE /api/mcp - Session termination acknowledgement
export async function DELETE() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
