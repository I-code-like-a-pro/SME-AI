import { tavily } from "@tavily/core";

export interface TavilyOptions {
  searchDepth?: string;
  [key: string]: unknown;
}

function getClient() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY not set in environment");
  return tavily({ apiKey });
}

export async function tavilySearch(query: string, options: TavilyOptions = {}) {
  if (!query || typeof query !== "string") {
    throw new Error("Query must be a non-empty string");
  }

  const client = getClient();

  // Pass options through to the SDK. Caller should sanitize inputs.
  const res = await client.search(query, options as any);
  return res;
}

export default tavilySearch;
