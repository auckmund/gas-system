"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/layout/role-guard";
import { DeviceCard } from "@/components/devices/device-card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { deviceService } from "@/services";

export default function AdminDevicesPage() {
  const devices = deviceService.getAll();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "online" | "offline">("all");

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const matchQ =
        !q ||
        d.deviceSerial.toLowerCase().includes(q.toLowerCase()) ||
        d.id.toLowerCase().includes(q.toLowerCase());
      const matchStatus = status === "all" || d.status === status;
      return matchQ && matchStatus;
    });
  }, [devices, q, status]);

  const online = devices.filter((d) => d.status === "online").length;

  return (
    <RoleGuard roles={["super_admin"]} title="Devices" subtitle="ESP32 IoT controllers across the network">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search device serial…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex gap-2">
          {(["all", "online", "offline"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`border px-3 py-2 text-xs uppercase tracking-wider ${
                status === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Badge variant="success">{online} online</Badge>
        <Badge variant="outline">{devices.length - online} offline</Badge>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.slice(0, 48).map((d) => (
          <DeviceCard key={d.id} device={d} />
        ))}
      </div>
      {filtered.length > 48 && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Showing 48 of {filtered.length} devices
        </p>
      )}
    </RoleGuard>
  );
}
