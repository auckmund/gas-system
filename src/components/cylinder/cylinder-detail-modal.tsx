"use client";

import { GasCylinder } from "@/components/cylinder/gas-cylinder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { cylinderGasValue, cylinderRefillCost } from "@/lib/constants";
import type { Customer, Cylinder, SensorReading } from "@/types";
import { X } from "lucide-react";

interface CylinderDetailProps {
  cylinder: Cylinder;
  customer?: Customer;
  readings?: SensorReading[];
  onClose: () => void;
  onRequestRefill?: () => void;
}

export function CylinderDetailModal({
  cylinder,
  customer,
  readings = [],
  onClose,
  onRequestRefill,
}: CylinderDetailProps) {
  const gasValue = cylinderGasValue(cylinder);
  const refillCost = cylinderRefillCost(cylinder);

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">{cylinder.serialNumber}</h2>
            <p className="text-xs text-muted-foreground">{cylinder.id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr]">
          <GasCylinder level={cylinder.currentLevel} size="lg" serial={cylinder.serialNumber} />
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {cylinder.currentLevel < 10 && <Badge variant="destructive">Critical</Badge>}
              {cylinder.currentLevel >= 10 && cylinder.currentLevel < 20 && (
                <Badge variant="warning">Low</Badge>
              )}
              {cylinder.refillStatus && (
                <Badge variant="outline">{cylinder.refillStatus}</Badge>
              )}
            </div>
            <Row label="Customer" value={customer?.name ?? "—"} />
            <Row label="Location" value={`${cylinder.city}`} />
            <Row label="Address" value={customer?.address ?? "—"} />
            <Row label="Capacity" value={`${cylinder.capacityKg} kg`} />
            <Row label="Current weight" value={`${cylinder.currentWeightKg} kg`} />
            <Row label="Gas level" value={`${cylinder.currentLevel}%`} />
            <Row label="Rate" value={`${formatCurrency(cylinder.pricePerKg)}/kg`} />
            <Row label="Full refill price" value={formatCurrency(cylinder.refillPrice)} />
            <Row label="Current gas value" value={formatCurrency(gasValue)} />
            <Row label="Est. refill cost" value={formatCurrency(refillCost)} />
            <Row label="Last updated" value={formatRelativeTime(cylinder.lastUpdated)} />
            {onRequestRefill && (
              <Button className="mt-2 w-full" onClick={onRequestRefill}>
                Request refill · {formatCurrency(refillCost)}
              </Button>
            )}
          </div>
        </div>
        {readings.length > 0 && (
          <div className="border-t border-border p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Usage history
            </h3>
            <div className="max-h-40 space-y-1 overflow-y-auto font-mono text-xs">
              {readings.slice(0, 12).map((r) => (
                <div key={r.id} className="flex justify-between border-b border-border/50 py-1">
                  <span className="text-muted-foreground">
                    {new Date(r.timestamp).toLocaleString()}
                  </span>
                  <span>
                    {r.gasPercentage}% · {r.weight}kg
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
