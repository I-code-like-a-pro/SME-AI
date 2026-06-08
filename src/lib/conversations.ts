import type { } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "./supabase/client";
import { ensureSession, getUserId } from "./supabase/auth";

const CONV_KEY = "sme-ai-conversations";

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

function getLocalConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CONV_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

function saveLocalConversation(conv: Conversation) {
  const all = getLocalConversations();
  all.unshift(conv);
  localStorage.setItem(CONV_KEY, JSON.stringify(all));
}

export async function getConversations(): Promise<Conversation[]> {
  if (!isSupabaseConfigured()) return getLocalConversations();

  try {
    await ensureSession();
    const userId = await getUserId();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("id,title,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const rows = (data ?? []) as any[];
    return rows.map((r) => ({ id: r.id, title: r.title, createdAt: r.created_at }));
  } catch (err) {
    console.warn("[conversations] supabase unavailable, falling back to local", err);
    return getLocalConversations();
  }
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  if (!isSupabaseConfigured()) {
    const all = getLocalConversations();
    return all.find((c) => c.id === conversationId) ?? null;
  }

  try {
    await ensureSession();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("conversations")
      .select("id,title,created_at")
      .eq("id", conversationId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { id: data.id, title: data.title, createdAt: data.created_at };
  } catch (err) {
    console.warn("[conversations] getConversation failed", err);
    const all = getLocalConversations();
    return all.find((c) => c.id === conversationId) ?? null;
  }
}

export async function createConversation(title = "New conversation"): Promise<Conversation> {
  const conv: Conversation = { id: crypto.randomUUID(), title, createdAt: new Date().toISOString() };
  saveLocalConversation(conv);

  if (!isSupabaseConfigured()) return conv;

  try {
    await ensureSession();
    const userId = await getUserId();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("conversations").insert({ id: conv.id, user_id: userId, title: conv.title, created_at: conv.createdAt });
    if (error) throw error;
    return conv;
  } catch (err) {
    console.warn("[conversations] create failed, kept local", err);
    return conv;
  }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    await ensureSession();
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("messages")
      .select("id,role,content,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as any[];
    return rows.map((r) => ({ id: r.id, role: r.role as any, content: r.content, createdAt: r.created_at }));
  } catch (err) {
    console.warn("[conversations] getMessages failed", err);
    return [];
  }
}

export async function addMessage(conversationId: string, message: Message): Promise<Message> {
  const msg: Message = { ...message, id: message.id ?? crypto.randomUUID(), createdAt: message.createdAt ?? new Date().toISOString() };

  if (!isSupabaseConfigured()) return msg;

  try {
    await ensureSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("messages").insert({ id: msg.id, conversation_id: conversationId, role: msg.role, content: msg.content, created_at: msg.createdAt });
    if (error) throw error;
    return msg;
  } catch (err) {
    console.warn("[conversations] addMessage failed, message not persisted to supabase", err);
    return msg;
  }
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  // update local storage
  try {
    const all = getLocalConversations();
    const idx = all.findIndex((c) => c.id === conversationId);
    if (idx !== -1) {
      all[idx].title = title;
      localStorage.setItem(CONV_KEY, JSON.stringify(all));
    }
  } catch (e) {
    // ignore local update errors
  }

  if (!isSupabaseConfigured()) return;

  try {
    await ensureSession();
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("conversations").update({ title }).eq("id", conversationId);
    if (error) throw error;
  } catch (err) {
    console.warn("[conversations] updateConversationTitle failed", err);
  }
}

export default {
  getConversations,
  createConversation,
  getMessages,
  addMessage,
};
