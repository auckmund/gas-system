"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { AppShell } from "@/components/layout/app-shell";
import type { UserRole } from "@/types";

export function RoleGuard({
  roles,
  title,
  subtitle,
  children,
}: {
  roles: UserRole[];
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { authorized, isLoading } = useRequireAuth(roles);

  if (isLoading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Authenticating…
      </div>
    );
  }

  return (
    <AppShell title={title} subtitle={subtitle}>
      {children}
    </AppShell>
  );
}
