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

If there is no or very little sales data, instead of asking for external methods or using patronizing language, ask one concise clarifying question about whether they want to log sales now (for example: "Would you like to log your recent sales so I can give more accurate insights?").

IMPORTANT: You MUST respond ONLY with a valid JSON array of strings. Example:
["Your best selling day is Monday.", "Rice is your top product this week."]

If providing questions instead of insights, wrap them in the JSON array too:
["Would you like to log your recent sales so I can give more accurate insights?"]`,
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
