"use client";

import type { OnboardingData, Sale } from "./types";
import { parseSaleInput } from "./parse-sale";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import { ensureSession, getUserId } from "./supabase/auth";

export { parseSaleInput };

const ONBOARDING_KEY = "sme-ai-onboarding";
const SALES_KEY = "sme-ai-sales";
const MIGRATED_KEY = "sme-ai-supabase-migrated";

interface ProfileRow {
  id: string;
  name: string;
  business_type: string;
  language: string;
  completed_at: string;
}

interface SaleRow {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  quantity: number | null;
  item: string | null;
  created_at: string;
}

function mapProfileRow(row: ProfileRow): OnboardingData {
  return {
    name: row.name,
    businessType: row.business_type as OnboardingData["businessType"],
    language: row.language as OnboardingData["language"],
    completedAt: row.completed_at,
  };
}

function mapSaleRow(row: SaleRow): Sale {
  return {
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    quantity: row.quantity ?? undefined,
    item: row.item ?? undefined,
    createdAt: row.created_at,
  };
}

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

async function migrateLocalStorageToSupabase(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(MIGRATED_KEY)) return;

  const supabase = getSupabaseClient();
  const profile = getLocalOnboarding();
  const sales = getLocalSales();

  if (profile) {
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      name: profile.name,
      business_type: profile.businessType,
      language: profile.language,
      completed_at: profile.completedAt,
    });
    if (error) throw error;
  }

  if (sales.length > 0) {
    const { error } = await supabase.from("sales").upsert(
      sales.map((s) => ({
        id: s.id,
        user_id: userId,
        description: s.description,
        amount: s.amount,
        quantity: s.quantity ?? null,
        item: s.item ?? null,
        created_at: s.createdAt,
      })),
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  localStorage.setItem(MIGRATED_KEY, "true");
}

async function withSupabase<T>(
  operation: (userId: string) => Promise<T>,
  fallback: () => T
): Promise<T> {
  if (!isSupabaseConfigured()) return fallback();

  try {
    await ensureSession();
    const userId = await getUserId();
    await migrateLocalStorageToSupabase(userId);
    return await operation(userId);
  } catch (error) {
    console.warn("[storage] Supabase unavailable, using localStorage", error);
    return fallback();
  }
}

export async function getOnboardingData(): Promise<OnboardingData | null> {
  return withSupabase(async (userId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw error;
    if (data) return mapProfileRow(data as ProfileRow);
    return getLocalOnboarding();
  }, getLocalOnboarding);
}

export async function saveOnboardingData(data: OnboardingData): Promise<void> {
  saveLocalOnboarding(data);

  await withSupabase(async (userId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      name: data.name,
      business_type: data.businessType,
      language: data.language,
      completed_at: data.completedAt,
    });
    if (error) throw error;
  }, () => undefined);
}

export async function getSales(): Promise<Sale[]> {
  return withSupabase(async (userId) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as SaleRow[];
    if (rows.length === 0) return getLocalSales();
    return rows.map(mapSaleRow);
  }, getLocalSales);
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

  await withSupabase(async (userId) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("sales").insert({
      id: fullSale.id,
      user_id: userId,
      description: fullSale.description,
      amount: fullSale.amount,
      quantity: fullSale.quantity ?? null,
      item: fullSale.item ?? null,
      created_at: fullSale.createdAt,
    });
    if (error) throw error;
  }, () => undefined);

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
