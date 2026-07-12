"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  Cpu,
  FileText,
  Flame,
  Plus,
  Receipt,
  Truck,
} from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardCharts } from "@/components/dashboard/charts";
import { BillingSummaryCard } from "@/components/dashboard/billing-summary";
import { AddSupplierModal } from "@/components/suppliers/add-supplier-modal";
import { CreateDocumentModal } from "@/components/documents/create-document-modal";
import { GasCylinder } from "@/components/cylinder/gas-cylinder";
import { CylinderMap } from "@/components/map/cylinder-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  analyticsService,
  cylinderService,
  customerService,
  invoiceService,
  platformBillingService,
  quotationService,
  supplierService,
} from "@/services";
import { formatCurrency } from "@/lib/utils";
import { quotationStatusVariant, invoiceDocStatusVariant } from "@/lib/documents";
import type { Invoice, Quotation } from "@/types";

type CreateMode = "supplier" | "quotation" | "invoice" | null;

export default function AdminDashboardPage() {
  const [tick, setTick] = useState(0);
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [toast, setToast] = useState("");

  void tick;

  const stats = analyticsService.getAdminStats();
  const series = analyticsService.getConsumptionSeries();
  const lowGas = cylinderService.getLowGas(20).slice(0, 6);
  const customers = customerService.getAll();
  const suppliers = supplierService.getAll();
  const clientInvoices = invoiceService.getAll();
  const platformInvoices = platformBillingService.getAll();
  const quotations = quotationService.getAll();
  const mapPoints = cylinderService.getAll().slice(0, 80).map((cylinder) => ({
    cylinder,
    customer: customers.find((c) => c.id === cylinder.customerId),
  }));

  const clientPaid = invoiceService.getPaid(clientInvoices);
  const clientOutstanding = invoiceService.getOutstanding(clientInvoices);
  const platformPaid = platformBillingService.getPaid(platformInvoices);
  const platformOutstanding = platformBillingService.getOutstanding(platformInvoices);

  const quoteSent = quotations.filter((q) => q.status === "sent").length;
  const quoteAccepted = quotations.filter((q) => q.status === "accepted").length;
  const quoteConverted = quotations.filter((q) => q.status === "converted").length;
  const quotePipeline = quotations
    .filter((q) => ["sent", "accepted", "draft"].includes(q.status))
    .reduce((s, q) => s + q.total, 0);

  const recentQuotes = [...quotations]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);
  const recentInvoices = [...clientInvoices]
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
    .slice(0, 5);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  return (
    <RoleGuard
      roles={["super_admin"]}
      title="Platform Dashboard"
      subtitle="Global health, revenue, quotations, and invoicing"
    >
      <div className="space-y-6">
        {toast && (
          <div className="border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
            {toast}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => setCreateMode("supplier")}>
              <Plus className="h-4 w-4" />
              Add supplier
            </Button>
            <Button variant="accent" onClick={() => setCreateMode("quotation")}>
              <FileText className="h-4 w-4" />
              Create quotation
            </Button>
            <Button variant="secondary" onClick={() => setCreateMode("invoice")}>
              <Receipt className="h-4 w-4" />
              Create invoice
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Total Suppliers" value={suppliers.length} icon={Building2} tone="accent" />
          <StatCard title="Total Cylinders" value={stats.totalCylinders} icon={Flame} />
          <StatCard title="Online Devices" value={stats.onlineDevices} icon={Cpu} tone="secondary" />
          <StatCard title="Low Gas Alerts" value={stats.lowGasAlerts} icon={AlertTriangle} tone="warning" />
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={Truck}
            tone="primary"
            subtitle={`${stats.pendingDeliveries} pending deliveries`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Quotations" value={quotations.length} icon={FileText} tone="accent" subtitle={`${quoteSent} awaiting response`} />
          <StatCard title="Quote pipeline" value={formatCurrency(quotePipeline)} icon={FileText} tone="warning" subtitle={`${quoteAccepted} accepted`} />
          <StatCard title="Client invoices" value={clientInvoices.length} icon={Receipt} tone="primary" subtitle={`${quoteConverted} from quotes`} />
          <StatCard title="Invoice outstanding" value={formatCurrency(clientOutstanding)} icon={Receipt} tone="secondary" />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BillingSummaryCard
            title="Platform SaaS billing"
            href="/admin/billing"
            collected={platformPaid}
            outstanding={platformOutstanding}
            invoiceCount={platformInvoices.length}
            footnotes={[
              { label: "Active suppliers", value: String(suppliers.length) },
              {
                label: "SaaS + customer volume",
                value: formatCurrency(platformPaid + clientPaid),
              },
            ]}
            recent={[...platformInvoices]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 4)
              .map((inv) => ({
                id: inv.id,
                label: `${supplierService.getById(inv.supplierId)?.name ?? inv.supplierId} · ${inv.plan}`,
                amount: inv.amount,
                status: inv.status,
                date: inv.date,
              }))}
          />
          <BillingSummaryCard
            title="End-customer billing"
            href="/admin/invoices"
            collected={clientPaid}
            outstanding={clientOutstanding}
            invoiceCount={clientInvoices.length}
            footnotes={[
              { label: "Customers billed", value: String(customers.length) },
              { label: "Quotations open", value: String(quoteSent) },
            ]}
            recent={[...clientInvoices]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 4)
              .map((inv) => ({
                id: inv.id,
                label: customers.find((c) => c.id === inv.customerId)?.name ?? inv.customerId,
                amount: inv.amount,
                status: inv.status,
                date: inv.date,
              }))}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent quotations</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/quotations">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentQuotes.map((quote) => (
                <div
                  key={quote.id}
                  className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs">{quote.quoteNumber}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {suppliers.find((s) => s.id === quote.supplierId)?.name} →{" "}
                      {customers.find((c) => c.id === quote.customerId)?.name}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{formatCurrency(quote.total)}</span>
                    <Badge variant={quotationStatusVariant(quote.status)}>{quote.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Recent invoices</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/invoices">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs">{inv.invoiceNumber ?? inv.id}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {suppliers.find((s) => s.id === inv.supplierId)?.name} →{" "}
                      {customers.find((c) => c.id === inv.customerId)?.name}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{formatCurrency(inv.amount)}</span>
                    <Badge variant={invoiceDocStatusVariant(inv.status)}>{inv.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <DashboardCharts data={series} />

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Device Health Map</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <CylinderMap points={mapPoints} height="420px" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Critical & Low Gas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-2">
                {lowGas.map((c) => (
                  <GasCylinder key={c.id} level={c.currentLevel} size="sm" serial={c.serialNumber} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {createMode === "supplier" && (
        <AddSupplierModal
          onClose={() => setCreateMode(null)}
          onCreated={(supplier) => {
            setCreateMode(null);
            setTick((t) => t + 1);
            showToast(`Supplier ${supplier.name} added`);
          }}
        />
      )}
      {createMode === "quotation" && (
        <CreateDocumentModal
          kind="quotation"
          suppliers={suppliers}
          onClose={() => setCreateMode(null)}
          onCreated={(doc) => {
            setCreateMode(null);
            setTick((t) => t + 1);
            showToast(`Quotation ${(doc as Quotation).quoteNumber} created`);
          }}
        />
      )}
      {createMode === "invoice" && (
        <CreateDocumentModal
          kind="invoice"
          suppliers={suppliers}
          onClose={() => setCreateMode(null)}
          onCreated={(doc) => {
            setCreateMode(null);
            setTick((t) => t + 1);
            showToast(`Invoice ${(doc as Invoice).invoiceNumber ?? doc.id} created`);
          }}
        />
      )}
    </RoleGuard>
  );
}
