import { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Users",
  description: "Browse the roster of LingvoJam players and see when they joined the platform.",
};

export const revalidate = 0;

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (users.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Users</CardTitle>
          <CardDescription>
            We&apos;ll display new storytellers here as soon as someone signs up.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Registered LingvoJam accounts along with their roles and join dates.
        </p>
      </header>
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl">
                  {user.name?.trim() || user.email || "Unnamed player"}
                </CardTitle>
                <CardDescription>{user.email ?? "No email on record"}</CardDescription>
              </div>
              <Badge variant="secondary" className="w-fit uppercase tracking-wide">
                {user.role.toLowerCase()}
              </Badge>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs sm:text-sm">{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Joined</span>
                <span>{formatDate(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last updated</span>
                <span>{formatDate(user.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
