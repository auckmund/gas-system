"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RoleGuard } from "@/components/layout/role-guard";
import { DocumentPreview } from "@/components/documents/document-preview";
import { PayWithCardModal } from "@/components/billing/pay-with-card-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { useAuth } from "@/hooks/use-auth";
import {
  customerService,
  invoiceService,
  quotationService,
  supplierService,
} from "@/services";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, FileText, Receipt } from "lucide-react";
import type { Invoice } from "@/types";

export default function CustomerBillingPage() {
  const { session } = useAuth();
  const customerId = session?.user.customerId ?? "CUS-0001";
  const [tick, setTick] = useState(0);
  const customer = useMemo(
    () => customerService.getById(customerId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerId, tick],
  );
  const supplier = supplierService.getById(customer?.supplierId ?? "");
  const invoices = useMemo(
    () => invoiceService.getByCustomer(customerId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerId, tick],
  );
  const openQuotes = quotationService
    .getByCustomer(customerId)
    .filter((q) => q.status === "sent").length;
  const paid = invoiceService.getPaid(invoices);
  const invoiceOutstanding = invoiceService.getOutstanding(invoices);
  const outstanding = (customer?.outstandingBalance ?? 0) + invoiceOutstanding;
  const unpaid = useMemo(
    () =>
      [...invoices]
        .filter((i) => i.status !== "paid")
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [invoices],
  );

  const [preview, setPreview] = useState<Invoice | null>(null);
  const [paying, setPaying] = useState<Invoice | null>(null);
  const [toast, setToast] = useState("");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  return (
    <RoleGuard roles={["customer"]} title="Billing" subtitle="Invoices, payments, and linked quotations">
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard title="Paid to date" value={formatCurrency(paid)} icon={Receipt} tone="secondary" />
        <StatCard title="Outstanding balance" value={formatCurrency(outstanding)} icon={CreditCard} tone="warning" />
        <StatCard
          title="Quotes awaiting review"
          value={openQuotes}
          icon={FileText}
          tone="accent"
          subtitle="See Quotations"
        />
      </div>

      {unpaid.length > 0 && (
        <Card className="mb-6 border-primary/40">
          <CardHeader>
            <CardTitle>Unpaid invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaid.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <div className="font-mono text-xs">{inv.invoiceNumber ?? inv.id}</div>
                  <div className="truncate text-muted-foreground">{inv.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      inv.status === "overdue"
                        ? "destructive"
                        : inv.status === "draft"
                          ? "outline"
                          : "warning"
                    }
                  >
                    {inv.status}
                  </Badge>
                  <span className="font-semibold tabular-nums">
                    {formatCurrency(inv.amount)}
                  </span>
                  <Button size="sm" onClick={() => setPaying(inv)}>
                    <CreditCard className="h-3.5 w-3.5" />
                    Pay now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Billing profile</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/customer/quotations">View quotations</Link>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            Model:{" "}
            <strong className="capitalize">{customer?.billingModel ?? "consumption"}</strong>
          </div>
          <div>
            Rate: <strong>N$4/kg</strong>
          </div>
          <div>
            Customer: <strong>{customer?.name}</strong>
          </div>
          <div>
            Supplier: <strong>{supplier?.name ?? "—"}</strong>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice history</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...invoices]
                .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                .map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">
                      {inv.invoiceNumber ?? inv.id}
                    </TableCell>
                    <TableCell className="text-xs">{inv.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.quotationId ? inv.quotationId : "Direct"}
                    </TableCell>
                    <TableCell>{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          inv.status === "paid"
                            ? "success"
                            : inv.status === "overdue"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(inv.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => setPreview(inv)}>
                          View
                        </Button>
                        {inv.status !== "paid" && (
                          <Button size="sm" onClick={() => setPaying(inv)}>
                            Pay now
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {preview && (
        <DocumentPreview
          doc={{ kind: "invoice", data: preview }}
          customer={customer}
          supplier={supplier}
          onClose={() => setPreview(null)}
          actions={
            preview.status !== "paid" ? (
              <Button onClick={() => setPaying(preview)}>
                <CreditCard className="h-4 w-4" />
                Pay now with card
              </Button>
            ) : undefined
          }
        />
      )}

      {paying && (
        <PayWithCardModal
          invoice={{
            id: paying.invoiceNumber ?? paying.id,
            amount: paying.amount,
            description: paying.description,
          }}
          subtitle="Customer invoice payment"
          onClose={() => setPaying(null)}
          onProcess={() => {
            const paid = invoiceService.markPaid(paying.id);
            return paid
              ? {
                  id: paid.invoiceNumber ?? paid.id,
                  amount: paid.amount,
                  description: paid.description,
                }
              : null;
          }}
          onPaid={() => {
            setPaying(null);
            setPreview(null);
            setTick((t) => t + 1);
            showToast("Payment successful");
          }}
        />
      )}
    </RoleGuard>
  );
}
