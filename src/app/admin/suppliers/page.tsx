"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { AddSupplierModal } from "@/components/suppliers/add-supplier-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supplierService } from "@/services";
import { formatCurrency } from "@/lib/utils";

export default function AdminSuppliersPage() {
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const suppliers = useMemo(
    () => supplierService.getAll(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );

  return (
    <RoleGuard roles={["super_admin"]} title="Suppliers" subtitle="All gas supplier companies on the platform">
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Add supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{suppliers.length} suppliers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Customers</TableHead>
                <TableHead>Cylinders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-xs">{s.id}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.location}</TableCell>
                  <TableCell>{s.activeCustomers}</TableCell>
                  <TableCell>{s.activeCylinders}</TableCell>
                  <TableCell>{formatCurrency(s.monthlyRevenue)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {creating && (
        <AddSupplierModal
          onClose={() => setCreating(false)}
          onCreated={(supplier) => {
            setCreating(false);
            setTick((t) => t + 1);
            setToast(`Supplier ${supplier.name} added`);
            window.setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
    </RoleGuard>
  );
}
