"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X, Loader2, CheckCircle2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { saveSale, parseSaleInput } from "@/lib/storage";
import { formatCurrency, cn } from "@/lib/utils";

// Routes where a floating "log a sale" button doesn't belong.
const HIDDEN_ROUTES = ["/", "/signin", "/signup", "/onboarding", "/log"];

export function FloatingLog() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input as soon as the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside-click or Escape while the panel is open.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Only show for signed-in users, and not on the routes above.
  if (!user || HIDDEN_ROUTES.includes(pathname)) return null;

  const parsed = text.trim() ? parseSaleInput(text) : null;

  async function handleSave() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      const p = parseSaleInput(text);
      await saveSale({
        description: p.description,
        amount: p.amount,
        quantity: p.quantity,
        item: p.item,
      });
      setSaved(true);
      setText("");
      // Opt-in hook: any page can listen for this to live-refresh its sales.
      window.dispatchEvent(new CustomEvent("sme-ai:sale-logged"));
      setTimeout(() => {
        setSaved(false);
        setOpen(false);
      }, 1400);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={containerRef}
      className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6"
    >
      {open && (
        <Card className="w-[calc(100vw-2rem)] max-w-sm border-2 border-green-200 shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-gray-900">Quick log a sale</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close quick log"
                className="rounded-md p-1 text-muted-foreground hover:bg-green-50 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder="sold 10 bags of rice for ₦50"
              disabled={saving}
            />

            {parsed && parsed.amount > 0 && (
              <Card className="mt-3 border-green-200 bg-green-50">
                <CardContent className="p-3">
                  <p className="mb-1 text-xs font-semibold text-green-800">Detected:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-700">
                      {parsed.quantity ? `${parsed.quantity} × ${parsed.item}` : parsed.item ?? parsed.description}
                    </span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(parsed.amount)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleSave}
              disabled={!text.trim() || saving}
              className="mt-3 w-full"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
              ) : saved ? (
                <><CheckCircle2 className="h-4 w-4" /> Saved!</>
              ) : (
                "Save Sale"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close quick log" : "Quick log a sale"}
        aria-expanded={open}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all hover:shadow-xl",
          open ? "bg-gray-900 text-white rotate-90" : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <PlusCircle className="h-6 w-6" />}
      </button>
    </div>
  );
}
