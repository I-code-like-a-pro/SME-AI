"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, BookOpen, Sparkles, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getOnboardingData } from "@/lib/storage";
import type { LearnTip } from "@/lib/types";
import { cn } from "@/lib/utils";

const tips: LearnTip[] = [
  { id: "1", title: "Pay Yourself First", content: "Before spending today's earnings, set aside a small amount — even $1 — for savings. This builds a safety net for slow days and emergencies.", topic: "savings" },
  { id: "2", title: "Track Every Sale", content: "Small sales add up! Recording every transaction — even a $2 sale — gives you a true picture of your business and helps you spot trends.", topic: "budgeting" },
  { id: "3", title: "Understand Loan Terms", content: "Before taking a loan, know the total you'll repay (principal + interest) and how much you'll pay each week. Only borrow what you can repay from sales.", topic: "loans" },
  { id: "4", title: "Separate Business Money", content: "Keep business earnings separate from personal spending. Use a dedicated pouch, box, or mobile wallet for your business cash.", topic: "budgeting" },
  { id: "5", title: "Reinvest for Growth", content: "When you have a good week, reinvest part of your profit into better stock or tools. This helps your business grow faster over time.", topic: "growth" },
  { id: "6", title: "Watch Out for Scams", content: "Never share your PIN or OTP with anyone — not even someone claiming to be from a bank or loan company. Real lenders never ask for these.", topic: "safety" },
  { id: "7", title: "Price for Profit", content: "Know your costs (what you pay for goods) and add a fair markup. A 20-30% markup on retail goods is common. Don't sell at a loss!", topic: "growth" },
  { id: "8", title: "Build an Emergency Fund", content: "Aim to save enough to cover 1-2 weeks of stock costs. This protects you when sales are slow or suppliers raise prices suddenly.", topic: "savings" },
];

const topicStyles: Record<LearnTip["topic"], { label: string; bg: string; text: string }> = {
  savings: { label: "Savings", bg: "bg-green-100", text: "text-green-700" },
  loans: { label: "Loans", bg: "bg-blue-100", text: "text-blue-700" },
  budgeting: { label: "Budgeting", bg: "bg-purple-100", text: "text-purple-700" },
  growth: { label: "Growth", bg: "bg-orange-100", text: "text-orange-700" },
  safety: { label: "Safety", bg: "bg-red-100", text: "text-red-700" },
};

export default function LearnPage() {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const tip = tips[current];
  const style = topicStyles[tip.topic];

  function goNext() { setCurrent((c) => (c + 1) % tips.length); }
  function goPrev() { setCurrent((c) => (c - 1 + tips.length) % tips.length); }

  async function fetchAiTip() {
    const user = await getOnboardingData();
    setAiLoading(true);
    setAiTip(null);
    try {
      const res = await fetch("/api/get-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: user?.businessType,
          language: user?.language,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiTip(data.tip);
    } catch {
      setAiTip("Could not load AI tip. Check your API key and restart the dev server.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1"><BookOpen className="h-5 w-5 text-primary" /><h1 className="text-2xl font-extrabold text-gray-900">Learn</h1></div>
          <p className="text-muted-foreground">Swipe through financial tips for your business</p>
        </div>
        <div className="relative mb-6" onTouchStart={(e) => setTouchStart(e.touches[0].clientX)} onTouchEnd={(e) => { if (touchStart === null) return; const diff = touchStart - e.changedTouches[0].clientX; if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev(); } setTouchStart(null); }}>
          <Card className="border-2 border-green-200 min-h-[320px] flex flex-col shadow-md">
            <CardContent className="p-6 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-4">
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", style.bg, style.text)}>{style.label}</span>
                <span className="text-xs font-semibold text-muted-foreground">{current + 1} / {tips.length}</span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-4">{tip.title}</h2>
              <p className="text-muted-foreground leading-relaxed flex-1 text-base">{tip.content}</p>
              <div className="flex justify-center gap-1.5 mt-6">
                {tips.map((_, i) => (
                  <button key={i} onClick={() => setCurrent(i)} className={cn("h-2 rounded-full transition-all", i === current ? "w-6 bg-primary" : "w-2 bg-green-200")} aria-label={`Go to tip ${i + 1}`} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-3 mb-4">
          <Button variant="outline" onClick={goPrev} className="flex-1"><ChevronLeft className="h-4 w-4" /> Previous</Button>
          <Button onClick={goNext} className="flex-1">Next <ChevronRight className="h-4 w-4" /></Button>
        </div>
        <Button onClick={fetchAiTip} disabled={aiLoading} variant="secondary" className="w-full mb-4">
          {aiLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Getting AI tip...</> : <><Sparkles className="h-4 w-4" /> Get a personalized AI tip</>}
        </Button>
        {aiTip && (
          <Card className="border-2 border-primary/20 bg-green-50 mb-4">
            <CardContent className="p-4 text-sm leading-relaxed flex gap-2">
              <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              {aiTip}
            </CardContent>
          </Card>
        )}
        <div className="mt-8">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Browse by Topic</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(topicStyles).map(([topic, s]) => (
              <button key={topic} onClick={() => setCurrent(tips.findIndex((t) => t.topic === topic))} className={cn("rounded-full px-3 py-1.5 text-xs font-bold transition-all", s.bg, s.text, tips[current].topic === topic && "ring-2 ring-primary ring-offset-1")}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>
    </OnboardingGuard>
  );
}
