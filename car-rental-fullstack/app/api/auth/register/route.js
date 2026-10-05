import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { attachSessionCookie, createSessionToken } from "../../../../lib/session";

function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    if (!validEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (bcrypt.truncates(password)) {
      return NextResponse.json({ error: "Password is too long for bcrypt." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: "USER" },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = await createSessionToken(user);
    const response = NextResponse.json({ user }, { status: 201 });
    attachSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Unable to create account." }, { status: 500 });
  }
}
