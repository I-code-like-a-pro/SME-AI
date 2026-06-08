import { NextRequest, NextResponse } from "next/server";
import { getConversations, createConversation } from "@/lib/conversations";

export async function GET() {
  try {
    const convos = await getConversations();
    return NextResponse.json({ conversations: convos });
  } catch (err) {
    console.error("[api/conversations] GET error", err);
    return NextResponse.json({ error: "Could not load conversations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json();
    const conv = await createConversation(title ?? "New conversation");
    return NextResponse.json({ conversation: conv });
  } catch (err) {
    console.error("[api/conversations] POST error", err);
    return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });
  }
}
