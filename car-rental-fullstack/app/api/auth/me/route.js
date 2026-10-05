import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../lib/auth";

export async function GET(request) {
  const user = await getCurrentUser(request);
  return NextResponse.json({ user });
}
