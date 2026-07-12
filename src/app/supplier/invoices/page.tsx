"use client";

import { useMemo, useState } from "react";
import { Plus, Receipt } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { CreateDocumentModal } from "@/components/documents/create-document-modal";
import { DocumentPreview } from "@/components/documents/document-preview";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { invoiceDocStatusVariant } from "@/lib/documents";
import { formatCurrency } from "@/lib/utils";
import {
  customerService,
  invoiceService,
  supplierService,
} from "@/services";
import type { Invoice, InvoiceStatus } from "@/types";

const STATUS_FILTERS: Array<InvoiceStatus | "all"> = [
  "all",
  "draft",
  "pending",
  "paid",
  "overdue",
];

export default function SupplierInvoicesPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const supplier = supplierService.getById(supplierId);
  const customers = customerService.getBySupplier(supplierId);
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [toast, setToast] = useState("");

  const invoices = useMemo(
    () => invoiceService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...invoices]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((inv) => {
        const customer = customers.find((c) => c.id === inv.customerId);
        const matchStatus = status === "all" || inv.status === status;
        const matchQ =
          !query ||
          inv.id.toLowerCase().includes(query) ||
          (inv.invoiceNumber ?? "").toLowerCase().includes(query) ||
          customer?.name.toLowerCase().includes(query);
        return matchStatus && matchQ;
      });
  }, [invoices, customers, q, status]);

  const collected = invoiceService.getPaid(invoices);
  const outstanding = invoiceService.getOutstanding(invoices);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const refresh = () => setTick((t) => t + 1);

  return (
    <RoleGuard
      roles={["supplier_admin"]}
      title="Invoices"
      subtitle="Issue client invoices and track payment status"
    >
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div className="border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Invoices</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{invoices.length}</p>
        </div>
        <div className="border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Collected</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-secondary">
            {formatCurrency(collected)}
          </p>
        </div>
        <div className="border border-border bg-card p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">
            {formatCurrency(outstanding)}
          </p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search invoice or customer…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-wider ${
                status === s
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New invoice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            {filtered.length} invoices
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => {
                const customer = customers.find((c) => c.id === inv.customerId);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">
                      {inv.invoiceNumber ?? inv.id}
                    </TableCell>
                    <TableCell>{customer?.name ?? inv.customerId}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {inv.quotationId ? `Quote ${inv.quotationId}` : "Direct"}
                    </TableCell>
                    <TableCell>{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={invoiceDocStatusVariant(inv.status)}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => setPreview(inv)}>
                          View
                        </Button>
                        {inv.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              invoiceService.markPaid(inv.id);
                              refresh();
                              showToast(`${inv.id} marked paid`);
                            }}
                          >
                            Mark paid
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No invoices match your filters.
            </p>
          )}
        </CardContent>
      </Card>

      {creating && (
        <CreateDocumentModal
          kind="invoice"
          supplierId={supplierId}
          customers={customers}
          onClose={() => setCreating(false)}
          onCreated={(doc) => {
            setCreating(false);
            refresh();
            showToast(`Created ${(doc as Invoice).invoiceNumber ?? doc.id}`);
            setPreview(doc as Invoice);
          }}
        />
      )}

      {preview && (
        <DocumentPreview
          doc={{ kind: "invoice", data: preview }}
          customer={customers.find((c) => c.id === preview.customerId)}
          supplier={supplier}
          onClose={() => setPreview(null)}
          actions={
            preview.status !== "paid" ? (
              <Button
                onClick={() => {
                  invoiceService.markPaid(preview.id);
                  refresh();
                  setPreview({ ...preview, status: "paid" });
                  showToast("Invoice marked as paid");
                }}
              >
                Mark as paid
              </Button>
            ) : undefined
          }
        />
      )}
    </RoleGuard>
  );
}
