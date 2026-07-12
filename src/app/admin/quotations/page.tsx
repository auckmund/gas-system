"use client";

import { useMemo, useState } from "react";
import { FileText, Plus } from "lucide-react";
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
import { quotationStatusVariant } from "@/lib/documents";
import { formatCurrency } from "@/lib/utils";
import {
  customerService,
  quotationService,
  supplierService,
} from "@/services";
import type { Quotation, QuotationStatus } from "@/types";

const STATUS_FILTERS: Array<QuotationStatus | "all"> = [
  "all",
  "draft",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted",
];

export default function AdminQuotationsPage() {
  const [tick, setTick] = useState(0);
  const suppliers = useMemo(
    () => supplierService.getAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );
  const customers = customerService.getAll();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "all">("all");
  const [supplierId, setSupplierId] = useState("all");
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const quotations = useMemo(
    () => quotationService.getAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...quotations]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .filter((quote) => {
        const customer = customers.find((c) => c.id === quote.customerId);
        const supplier = suppliers.find((s) => s.id === quote.supplierId);
        const matchStatus = status === "all" || quote.status === status;
        const matchSupplier = supplierId === "all" || quote.supplierId === supplierId;
        const matchQ =
          !query ||
          quote.quoteNumber.toLowerCase().includes(query) ||
          quote.id.toLowerCase().includes(query) ||
          customer?.name.toLowerCase().includes(query) ||
          supplier?.name.toLowerCase().includes(query);
        return matchStatus && matchSupplier && matchQ;
      });
  }, [quotations, customers, suppliers, q, status, supplierId]);

  const counts = useMemo(() => {
    return {
      total: quotations.length,
      sent: quotations.filter((x) => x.status === "sent").length,
      accepted: quotations.filter((x) => x.status === "accepted").length,
      value: quotations.reduce((s, x) => s + x.total, 0),
    };
  }, [quotations]);

  return (
    <RoleGuard
      roles={["super_admin"]}
      title="Platform Quotations"
      subtitle="All supplier quotations across the network"
    >
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Total quotes" value={String(counts.total)} />
        <Metric label="Awaiting response" value={String(counts.sent)} />
        <Metric label="Accepted" value={String(counts.accepted)} />
        <Metric label="Pipeline value" value={formatCurrency(counts.value)} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search quote, customer, supplier…"
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
          Create quotation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-accent" />
            {filtered.length} quotations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-xs">{quote.quoteNumber}</TableCell>
                  <TableCell>
                    {suppliers.find((s) => s.id === quote.supplierId)?.name ?? quote.supplierId}
                  </TableCell>
                  <TableCell>
                    {customers.find((c) => c.id === quote.customerId)?.name ?? quote.customerId}
                  </TableCell>
                  <TableCell>{formatCurrency(quote.total)}</TableCell>
                  <TableCell>
                    <Badge variant={quotationStatusVariant(quote.status)}>{quote.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(quote.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" onClick={() => setPreview(quote)}>
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
          kind="quotation"
          suppliers={suppliers}
          onClose={() => setCreating(false)}
          onCreated={(doc) => {
            setCreating(false);
            setTick((t) => t + 1);
            setToast(`Created ${(doc as Quotation).quoteNumber}`);
            setPreview(doc as Quotation);
            window.setTimeout(() => setToast(""), 2500);
          }}
        />
      )}

      {preview && (
        <DocumentPreview
          doc={{ kind: "quotation", data: preview }}
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
