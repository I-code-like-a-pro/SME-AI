"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, CheckCircle2, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { getSales, saveSale, parseSaleInput } from "@/lib/storage";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import type { Sale } from "@/lib/types";

export default function LogSalePage() {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    async function load() {
      const sales = await getSales();
      setRecentSales(sales.slice(0, 5));
    }
    load();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join("");
      setText(transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  function toggleListening() {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const parsed = parseSaleInput(text);
      await saveSale({
        description: parsed.description,
        amount: parsed.amount,
        quantity: parsed.quantity,
        item: parsed.item,
      });
      const sales = await getSales();
      setRecentSales(sales.slice(0, 5));
      setSaved(true);
      setText("");
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  }

  const parsed = text ? parseSaleInput(text) : null;

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Log a Sale</h1>
          <p className="text-muted-foreground mt-1">
            Speak or type what you sold — e.g. &quot;sold 10 bags of rice for $50&quot;
          </p>
        </div>

        <Card className="mb-6 border-2 border-green-100">
          <CardContent className="p-6 flex flex-col items-center gap-4">
            <button
              onClick={toggleListening}
              disabled={!speechSupported}
              className={cn(
                "relative flex h-24 w-24 items-center justify-center rounded-full transition-all shadow-lg",
                isListening ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground hover:bg-primary/90",
                !speechSupported && "opacity-50 cursor-not-allowed"
              )}
            >
              {isListening ? <MicOff className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
              {isListening && <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />}
            </button>
            <p className="text-sm font-semibold text-center">
              {isListening ? "Listening... speak now" : speechSupported ? "Tap to speak your sale" : "Voice not supported — use text input below"}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="sale-text">Or type your sale</Label>
            <Input id="sale-text" placeholder="sold 10 bags of rice for $50" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSave()} />
          </div>
          {parsed && parsed.amount > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-green-800 mb-1">Detected:</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">{parsed.quantity ? `${parsed.quantity} × ${parsed.item}` : parsed.item ?? parsed.description}</span>
                  <span className="font-bold text-primary text-lg">{formatCurrency(parsed.amount)}</span>
                </div>
              </CardContent>
            </Card>
          )}
          <Button onClick={handleSave} disabled={!text.trim() || saving} size="lg" className="w-full">
            {saving ? <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</> : saved ? <><CheckCircle2 className="h-5 w-5" /> Saved!</> : "Save Sale"}
          </Button>
        </div>

        {recentSales.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Recent Sales</h2>
            </div>
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <Card key={sale.id} className="border border-green-100">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-sm">{sale.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(new Date(sale.createdAt))}</p>
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(sale.amount)}</span>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </OnboardingGuard>
  );
}
