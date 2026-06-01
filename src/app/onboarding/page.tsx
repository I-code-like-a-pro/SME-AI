"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { saveOnboardingData } from "@/lib/storage";
import {
  BUSINESS_TYPES,
  LANGUAGES,
  type BusinessType,
  type Language,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["Your Name", "Business Type", "Language"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType | "">("");
  const [language, setLanguage] = useState<Language | "">("");

  const progress = ((step + 1) / STEPS.length) * 100;

  const [saving, setSaving] = useState(false);

  async function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      setSaving(true);
      try {
        await saveOnboardingData({
          name: name.trim(),
          businessType: businessType as BusinessType,
          language: language as Language,
          completedAt: new Date().toISOString(),
        });
        router.push("/dashboard");
      } finally {
        setSaving(false);
      }
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  const canProceed =
    (step === 0 && name.trim().length >= 2) ||
    (step === 1 && businessType !== "") ||
    (step === 2 && language !== "");

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="mx-auto max-w-lg px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm">
              AI
            </div>
            <span className="text-lg font-bold text-primary">SME AI</span>
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </span>
            <span className="text-sm font-bold text-primary">{STEPS[step]}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="space-y-6">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  What should we call you?
                </h1>
                <p className="text-muted-foreground">
                  Enter your name so we can personalize your experience.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Amara, Raj, Fatima"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  What type of business do you run?
                </h1>
                <p className="text-muted-foreground">
                  This helps us give you relevant tips and loan options.
                </p>
              </div>
              <div className="grid gap-3">
                {BUSINESS_TYPES.map(({ value, label, emoji }) => (
                  <Card
                    key={value}
                    className={cn(
                      "cursor-pointer border-2 transition-all",
                      businessType === value
                        ? "border-primary bg-green-50"
                        : "border-gray-200 hover:border-green-200"
                    )}
                    onClick={() => setBusinessType(value)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <span className="text-2xl">{emoji}</span>
                      <span className="font-semibold flex-1">{label}</span>
                      {businessType === value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Choose your language
                </h1>
                <p className="text-muted-foreground">
                  We&apos;ll show tips and insights in your preferred language.
                </p>
              </div>
              <div className="grid gap-3">
                {LANGUAGES.map(({ value, label, native }) => (
                  <Card
                    key={value}
                    className={cn(
                      "cursor-pointer border-2 transition-all",
                      language === value
                        ? "border-primary bg-green-50"
                        : "border-gray-200 hover:border-green-200"
                    )}
                    onClick={() => setLanguage(value)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="flex-1">
                        <div className="font-semibold">{label}</div>
                        <div className="text-sm text-muted-foreground">
                          {native}
                        </div>
                      </div>
                      {language === value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed || saving}
            className="flex-1"
          >
            {saving ? "Saving..." : step === STEPS.length - 1 ? "Start Using SME AI" : "Continue"}
            {step < STEPS.length - 1 && <ArrowRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
