import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/slots";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serviceId = searchParams.get("service_id");
  const date = searchParams.get("date"); // YYYY-MM-DD

  if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Missing service_id or date" }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(serviceId, date);
    return NextResponse.json({ slots });
  } catch (e) {
    console.error("slots error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
