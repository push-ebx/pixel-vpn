import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("pixel-vpn-web-auth-token")?.value;

  if (!token) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({ user: null, isAuthenticated: true });
}