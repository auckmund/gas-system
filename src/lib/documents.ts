import type { InvoiceStatus, QuotationStatus } from "@/types";

export function quotationStatusVariant(
  status: QuotationStatus,
): "default" | "secondary" | "accent" | "warning" | "destructive" | "outline" | "success" {
  switch (status) {
    case "accepted":
    case "converted":
      return "success";
    case "sent":
      return "accent";
    case "draft":
      return "outline";
    case "rejected":
    case "expired":
      return "destructive";
    default:
      return "warning";
  }
}

export function invoiceDocStatusVariant(
  status: InvoiceStatus,
): "success" | "destructive" | "warning" | "outline" {
  if (status === "paid") return "success";
  if (status === "overdue") return "destructive";
  if (status === "draft") return "outline";
  return "warning";
}

export const QUOTE_CATALOG = [
  { description: "LPG cylinder refill (9kg)", unit: "cyl", unitPrice: 140 },
  { description: "LPG cylinder refill (19kg)", unit: "cyl", unitPrice: 280 },
  { description: "LPG cylinder refill (48kg)", unit: "cyl", unitPrice: 620 },
  { description: "IoT device installation", unit: "unit", unitPrice: 450 },
  { description: "Monthly monitoring fee", unit: "month", unitPrice: 120 },
  { description: "Emergency delivery surcharge", unit: "trip", unitPrice: 85 },
  { description: "Bulk LPG supply", unit: "kg", unitPrice: 4 },
  { description: "Cylinder deposit", unit: "unit", unitPrice: 350 },
] as const;
