import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, getUserData, saveUserData, COOKIE_NAME } from "@/lib/auth";

// GET: Load all user data (called on login to restore localStorage)
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const data = await getUserData(session.userId);
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}

// POST: Save user data (called periodically and on important changes)
export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const session = await verifySession(token);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json();
    await saveUserData(session.userId, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
