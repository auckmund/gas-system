"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Flame, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  APP_FULL_NAME,
  APP_NAME,
  APP_TAGLINE,
  DEMO_CREDENTIALS,
} from "@/lib/constants";
import { authService } from "@/services";

export default function LoginPage() {
  const { login, session, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@auckmund.com");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && session) {
      router.replace(authService.getDashboardPath(session.user.role));
    }
  }, [session, isLoading, router]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = login(email, password);
    if (!result.ok) setError(result.error ?? "Login failed");
    setSubmitting(false);
  };

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgb(74,74,74) 1px, transparent 1px), linear-gradient(90deg, rgb(74,74,74) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 border border-border bg-card px-3 py-1.5 text-xs uppercase tracking-widest text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-secondary" />
            Connected intelligence platform
          </div>
          <h1 className="text-5xl font-bold tracking-widest text-primary md:text-6xl">
            {APP_NAME}
          </h1>
          <p className="max-w-md text-lg text-foreground/90">{APP_FULL_NAME}</p>
          <p className="max-w-md text-sm text-muted-foreground">{APP_TAGLINE}</p>
          <div className="grid max-w-md gap-3 sm:grid-cols-3">
            {[
              { icon: Flame, label: "250 cylinders" },
              { icon: Shield, label: "Role-based access" },
              { icon: Activity, label: "Live IoT telemetry" },
            ].map((item) => (
              <div key={item.label} className="border border-border bg-card/80 p-3">
                <item.icon className="mb-2 h-4 w-4 text-accent" />
                <div className="text-xs text-muted-foreground">{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        <Card className="w-full max-w-md justify-self-center lg:justify-self-end">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Use demo credentials to explore role dashboards</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {error}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Quick demo access
              </p>
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => fillDemo(cred.email, cred.password)}
                  className="flex w-full items-center justify-between border border-border bg-muted/40 px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
                >
                  <span>
                    <span className="font-medium text-foreground">{cred.label}</span>
                    <span className="mt-0.5 block text-muted-foreground">{cred.email}</span>
                  </span>
                  <span className="font-mono text-muted-foreground">{cred.password}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
