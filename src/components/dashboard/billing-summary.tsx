import Link from "next/link";
import { ArrowRight, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { InvoiceStatus } from "@/types";

export function invoiceStatusVariant(
  status: InvoiceStatus,
): "success" | "destructive" | "warning" {
  if (status === "paid") return "success";
  if (status === "overdue") return "destructive";
  return "warning";
}

interface BillingSummaryProps {
  title: string;
  href: string;
  collected: number;
  outstanding: number;
  invoiceCount: number;
  footnotes?: { label: string; value: string }[];
  recent?: { id: string; label: string; amount: number; status: InvoiceStatus; date: string }[];
}

export function BillingSummaryCard({
  title,
  href,
  collected,
  outstanding,
  invoiceCount,
  footnotes = [],
  recent = [],
}: BillingSummaryProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={href}>
            View billing
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Collected" value={formatCurrency(collected)} tone="text-secondary" />
          <Metric label="Outstanding" value={formatCurrency(outstanding)} tone="text-destructive" />
          <Metric label="Invoices" value={String(invoiceCount)} />
        </div>
        {footnotes.length > 0 && (
          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
            {footnotes.map((f) => (
              <div key={f.label} className="flex justify-between border border-border/60 px-2 py-1.5">
                <span>{f.label}</span>
                <span className="text-foreground">{f.value}</span>
              </div>
            ))}
          </div>
        )}
        {recent.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Recent</p>
            {recent.slice(0, 4).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{r.label}</div>
                  <div className="text-muted-foreground">
                    {new Date(r.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono">{formatCurrency(r.amount)}</span>
                  <Badge variant={invoiceStatusVariant(r.status)}>{r.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="border border-border bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${tone ?? ""}`}>{value}</p>
    </div>
  );
}
