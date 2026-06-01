import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";
import { languagePrompt } from "@/lib/language";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const lang = languagePrompt(context?.language);
    const name = context?.name ?? "Trader";
    const businessType = context?.businessType ?? "small business";
    const salesSummary = context?.salesSummary ?? {};
    const recentSales = context?.recentSales ?? [];

    const history = (messages as ChatMessage[])
      .map((m) => `${m.role === "user" ? "Trader" : "Assistant"}: ${m.content}`)
      .join("\n");

    const system = `You are SME AI — a warm, practical financial assistant for micro-traders and small business owners who may not have bank accounts.
  Keep answers short (2-4 sentences unless they ask for detail). Use simple words. Be encouraging, never preachy.
  Respond in ${lang}.
  Help with: sales tracking, saving, loans, pricing, restocking, scams to avoid, and growing their business.
  Do not make up specific loan offers or claim money was transferred.

  Important guidance for in-app use:
  - You operate inside the SME AI app and have access to the user's in-app sales logs (the Log Sale feature). Prefer in-app actions over external suggestions.
  - If you detect missing or incomplete sales data for a request, first ask one concise clarifying question to identify what is missing (for example: "Do you want to log your recent sales now so I can give more accurate advice?").
  - Offer a single, clear in-app action the user can take (for example: "Tap Log Sale and enter amount, description, quantity, and item for each sale; I can guide you through it") and, if the user agrees, prompt them to provide the specific values in chat so they can be recorded.
  - When asking for values, request the exact fields needed: amount, description, quantity (optional), item (optional), and date/time (optional). Keep the request short and show one example entry.
  - Do NOT suggest external methods like keeping a paper notebook or using third-party phone apps. Do NOT use patronizing language such as "Since you haven't logged any sales yet" or give blanket rules like "set aside 10%". Stay practical and supportive.`;

    const userPrompt = `Trader profile:
- Name: ${name}
- Business type: ${businessType}
- Today's sales: ${salesSummary.today ?? 0}
- This week: ${salesSummary.week ?? 0}
- This month: ${salesSummary.month ?? 0}
- Total sales logged: ${salesSummary.totalSales ?? 0}
- Recent sales: ${JSON.stringify(recentSales.slice(0, 5))}

Conversation so far:
${history}

Reply as the Assistant to the Trader's latest message. Be specific to their numbers when possible.`;

    const reply = await callClaude(userPrompt, { system, maxTokens: 600 });

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant unavailable";
    console.error("[assistant]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
