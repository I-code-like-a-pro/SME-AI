"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getSales } from "@/lib/storage";
import { formatCurrency } from "@/lib/utils";
import type { Sale } from "@/lib/types";

function groupSalesByDay(sales: Sale[], days: number) {
  const result: { label: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    const daySales = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= dayStart && d < dayEnd;
    });
    result.push({
      label: date.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      revenue: daySales.reduce((sum, s) => sum + s.amount, 0),
    });
  }
  return result;
}

function groupSalesByWeek(sales: Sale[], weeks: number) {
  const result: { label: string; revenue: number }[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekEndDay = new Date(weekEnd);
    weekEndDay.setHours(23, 59, 59, 999);
    const weekSales = sales.filter((s) => {
      const d = new Date(s.createdAt);
      return d >= weekStart && d <= weekEndDay;
    });
    result.push({ label: `W${weeks - i}`, revenue: weekSales.reduce((sum, s) => sum + s.amount, 0) });
  }
  return result;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-white border-2 border-green-100 px-4 py-2 shadow-lg">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-primary">{formatCurrency(payload[0].value)}</p>
    </div>
  );
};

export default function InsightsPage() {
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    getSales().then(setSales);
  }, []);
  const weeklyData = useMemo(() => groupSalesByDay(sales, 7), [sales]);
  const monthlyData = useMemo(() => groupSalesByWeek(sales, 4), [sales]);
  const weekTotal = weeklyData.reduce((sum, d) => sum + d.revenue, 0);
  const monthTotal = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const bestDay = weeklyData.reduce((best, d) => (d.revenue > best.revenue ? d : best), weeklyData[0] ?? { label: "-", revenue: 0 });

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-3xl md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Insights</h1>
          <p className="text-muted-foreground mt-1">See how your business is doing over time</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="border-2 border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><Calendar className="h-4 w-4" /><span className="text-xs font-semibold">This Week</span></div>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(weekTotal)}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-100">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1"><TrendingUp className="h-4 w-4" /><span className="text-xs font-semibold">Best Day</span></div>
              <p className="text-2xl font-extrabold text-primary">{formatCurrency(bestDay.revenue)}</p>
              <p className="text-xs text-muted-foreground">{bestDay.label}</p>
            </CardContent>
          </Card>
        </div>
        <Tabs defaultValue="weekly">
          <TabsList><TabsTrigger value="weekly">Weekly</TabsTrigger><TabsTrigger value="monthly">Monthly</TabsTrigger></TabsList>
          <TabsContent value="weekly">
            <Card className="border-2 border-green-100">
              <CardHeader><CardTitle className="text-base">Last 7 Days</CardTitle></CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-green-50 border-2 border-dashed border-green-200">
                    <p className="text-sm text-muted-foreground text-center px-4">Log some sales to see your weekly chart</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly">
            <Card className="border-2 border-green-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Last 4 Weeks</CardTitle>
                <span className="text-sm font-bold text-primary">Total: {formatCurrency(monthTotal)}</span>
              </CardHeader>
              <CardContent>
                {sales.length === 0 ? (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-green-50 border-2 border-dashed border-green-200">
                    <p className="text-sm text-muted-foreground text-center px-4">Log some sales to see your monthly chart</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={64} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OnboardingGuard>
  );
}
