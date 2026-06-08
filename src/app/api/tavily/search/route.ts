import { NextRequest, NextResponse } from "next/server";
import tavilySearch from "@/lib/tavily";

// Basic in-memory rate limiter (per-process). Fine for dev; replace for prod.
const RATE_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT = 20; // requests per window per IP
const rateMap = new Map<string, { count: number; resetAt: number }>();

function checkRate(ip: string) {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "unknown";
    if (!checkRate(String(ip))) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    const searchDepth = typeof body?.searchDepth === "string" ? body.searchDepth : undefined;

    if (!query) {
      return NextResponse.json({ error: "Missing 'query' in request body" }, { status: 400 });
    }

    // Call the server-side wrapper which reads the API key from env
    const result = await tavilySearch(query, { searchDepth });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[api/tavily/search]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "POST JSON { \"query\": \"...\" }" });
}
