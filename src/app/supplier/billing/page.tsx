"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Building2, CreditCard, Users, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { invoiceStatusVariant } from "@/components/dashboard/billing-summary";
import { PayWithCardModal } from "@/components/billing/pay-with-card-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import {
  customerService,
  invoiceService,
  platformBillingService,
  supplierService,
} from "@/services";
import { formatCurrency } from "@/lib/utils";
import type { PlatformInvoice } from "@/types";

type Tab = "platform" | "clients";

export default function SupplierBillingPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const supplier = supplierService.getById(supplierId);
  const clients = customerService.getBySupplier(supplierId);
  const clientInvoices = invoiceService.getBySupplier(supplierId);
  const [tab, setTab] = useState<Tab>("platform");
  const [paying, setPaying] = useState<PlatformInvoice | null>(null);
  const [tick, setTick] = useState(0);

  const platformInvoices = useMemo(
    () => platformBillingService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );
  const currentPlan = platformBillingService.getCurrentPlan(supplierId);

  const clientPaid = invoiceService.getPaid(clientInvoices);
  const clientOutstanding = invoiceService.getOutstanding(clientInvoices);
  const platformPaid = platformBillingService.getPaid(platformInvoices);
  const platformOutstanding = platformBillingService.getOutstanding(platformInvoices);

  const sortedClients = useMemo(
    () =>
      [...clientInvoices].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [clientInvoices],
  );
  const sortedPlatform = useMemo(
    () =>
      [...platformInvoices].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [platformInvoices],
  );

  const unpaidPlatform = sortedPlatform.filter((inv) => inv.status !== "paid");

  return (
    <RoleGuard
      roles={["supplier_admin"]}
      title="Billing"
      subtitle="Your AUGMUND platform fees and client invoicing"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Platform fees paid"
          value={formatCurrency(platformPaid)}
          icon={Building2}
          tone="accent"
          subtitle={currentPlan ? `${currentPlan.plan} plan` : undefined}
        />
        <StatCard
          title="Platform outstanding"
          value={formatCurrency(platformOutstanding)}
          icon={CreditCard}
          tone="warning"
        />
        <StatCard
          title="Client revenue collected"
          value={formatCurrency(clientPaid)}
          icon={Wallet}
          tone="secondary"
        />
        <StatCard
          title="Client outstanding"
          value={formatCurrency(clientOutstanding)}
          icon={Users}
          tone="primary"
          subtitle={`${clients.length} customers`}
        />
      </div>

      {unpaidPlatform.length > 0 && (
        <Card className="mb-6 border-primary/40">
          <CardHeader>
            <CardTitle>Unpaid AUGMUND invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {unpaidPlatform.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-border bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0 text-sm">
                  <div className="font-mono text-xs">{inv.id}</div>
                  <div className="truncate text-muted-foreground">{inv.description}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                  <span className="font-semibold tabular-nums">{formatCurrency(inv.amount)}</span>
                  <Button size="sm" onClick={() => setPaying(inv)}>
                    <CreditCard className="h-3.5 w-3.5" />
                    Pay now
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Account overview — {supplier?.name ?? "Supplier"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Info label="Platform plan" value={currentPlan?.plan ?? "—"} />
          <Info label="Monitored devices" value={String(currentPlan?.deviceCount ?? 0)} />
          <Info
            label="Client billing models"
            value={`${clients.filter((c) => c.billingModel === "consumption").length} PAYG · ${clients.filter((c) => c.billingModel === "subscription").length} sub`}
          />
          <Info label="Gas rate" value="N$4/kg" />
        </CardContent>
      </Card>

      <div className="mb-4 flex gap-2">
        <TabButton active={tab === "platform"} onClick={() => setTab("platform")}>
          Our platform billing
        </TabButton>
        <TabButton active={tab === "clients"} onClick={() => setTab("clients")}>
          Client billing
        </TabButton>
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <Link href="/supplier/quotations">Quotations</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/supplier/invoices">Invoices</Link>
        </Button>
      </div>

      {tab === "platform" ? (
        <Card>
          <CardHeader>
            <CardTitle>AUGMUND SaaS invoices ({sortedPlatform.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPlatform.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                    <TableCell className="capitalize">{inv.plan}</TableCell>
                    <TableCell className="text-xs">{inv.description}</TableCell>
                    <TableCell>{inv.deviceCount}</TableCell>
                    <TableCell>{formatCurrency(inv.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {inv.status !== "paid" ? (
                        <Button size="sm" onClick={() => setPaying(inv)}>
                          Pay now
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Paid</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Customer invoices ({sortedClients.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClients.map((inv) => {
                  const cust = clients.find((c) => c.id === inv.customerId);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                      <TableCell>{cust?.name ?? inv.customerId}</TableCell>
                      <TableCell className="capitalize">{inv.billingModel}</TableCell>
                      <TableCell className="text-xs">{inv.description}</TableCell>
                      <TableCell>{inv.gasUsageKg} kg</TableCell>
                      <TableCell>{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(inv.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {paying && (
        <PayWithCardModal
          invoice={{
            id: paying.id,
            amount: paying.amount,
            description: paying.description,
          }}
          subtitle="AUGMUND platform invoice"
          onClose={() => setPaying(null)}
          onProcess={(id) => {
            const paid = platformBillingService.payInvoice(id);
            return paid
              ? { id: paid.id, amount: paid.amount, description: paid.description }
              : null;
          }}
          onPaid={() => {
            setPaying(null);
            setTick((t) => t + 1);
          }}
        />
      )}
    </RoleGuard>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
        active
          ? "border-primary bg-primary/20 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium capitalize">{value}</div>
    </div>
  );
}
