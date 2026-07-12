"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/layout/role-guard";
import { GasCylinder } from "@/components/cylinder/gas-cylinder";
import { CylinderDetailModal } from "@/components/cylinder/cylinder-detail-modal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  customerService,
  cylinderService,
  readingService,
  refillService,
} from "@/services";
import type { Cylinder } from "@/types";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { cylinderGasValue, cylinderRefillCost } from "@/lib/constants";

export default function CustomerCylindersPage() {
  const { session } = useAuth();
  const customerId = session?.user.customerId ?? "CUS-0001";
  const customer = customerService.getById(customerId);
  const cylinders = cylinderService.getByCustomer(customerId);
  const [selected, setSelected] = useState<Cylinder | null>(null);
  const [toast, setToast] = useState("");

  const requestRefill = (cyl: Cylinder) => {
    refillService.requestRefill(customerId, cyl.id);
    setToast(`Refill requested for ${cyl.serialNumber}`);
    setSelected(null);
    setTimeout(() => setToast(""), 2500);
  };

  return (
    <RoleGuard roles={["customer"]} title="My Cylinders" subtitle="Live levels and refill requests">
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cylinders.map((c) => (
          <div key={c.id} className="border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-4">
              <GasCylinder
                level={c.currentLevel}
                size="md"
                serial={c.serialNumber}
                onClick={() => setSelected(c)}
              />
              <div className="flex-1 space-y-2 text-sm">
                <div className="font-mono text-xs text-muted-foreground">{c.id}</div>
                <div>
                  Capacity: <strong>{c.capacityKg} kg</strong>
                </div>
                <div>
                  Weight: <strong>{c.currentWeightKg} kg</strong>
                </div>
                <div>
                  Rate: <strong>{formatCurrency(c.pricePerKg)}/kg</strong>
                </div>
                <div>
                  Full refill: <strong>{formatCurrency(c.refillPrice)}</strong>
                </div>
                <div>
                  Gas value: <strong>{formatCurrency(cylinderGasValue(c))}</strong>
                </div>
                <div className="text-xs text-muted-foreground">
                  Updated {formatRelativeTime(c.lastUpdated)}
                </div>
                <div className="text-xs text-muted-foreground">{c.city}</div>
                <Button size="sm" className="mt-2" onClick={() => requestRefill(c)}>
                  Request refill · {formatCurrency(cylinderRefillCost(c))}
                </Button>
              </div>
            </div>
          </div>
        ))}
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
