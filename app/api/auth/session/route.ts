import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, findUserById, toPublic, COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: toPublic(user) });
  } catch {
    return NextResponse.json({ user: null });
  }
}
