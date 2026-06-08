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

If there is no or very little sales data, do NOT ask the user a question. Instead, return loan recommendations with eligibility set to "Low" and a reason that clearly states the recommendation is based on limited data and that more sales logging will improve future recommendations.

IMPORTANT: return ONLY a valid JSON array of objects. Do not include any markdown, bullet points, explanation, or extra text.
Example:
[
  {"name":"Starter micro-loan","amount":"$100-$200","reason":"Limited sales data; log more sales to improve recommendations.","eligibility":"Low","repayment":"2-3 months"}
]
`,
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
