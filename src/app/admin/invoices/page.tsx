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

export default function AdminInvoicesPage() {
  const [tick, setTick] = useState(0);
  const suppliers = useMemo(
    () => supplierService.getAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );
  const customers = customerService.getAll();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [supplierId, setSupplierId] = useState("all");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const invoices = useMemo(
    () => invoiceService.getAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );
  const collected = invoiceService.getPaid(invoices);
  const outstanding = invoiceService.getOutstanding(invoices);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...invoices]
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .filter((inv) => {
        const customer = customers.find((c) => c.id === inv.customerId);
        const supplier = suppliers.find((s) => s.id === inv.supplierId);
        const matchStatus = status === "all" || inv.status === status;
        const matchSupplier = supplierId === "all" || inv.supplierId === supplierId;
        const matchQ =
          !query ||
          inv.id.toLowerCase().includes(query) ||
          (inv.invoiceNumber ?? "").toLowerCase().includes(query) ||
          customer?.name.toLowerCase().includes(query) ||
          supplier?.name.toLowerCase().includes(query);
        return matchStatus && matchSupplier && matchQ;
      });
  }, [invoices, customers, suppliers, q, status, supplierId]);

  return (
    <RoleGuard
      roles={["super_admin"]}
      title="Platform Invoices"
      subtitle="All supplier-to-customer invoices across the network"
    >
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Total invoices" value={String(invoices.length)} />
        <Metric label="Collected" value={formatCurrency(collected)} />
        <Metric label="Outstanding" value={formatCurrency(outstanding)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search invoice, customer, supplier…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="h-10 border border-input bg-muted px-3 text-sm"
        >
          <option value="all">All suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
          Create invoice
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
                <TableHead>Supplier</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs">
                    {inv.invoiceNumber ?? inv.id}
                  </TableCell>
                  <TableCell>
                    {suppliers.find((s) => s.id === inv.supplierId)?.name ?? inv.supplierId}
                  </TableCell>
                  <TableCell>
                    {customers.find((c) => c.id === inv.customerId)?.name ?? inv.customerId}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {inv.quotationId ?? "Direct"}
                  </TableCell>
                  <TableCell>{formatCurrency(inv.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={invoiceDocStatusVariant(inv.status)}>{inv.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(inv.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setPreview(inv)}>
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {creating && (
        <CreateDocumentModal
          kind="invoice"
          suppliers={suppliers}
          onClose={() => setCreating(false)}
          onCreated={(doc) => {
            setCreating(false);
            setTick((t) => t + 1);
            setToast(`Created ${(doc as Invoice).invoiceNumber ?? doc.id}`);
            setPreview(doc as Invoice);
            window.setTimeout(() => setToast(""), 2500);
          }}
        />
      )}

      {preview && (
        <DocumentPreview
          doc={{ kind: "invoice", data: preview }}
          customer={customers.find((c) => c.id === preview.customerId)}
          supplier={suppliers.find((s) => s.id === preview.supplierId)}
          onClose={() => setPreview(null)}
        />
      )}
    </RoleGuard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
