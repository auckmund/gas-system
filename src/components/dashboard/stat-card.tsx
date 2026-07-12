import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  tone?: "default" | "primary" | "secondary" | "accent" | "warning";
}

const toneMap = {
  default: "text-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  accent: "text-accent",
  warning: "text-destructive",
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
}: StatCardProps) {
  return (
    <div className="border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={cn("mt-2 text-2xl font-bold tabular-nums md:text-3xl", toneMap[tone])}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="border border-border bg-muted p-2">
          <Icon className={cn("h-5 w-5", toneMap[tone])} />
        </div>
      </div>
    </div>
  );
}
