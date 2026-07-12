"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import type { UserRole } from "@/types";
import { authService } from "@/services";

export function useRequireAuth(allowedRoles: UserRole[]) {
  const { session, isLoading, hasRole } = useAuth();
  const router = useRouter();
  const rolesKey = allowedRoles.join(",");

  const authorized = useMemo(
    () => !!session && hasRole(...allowedRoles),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, hasRole, rolesKey],
  );

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!authorized) {
      router.replace(authService.getDashboardPath(session.user.role));
    }
  }, [session, isLoading, authorized, router]);

  return { session, isLoading, authorized };
}
