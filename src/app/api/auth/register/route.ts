import { NextResponse } from "next/server";
import { hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";

function validateEmail(email: unknown): email is string {
  return typeof email === "string" && /.+@.+\..+/.test(email);
}

function validatePassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body ?? {};

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser?.passwordHash) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await hash(password, 12);

    if (existingUser) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name:
            typeof name === "string" && name.trim().length > 0 ? name.trim() : existingUser.name,
          passwordHash,
        },
      });
    } else {
      await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: typeof name === "string" && name.trim().length > 0 ? name.trim() : null,
          passwordHash,
        },
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to register user", error);
    return NextResponse.json({ error: "Unable to register right now." }, { status: 500 });
  }
}
