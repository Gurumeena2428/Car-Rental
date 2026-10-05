import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { attachSessionCookie, createSessionToken } from "../../../../lib/session";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const userRecord = await prisma.user.findUnique({ where: { email } });
    if (!userRecord) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const matches = await bcrypt.compare(password, userRecord.passwordHash);
    if (!matches) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      role: userRecord.role,
      createdAt: userRecord.createdAt,
    };
    const token = await createSessionToken(user);
    const response = NextResponse.json({ user });
    attachSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Unable to log in." }, { status: 500 });
  }
}
