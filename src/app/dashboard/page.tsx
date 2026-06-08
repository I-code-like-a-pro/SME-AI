"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PlusCircle,
  BarChart3,
  Sparkles,
  TrendingUp,
  ArrowUpRight,
  Banknote,
  Loader2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getOnboardingData, getSales, getSalesSummary } from "@/lib/storage";
import { LANGUAGE_GREETINGS, type OnboardingData, type Sale } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const quickActions = [
  { href: "/assistant", label: "Ask AI", icon: Sparkles, color: "bg-green-600" },
  { href: "/log", label: "Log Sale", icon: PlusCircle, color: "bg-emerald-500" },
  { href: "/insights", label: "Insights", icon: BarChart3, color: "bg-teal-500" },
];

export default function DashboardPage() {
  const [user, setUser] = useState<OnboardingData | null>(null);
  const [summary, setSummary] = useState({
    today: 0,
    week: 0,
    month: 0,
    totalSales: 0,
    recentSales: [] as Sale[],
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const data = await getOnboardingData();
      setUser(data);
      setSummary(await getSalesSummary());
    }
    load();
  }, []);

  useEffect(() => {
    async function loadInsights() {
      const data = await getOnboardingData();
      const sales = await getSales();
      setInsightsLoading(true);
      setInsightsError(null);

      try {
        const res = await fetch("/api/get-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sales,
            language: data?.language ?? "english",
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Failed to load insights");
        setInsights(json.insights ?? []);
      } catch (error) {
        setInsightsError(error instanceof Error ? error.message : "Could not load AI insights");
        setInsights([]);
      } finally {
        setInsightsLoading(false);
      }
    }

    loadInsights();
  }, []);

  const greeting = user ? LANGUAGE_GREETINGS[user.language] : "Welcome back";

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-5xl md:px-6">
        <div className="mb-6">
          <p className="text-muted-foreground text-sm font-medium">{greeting}</p>
          <h1 className="text-2xl font-extrabold text-gray-900">{user?.name ?? "Trader"} 👋</h1>
        </div>

        <Link href="/assistant" className="block mb-6">
          <Card className="border-0 bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20">
                <MessageCircle className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">Chat with your AI assistant</p>
                <p className="text-green-100 text-sm">Ask about sales, savings, loans & growth</p>
              </div>
              <ArrowUpRight className="h-6 w-6 shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <Card className="mb-6 border-0 bg-primary text-primary-foreground shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-green-100 text-sm font-medium">Today&apos;s Sales</p>
                <p className="text-4xl font-extrabold mt-1">{formatCurrency(summary.today)}</p>
              </div>
              <div className="rounded-2xl bg-white/20 p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
              <div>
                <p className="text-green-100 text-xs">This Week</p>
                <p className="text-lg font-bold">{formatCurrency(summary.week)}</p>
              </div>
              <div>
                <p className="text-green-100 text-xs">This Month</p>
                <p className="text-lg font-bold">{formatCurrency(summary.month)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {quickActions.map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}>
                <Card className="border-2 border-green-100 hover:border-primary/40 transition-all hover:shadow-md">
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-center">{label}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <Link href="/loans" className="block mb-6">
          <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-primary/40 transition-all">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shrink-0">
                <Banknote className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">AI Micro-Loan Advice</p>
                <p className="text-sm text-muted-foreground">Personalized loan options for your business</p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-primary shrink-0" />
            </CardContent>
          </Card>
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">AI Insights</h2>
            {insightsLoading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </div>

          {insightsError && (
            <Card className="border-2 border-amber-200 bg-amber-50 mb-3">
              <CardContent className="p-4 text-sm text-amber-800">{insightsError}</CardContent>
            </Card>
          )}

          <div className="space-y-3">
            {insightsLoading && insights.length === 0 && (
              <Card className="border-2 border-green-100">
                <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing your sales with AI...
                </CardContent>
              </Card>
            )}
            {insights.map((insight, i) => (
              <Card key={i} className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-white">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground leading-relaxed flex gap-2">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {insight}
                  </p>
                </CardContent>
              </Card>
            ))}
            {!insightsLoading && insights.length === 0 && !insightsError && (
              <Card className="border-2 border-dashed border-green-200">
                <CardContent className="p-4 text-sm text-muted-foreground text-center">
                  Log some sales to unlock personalized AI insights.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {summary.recentSales.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Recent Sales</h2>
              <Button asChild variant="ghost" size="sm" className="text-primary">
                <Link href="/log">View all <ArrowUpRight className="h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="space-y-2">
              {summary.recentSales.map((sale) => (
                <Card key={sale.id} className="border border-green-100">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">{sale.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(sale.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(sale.amount)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {summary.totalSales === 0 && (
          <Card className="border-2 border-dashed border-green-200 bg-green-50/50">
            <CardContent className="p-6 text-center">
              <p className="font-semibold text-gray-900 mb-1">No sales logged yet</p>
              <p className="text-sm text-muted-foreground mb-4">Log your first sale so AI can give you personalized advice.</p>
              <Button asChild>
                <Link href="/log"><PlusCircle className="h-4 w-4" /> Log Your First Sale</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </OnboardingGuard>
  );
}
