import { NextRequest, NextResponse } from "next/server";
import { getMessages, addMessage } from "@/lib/conversations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") || req.url.split("/").pop();
    if (!id) return NextResponse.json({ error: "Missing conversation id" }, { status: 400 });
    const msgs = await getMessages(id);
    return NextResponse.json({ messages: msgs });
  } catch (err) {
    console.error("[api/conversations/[id]/messages] GET error", err);
    return NextResponse.json({ error: "Could not load messages" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const id = req.url.split("/").slice(-3, -2)[0];
    if (!id) return NextResponse.json({ error: "Missing conversation id" }, { status: 400 });
    const body = await req.json();
    const { role, content } = body;
    if (!role || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const msg = await addMessage(id, { role, content });
    return NextResponse.json({ message: msg });
  } catch (err) {
    console.error("[api/conversations/[id]/messages] POST error", err);
    return NextResponse.json({ error: "Could not save message" }, { status: 500 });
  }
}
