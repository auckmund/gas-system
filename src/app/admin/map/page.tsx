"use client";

import { RoleGuard } from "@/components/layout/role-guard";
import { CylinderMap } from "@/components/map/cylinder-map";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cylinderService, customerService } from "@/services";

export default function AdminMapPage() {
  const customers = customerService.getAll();
  const points = cylinderService.getAll().map((cylinder) => ({
    cylinder,
    customer: customers.find((c) => c.id === cylinder.customerId),
  }));

  return (
    <RoleGuard roles={["super_admin"]} title="Network Map" subtitle="All cylinder locations across Namibia">
      <Card>
        <CardHeader>
          <CardTitle>
            {points.length} markers · Green &gt;50% · Orange 20–50% · Red &lt;20% · Critical &lt;10%
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <CylinderMap points={points} height="70vh" />
        </CardContent>
      </Card>
    </RoleGuard>
  );
}
