import { Badge } from "@/components/ui/badge";
import { formatRelativeTime, cn } from "@/lib/utils";
import type { Device } from "@/types";
import { Battery, Signal, Wifi } from "lucide-react";

export function DeviceCard({ device }: { device: Device }) {
  const batteryTone =
    device.battery < 20
      ? "text-primary"
      : device.battery < 40
        ? "text-destructive"
        : "text-secondary";

  return (
    <div className="border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm font-semibold">{device.deviceSerial}</div>
          <div className="text-xs text-muted-foreground">{device.id}</div>
        </div>
        <Badge variant={device.status === "online" ? "success" : "outline"}>
          {device.status}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Battery className={cn("h-4 w-4", batteryTone)} />
          <span>{device.battery}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="h-4 w-4 text-accent" />
          <span>{device.connection}</span>
        </div>
        <div className="flex items-center gap-2">
          <Signal className="h-4 w-4 text-muted-foreground" />
          <span>{device.signalStrength}%</span>
        </div>
        <div className="text-muted-foreground">
          {formatRelativeTime(device.lastReading)}
        </div>
      </div>
    </div>
  );
}
