const MODEL = "llama-3.3-70b-versatile";

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/**
 * Clean and normalize model text output.
 * - Replace smart quotes with straight quotes
 * - Remove zero-width characters
 * - Replace non-breaking spaces with normal spaces
 * - Collapse repeated spaces/tabs but preserve newlines
 */
export function sanitizeModelText(text: string): string {
  if (!text) return text;
  let t = text;
  // Normalize non-breaking spaces and control characters
  t = t.replace(/\u00A0/g, " ");
  t = t.replace(/[\u200B-\u200F\uFEFF]/g, "");

  // Replace smart quotes with straight quotes
  t = t.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Normalize line endings and remove stray carriage returns
  t = t.replace(/\r/g, "");

  // Collapse multiple spaces/tabs into single space but keep newlines
  t = t.replace(/[ \t\f\v]+/g, " ");

  // Collapse excessive blank lines
  t = t.replace(/\n{3,}/g, "\n\n");

  return t.trim();
}

export async function callClaude(
  userPrompt: string,
  options: { maxTokens?: number; system?: string } = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in .env.local");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: options.maxTokens ?? 1024,
      messages: [
        ...(options.system ? [{ role: "system", content: options.system }] : []),
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message ?? `Groq API error (${response.status})`;
    throw new Error(message);
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    throw new Error("Unexpected response from Groq API");
  }

  return sanitizeModelText(text);
}

export function parseJsonFromClaude<T>(text: string): T {
  const cleaned = sanitizeModelText(text.replace(/```json\n?|\n?```/g, "").trim());
  return JSON.parse(cleaned) as T;
}
