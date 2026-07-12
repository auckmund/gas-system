"use client";

import { RoleGuard } from "@/components/layout/role-guard";
import { CylinderMap } from "@/components/map/cylinder-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { cylinderService, customerService } from "@/services";

export default function SupplierMapPage() {
  const { session } = useAuth();
  const supplierId = session?.user.supplierId ?? "SUP-001";
  const customers = customerService.getBySupplier(supplierId);
  const points = cylinderService.getBySupplier(supplierId).map((cylinder) => ({
    cylinder,
    customer: customers.find((c) => c.id === cylinder.customerId),
  }));

  return (
    <RoleGuard roles={["supplier_admin"]} title="Fleet Map" subtitle="Your cylinder locations">
      <Card>
        <CardHeader>
          <CardTitle>{points.length} cylinders on map</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CylinderMap points={points} height="70vh" zoom={6} />
        </CardContent>
      </Card>
    </RoleGuard>
  );
}
