"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calcDocumentTotals, formatCurrency, lineItemTotal } from "@/lib/utils";
import { QUOTE_CATALOG } from "@/lib/documents";
import type { LineItem } from "@/types";

interface LineItemsEditorProps {
  items: LineItem[];
  taxRate: number;
  onChange: (items: LineItem[]) => void;
}

export function LineItemsEditor({ items, taxRate, onChange }: LineItemsEditorProps) {
  const totals = calcDocumentTotals(items, taxRate);

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const addBlank = () => {
    onChange([
      ...items,
      {
        id: `LI-${Date.now()}`,
        description: "",
        quantity: 1,
        unit: "unit",
        unitPrice: 0,
      },
    ]);
  };

  const addFromCatalog = (index: number) => {
    const catalog = QUOTE_CATALOG[index];
    if (!catalog) return;
    onChange([
      ...items,
      {
        id: `LI-${Date.now()}-${index}`,
        description: catalog.description,
        quantity: catalog.unit === "kg" ? 20 : 1,
        unit: catalog.unit,
        unitPrice: catalog.unitPrice,
      },
    ]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addBlank}>
          <Plus className="h-3.5 w-3.5" />
          Custom line
        </Button>
        <select
          className="h-8 border border-input bg-muted px-2 text-xs text-foreground"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value !== "") {
              addFromCatalog(Number(e.target.value));
              e.target.value = "";
            }
          }}
        >
          <option value="" disabled>
            Add catalog item…
          </option>
          {QUOTE_CATALOG.map((item, idx) => (
            <option key={item.description} value={idx}>
              {item.description} — R{item.unitPrice}/{item.unit}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="grid gap-2 border border-border p-2 md:grid-cols-[1.6fr_0.5fr_0.5fr_0.7fr_auto_auto]">
            <Input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(item.id, { description: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              step="0.1"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) =>
                updateItem(item.id, { quantity: Number(e.target.value) || 0 })
              }
            />
            <Input
              placeholder="Unit"
              value={item.unit}
              onChange={(e) => updateItem(item.id, { unit: e.target.value })}
            />
            <Input
              type="number"
              min={0}
              step="0.01"
              placeholder="Unit price"
              value={item.unitPrice}
              onChange={(e) =>
                updateItem(item.id, { unitPrice: Number(e.target.value) || 0 })
              }
            />
            <div className="flex items-center justify-end font-mono text-xs tabular-nums">
              {formatCurrency(lineItemTotal(item.quantity, item.unitPrice))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(item.id)}
              aria-label="Remove line"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Add at least one line item
          </p>
        )}
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1 border border-border bg-muted/30 p-3 text-sm">
        <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
        <Row
          label={`VAT (${Math.round(taxRate * 100)}%)`}
          value={formatCurrency(totals.taxAmount)}
        />
        <Row label="Total" value={formatCurrency(totals.total)} bold />
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-primary" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
