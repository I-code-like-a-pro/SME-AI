"use client";

import Link from "next/link";
import {
  Mic,
  TrendingUp,
  Shield,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";

const features = [
  {
    icon: Mic,
    title: "Voice Logging",
    description: "Record sales by speaking — no typing needed.",
  },
  {
    icon: TrendingUp,
    title: "Smart Insights",
    description: "See your revenue trends and get AI-powered tips.",
  },
  {
    icon: Shield,
    title: "Micro-Loans",
    description: "Find loan options matched to your business size.",
  },
  {
    icon: Globe,
    title: "Your Language",
    description: "English, Pidgin, Swahili, or Hindi — your choice.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <section className="mx-auto max-w-lg px-6 pt-12 pb-16 md:max-w-4xl md:pt-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold">
              AI
            </div>
            <span className="text-xl font-bold text-primary">SME AI</span>
          </div>
          {user && (
            <Link href="/dashboard" className="text-sm font-semibold text-primary hover:underline">
              Dashboard
            </Link>
          )}
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-1.5 text-sm font-semibold text-green-800">
            <Sparkles className="h-4 w-4" />
            Built for micro-traders worldwide
          </div>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-5xl">
            Your smart business assistant,{" "}
            <span className="text-primary">in your pocket</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
            Track sales, understand your money, find loans, and learn — all in
            simple language. No bank account needed to get started.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row pt-2">
            {user ? (
              <>
                <Button asChild size="lg" className="text-base">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="lg" className="text-base">
                  <Link href="/signup">
                    Get Started
                    <ArrowRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/signin">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { value: "Free", label: "To start" },
            { value: "4", label: "Languages" },
            { value: "24/7", label: "AI insights" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl bg-white border-2 border-green-100 p-4 text-center shadow-sm"
            >
              <div className="text-2xl font-extrabold text-primary">
                {stat.value}
              </div>
              <div className="text-xs font-medium text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-lg px-6 pb-20 md:max-w-4xl">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Everything you need to grow
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="border-2 border-green-100 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-5">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-primary p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Ready to take control?</h2>
          <p className="text-green-100 mb-6">
            Join thousands of traders managing their business smarter.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="bg-white text-primary hover:bg-green-50 font-bold"
          >
            {user ? (
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            ) : (
              <Link href="/signup">
                Get Started — It&apos;s Free
                <ArrowRight className="ml-1 h-5 w-5" />
              </Link>
            )}
          </Button>
        </div>
      </section>
    </div>
  );
}
