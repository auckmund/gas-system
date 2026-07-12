"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, CreditCard, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

export interface PayableInvoice {
  id: string;
  amount: number;
  description: string;
}

interface PayWithCardModalProps {
  invoice: PayableInvoice;
  subtitle?: string;
  onClose: () => void;
  onProcess: (invoiceId: string) => PayableInvoice | null;
  onPaid: (invoice: PayableInvoice) => void;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function PayWithCardModal({
  invoice,
  subtitle = "Secure card payment",
  onClose,
  onProcess,
  onPaid,
}: PayWithCardModalProps) {
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const digits = cardNumber.replace(/\s/g, "");
    if (cardName.trim().length < 2) {
      setError("Enter the name on the card.");
      return;
    }
    if (digits.length < 16) {
      setError("Enter a valid 16-digit card number.");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setError("Enter expiry as MM/YY.");
      return;
    }
    if (cvc.length < 3) {
      setError("Enter a valid CVC.");
      return;
    }

    setProcessing(true);
    window.setTimeout(() => {
      const paid = onProcess(invoice.id);
      setProcessing(false);
      if (!paid) {
        setError("Unable to process this invoice.");
        return;
      }
      setSuccess(true);
      window.setTimeout(() => onPaid(paid), 900);
    }, 1200);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,440px)] -translate-x-1/2 -translate-y-1/2 border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">Pay with card</h2>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-secondary" />
            <p className="text-lg font-semibold">Payment successful</p>
            <p className="text-sm text-muted-foreground">
              {invoice.id} · {formatCurrency(invoice.amount)}
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 p-4">
            <div className="border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-mono">{invoice.id}</span>
              </div>
              <div className="mt-1 flex justify-between gap-3">
                <span className="text-muted-foreground">Amount due</span>
                <span className="text-lg font-semibold text-primary">
                  {formatCurrency(invoice.amount)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{invoice.description}</p>
            </div>

            <div className="flex items-center gap-2 border border-accent/40 bg-accent/10 px-3 py-2 text-xs text-accent">
              <CreditCard className="h-4 w-4" />
              Pay with card selected
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-name">Name on card</Label>
              <Input
                id="card-name"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="Cardholder name"
                autoComplete="cc-name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="card-number">Card number</Label>
              <Input
                id="card-number"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="card-expiry">Expiry</Label>
                <Input
                  id="card-expiry"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="card-cvc">CVC</Label>
                <Input
                  id="card-cvc"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="123"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={processing}>
              <Lock className="h-4 w-4" />
              {processing ? "Processing…" : `Pay ${formatCurrency(invoice.amount)}`}
            </Button>
            <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              Demo checkout · card data is not stored
            </p>
          </form>
        )}
      </div>
    </>
  );
}
