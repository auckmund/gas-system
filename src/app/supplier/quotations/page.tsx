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
import { useAuth } from "@/hooks/use-auth";
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

export default function SupplierQuotationsPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const supplier = supplierService.getById(supplierId);
  const customers = customerService.getBySupplier(supplierId);
  const [tick, setTick] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<QuotationStatus | "all">("all");
  const [creating, setCreating] = useState(false);
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [toast, setToast] = useState("");

  const quotations = useMemo(
    () => quotationService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return [...quotations]
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .filter((quote) => {
        const customer = customers.find((c) => c.id === quote.customerId);
        const matchStatus = status === "all" || quote.status === status;
        const matchQ =
          !query ||
          quote.quoteNumber.toLowerCase().includes(query) ||
          quote.id.toLowerCase().includes(query) ||
          customer?.name.toLowerCase().includes(query);
        return matchStatus && matchQ;
      });
  }, [quotations, customers, q, status]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  const refresh = () => setTick((t) => t + 1);

  return (
    <RoleGuard
      roles={["supplier_admin"]}
      title="Quotations"
      subtitle="Create quotes, send to customers, convert to invoices"
    >
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search quote or customer…"
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
          New quotation
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
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((quote) => {
                const customer = customers.find((c) => c.id === quote.customerId);
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-mono text-xs">{quote.quoteNumber}</TableCell>
                    <TableCell>{customer?.name ?? quote.customerId}</TableCell>
                    <TableCell>{quote.items.length}</TableCell>
                    <TableCell>{formatCurrency(quote.total)}</TableCell>
                    <TableCell>
                      <Badge variant={quotationStatusVariant(quote.status)}>
                        {quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(quote.validUntil).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="outline" onClick={() => setPreview(quote)}>
                          View
                        </Button>
                        {quote.status === "draft" && (
                          <Button
                            size="sm"
                            variant="accent"
                            onClick={() => {
                              quotationService.updateStatus(quote.id, "sent");
                              refresh();
                              showToast(`${quote.quoteNumber} sent to customer`);
                            }}
                          >
                            Send
                          </Button>
                        )}
                        {(quote.status === "sent" || quote.status === "accepted" || quote.status === "draft") && (
                          <Button
                            size="sm"
                            onClick={() => {
                              const result = quotationService.convertToInvoice(quote.id);
                              if (result) {
                                refresh();
                                showToast(
                                  `Converted to invoice ${result.invoice.invoiceNumber ?? result.invoice.id}`,
                                );
                              }
                            }}
                          >
                            To invoice
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
              No quotations match your filters.
            </p>
          )}
        </CardContent>
      </Card>

      {creating && (
        <CreateDocumentModal
          kind="quotation"
          supplierId={supplierId}
          customers={customers}
          onClose={() => setCreating(false)}
          onCreated={(doc) => {
            setCreating(false);
            refresh();
            showToast(`Created ${(doc as Quotation).quoteNumber}`);
            setPreview(doc as Quotation);
          }}
        />
      )}

      {preview && (
        <DocumentPreview
          doc={{ kind: "quotation", data: preview }}
          customer={customers.find((c) => c.id === preview.customerId)}
          supplier={supplier}
          onClose={() => setPreview(null)}
          actions={
            <>
              {preview.status === "draft" && (
                <Button
                  onClick={() => {
                    quotationService.updateStatus(preview.id, "sent");
                    refresh();
                    setPreview({ ...preview, status: "sent" });
                    showToast("Quotation sent");
                  }}
                >
                  Send to customer
                </Button>
              )}
              {(preview.status === "sent" ||
                preview.status === "accepted" ||
                preview.status === "draft") && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    const result = quotationService.convertToInvoice(preview.id);
                    if (result) {
                      refresh();
                      setPreview(null);
                      showToast(`Invoice ${result.invoice.id} created`);
                    }
                  }}
                >
                  Convert to invoice
                </Button>
              )}
            </>
          }
        />
      )}
    </RoleGuard>
  );
}
