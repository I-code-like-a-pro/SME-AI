"use client";

import type { OnboardingData, Sale } from "./types";
import { parseSaleInput } from "./parse-sale";

export { parseSaleInput };

const ONBOARDING_KEY = "sme-ai-onboarding";
const SALES_KEY = "sme-ai-sales";

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
