import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJsonFromClaude } from "@/lib/anthropic";
import { languagePrompt } from "@/lib/language";

export async function POST(req: NextRequest) {
  try {
    const { sales, language } = await req.json();
    const lang = languagePrompt(language);

    const text = await callClaude(
      `You are a friendly financial advisor for small market traders.
Based on these recent sales, give 2-3 short practical insights.
Be encouraging, simple and specific.
Respond in ${lang}.

Sales data: ${JSON.stringify(sales ?? [])}

If there is no or very little sales data, do NOT suggest external methods like "keep a paper notebook" or "use a third-party phone app" and do NOT use patronizing language such as "Since you haven't logged any sales yet". Instead:
- Ask one concise clarifying question asking whether the user wants to log sales now (for example: "Would you like to log your recent sales so I can give more accurate insights?").
- If the user confirms, instruct a single in-app action (for example: "Tap Log Sale and enter amount, description, quantity, and item; I can guide you through it"), or request the exact sale fields in chat so they can be recorded.

Return ONLY a JSON array of insight strings. Example:
["Your best selling day is Monday.", "Rice is your top product this week."]`,
      { maxTokens: 500 }
    );

    const insights = parseJsonFromClaude<string[]>(text);
    return NextResponse.json({ insights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get insights";
    console.error("[get-insights]", error);
    return NextResponse.json({ error: message, insights: [] }, { status: 500 });
  }
}
