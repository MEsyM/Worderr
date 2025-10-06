import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const emailServerPort = process.env.EMAIL_SERVER_PORT ? Number(process.env.EMAIL_SERVER_PORT) : 587;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  trustHost: true,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        const normalizedEmail = credentials.email.toLowerCase();
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        if (!user?.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
    EmailProvider({
      from: requiredEnv("EMAIL_FROM"),
      server: {
        host: requiredEnv("EMAIL_SERVER_HOST"),
        port: emailServerPort,
        auth: {
          user: requiredEnv("EMAIL_SERVER_USER"),
          pass: requiredEnv("EMAIL_SERVER_PASSWORD"),
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const sourceUser =
          user ??
          (session.user.email
            ? await prisma.user.findUnique({ where: { email: session.user.email } })
            : null);
        if (sourceUser) {
          session.user.id = sourceUser.id;
          session.user.role = sourceUser.role;
          session.user.name = sourceUser.name;
          session.user.email = sourceUser.email;
        }
      }
      return session;
    },
  },
  secret: requiredEnv("NEXTAUTH_SECRET"),
});
