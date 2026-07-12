"use client";

import { FormEvent, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { LineItemsEditor } from "@/components/documents/line-items-editor";
import { customerService, invoiceService, quotationService } from "@/services";
import type { Customer, Invoice, LineItem, Quotation, Supplier } from "@/types";

interface CreateDocumentModalProps {
  kind: "quotation" | "invoice";
  supplierId?: string;
  suppliers?: Supplier[];
  customers?: Customer[];
  onClose: () => void;
  onCreated: (doc: Quotation | Invoice) => void;
}

export function CreateDocumentModal({
  kind,
  supplierId: fixedSupplierId,
  suppliers,
  customers: initialCustomers,
  onClose,
  onCreated,
}: CreateDocumentModalProps) {
  const canPickSupplier = !!suppliers && suppliers.length > 0 && !fixedSupplierId;
  const [selectedSupplierId, setSelectedSupplierId] = useState(
    fixedSupplierId ?? suppliers?.[0]?.id ?? "",
  );
  const activeSupplierId = fixedSupplierId ?? selectedSupplierId;

  const customers = useMemo(() => {
    if (initialCustomers && !canPickSupplier) return initialCustomers;
    return customerService.getBySupplier(activeSupplierId);
  }, [initialCustomers, canPickSupplier, activeSupplierId]);

  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [taxRate, setTaxRate] = useState(15);
  const [validDays, setValidDays] = useState(14);
  const [items, setItems] = useState<LineItem[]>([]);
  const [error, setError] = useState("");
  const [sendNow, setSendNow] = useState(true);

  const title = kind === "quotation" ? "New quotation" : "New invoice";

  // Keep customer selection valid when supplier changes
  const customerOptions = customers;
  const effectiveCustomerId = customerOptions.some((c) => c.id === customerId)
    ? customerId
    : (customerOptions[0]?.id ?? "");

  const canSubmit = useMemo(
    () =>
      !!activeSupplierId &&
      !!effectiveCustomerId &&
      items.length > 0 &&
      items.every((i) => i.description.trim()),
    [activeSupplierId, effectiveCustomerId, items],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) {
      setError("Select supplier, customer, and add complete line items.");
      return;
    }

    if (kind === "quotation") {
      const quote = quotationService.create({
        customerId: effectiveCustomerId,
        supplierId: activeSupplierId,
        items,
        notes: notes || undefined,
        taxRate: taxRate / 100,
        validDays,
        status: sendNow ? "sent" : "draft",
      });
      onCreated(quote);
      return;
    }

    const invoice = invoiceService.create({
      customerId: effectiveCustomerId,
      supplierId: activeSupplierId,
      items,
      notes: notes || undefined,
      taxRate: taxRate / 100,
      dueInDays: validDays,
    });
    onCreated(invoice);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(96vw,820px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">{title}</h2>
            <p className="text-xs text-muted-foreground">
              Line items · VAT · customer assignment
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {canPickSupplier && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="supplier">Supplier</Label>
                <select
                  id="supplier"
                  value={selectedSupplierId}
                  onChange={(e) => {
                    setSelectedSupplierId(e.target.value);
                    setCustomerId("");
                  }}
                  className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
                  required
                >
                  {suppliers!.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} · {s.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="customer">Customer</Label>
              <select
                id="customer"
                value={effectiveCustomerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
                required
              >
                {customerOptions.length === 0 && (
                  <option value="">No customers for this supplier</option>
                )}
                {customerOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.city}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="vat">VAT %</Label>
                <Input
                  id="vat"
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="days">
                  {kind === "quotation" ? "Valid days" : "Due in days"}
                </Label>
                <Input
                  id="days"
                  type="number"
                  min={1}
                  value={validDays}
                  onChange={(e) => setValidDays(Number(e.target.value) || 14)}
                />
              </div>
            </div>
          </div>

          <LineItemsEditor
            items={items}
            taxRate={taxRate / 100}
            onChange={setItems}
          />

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional terms or delivery notes"
            />
          </div>

          {kind === "quotation" && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={sendNow}
                onChange={(e) => setSendNow(e.target.checked)}
              />
              Mark as sent to customer immediately
            </label>
          )}

          {error && (
            <p className="border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Create {kind === "quotation" ? "quotation" : "invoice"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
