"use client";

import { parseSaleInput } from "./parse-sale";
import type { BusinessType, Language, Sale } from "./types";

/**
 * api-client — the single seam between the UI and your backend.
 *
 * This app was migrated off its Next.js `/api` routes (Groq AI) and Supabase
 * (auth + database). Every method below currently returns hardcoded or
 * localStorage-backed data so the UI keeps working offline.
 *
 * When your real backend is ready, replace the body of each method with a
 * `fetch()` to your API. The argument and return shapes here are exactly what
 * the components already expect, so the UI won't need to change — only this
 * file does.
 */

export interface AuthUser {
  id: string;
  email: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiLoan {
  name: string;
  amount: string;
  reason: string;
  eligibility: "High" | "Medium" | "Low";
  repayment: string;
}

const USER_KEY = "sme-ai-user";
const CONV_KEY = "sme-ai-conversations";

/* -------------------------------------------------------------------------- */
/* Auth — local session stand-in. Replace with real auth calls.               */
/* -------------------------------------------------------------------------- */

function readUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new CustomEvent("sme-ai:auth-changed"));
}

const auth = {
  async getCurrentUser(): Promise<AuthUser | null> {
    // TODO(backend): GET /auth/me
    return readUser();
  },

  async signUp(email: string, _password: string): Promise<AuthUser> {
    // TODO(backend): POST /auth/signup
    const user: AuthUser = { id: crypto.randomUUID(), email };
    writeUser(user);
    return user;
  },

  async signIn(email: string, _password: string): Promise<AuthUser> {
    // TODO(backend): POST /auth/login
    const existing = readUser();
    const user: AuthUser =
      existing && existing.email === email
        ? existing
        : { id: crypto.randomUUID(), email };
    writeUser(user);
    return user;
  },

  async signOut(): Promise<void> {
    // TODO(backend): POST /auth/logout
    writeUser(null);
  },
};

/* -------------------------------------------------------------------------- */
/* Conversations — localStorage-backed. Replace with real endpoints.          */
/* -------------------------------------------------------------------------- */

function readConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CONV_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function writeConversations(list: Conversation[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONV_KEY, JSON.stringify(list));
}

const conversations = {
  async list(): Promise<Conversation[]> {
    // TODO(backend): GET /conversations
    return readConversations();
  },

  async create(title = "New conversation"): Promise<Conversation> {
    // TODO(backend): POST /conversations
    const conv: Conversation = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date().toISOString(),
    };
    const all = readConversations();
    all.unshift(conv);
    writeConversations(all);
    return conv;
  },

  async messages(_conversationId: string): Promise<ChatMessage[]> {
    // TODO(backend): GET /conversations/:id/messages
    // Per-conversation history isn't persisted offline yet.
    return [];
  },
};

/* -------------------------------------------------------------------------- */
/* AI features — hardcoded responses. Replace each with a real AI call.        */
/* -------------------------------------------------------------------------- */

async function getInsights(payload: {
  sales: Sale[];
  language?: Language;
}): Promise<{ insights: string[] }> {
  // TODO(backend): POST /ai/insights
  const sales = payload.sales ?? [];
  if (sales.length === 0) return { insights: [] };

  return {
    insights: [
      `You've logged ${sales.length} sale${sales.length === 1 ? "" : "s"}. Recording every sale — even the small ones — is the habit that unlocks better advice.`,
      "Try setting aside a small part of each day's takings as savings before you restock.",
      "Keep logging daily. Once your AI backend is connected, these insights will be tailored to your real numbers.",
    ],
  };
}

const TIPS: string[] = [
  "Pay yourself first: set aside a little savings before spending today's earnings.",
  "Track every sale, even the tiny ones — small amounts add up and reveal your trends.",
  "Know your costs and add a fair markup. Never sell below what the goods cost you.",
  "Keep business money separate from personal cash so you always know your true profit.",
  "On a good week, reinvest part of your profit into better stock — it compounds over time.",
];

async function getTip(_payload: {
  businessType?: BusinessType;
  language?: Language;
}): Promise<{ tip: string }> {
  // TODO(backend): POST /ai/tip
  const tip = TIPS[Math.floor(Math.random() * TIPS.length)];
  return { tip };
}

async function getLoanRecommendation(payload: {
  sales: Sale[];
  businessType?: BusinessType;
  language?: Language;
}): Promise<{ loans: AiLoan[] }> {
  // TODO(backend): POST /ai/loan-recommendation
  const salesCount = payload.sales?.length ?? 0;

  const loans: AiLoan[] = [
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
  ];

  return { loans };
}

async function sendAssistantMessage(payload: {
  messages: ChatMessage[];
  context?: {
    name?: string;
    salesSummary?: { totalSales?: number };
    [key: string]: unknown;
  };
}): Promise<{ reply: string }> {
  // TODO(backend): POST /ai/assistant
  const name = payload.context?.name;
  const totalSales = payload.context?.salesSummary?.totalSales;
  const greeting = name ? `${name}, ` : "";
  const salesNote =
    typeof totalSales === "number" ? ` You have ${totalSales} logged so far.` : "";

  return {
    reply: `Thanks ${greeting}I've noted that. The AI assistant is in offline mode right now — your live AI backend isn't connected yet, so I can't give tailored advice.${salesNote} Keep logging your sales and I'll have plenty to work with once the backend is live.`,
  };
}

export const apiClient = {
  auth,
  conversations,
  getInsights,
  getTip,
  getLoanRecommendation,
  sendAssistantMessage,
  parseSale(text: string) {
    return parseSaleInput(text);
  },
};
