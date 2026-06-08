import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { ensureSession, getUserId } from "@/lib/supabase/auth";

interface IncomingSale {
  id?: string;
  amount: number | string;
  description: string;
  quantity?: number | null;
  item?: string | null;
  createdAt?: string; // ISO string optional
}

export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // ensure session and get user id
    try {
      await ensureSession();
    } catch (err) {
      // Not authenticated — return 401 so clients can fallback to local save
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = await getUserId();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const sales: IncomingSale[] = Array.isArray(body) ? body : [body];

    const validated = [] as Array<Record<string, unknown>>;

    for (const s of sales) {
      if (typeof s !== "object" || s === null) {
        return NextResponse.json({ error: "Invalid sale object" }, { status: 400 });
      }
      const sale = s as IncomingSale;

      // basic validation
      const amount = typeof sale.amount === "string" ? Number(sale.amount) : sale.amount;
      if (Number.isNaN(amount) || typeof amount !== "number") {
        return NextResponse.json({ error: "Sale amount must be a number" }, { status: 400 });
      }
      if (!sale.description || typeof sale.description !== "string") {
        return NextResponse.json({ error: "Sale description required" }, { status: 400 });
      }

      const row: Record<string, unknown> = {
        user_id: userId,
        description: sale.description,
        amount,
        quantity: sale.quantity ?? null,
        item: sale.item ?? null,
        created_at: sale.createdAt ?? new Date().toISOString(),
      };

      if (sale.id && typeof sale.id === "string") {
        row.id = sale.id;
      }

      validated.push(row);
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("sales").upsert(validated, { onConflict: "id" });

    if (error) {
      console.error("[log-sale] Supabase error", error);
      return NextResponse.json({ error: error.message ?? "Failed to insert sales" }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[log-sale]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
