"use client";

import { RoleGuard } from "@/components/layout/role-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { cylinderService, refillService } from "@/services";

export default function CustomerOrdersPage() {
  const { session } = useAuth();
  const customerId = session?.user.customerId ?? "CUS-0001";
  const orders = refillService.getByCustomer(customerId);
  const cylinders = cylinderService.getByCustomer(customerId);

  return (
    <RoleGuard roles={["customer"]} title="Refill Orders" subtitle="Track delivery status">
      <Card>
        <CardHeader>
          <CardTitle>{orders.length} orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No refill orders yet. Request one from your cylinders page.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Cylinder</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gas at request</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => {
                  const cyl = cylinders.find((c) => c.id === o.cylinderId);
                  return (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {cyl?.serialNumber ?? o.cylinderId}
                      </TableCell>
                      <TableCell>
                        <Badge variant={o.priority === "urgent" ? "destructive" : "outline"}>
                          {o.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            o.status === "completed"
                              ? "success"
                              : o.status === "urgent"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {o.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{o.gasLevelAtRequest}%</TableCell>
                      <TableCell className="text-xs">
                        {new Date(o.createdAt).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </RoleGuard>
  );
}
