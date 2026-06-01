import { NextRequest, NextResponse } from "next/server";
import { parseSaleInput } from "@/lib/parse-sale";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST JSON: { \"text\": \"sold 10 bags of rice for 50\" }",
  });
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid JSON body",
          hint: 'Send: { "text": "sold 10 bags of rice for 50" }. In PowerShell use single quotes so $ is not stripped.',
        },
        { status: 400 }
      );
    }

    const text =
      body &&
      typeof body === "object" &&
      "text" in body &&
      typeof (body as { text: unknown }).text === "string"
        ? (body as { text: string }).text.trim()
        : "";

    if (!text) {
      return NextResponse.json(
        { error: "Missing or empty 'text' field" },
        { status: 400 }
      );
    }

    const parsed = parseSaleInput(text);

    return NextResponse.json({
      success: true,
      parsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[parse-sale]", error);
    return NextResponse.json(
      { error: "Failed to parse sale input", details: message },
      { status: 500 }
    );
  }
}
