"use client";

import { useState } from "react";
import { Send, ArrowDownLeft, QrCode, Phone, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OnboardingGuard } from "@/components/onboarding-guard";

export default function PaymentsPage() {
  const [sendPhone, setSendPhone] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [receivePhone] = useState("+234 801 234 5678");
  const [sent, setSent] = useState(false);

  function handleSend() {
    if (!sendPhone || !sendAmount) return;
    setSent(true);
    setTimeout(() => { setSent(false); setSendPhone(""); setSendAmount(""); }, 3000);
  }

  return (
    <OnboardingGuard>
      <div className="mx-auto max-w-lg px-4 py-6 md:max-w-2xl md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">Payments</h1>
          <p className="text-muted-foreground mt-1">Send and receive money — demo mode, no real transactions</p>
        </div>
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-200 p-3">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">This is a mock payment interface for demonstration. No real money will be transferred.</p>
        </div>
        <Tabs defaultValue="send">
          <TabsList>
            <TabsTrigger value="send" className="gap-1.5"><Send className="h-4 w-4" /> Send</TabsTrigger>
            <TabsTrigger value="receive" className="gap-1.5"><ArrowDownLeft className="h-4 w-4" /> Receive</TabsTrigger>
          </TabsList>
          <TabsContent value="send">
            <Card className="border-2 border-green-100">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Send Money</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Recipient Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="phone" placeholder="+234 800 000 0000" value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input id="amount" type="number" placeholder="0.00" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} min="0" step="0.01" />
                </div>
                <Button onClick={handleSend} disabled={!sendPhone || !sendAmount || sent} className="w-full" size="lg">
                  {sent ? <><CheckCircle2 className="h-5 w-5" /> Sent Successfully!</> : <><Send className="h-4 w-4" /> Send ${sendAmount || "0.00"}</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="receive">
            <Card className="border-2 border-green-100">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowDownLeft className="h-4 w-4 text-primary" /> Receive Money</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Your Payment Number</Label>
                  <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
                    <Phone className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-bold text-lg text-primary">{receivePhone}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this number for customers to pay you</p>
                </div>
                <div className="space-y-2">
                  <Label>Your QR Code</Label>
                  <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-green-200 bg-white p-8">
                    <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-green-50 border-2 border-green-200">
                      <QrCode className="h-24 w-24 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Customers can scan this code to pay you instantly</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">Share Payment Link</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OnboardingGuard>
  );
}
