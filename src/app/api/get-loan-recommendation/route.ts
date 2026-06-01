import { NextRequest, NextResponse } from "next/server";
import { callClaude, parseJsonFromClaude } from "@/lib/anthropic";
import { languagePrompt } from "@/lib/language";

interface AiLoan {
  name: string;
  amount: string;
  reason: string;
  eligibility: "High" | "Medium" | "Low";
  repayment: string;
}

export async function POST(req: NextRequest) {
  try {
    const { sales, businessType, language } = await req.json();
    const lang = languagePrompt(language);

    const text = await callClaude(
      `You are a financial advisor for small market traders.
Based on this trader's sales history and business type, recommend 2-3 micro-loan options.
For each loan return a JSON object with:
- name (string): loan product name
- amount (string): recommended amount range e.g. "$100-$250"
- reason (string): why this loan suits them
- eligibility (string): "High" | "Medium" | "Low"
- repayment (string): suggested repayment period

Business type: ${businessType || "general trader"}
Respond in ${lang}.
Sales data: ${JSON.stringify(sales ?? [])}

If there is no or very little sales data, do NOT advise using external notebooks or third-party apps, and do NOT include patronizing language such as "Since you haven't logged any sales yet". Instead:
- Ask one short question offering to log sales now (for example: "Would you like to log 3 recent sales now so I can tailor recommendations?").
- If the user agrees, instruct a single in-app action (for example: "Use the Log Sale feature and provide amount, description, quantity, item and date/time for each sale; I can guide you") or request those exact values in chat so they can be recorded.
- If the user declines, provide loan suggestions based on the business type only and clearly mark that recommendations are based on limited data.

Always return ONLY a valid JSON array, no explanation, no markdown.`,
      { maxTokens: 600 }
    );

    const loans = parseJsonFromClaude<AiLoan[]>(text);
    return NextResponse.json({ loans });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get loan recommendations";
    console.error("[get-loan-recommendation]", error);
    return NextResponse.json({ error: message, loans: [] }, { status: 500 });
  }
}
