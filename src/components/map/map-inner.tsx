"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCylinderPoint } from "./cylinder-map";

interface MapInnerProps {
  points: MapCylinderPoint[];
  zoom: number;
  center: { lat: number; lng: number };
  gasLevelColor: (level: number) => string;
  gasLevelLabel: (level: number) => string;
  formatRelativeTime: (date: string) => string;
}

export default function MapInner({
  points,
  zoom,
  center,
  gasLevelColor,
  gasLevelLabel,
  formatRelativeTime,
}: MapInnerProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map(({ cylinder, customer }) => {
        const color = gasLevelColor(cylinder.currentLevel);
        const critical = gasLevelLabel(cylinder.currentLevel) === "critical";
        return (
          <CircleMarker
            key={cylinder.id}
            center={[cylinder.lat, cylinder.lng]}
            radius={critical ? 10 : 7}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="space-y-1 text-sm" style={{ fontFamily: "Oxanium, sans-serif" }}>
                <div>
                  <strong>Customer:</strong> {customer?.name ?? "—"}
                </div>
                <div>
                  <strong>Cylinder:</strong> {cylinder.serialNumber}
                </div>
                <div>
                  <strong>Gas Level:</strong>{" "}
                  <span style={{ color }}>{cylinder.currentLevel}%</span>
                </div>
                <div>
                  <strong>Refill price:</strong> N${cylinder.refillPrice}
                </div>
                <div>
                  <strong>Rate:</strong> N${cylinder.pricePerKg}/kg
                </div>
                <div>
                  <strong>Last Updated:</strong>{" "}
                  {formatRelativeTime(cylinder.lastUpdated)}
                </div>
                <div>
                  <strong>Location:</strong> {cylinder.city}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
