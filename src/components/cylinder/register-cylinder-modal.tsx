"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { CYLINDER_CAPACITIES, getCylinderPricing } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { cylinderService } from "@/services";
import type { ConnectionType, Customer, Cylinder, Device } from "@/types";

interface RegisterCylinderModalProps {
  supplierId: string;
  customers: Customer[];
  onClose: () => void;
  onCreated: (result: { cylinder: Cylinder; device: Device }) => void;
}

export function RegisterCylinderModal({
  supplierId,
  customers,
  onClose,
  onCreated,
}: RegisterCylinderModalProps) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [capacityKg, setCapacityKg] = useState<number>(CYLINDER_CAPACITIES[1]!);
  const [currentLevel, setCurrentLevel] = useState(100);
  const [serialNumber, setSerialNumber] = useState("");
  const [connection, setConnection] = useState<ConnectionType>("WiFi");
  const defaults = getCylinderPricing(capacityKg);
  const [refillPrice, setRefillPrice] = useState(defaults.refillPrice);
  const [pricePerKg, setPricePerKg] = useState(defaults.pricePerKg);
  const [error, setError] = useState("");

  const onCapacityChange = (next: number) => {
    setCapacityKg(next);
    const pricing = getCylinderPricing(next);
    setRefillPrice(pricing.refillPrice);
    setPricePerKg(pricing.pricePerKg);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!customerId) {
      setError("Select a customer to assign this cylinder.");
      return;
    }
    try {
      const result = cylinderService.register({
        customerId,
        supplierId,
        capacityKg,
        currentLevel,
        serialNumber: serialNumber || undefined,
        connection,
        refillPrice,
        pricePerKg,
      });
      onCreated(result);
    } catch {
      setError("Unable to register cylinder. Check the selected customer.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,520px)] -translate-x-1/2 -translate-y-1/2 border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">Register new gas</h2>
            <p className="text-xs text-muted-foreground">
              Cylinder + IoT device assignment
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="cyl-customer">Assign to customer</Label>
            <select
              id="cyl-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              required
            >
              {customers.length === 0 && (
                <option value="">No customers yet — add a customer first</option>
              )}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.city}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cyl-capacity">Capacity</Label>
              <select
                id="cyl-capacity"
                value={capacityKg}
                onChange={(e) => onCapacityChange(Number(e.target.value))}
                className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              >
                {CYLINDER_CAPACITIES.map((cap) => (
                  <option key={cap} value={cap}>
                    {cap} kg · refill {formatCurrency(getCylinderPricing(cap).refillPrice)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cyl-level">Initial gas level (%)</Label>
              <Input
                id="cyl-level"
                type="number"
                min={0}
                max={100}
                value={currentLevel}
                onChange={(e) => setCurrentLevel(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cyl-refill-price">Full refill price (N$)</Label>
              <Input
                id="cyl-refill-price"
                type="number"
                min={0}
                value={refillPrice}
                onChange={(e) => setRefillPrice(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cyl-rate">Price per kg (N$)</Label>
              <Input
                id="cyl-rate"
                type="number"
                min={0}
                step="0.1"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cyl-serial">Serial (optional)</Label>
              <Input
                id="cyl-serial"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="AUG-CYL-xxxxx"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cyl-conn">Device connection</Label>
              <select
                id="cyl-conn"
                value={connection}
                onChange={(e) => setConnection(e.target.value as ConnectionType)}
                className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              >
                <option value="WiFi">WiFi</option>
                <option value="GSM">GSM</option>
                <option value="LoRaWAN">LoRaWAN</option>
              </select>
            </div>
          </div>

          <p className="border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Location is taken from the selected customer GPS. An ESP32 device is
            created automatically and marked online.
          </p>

          {error && (
            <p className="border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={customers.length === 0}>
              Register gas cylinder
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
