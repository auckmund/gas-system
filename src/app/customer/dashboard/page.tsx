"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Package, Truck, Wallet } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { StatCard } from "@/components/dashboard/stat-card";
import { BillingSummaryCard } from "@/components/dashboard/billing-summary";
import { GasCylinder } from "@/components/cylinder/gas-cylinder";
import { CylinderDetailModal } from "@/components/cylinder/cylinder-detail-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import {
  analyticsService,
  customerService,
  cylinderService,
  invoiceService,
  readingService,
  refillService,
} from "@/services";
import { formatCurrency } from "@/lib/utils";
import type { Cylinder } from "@/types";

export default function CustomerDashboardPage() {
  const { session } = useAuth();
  const customerId = session?.user.customerId ?? "CUS-0001";
  const customer = customerService.getById(customerId);
  const stats = analyticsService.getCustomerStats(customerId);
  const cylinders = cylinderService.getByCustomer(customerId);
  const invoices = invoiceService.getByCustomer(customerId);
  const [selected, setSelected] = useState<Cylinder | null>(null);
  const [autoRefill, setAutoRefill] = useState(customer?.autoRefill ?? false);
  const [toast, setToast] = useState("");

  const paid = invoiceService.getPaid(invoices);
  const invoiceOutstanding = invoiceService.getOutstanding(invoices);
  const outstanding = useMemo(
    () => (customer?.outstandingBalance ?? 0) + invoiceOutstanding,
    [customer, invoiceOutstanding],
  );

  const onToggleAuto = (checked: boolean) => {
    setAutoRefill(checked);
    refillService.toggleAutoRefill(customerId, checked);
    setToast(checked ? "Auto refill enabled" : "Auto refill disabled");
    setTimeout(() => setToast(""), 2500);
  };

  const requestRefill = (cyl: Cylinder) => {
    refillService.requestRefill(customerId, cyl.id);
    setToast(`Refill requested for ${cyl.serialNumber}`);
    setSelected(null);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <RoleGuard
      roles={["customer"]}
      title="My Dashboard"
      subtitle="Your cylinders, usage, and refill controls"
    >
      <div className="space-y-6">
        {toast && (
          <div className="border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
            {toast}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="My Cylinders" value={stats.totalCylinders} icon={Package} />
          <StatCard title="Low Gas" value={stats.lowGasAlerts} icon={AlertTriangle} tone="warning" />
          <StatCard title="Open Orders" value={stats.pendingDeliveries} icon={Truck} tone="accent" />
          <StatCard title="Outstanding" value={formatCurrency(outstanding)} icon={Wallet} tone="primary" />
        </div>

        <BillingSummaryCard
          title="My billing"
          href="/customer/billing"
          collected={paid}
          outstanding={outstanding}
          invoiceCount={invoices.length}
          footnotes={[
            { label: "Billing model", value: customer?.billingModel ?? "—" },
            { label: "Rate", value: "N$4/kg" },
          ]}
          recent={[...invoices]
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

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Auto refill</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Below 20% creates a refill request · Below 10% creates urgent delivery
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-refill">Enable</Label>
              <Switch id="auto-refill" checked={autoRefill} onCheckedChange={onToggleAuto} />
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cylinder levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-8">
              {cylinders.map((c) => (
                <GasCylinder
                  key={c.id}
                  level={c.currentLevel}
                  size="lg"
                  serial={c.serialNumber}
                  onClick={() => setSelected(c)}
                />
              ))}
              {cylinders.length === 0 && (
                <p className="text-sm text-muted-foreground">No cylinders assigned</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {selected && (
        <CylinderDetailModal
          cylinder={selected}
          customer={customer}
          readings={readingService.getByCylinder(selected.id)}
          onClose={() => setSelected(null)}
          onRequestRefill={() => requestRefill(selected)}
        />
      )}
    </RoleGuard>
  );
}
