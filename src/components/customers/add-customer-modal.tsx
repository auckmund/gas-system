"use client";

import { FormEvent, useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { NAMIBIA_CITIES } from "@/lib/constants";
import { customerService } from "@/services";
import type { BillingModel, Customer } from "@/types";

interface AddCustomerModalProps {
  supplierId: string;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export function AddCustomerModal({
  supplierId,
  onClose,
  onCreated,
}: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState<string>(NAMIBIA_CITIES[0]!.city);
  const [areaIndex, setAreaIndex] = useState(0);
  const [billingModel, setBillingModel] = useState<BillingModel>("consumption");
  const [autoRefill, setAutoRefill] = useState(false);
  const [lat, setLat] = useState(String(NAMIBIA_CITIES[0]!.points[0]!.lat));
  const [lng, setLng] = useState(String(NAMIBIA_CITIES[0]!.points[0]!.lng));
  const [error, setError] = useState("");

  const cityData = useMemo(
    () => NAMIBIA_CITIES.find((c) => c.city === city) ?? NAMIBIA_CITIES[0]!,
    [city],
  );

  const applyCityPoint = (nextCity: string, pointIdx = 0) => {
    const data = NAMIBIA_CITIES.find((c) => c.city === nextCity) ?? NAMIBIA_CITIES[0]!;
    const point = data.points[Math.min(pointIdx, data.points.length - 1)]!;
    setCity(nextCity);
    setAreaIndex(Math.min(pointIdx, data.points.length - 1));
    setLat(String(point.lat));
    setLng(String(point.lng));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !email.trim() || !address.trim()) {
      setError("Name, phone, email, and address are required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);
    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      setError("Enter valid GPS coordinates.");
      return;
    }

    const customer = customerService.create({
      name,
      phone,
      email,
      address,
      city,
      lat: parsedLat,
      lng: parsedLng,
      supplierId,
      billingModel,
      autoRefill,
    });
    onCreated(customer);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[min(94vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">Add customer</h2>
            <p className="text-xs text-muted-foreground">
              Contact details and GPS location
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="cus-name">Full name / business</Label>
            <Input
              id="cus-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cus-phone">Phone</Label>
              <Input
                id="cus-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+264 81 000 0000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cus-email">Email</Label>
              <Input
                id="cus-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@mail.na"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cus-address">Street address</Label>
            <Input
              id="cus-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="12 Independence Avenue"
              required
            />
          </div>

          <div className="border border-border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              Location
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cus-city">City</Label>
                <select
                  id="cus-city"
                  value={city}
                  onChange={(e) => applyCityPoint(e.target.value, 0)}
                  className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
                >
                  {NAMIBIA_CITIES.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cus-area">Area / suburb</Label>
                <select
                  id="cus-area"
                  value={areaIndex}
                  onChange={(e) => applyCityPoint(city, Number(e.target.value))}
                  className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
                >
                  {cityData.points.map((p, idx) => (
                    <option key={p.label} value={idx}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cus-lat">Latitude</Label>
                <Input
                  id="cus-lat"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  inputMode="decimal"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cus-lng">Longitude</Label>
                <Input
                  id="cus-lng"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  inputMode="decimal"
                  required
                />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              City/area presets fill GPS. You can fine-tune coordinates manually.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cus-billing">Billing model</Label>
              <select
                id="cus-billing"
                value={billingModel}
                onChange={(e) => setBillingModel(e.target.value as BillingModel)}
                className="flex h-10 w-full border border-input bg-muted px-3 text-sm"
              >
                <option value="consumption">Pay-As-You-Use</option>
                <option value="subscription">Monthly subscription</option>
              </select>
            </div>
            <div className="flex items-end justify-between border border-border px-3 py-2">
              <div>
                <div className="text-sm font-medium">Auto refill</div>
                <div className="text-[10px] text-muted-foreground">Below 20% creates order</div>
              </div>
              <Switch checked={autoRefill} onCheckedChange={setAutoRefill} />
            </div>
          </div>

          {error && (
            <p className="border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Add customer</Button>
          </div>
        </form>
      </div>
    </>
  );
}
