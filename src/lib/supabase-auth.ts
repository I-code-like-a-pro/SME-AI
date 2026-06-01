import { getSupabase, isSupabaseConfigured } from "./supabase";

export async function ensureAuthSession() {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  await ensureAuthSession();
  const { data: { user } } = await getSupabase().auth.getUser();
  return user?.id ?? null;
}
