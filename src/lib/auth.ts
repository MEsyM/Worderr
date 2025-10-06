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
    strategy: "jwt",
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
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = user.role;
        token.name = user.name ?? token.name;
        token.email = user.email ?? token.email;
      } else if ((!token.userId || !token.role) && token.email) {
        const existingUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (existingUser) {
          token.userId = existingUser.id;
          token.role = existingUser.role;
          token.name = existingUser.name ?? token.name;
          token.email = existingUser.email ?? token.email;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        if (typeof token.userId === "string") {
          session.user.id = token.userId;
        } else if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }

        if (token.role) {
          session.user.role = token.role;
        } else if (!session.user.role) {
          session.user.role = "PLAYER";
        }

        const nameFromToken = token.name as string | null | undefined;
        const emailFromToken = token.email as string | null | undefined;

        session.user.name = nameFromToken ?? session.user.name ?? null;
        session.user.email = emailFromToken ?? session.user.email ?? null;
      }

      return session;
    },
  },
  secret: requiredEnv("NEXTAUTH_SECRET"),
});
