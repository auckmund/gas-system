"use client";

import { FormEvent, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import { refillService } from "@/services";
import { formatCurrency } from "@/lib/utils";
import { cylinderRefillCost } from "@/lib/constants";
import type { Customer, Cylinder, RefillOrder } from "@/types";

interface AddRefillOrderModalProps {
  supplierId: string;
  customers: Customer[];
  cylinders: Cylinder[];
  onClose: () => void;
  onCreated: (order: RefillOrder) => void;
}

export function AddRefillOrderModal({
  supplierId,
  customers,
  cylinders,
  onClose,
  onCreated,
}: AddRefillOrderModalProps) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const customerCylinders = useMemo(
    () => cylinders.filter((c) => c.customerId === customerId),
    [cylinders, customerId],
  );
  const [cylinderId, setCylinderId] = useState(customerCylinders[0]?.id ?? "");
  const [status, setStatus] = useState<RefillOrder["status"]>("pending");
  const [priority, setPriority] = useState<RefillOrder["priority"]>("normal");
  const [schedule, setSchedule] = useState(false);
  const [error, setError] = useState("");

  const selectedCylinder = cylinders.find((c) => c.id === cylinderId);

  const onCustomerChange = (nextCustomerId: string) => {
    setCustomerId(nextCustomerId);
    const nextCylinders = cylinders.filter((c) => c.customerId === nextCustomerId);
    setCylinderId(nextCylinders[0]?.id ?? "");
  };

  const onCylinderChange = (nextCylinderId: string) => {
    setCylinderId(nextCylinderId);
    const cyl = cylinders.find((c) => c.id === nextCylinderId);
    if (cyl && cyl.currentLevel < 10) {
      setStatus("urgent");
      setPriority("urgent");
    } else if (cyl && cyl.currentLevel < 20) {
      setStatus("pending");
      setPriority("normal");
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!customerId || !cylinderId) {
      setError("Select a customer and cylinder.");
      return;
    }
    try {
      const order = refillService.create({
        customerId,
        cylinderId,
        supplierId,
        status,
        priority,
        scheduledAt: schedule
          ? new Date(Date.now() + 86400000).toISOString()
          : undefined,
      });
      onCreated(order);
    } catch {
      setError("Unable to create refill order.");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(94vw,480px)] -translate-x-1/2 -translate-y-1/2 border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">Add refill order</h2>
            <p className="text-xs text-muted-foreground">
              Create a delivery for a customer cylinder
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="refill-customer">Customer</Label>
            <select
              id="refill-customer"
              value={customerId}
              onChange={(e) => onCustomerChange(e.target.value)}
              className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              required
            >
              {customers.length === 0 && <option value="">No customers</option>}
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.city}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refill-cylinder">Cylinder</Label>
            <select
              id="refill-cylinder"
              value={cylinderId}
              onChange={(e) => onCylinderChange(e.target.value)}
              className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              required
            >
              {customerCylinders.length === 0 && (
                <option value="">No cylinders for this customer</option>
              )}
              {customerCylinders.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.serialNumber} · {c.currentLevel}% · {c.capacityKg}kg ·{" "}
                  {formatCurrency(c.refillPrice)}
                </option>
              ))}
            </select>
            {selectedCylinder && (
              <p className="text-xs text-muted-foreground">
                Current level: {selectedCylinder.currentLevel}% · {selectedCylinder.city} ·
                rate {formatCurrency(selectedCylinder.pricePerKg)}/kg · est. top-up{" "}
                {formatCurrency(cylinderRefillCost(selectedCylinder))}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="refill-status">Status</Label>
              <select
                id="refill-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RefillOrder["status"])}
                className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_transit">In transit</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="refill-priority">Priority</Label>
              <select
                id="refill-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as RefillOrder["priority"])
                }
                className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={schedule}
              onChange={(e) => {
                setSchedule(e.target.checked);
                if (e.target.checked && status === "pending") setStatus("scheduled");
              }}
            />
            Schedule for tomorrow
          </label>

          {error && (
            <p className="border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!customerId || !cylinderId || customerCylinders.length === 0}
            >
              Create order
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
