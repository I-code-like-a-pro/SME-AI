"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getSales } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface AiLoan {
  name: string;
  amount: string;
  reason: string;
  eligibility: "High" | "Medium" | "Low";
  repayment: string;
}

const eligibilityStyle: Record<string, string> = {
  High: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Low: "bg-gray-100 text-gray-500",
};

export default function LoansPage() {
  const [loans, setLoans] = useState<AiLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const salesCount = (await getSales()).length;
        setLoans([
          {
            name: "Starter Micro-Loan",
            amount: "₦20,000",
            reason: "A small first loan to smooth cash flow and top up your stock.",
            eligibility: salesCount >= 3 ? "High" : "Medium",
            repayment: "₦2,200 / week for 10 weeks",
          },
          {
            name: "Growth Loan",
            amount: "₦75,000",
            reason: "For expanding your stock once you have a steady sales history.",
            eligibility: salesCount >= 10 ? "Medium" : "Low",
            repayment: "₦8,500 / week for 10 weeks",
          },
          {
            name: "Working Capital Line",
            amount: "₦150,000",
            reason: "Flexible credit for established traders with consistent revenue.",
            eligibility: "Low",
            repayment: "Flexible — you pay interest only on what you use",
          },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load loan advice");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-extrabold text-gray-900">Micro-Loans</h1>
          </div>
          <p className="text-muted-foreground">AI-matched loan options for your business</p>
        </div>

        {loading && (
          <Card className="border-2 border-green-100 mb-4">
            <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              AI is analyzing your sales history...
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-2 border-amber-200 bg-amber-50 mb-4">
            <CardContent className="p-4 text-sm text-amber-800">{error}</CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {loans.map((loan, i) => (
            <Card key={i} className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{loan.name}</CardTitle>
                    <p className="text-2xl font-extrabold text-primary mt-1">{loan.amount}</p>
                  </div>
                  <div className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold", eligibilityStyle[loan.eligibility] ?? eligibilityStyle.Low)}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {loan.eligibility} match
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">{loan.reason}</p>
                <p className="text-xs font-semibold text-muted-foreground">Repayment: {loan.repayment}</p>
                <Button className="w-full" disabled={loan.eligibility === "Low"}>
                  {loan.eligibility === "Low" ? "Keep Logging Sales" : "Learn More"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {!loading && loans.length === 0 && !error && (
          <Card className="border-2 border-dashed border-green-200">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Log some sales so AI can recommend loans tailored to your business.
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-center text-muted-foreground mt-6 px-4">
          Recommendations are AI-generated guidance. Connect to partner lenders for real offers.
        </p>
      </div>
    </OnboardingGuard>
  );
}
