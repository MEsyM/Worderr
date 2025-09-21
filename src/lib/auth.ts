import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";

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
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  secret: requiredEnv("NEXTAUTH_SECRET"),
});
