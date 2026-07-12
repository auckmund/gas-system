import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "R") {
  return `${currency}${amount.toLocaleString("en-NA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function gasLevelColor(level: number): string {
  if (level < 10) return "rgb(229, 57, 53)";
  if (level < 20) return "rgb(229, 57, 53)";
  if (level < 50) return "rgb(255, 160, 0)";
  return "rgb(104, 159, 56)";
}

export function gasLevelLabel(level: number): "critical" | "low" | "medium" | "good" {
  if (level < 10) return "critical";
  if (level < 20) return "low";
  if (level < 50) return "medium";
  return "good";
}

export function padId(prefix: string, num: number, width = 5) {
  return `${prefix}${String(num).padStart(width, "0")}`;
}

export function lineItemTotal(quantity: number, unitPrice: number) {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function calcDocumentTotals(
  items: { quantity: number; unitPrice: number }[],
  taxRate = 0.15,
) {
  const subtotal = Math.round(
    items.reduce((s, i) => s + lineItemTotal(i.quantity, i.unitPrice), 0) * 100,
  ) / 100;
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;
  return { subtotal, taxRate, taxAmount, total };
}

