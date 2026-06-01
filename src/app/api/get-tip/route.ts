import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";
import { languagePrompt } from "@/lib/language";

export async function POST(req: NextRequest) {
  try {
    const { businessType, language } = await req.json();
    const lang = languagePrompt(language);

    const tip = await callClaude(
      `Give one short practical financial literacy tip for a ${businessType || "small market trader"}.
Keep it under 2 sentences. Be friendly and encouraging.
Respond in ${lang}.
Return ONLY the tip text, nothing else.`,
      { maxTokens: 300 }
    );

    return NextResponse.json({ tip });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get tip";
    console.error("[get-tip]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
