"use client";

import type { AuthUser, Conversation, InventoryItem, OnboardingData, Sale } from "./types";
import { parseSaleInput } from "./parse-sale";

export { parseSaleInput };

const ONBOARDING_KEY = "sme-ai-onboarding";
const SALES_KEY = "sme-ai-sales";
const USER_KEY = "sme-ai-user";
const CONVERSATIONS_KEY = "sme-ai-conversations";
const INVENTORY_KEY = "sme-ai-inventory";

function getLocalOnboarding(): OnboardingData | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ONBOARDING_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingData;
  } catch {
    return null;
  }
}

function saveLocalOnboarding(data: OnboardingData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(data));
}

function getLocalSales(): Sale[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SALES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Sale[];
  } catch {
    return [];
  }
}

function saveLocalSale(sale: Sale): void {
  const sales = getLocalSales();
  sales.unshift(sale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
}

export async function getOnboardingData(): Promise<OnboardingData | null> {
  return getLocalOnboarding();
}

export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  saveLocalOnboarding(data);
}

export async function getSales(): Promise<Sale[]> {
  return getLocalSales();
}

export async function saveSale(
  sale: Omit<Sale, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<Sale> {
  const fullSale: Sale = {
    id: sale.id ?? crypto.randomUUID(),
    description: sale.description,
    amount: sale.amount,
    quantity: sale.quantity,
    item: sale.item,
    createdAt: sale.createdAt ?? new Date().toISOString(),
  };

  saveLocalSale(fullSale);
  return fullSale;
}

export async function getSalesSummary() {
  const sales = await getSales();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todaySales = sales.filter((s) => new Date(s.createdAt) >= todayStart);
  const weekSales = sales.filter((s) => new Date(s.createdAt) >= weekStart);
  const monthSales = sales.filter((s) => new Date(s.createdAt) >= monthStart);

  return {
    today: todaySales.reduce((sum, s) => sum + s.amount, 0),
    week: weekSales.reduce((sum, s) => sum + s.amount, 0),
    month: monthSales.reduce((sum, s) => sum + s.amount, 0),
    totalSales: sales.length,
    recentSales: sales.slice(0, 5),
  };
}

/* -------------------------------------------------------------------------- */
/* Auth — local login/session stored in localStorage.                         */
/* -------------------------------------------------------------------------- */

function getLocalUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setLocalUser(user: AuthUser | null): void {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
  // Let the auth context (and other browser tabs) know the session changed.
  window.dispatchEvent(new CustomEvent("sme-ai:auth-changed"));
}

export async function getUser(): Promise<AuthUser | null> {
  return getLocalUser();
}

export async function signIn(email: string): Promise<AuthUser> {
  const existing = getLocalUser();
  const user: AuthUser =
    existing && existing.email === email
      ? existing
      : { id: crypto.randomUUID(), email };
  setLocalUser(user);
  return user;
}

export async function signUp(email: string): Promise<AuthUser> {
  const user: AuthUser = { id: crypto.randomUUID(), email };
  setLocalUser(user);
  return user;
}

export async function signOut(): Promise<void> {
  setLocalUser(null);
}

/* -------------------------------------------------------------------------- */
/* Conversations — chat threads stored in localStorage.                        */
/* -------------------------------------------------------------------------- */

function getLocalConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CONVERSATIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export async function getConversations(): Promise<Conversation[]> {
  return getLocalConversations();
}

export async function createConversation(
  title = "New conversation"
): Promise<Conversation> {
  const conv: Conversation = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
  };
  const all = getLocalConversations();
  all.unshift(conv);
  if (typeof window !== "undefined") {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(all));
  }
  return conv;
}

/* -------------------------------------------------------------------------- */
/* Inventory — stock items stored in localStorage.                             */
/* -------------------------------------------------------------------------- */

function getLocalInventory(): InventoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(INVENTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as InventoryItem[];
  } catch {
    return [];
  }
}

function writeLocalInventory(items: InventoryItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(items));
}

export async function getInventory(): Promise<InventoryItem[]> {
  return getLocalInventory();
}

export async function addInventoryItem(
  input: Omit<InventoryItem, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<InventoryItem> {
  const now = new Date().toISOString();
  const item: InventoryItem = {
    id: input.id ?? crypto.randomUUID(),
    name: input.name,
    quantity: input.quantity,
    lowStockThreshold: input.lowStockThreshold,
    category: input.category,
    unit: input.unit,
    costPrice: input.costPrice,
    sellingPrice: input.sellingPrice,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
  };
  const all = getLocalInventory();
  all.unshift(item);
  writeLocalInventory(all);
  return item;
}

export async function updateInventoryItem(
  id: string,
  patch: Partial<Omit<InventoryItem, "id" | "createdAt">>
): Promise<InventoryItem | null> {
  const all = getLocalInventory();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;
  const updated: InventoryItem = {
    ...all[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  writeLocalInventory(all);
  return updated;
}

export async function adjustInventoryStock(
  id: string,
  delta: number
): Promise<InventoryItem | null> {
  const all = getLocalInventory();
  const index = all.findIndex((i) => i.id === id);
  if (index === -1) return null;
  const updated: InventoryItem = {
    ...all[index],
    quantity: Math.max(0, all[index].quantity + delta),
    updatedAt: new Date().toISOString(),
  };
  all[index] = updated;
  writeLocalInventory(all);
  return updated;
}

export async function deleteInventoryItem(id: string): Promise<void> {
  const all = getLocalInventory().filter((i) => i.id !== id);
  writeLocalInventory(all);
}
