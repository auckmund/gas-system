"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { GasCylinder } from "@/components/cylinder/gas-cylinder";
import { CylinderDetailModal } from "@/components/cylinder/cylinder-detail-modal";
import { RegisterCylinderModal } from "@/components/cylinder/register-cylinder-modal";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  cylinderService,
  customerService,
  readingService,
} from "@/services";
import { gasLevelLabel, formatCurrency } from "@/lib/utils";
import { cylinderRefillCost } from "@/lib/constants";
import type { Cylinder } from "@/types";

type LevelFilter = "all" | "good" | "medium" | "low" | "critical";
type RefillFilter = "all" | "none" | "pending" | "scheduled" | "urgent" | "in_transit";

const LEVEL_OPTIONS: { value: LevelFilter; label: string }[] = [
  { value: "all", label: "All levels" },
  { value: "good", label: ">50%" },
  { value: "medium", label: "20–50%" },
  { value: "low", label: "10–20%" },
  { value: "critical", label: "<10%" },
];

const REFILL_OPTIONS: { value: RefillFilter; label: string }[] = [
  { value: "all", label: "All refill" },
  { value: "none", label: "No order" },
  { value: "pending", label: "Pending" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_transit", label: "In transit" },
  { value: "urgent", label: "Urgent" },
];

function FilterChip({
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
      className={`border px-3 py-1.5 text-xs uppercase tracking-wider transition-colors ${
        active
          ? "border-primary bg-primary/20 text-primary"
          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export default function SupplierCylindersPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const [tick, setTick] = useState(0);
  const cylinders = useMemo(
    () => cylinderService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );
  const customers = useMemo(
    () => customerService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );

  const [q, setQ] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [city, setCity] = useState("all");
  const [capacity, setCapacity] = useState("all");
  const [refill, setRefill] = useState<RefillFilter>("all");
  const [selected, setSelected] = useState<Cylinder | null>(null);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState("");

  const cities = useMemo(
    () => [...new Set(cylinders.map((c) => c.city))].sort(),
    [cylinders],
  );
  const capacities = useMemo(
    () => [...new Set(cylinders.map((c) => c.capacityKg))].sort((a, b) => a - b),
    [cylinders],
  );

  const customerMap = useMemo(() => {
    const map = new Map(customers.map((c) => [c.id, c]));
    return map;
  }, [customers]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return cylinders.filter((c) => {
      const customer = customerMap.get(c.customerId);
      const matchQ =
        !query ||
        c.serialNumber.toLowerCase().includes(query) ||
        c.id.toLowerCase().includes(query) ||
        customer?.name.toLowerCase().includes(query) ||
        customer?.email.toLowerCase().includes(query);

      const matchLevel = level === "all" || gasLevelLabel(c.currentLevel) === level;

      const matchCity = city === "all" || c.city === city;

      const matchCapacity =
        capacity === "all" || c.capacityKg === Number(capacity);

      const matchRefill =
        refill === "all" ||
        (refill === "none" && !c.refillStatus) ||
        c.refillStatus === refill;

      return matchQ && matchLevel && matchCity && matchCapacity && matchRefill;
    });
  }, [cylinders, customerMap, q, level, city, capacity, refill]);

  const counts = useMemo(() => {
    return {
      total: cylinders.length,
      critical: cylinders.filter((c) => c.currentLevel < 10).length,
      low: cylinders.filter((c) => c.currentLevel >= 10 && c.currentLevel < 20).length,
      medium: cylinders.filter((c) => c.currentLevel >= 20 && c.currentLevel < 50).length,
      good: cylinders.filter((c) => c.currentLevel >= 50).length,
    };
  }, [cylinders]);

  const hasActiveFilters =
    q !== "" || level !== "all" || city !== "all" || capacity !== "all" || refill !== "all";

  const clearFilters = () => {
    setQ("");
    setLevel("all");
    setCity("all");
    setCapacity("all");
    setRefill("all");
  };

  return (
    <RoleGuard roles={["supplier_admin"]} title="Cylinders" subtitle="Monitor gas levels across your fleet">
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 space-y-4 border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search serial, ID, or customer…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="h-10 border border-input bg-muted px-3 text-sm text-foreground"
          >
            <option value="all">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="h-10 border border-input bg-muted px-3 text-sm text-foreground"
          >
            <option value="all">All capacities</option>
            {capacities.map((cap) => (
              <option key={cap} value={cap}>
                {cap} kg
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <Button className="ml-auto" onClick={() => setRegistering(true)}>
            <Plus className="h-4 w-4" />
            Register new gas
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {LEVEL_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={level === opt.value}
              onClick={() => setLevel(opt.value)}
            >
              {opt.label}
              {opt.value !== "all" && (
                <span className="ml-1 opacity-70">
                  ({counts[opt.value]})
                </span>
              )}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {REFILL_OPTIONS.map((opt) => (
            <FilterChip
              key={opt.value}
              active={refill === opt.value}
              onClick={() => setRefill(opt.value)}
            >
              {opt.label}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>
            Showing <strong className="text-foreground">{filtered.length}</strong> of{" "}
            {counts.total}
          </span>
          <Badge variant="destructive">{counts.critical} critical</Badge>
          <Badge variant="warning">{counts.low} low</Badge>
          <Badge variant="outline">{counts.medium} medium</Badge>
          <Badge variant="success">{counts.good} good</Badge>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No cylinders match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filtered.map((c) => (
            <div key={c.id} className="border border-border bg-card p-3">
              <GasCylinder
                level={c.currentLevel}
                size="sm"
                serial={c.serialNumber}
                onClick={() => setSelected(c)}
              />
              <p className="mt-1 truncate text-center text-[10px] text-muted-foreground">
                {customerMap.get(c.customerId)?.name ?? c.city}
              </p>
              <p className="text-center text-[10px] font-medium tabular-nums text-foreground">
                {formatCurrency(c.refillPrice)} refill
              </p>
              <p className="text-center text-[10px] text-muted-foreground">
                {formatCurrency(c.pricePerKg)}/kg · top-up {formatCurrency(cylinderRefillCost(c))}
              </p>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <CylinderDetailModal
          cylinder={selected}
          customer={customers.find((c) => c.id === selected.customerId)}
          readings={readingService.getByCylinder(selected.id)}
          onClose={() => setSelected(null)}
        />
      )}

      {registering && (
        <RegisterCylinderModal
          supplierId={supplierId}
          customers={customers}
          onClose={() => setRegistering(false)}
          onCreated={({ cylinder, device }) => {
            setRegistering(false);
            setTick((t) => t + 1);
            setSelected(cylinder);
            setToast(
              `Registered ${cylinder.serialNumber} with device ${device.deviceSerial}`,
            );
            window.setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
    </RoleGuard>
  );
}
