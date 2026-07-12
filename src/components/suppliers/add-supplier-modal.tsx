"use client";

import { FormEvent, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { NAMIBIA_CITIES } from "@/lib/constants";
import { supplierService } from "@/services";
import type { Supplier } from "@/types";

interface AddSupplierModalProps {
  onClose: () => void;
  onCreated: (supplier: Supplier) => void;
}

export function AddSupplierModal({ onClose, onCreated }: AddSupplierModalProps) {
  const [name, setName] = useState("");
  const [city, setCity] = useState<string>(NAMIBIA_CITIES[0]!.city);
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setError("Name, phone, and email are required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    const supplier = supplierService.create({
      name,
      city,
      location: location || `${city}, Namibia`,
      phone,
      email,
    });
    onCreated(supplier);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,480px)] -translate-x-1/2 -translate-y-1/2 border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">Add supplier</h2>
            <p className="text-xs text-muted-foreground">Register a gas supplier company</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 p-4">
          <div className="space-y-2">
            <Label htmlFor="sup-name">Company name</Label>
            <Input
              id="sup-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Namibia Gas Partners"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sup-city">City</Label>
              <select
                id="sup-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
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
              <Label htmlFor="sup-location">Location</Label>
              <Input
                id="sup-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Industrial Area"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sup-phone">Phone</Label>
            <Input
              id="sup-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+264 81 000 0000"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sup-email">Email</Label>
            <Input
              id="sup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ops@supplier.na"
              required
            />
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
            <Button type="submit">Add supplier</Button>
          </div>
        </form>
      </div>
    </>
  );
}
