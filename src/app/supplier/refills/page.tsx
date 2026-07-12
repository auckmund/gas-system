"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { AddRefillOrderModal } from "@/components/refills/add-refill-order-modal";
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
import { customerService, cylinderService, refillService } from "@/services";

export default function SupplierRefillsPage() {
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
  const orders = useMemo(
    () =>
      [...refillService.getBySupplier(supplierId)].sort(
        (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supplierId, tick],
  );

  return (
    <RoleGuard
      roles={["supplier_admin"]}
      title="Refill Orders"
      subtitle="Manual and auto-refill delivery pipeline"
    >
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Add refill order
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{orders.length} orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Cylinder</TableHead>
                <TableHead>Level at request</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => {
                const cust = customers.find((c) => c.id === o.customerId);
                const cyl = cylinders.find((c) => c.id === o.cylinderId);
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono text-xs">{o.id}</TableCell>
                    <TableCell>{cust?.name ?? o.customerId}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {cyl?.serialNumber ?? o.cylinderId}
                    </TableCell>
                    <TableCell>{o.gasLevelAtRequest}%</TableCell>
                    <TableCell>
                      <Badge variant={o.priority === "urgent" ? "destructive" : "outline"}>
                        {o.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          o.status === "urgent"
                            ? "destructive"
                            : o.status === "completed"
                              ? "success"
                              : "warning"
                        }
                      >
                        {o.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(o.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {creating && (
        <AddRefillOrderModal
          supplierId={supplierId}
          customers={customers}
          cylinders={cylinders}
          onClose={() => setCreating(false)}
          onCreated={(order) => {
            setCreating(false);
            setTick((t) => t + 1);
            setToast(`Refill order ${order.id} created`);
            window.setTimeout(() => setToast(""), 2500);
          }}
        />
      )}
    </RoleGuard>
  );
}
