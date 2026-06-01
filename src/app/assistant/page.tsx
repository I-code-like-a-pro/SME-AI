"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getOnboardingData, getSales, getSalesSummary } from "@/lib/storage";
import type { OnboardingData } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "How am I doing this week?",
  "Help me save more money",
  "Should I take a small loan?",
  "What should I restock?",
];

export default function AssistantPage() {
  const [user, setUser] = useState<OnboardingData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedSalePending, setParsedSalePending] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function init() {
      const data = await getOnboardingData();
      setUser(data);
      if (data && !initialized) {
        setMessages([
          {
            role: "assistant",
            content: `Hi ${data.name}! I'm your SME AI assistant. Ask me about your sales, savings, loans, or how to grow your ${data.businessType} business. How can I help today?`,
          },
        ]);
        setInitialized(true);
      }
    }
    init();
  }, [initialized]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    // Try to parse the input as a sale first. If it parses successfully,
    // prompt the user to confirm saving the parsed sale instead of sending
    // the text to the assistant immediately.
    try {
      const parseRes = await fetch("/api/parse-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (parseRes.ok) {
        const parsed = await parseRes.json();
        if (parsed?.success && parsed.parsed) {
          setParsedSalePending(parsed.parsed);
          setInput("");
          return;
        }
      }
    } catch (err) {
      // ignore parse errors and continue to send message to assistant
      console.warn("parse-sale failed", err);
    }

    const userMessage: Message = { role: "user", content: text.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const summary = await getSalesSummary();
      const recentSales = await getSales();
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: {
            name: user?.name,
            businessType: user?.businessType,
            language: user?.language,
            salesSummary: {
              today: summary.today,
              week: summary.week,
              month: summary.month,
              totalSales: summary.totalSales,
            },
            recentSales: recentSales.slice(0, 10),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const msg =
        error instanceof Error ? error.message : "Could not reach the assistant";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I couldn't respond right now. ${msg}. Check that ANTHROPIC_API_KEY is in .env.local and restart the dev server.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function saveParsedSale() {
    if (!parsedSalePending) return;
    try {
      setLoading(true);
      const res = await fetch("/api/log-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedSalePending),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save sale");

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Saved your sale — nice! I can use this to give better advice." },
      ]);
      setParsedSalePending(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Could not save sale: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function cancelParsedSale() {
    setParsedSalePending(null);
  }

  return (
    <OnboardingGuard>
      <div className="mx-auto flex max-w-lg flex-col md:max-w-2xl md:px-6" style={{ height: "calc(100vh - 5rem)" }}>
        <div className="px-4 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">AI Assistant</h1>
              <p className="text-xs text-muted-foreground">Your business advisor, powered by Claude</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
            >
              <Card
                className={cn(
                  "max-w-[85%] border-2",
                  msg.role === "user"
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-green-100 bg-white"
                )}
              >
                <CardContent className="p-3 text-sm leading-relaxed">{msg.content}</CardContent>
              </Card>
            </div>
          ))}
          {parsedSalePending && (
            <div className="flex justify-center">
              <Card className="border-2 border-green-100 bg-white max-w-[85%]">
                <CardContent className="p-3 text-sm leading-relaxed">
                  <div className="mb-2 font-semibold">Parsed sale</div>
                  <div className="text-xs text-muted-foreground mb-3">
                    I parsed this from your message — confirm to save it to your sales.
                  </div>
                  <div className="space-y-1 text-sm">
                    <div><strong>Amount:</strong> {parsedSalePending.amount}</div>
                    <div><strong>Description:</strong> {parsedSalePending.description}</div>
                    {parsedSalePending.quantity !== undefined && (
                      <div><strong>Quantity:</strong> {parsedSalePending.quantity}</div>
                    )}
                    {parsedSalePending.item && (
                      <div><strong>Item:</strong> {parsedSalePending.item}</div>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button onClick={() => saveParsedSale()} disabled={loading}>
                      Save sale
                    </Button>
                    <Button variant="outline" onClick={() => cancelParsedSale()} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {loading && (
            <div className="flex justify-start">
              <Card className="border-2 border-green-100">
                <CardContent className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </CardContent>
              </Card>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t bg-white px-4 py-3 space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => sendMessage(prompt)}
                disabled={loading}
                className="shrink-0 rounded-full border-2 border-green-100 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-800 hover:border-primary/30 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, savings, loans..."
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </OnboardingGuard>
  );
}
