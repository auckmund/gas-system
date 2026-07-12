"use client";

import dynamic from "next/dynamic";
import type { Cylinder, Customer } from "@/types";
import { gasLevelColor, gasLevelLabel, formatRelativeTime } from "@/lib/utils";
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/constants";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[400px] items-center justify-center border border-border bg-card text-muted-foreground">
      Loading map…
    </div>
  ),
});

export interface MapCylinderPoint {
  cylinder: Cylinder;
  customer?: Customer;
}

interface CylinderMapProps {
  points: MapCylinderPoint[];
  height?: string;
  zoom?: number;
  center?: { lat: number; lng: number };
}

export function CylinderMap({
  points,
  height = "500px",
  zoom = MAP_DEFAULT_ZOOM,
  center = MAP_CENTER,
}: CylinderMapProps) {
  return (
    <div style={{ height }} className="w-full border border-border">
      <MapInner
        points={points}
        zoom={zoom}
        center={center}
        gasLevelColor={gasLevelColor}
        gasLevelLabel={gasLevelLabel}
        formatRelativeTime={formatRelativeTime}
      />
    </div>
  );
}
