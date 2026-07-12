"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AUTH_STORAGE_KEY } from "@/lib/constants";
import { authService } from "@/services";
import type { AuthSession, UserRole } from "@/types";

interface AuthContextValue {
  session: AuthSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) setSession(JSON.parse(raw) as AuthSession);
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    (email: string, password: string) => {
      const result = authService.login(email, password);
      if (!result) return { ok: false, error: "Invalid email or password" };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(result));
      setSession(result);
      router.push(authService.getDashboardPath(result.user.role));
      return { ok: true };
    },
    [router],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setSession(null);
    router.push("/login");
  }, [router]);

  const hasRole = useCallback(
    (...roles: UserRole[]) =>
      !!session && roles.includes(session.user.role),
    [session],
  );

  const value = useMemo(
    () => ({ session, isLoading, login, logout, hasRole }),
    [session, isLoading, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
