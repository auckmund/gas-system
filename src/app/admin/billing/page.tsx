"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/layout/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerService,
  invoiceService,
  platformBillingService,
  supplierService,
} from "@/services";
import { formatCurrency } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { invoiceStatusVariant } from "@/components/dashboard/billing-summary";
import { Building2, CreditCard, Users, Wallet } from "lucide-react";

type Tab = "platform" | "clients";

export default function AdminBillingPage() {
  const invoices = invoiceService.getAll();
  const platformInvoices = platformBillingService.getAll();
  const customers = customerService.getAll();
  const suppliers = supplierService.getAll();
  const [tab, setTab] = useState<Tab>("platform");

  const clientPaid = invoiceService.getPaid(invoices);
  const clientOutstanding = invoiceService.getOutstanding(invoices);
  const platformPaid = platformBillingService.getPaid(platformInvoices);
  const platformOutstanding = platformBillingService.getOutstanding(platformInvoices);

  return (
    <RoleGuard
      roles={["super_admin"]}
      title="Billing & Subscriptions"
      subtitle="Platform SaaS fees and end-customer invoice ledger"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="SaaS collected" value={formatCurrency(platformPaid)} icon={Building2} tone="accent" />
        <StatCard title="SaaS outstanding" value={formatCurrency(platformOutstanding)} icon={CreditCard} tone="warning" />
        <StatCard title="Customer collected" value={formatCurrency(clientPaid)} icon={Wallet} tone="secondary" />
        <StatCard title="Customer outstanding" value={formatCurrency(clientOutstanding)} icon={Users} tone="primary" />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Supplier subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suppliers.map((s) => {
              const plan = platformBillingService.getCurrentPlan(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between border border-border px-3 py-2 text-sm"
                >
                  <div>
                    <div>{s.name}</div>
                    <div className="text-xs capitalize text-muted-foreground">
                      {plan?.plan ?? "—"} · {plan?.deviceCount ?? 0} devices
                    </div>
                  </div>
                  <Badge variant="accent">Active</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Billing models</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <span className="text-foreground">Supplier SaaS:</span> Starter / Growth / Enterprise + per-device fee
            </p>
            <p>
              <span className="text-foreground">Pay-As-You-Use:</span> R4/kg consumption billing
            </p>
            <p>
              <span className="text-foreground">Monthly subscription:</span> Fixed monitoring fee + usage
            </p>
            <p>
              Customers on consumption:{" "}
              {customers.filter((c) => c.billingModel === "consumption").length}
            </p>
            <p>
              Customers on subscription:{" "}
              {customers.filter((c) => c.billingModel === "subscription").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("platform")}
          className={`border px-4 py-2 text-xs font-medium uppercase tracking-wider ${
            tab === "platform"
              ? "border-primary bg-primary/20 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          Platform SaaS invoices
        </button>
        <button
          type="button"
          onClick={() => setTab("clients")}
          className={`border px-4 py-2 text-xs font-medium uppercase tracking-wider ${
            tab === "clients"
              ? "border-primary bg-primary/20 text-primary"
              : "border-border text-muted-foreground"
          }`}
        >
          Customer invoices
        </button>
      </div>

      {tab === "platform" ? (
        <Card>
          <CardHeader>
            <CardTitle>Platform invoices ({platformInvoices.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Devices</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...platformInvoices]
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                      <TableCell>
                        {suppliers.find((s) => s.id === inv.supplierId)?.name ?? inv.supplierId}
                      </TableCell>
                      <TableCell className="capitalize">{inv.plan}</TableCell>
                      <TableCell>{inv.deviceCount}</TableCell>
                      <TableCell>{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={invoiceStatusVariant(inv.status)}>{inv.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(inv.date).toLocaleDateString()}
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
            <CardTitle>Customer invoices ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...invoices]
                  .sort((a, b) => +new Date(b.date) - +new Date(a.date))
                  .map((inv) => {
                    const cust = customers.find((c) => c.id === inv.customerId);
                    const supplier = suppliers.find((s) => s.id === inv.supplierId);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-xs">{inv.id}</TableCell>
                        <TableCell>{cust?.name ?? inv.customerId}</TableCell>
                        <TableCell className="text-xs">{supplier?.name ?? inv.supplierId}</TableCell>
                        <TableCell className="capitalize">{inv.billingModel}</TableCell>
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
    </RoleGuard>
  );
}
