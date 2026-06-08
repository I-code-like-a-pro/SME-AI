import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "@/lib/anthropic";
import { languagePrompt } from "@/lib/language";
import { tavilySearch } from "@/lib/tavily";
import { addMessage, getConversation, updateConversationTitle } from "@/lib/conversations";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context, conversationId } = body;

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

    const system = `You are SME AI — a sharp, friendly business advisor for small traders and market sellers.
Respond in ${lang}.

Your personality:
- Talk like a knowledgeable friend who runs a business, not a corporate chatbot
- Be direct and specific — give real answers, not generic advice
- Use the trader's actual sales data when it's available; when it's not, give general advice anyway and optionally mention they can log sales for more personalised tips
- Keep responses conversational — vary your length naturally based on what the question needs
- Don't bold everything, don't bullet-point everything, just talk
- Never lecture or moralize
- Never refuse to answer a question just because data is limited — make a reasonable recommendation

You help with: restocking decisions, pricing, saving, loan decisions, spotting scams, and growing their business.
Do not claim money was transferred or invent specific loan products.`;

    let searchSummary = "";

    try {
      const lastUser = (messages as ChatMessage[]).slice().reverse().find((m) => m.role === "user");
      const lastText = lastUser?.content?.toLowerCase() ?? "";
      const shouldSearch = /restock|what products|should i restock|competitor|price|prices|where to buy|search/.test(lastText);
      if (shouldSearch && lastText) {
        const results = await tavilySearch(lastText, { searchDepth: "basic" });
        const items = (results as any)?.items ?? (results as any)?.results ?? results;
        if (Array.isArray(items)) {
          const top = items.slice(0, 3).map((it: any, i: number) => {
            const title = it.title ?? it.headline ?? it.name ?? `Result ${i + 1}`;
            const snippet = it.snippet ?? it.summary ?? it.excerpt ?? it.description ?? "";
            return `- ${title}: ${snippet}`;
          });
          searchSummary = `Web search results:\n${top.join("\n")}`;
        } else if (typeof results === "string") {
          searchSummary = `Web search results:\n${results}`;
        }
      }
    } catch (err) {
      console.warn("[assistant] tavily search failed", err);
    }

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

    const fullPrompt = searchSummary ? `${userPrompt}\n\n${searchSummary}` : userPrompt;

    const reply = await callClaude(fullPrompt, { system, maxTokens: 600 });

    try {
      if (conversationId) {
        const msgs = messages as ChatMessage[];
        const last = msgs[msgs.length - 1];
        if (last) await addMessage(conversationId, { role: last.role, content: last.content });
        await addMessage(conversationId, { role: "assistant", content: reply });
        // Auto-generate a title from the first user message if conversation has a generic title
        try {
          const firstUser = (messages as ChatMessage[]).find((m) => m.role === "user");
          if (firstUser && firstUser.content) {
            const conv = await getConversation(conversationId);
            const shouldReplace = !conv || !conv.title || /^(Conversation|New)/i.test(conv.title);
            if (shouldReplace) {
              const words = firstUser.content.replace(/[\n\r]+/g, " ").trim().split(/\s+/).slice(0, 8);
              let title = words.join(" ");
              if (title.length > 60) title = title.slice(0, 57) + "...";
              await updateConversationTitle(conversationId, title);
            }
          }
        } catch (err) {
          console.warn("[assistant] could not auto-generate conversation title", err);
        }
      }
    } catch (err) {
      console.warn("[assistant] failed to persist messages", err);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant unavailable";
    console.error("[assistant]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}