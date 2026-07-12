"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { RoleGuard } from "@/components/layout/role-guard";
import { CreateDocumentModal } from "@/components/documents/create-document-modal";
import { DocumentPreview } from "@/components/documents/document-preview";
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
import { quotationStatusVariant } from "@/lib/documents";
import { formatCurrency } from "@/lib/utils";
import {
  customerService,
  quotationService,
  supplierService,
} from "@/services";
import type { Quotation } from "@/types";

export default function CustomerQuotationsPage() {
  const { session } = useAuth();
  const customerId = session?.user.customerId ?? "CUS-0001";
  const customer = customerService.getById(customerId);
  const supplierId = customer?.supplierId ?? session?.user.supplierId ?? "";
  const [tick, setTick] = useState(0);
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState("");

  const quotations = useMemo(
    () =>
      quotationService
        .getByCustomer(customerId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [customerId, tick],
  );

  const supplier = supplierService.getById(supplierId);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  };

  return (
    <RoleGuard
      roles={["customer"]}
      title="Quotations"
      subtitle="Request quotes, review, and accept or reject"
    >
      {toast && (
        <div className="mb-4 border border-secondary/50 bg-secondary/10 px-4 py-2 text-sm text-secondary">
          {toast}
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <Button onClick={() => setCreating(true)} disabled={!customer || !supplierId}>
          <Plus className="h-4 w-4" />
          Create quote
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {quotations.length} quotations
            {supplier ? ` · ${supplier.name}` : ""}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valid until</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotations.map((quote) => (
                <TableRow key={quote.id}>
                  <TableCell className="font-mono text-xs">{quote.quoteNumber}</TableCell>
                  <TableCell>
                    {supplierService.getById(quote.supplierId)?.name ?? quote.supplierId}
                  </TableCell>
                  <TableCell>{formatCurrency(quote.total)}</TableCell>
                  <TableCell>
                    <Badge variant={quotationStatusVariant(quote.status)}>
                      {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(quote.validUntil).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" onClick={() => setPreview(quote)}>
                        View
                      </Button>
                      {quote.status === "sent" && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              quotationService.updateStatus(quote.id, "accepted");
                              setTick((t) => t + 1);
                              showToast(`${quote.quoteNumber} accepted`);
                            }}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              quotationService.updateStatus(quote.id, "rejected");
                              setTick((t) => t + 1);
                              showToast(`${quote.quoteNumber} rejected`);
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {quotations.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              No quotations yet. Create a quote request for your supplier.
            </p>
          )}
        </CardContent>
      </Card>

      {creating && customer && (
        <CreateDocumentModal
          kind="quotation"
          supplierId={supplierId}
          customers={[customer]}
          onClose={() => setCreating(false)}
          onCreated={(doc) => {
            setCreating(false);
            setTick((t) => t + 1);
            const quote = doc as Quotation;
            showToast(`Quote ${quote.quoteNumber} created`);
            setPreview(quote);
          }}
        />
      )}

      {preview && (
        <DocumentPreview
          doc={{ kind: "quotation", data: preview }}
          customer={customer}
          supplier={supplierService.getById(preview.supplierId) ?? supplier}
          onClose={() => setPreview(null)}
          actions={
            preview.status === "sent" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    quotationService.updateStatus(preview.id, "accepted");
                    setTick((t) => t + 1);
                    setPreview({ ...preview, status: "accepted" });
                    showToast("Quotation accepted");
                  }}
                >
                  Accept quotation
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    quotationService.updateStatus(preview.id, "rejected");
                    setTick((t) => t + 1);
                    setPreview({ ...preview, status: "rejected" });
                    showToast("Quotation rejected");
                  }}
                >
                  Reject
                </Button>
              </>
            ) : undefined
          }
        />
      )}
    </RoleGuard>
  );
}
