"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { AddCustomerModal } from "@/components/customers/add-customer-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { cylinderService, customerService } from "@/services";
import { formatCurrency } from "@/lib/utils";

export default function SupplierCustomersPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const [tick, setTick] = useState(0);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const customers = useMemo(
    () => customerService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );
  const cylinders = useMemo(
    () => cylinderService.getBySupplier(supplierId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );

  return (
    <RoleGuard roles={["supplier_admin"]} title="Customers" subtitle="Register and manage assigned customers">
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Add customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{customers.length} customers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Cylinders</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Auto refill</TableHead>
                <TableHead>Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono text-xs">{c.id}</TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-xs">{c.phone}</TableCell>
                  <TableCell className="text-xs">{c.email}</TableCell>
                  <TableCell className="text-xs">
                    {c.address}, {c.city}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-muted-foreground">
                    {c.lat.toFixed(4)}, {c.lng.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    {cylinders.filter((cyl) => cyl.customerId === c.id).length}
                  </TableCell>
                  <TableCell className="capitalize">{c.billingModel}</TableCell>
                  <TableCell>
                    <Badge variant={c.autoRefill ? "success" : "outline"}>
                      {c.autoRefill ? "On" : "Off"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(c.outstandingBalance)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {creating && (
        <AddCustomerModal
          supplierId={supplierId}
          onClose={() => setCreating(false)}
          onCreated={(customer) => {
            setCreating(false);
            setTick((t) => t + 1);
            setToast(`Customer ${customer.name} added at ${customer.city}`);
            window.setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
    </RoleGuard>
  );
}
