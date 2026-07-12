"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  invoiceDocStatusVariant,
  quotationStatusVariant,
} from "@/lib/documents";
import { formatCurrency, lineItemTotal } from "@/lib/utils";
import type { Customer, Invoice, Quotation, Supplier } from "@/types";

type Doc =
  | { kind: "quotation"; data: Quotation }
  | { kind: "invoice"; data: Invoice };

interface DocumentPreviewProps {
  doc: Doc;
  customer?: Customer;
  supplier?: Supplier;
  onClose: () => void;
  actions?: React.ReactNode;
}

export function DocumentPreview({
  doc,
  customer,
  supplier,
  onClose,
  actions,
}: DocumentPreviewProps) {
  const isQuote = doc.kind === "quotation";
  const items = (isQuote ? doc.data.items : doc.data.items) ?? [];
  const subtotal = isQuote
    ? doc.data.subtotal
    : (doc.data.subtotal ?? doc.data.amount);
  const taxRate = isQuote ? doc.data.taxRate : (doc.data.taxRate ?? 0);
  const taxAmount = isQuote ? doc.data.taxAmount : (doc.data.taxAmount ?? 0);
  const total = isQuote ? doc.data.total : doc.data.amount;
  const number = isQuote
    ? doc.data.quoteNumber
    : (doc.data.invoiceNumber ?? doc.data.id);
  const status = doc.data.status;
  const notes = doc.data.notes;
  const fallbackDescription = !isQuote ? doc.data.description : undefined;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,720px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">
              {isQuote ? "Quotation" : "Invoice"} {number}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isQuote ? "Commercial quotation" : "Tax invoice"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                isQuote
                  ? quotationStatusVariant(doc.data.status)
                  : invoiceDocStatusVariant(doc.data.status)
              }
            >
              {status}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">From</p>
              <p className="mt-1 font-semibold">{supplier?.name ?? "Supplier"}</p>
              <p className="text-xs text-muted-foreground">{supplier?.email}</p>
              <p className="text-xs text-muted-foreground">{supplier?.location}</p>
            </div>
            <div className="border border-border p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Bill to</p>
              <p className="mt-1 font-semibold">{customer?.name ?? "Customer"}</p>
              <p className="text-xs text-muted-foreground">{customer?.email}</p>
              <p className="text-xs text-muted-foreground">
                {customer?.address}, {customer?.city}
              </p>
            </div>
          </div>

          <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            {isQuote ? (
              <>
                <Meta label="Created" value={new Date(doc.data.createdAt).toLocaleDateString()} />
                <Meta label="Valid until" value={new Date(doc.data.validUntil).toLocaleDateString()} />
                <Meta label="Quote ID" value={doc.data.id} />
              </>
            ) : (
              <>
                <Meta label="Invoice date" value={new Date(doc.data.date).toLocaleDateString()} />
                <Meta label="Due date" value={new Date(doc.data.dueDate).toLocaleDateString()} />
                <Meta
                  label="Source quote"
                  value={doc.data.quotationId ?? "—"}
                />
              </>
            )}
          </div>

          <div className="border border-border">
            <div className="grid grid-cols-[1.5fr_0.4fr_0.4fr_0.5fr_0.5fr] border-b border-border bg-muted/40 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>Description</span>
              <span>Qty</span>
              <span>Unit</span>
              <span>Price</span>
              <span className="text-right">Amount</span>
            </div>
            {items.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                {fallbackDescription ?? "No line items"}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1.5fr_0.4fr_0.4fr_0.5fr_0.5fr] border-b border-border/60 px-3 py-2 text-sm"
                >
                  <span>{item.description}</span>
                  <span className="tabular-nums">{item.quantity}</span>
                  <span>{item.unit}</span>
                  <span className="tabular-nums">{formatCurrency(item.unitPrice)}</span>
                  <span className="text-right tabular-nums">
                    {formatCurrency(lineItemTotal(item.quantity, item.unitPrice))}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                VAT ({Math.round(taxRate * 100)}%)
              </span>
              <span className="tabular-nums">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-primary">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>

          {notes && (
            <p className="border border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              {notes}
            </p>
          )}

          {actions && <div className="flex flex-wrap gap-2 border-t border-border pt-4">{actions}</div>}
        </div>
      </div>
    </>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border px-2 py-1.5">
      <div className="uppercase tracking-wider">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}
