import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    // Thin route handler to delegate/process Supabase Webhooks
    return NextResponse.json({ received: true, payload });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
