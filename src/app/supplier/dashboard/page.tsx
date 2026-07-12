"use client";

import { AlertTriangle, Cpu, Flame, Truck, Users } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { DashboardCharts } from "@/components/dashboard/charts";
import { BillingSummaryCard } from "@/components/dashboard/billing-summary";
import { GasCylinder } from "@/components/cylinder/gas-cylinder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import {
  analyticsService,
  cylinderService,
  customerService,
  invoiceService,
  platformBillingService,
} from "@/services";
import { formatCurrency } from "@/lib/utils";

export default function SupplierDashboardPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const stats = analyticsService.getSupplierStats(supplierId);
  const series = analyticsService.getConsumptionSeries();
  const cylinders = cylinderService.getBySupplier(supplierId);
  const lowGas = cylinders.filter((c) => c.currentLevel < 20).slice(0, 6);
  const customers = customerService.getBySupplier(supplierId);
  const clientInvoices = invoiceService.getBySupplier(supplierId);
  const platformInvoices = platformBillingService.getBySupplier(supplierId);
  const currentPlan = platformBillingService.getCurrentPlan(supplierId);

  const clientPaid = invoiceService.getPaid(clientInvoices);
  const clientOutstanding = invoiceService.getOutstanding(clientInvoices);
  const platformPaid = platformBillingService.getPaid(platformInvoices);
  const platformOutstanding = platformBillingService.getOutstanding(platformInvoices);

  return (
    <RoleGuard
      roles={["supplier_admin"]}
      title="Supplier Dashboard"
      subtitle="NamGas Solutions — customers, cylinders & deliveries"
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Customers" value={stats.totalCustomers ?? customers.length} icon={Users} tone="accent" />
          <StatCard title="Cylinders" value={stats.totalCylinders} icon={Flame} />
          <StatCard title="Online Devices" value={stats.onlineDevices} icon={Cpu} tone="secondary" />
          <StatCard title="Low Gas Alerts" value={stats.lowGasAlerts} icon={AlertTriangle} tone="warning" />
          <StatCard
            title="Client revenue"
            value={formatCurrency(stats.monthlyRevenue)}
            icon={Truck}
            tone="primary"
            subtitle={`${stats.pendingDeliveries} pending refills`}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <BillingSummaryCard
            title="Our auckmund billing"
            href="/supplier/billing"
            collected={platformPaid}
            outstanding={platformOutstanding}
            invoiceCount={platformInvoices.length}
            footnotes={[
              { label: "Current plan", value: currentPlan?.plan ?? "—" },
              { label: "Devices billed", value: String(currentPlan?.deviceCount ?? 0) },
            ]}
            recent={[...platformInvoices]
              .sort((a, b) => +new Date(b.date) - +new Date(a.date))
              .slice(0, 4)
              .map((inv) => ({
                id: inv.id,
                label: inv.description,
                amount: inv.amount,
                status: inv.status,
                date: inv.date,
              }))}
          />
          <BillingSummaryCard
            title="Client billing"
            href="/supplier/billing"
            collected={clientPaid}
            outstanding={clientOutstanding}
            invoiceCount={clientInvoices.length}
            footnotes={[
              { label: "Customers", value: String(customers.length) },
              { label: "Rate", value: "N$4/kg PAYG" },
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

        <DashboardCharts data={series} />

        <Card>
          <CardHeader>
            <CardTitle>Cylinders needing attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              {lowGas.map((c) => (
                <GasCylinder key={c.id} level={c.currentLevel} size="md" serial={c.serialNumber} />
              ))}
              {lowGas.length === 0 && (
                <p className="text-sm text-muted-foreground">All cylinders above 20%</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
