import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./client";

export async function signUp(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = getSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function ensureSession(): Promise<Session> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabaseClient();
  const { data: existing } = await supabase.auth.getSession();

  if (existing.session?.user) {
    return existing.session;
  }

  throw new Error("Not authenticated");
}

export async function getUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }
  return user.id;
}
