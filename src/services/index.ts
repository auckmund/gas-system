import { getDb } from "@/data/mock-db";
import { GAS_RATE_PER_KG, getCylinderPricing } from "@/lib/constants";
import { calcDocumentTotals, padId } from "@/lib/utils";
import type {
  AuthSession,
  Customer,
  Cylinder,
  DashboardStats,
  Device,
  Invoice,
  LineItem,
  Notification,
  PlatformInvoice,
  Quotation,
  QuotationStatus,
  RefillOrder,
  SensorReading,
  Supplier,
  User,
  UserRole,
} from "@/types";

function stripPassword(user: User): Omit<User, "password"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...rest } = user;
  return rest;
}

export const authService = {
  login(email: string, password: string): AuthSession | null {
    const user = getDb().users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password,
    );
    if (!user) return null;
    return {
      user: stripPassword(user),
      token: `mock-jwt-${user.id}-${Date.now()}`,
      loggedInAt: new Date().toISOString(),
    };
  },

  getDashboardPath(role: UserRole): string {
    switch (role) {
      case "super_admin":
        return "/admin/dashboard";
      case "supplier_admin":
        return "/supplier/dashboard";
      case "customer":
        return "/customer/dashboard";
    }
  },
};

export const supplierService = {
  getAll(): Supplier[] {
    return getDb().suppliers;
  },
  getById(id: string): Supplier | undefined {
    return getDb().suppliers.find((s) => s.id === id);
  },
  create(input: {
    name: string;
    city: string;
    location?: string;
    phone: string;
    email: string;
  }): Supplier {
    const seq = getDb().suppliers.length + 1;
    const supplier: Supplier = {
      id: padId("SUP-", seq, 3),
      name: input.name.trim(),
      city: input.city,
      location: input.location?.trim() || input.city,
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      activeCustomers: 0,
      activeCylinders: 0,
      monthlyRevenue: 0,
    };
    getDb().suppliers.push(supplier);
    return supplier;
  },
};

export const customerService = {
  getAll(): Customer[] {
    return getDb().customers;
  },
  getBySupplier(supplierId: string): Customer[] {
    return getDb().customers.filter((c) => c.supplierId === supplierId);
  },
  getById(id: string): Customer | undefined {
    return getDb().customers.find((c) => c.id === id);
  },
  create(input: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    lat: number;
    lng: number;
    supplierId: string;
    billingModel?: Customer["billingModel"];
    autoRefill?: boolean;
  }): Customer {
    const seq = getDb().customers.length + 1;
    const customer: Customer = {
      id: padId("CUS-", seq, 4),
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email.trim().toLowerCase(),
      address: input.address.trim(),
      city: input.city,
      lat: input.lat,
      lng: input.lng,
      supplierId: input.supplierId,
      billingModel: input.billingModel ?? "consumption",
      autoRefill: input.autoRefill ?? false,
      outstandingBalance: 0,
    };
    getDb().customers.push(customer);
    const supplier = getDb().suppliers.find((s) => s.id === input.supplierId);
    if (supplier) supplier.activeCustomers += 1;
    return customer;
  },
};

export const cylinderService = {
  getAll(): Cylinder[] {
    return getDb().cylinders;
  },
  getBySupplier(supplierId: string): Cylinder[] {
    return getDb().cylinders.filter((c) => c.supplierId === supplierId);
  },
  getByCustomer(customerId: string): Cylinder[] {
    return getDb().cylinders.filter((c) => c.customerId === customerId);
  },
  getById(id: string): Cylinder | undefined {
    return getDb().cylinders.find((c) => c.id === id);
  },
  getLowGas(threshold = 20): Cylinder[] {
    return getDb().cylinders.filter((c) => c.currentLevel < threshold);
  },
  register(input: {
    customerId: string;
    supplierId: string;
    capacityKg: number;
    currentLevel?: number;
    serialNumber?: string;
    connection?: Device["connection"];
    refillPrice?: number;
    pricePerKg?: number;
  }): { cylinder: Cylinder; device: Device } {
    const customer = getDb().customers.find((c) => c.id === input.customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }
    const seq = getDb().cylinders.length + 1;
    const level = Math.max(0, Math.min(100, input.currentLevel ?? 100));
    const capacity = input.capacityKg;
    const defaults = getCylinderPricing(capacity);
    const cylinder: Cylinder = {
      id: padId("CYL-", seq, 5),
      serialNumber: input.serialNumber?.trim() || padId("AUG-CYL-", 10000 + seq, 5),
      customerId: input.customerId,
      supplierId: input.supplierId,
      capacityKg: capacity,
      currentLevel: level,
      currentWeightKg: Math.round((capacity * level) / 100 * 10) / 10,
      refillPrice: input.refillPrice ?? defaults.refillPrice,
      pricePerKg: input.pricePerKg ?? defaults.pricePerKg,
      lat: customer.lat + (Math.random() - 0.5) * 0.01,
      lng: customer.lng + (Math.random() - 0.5) * 0.01,
      city: customer.city,
      lastUpdated: new Date().toISOString(),
    };
    getDb().cylinders.push(cylinder);

    const deviceSeq = getDb().devices.length + 1;
    const device: Device = {
      id: padId("DEV-", deviceSeq, 5),
      deviceSerial: padId("AUG-ESP32-", deviceSeq, 5),
      cylinderId: cylinder.id,
      battery: 100,
      status: "online",
      connection: input.connection ?? "WiFi",
      signalStrength: 90,
      lastReading: cylinder.lastUpdated,
    };
    getDb().devices.push(device);

    const supplier = getDb().suppliers.find((s) => s.id === input.supplierId);
    if (supplier) supplier.activeCylinders += 1;

    return { cylinder, device };
  },
};

export const deviceService = {
  getAll(): Device[] {
    return getDb().devices;
  },
  getBySupplier(supplierId: string): Device[] {
    const cylIds = new Set(
      getDb().cylinders.filter((c) => c.supplierId === supplierId).map((c) => c.id),
    );
    return getDb().devices.filter((d) => cylIds.has(d.cylinderId));
  },
  getOnlineCount(): number {
    return getDb().devices.filter((d) => d.status === "online").length;
  },
};

export const readingService = {
  getByCylinder(cylinderId: string, limit = 50): SensorReading[] {
    return getDb()
      .sensorReadings.filter((r) => r.cylinderId === cylinderId)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, limit);
  },
  getRecent(limit = 100): SensorReading[] {
    return [...getDb().sensorReadings]
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .slice(0, limit);
  },
};

export const refillService = {
  getAll(): RefillOrder[] {
    return getDb().refillOrders;
  },
  getBySupplier(supplierId: string): RefillOrder[] {
    return getDb().refillOrders.filter((o) => o.supplierId === supplierId);
  },
  getByCustomer(customerId: string): RefillOrder[] {
    return getDb().refillOrders.filter((o) => o.customerId === customerId);
  },
  getPending(): RefillOrder[] {
    return getDb().refillOrders.filter((o) =>
      ["pending", "scheduled", "in_transit", "urgent"].includes(o.status),
    );
  },
  requestRefill(customerId: string, cylinderId: string): RefillOrder {
    const cyl = cylinderService.getById(cylinderId)!;
    const order: RefillOrder = {
      id: `RO-${Date.now()}`,
      customerId,
      cylinderId,
      supplierId: cyl.supplierId,
      status: cyl.currentLevel < 10 ? "urgent" : "pending",
      priority: cyl.currentLevel < 10 ? "urgent" : "normal",
      gasLevelAtRequest: cyl.currentLevel,
      createdAt: new Date().toISOString(),
    };
    getDb().refillOrders.unshift(order);
    cyl.refillStatus = order.status;
    return order;
  },
  create(input: {
    customerId: string;
    cylinderId: string;
    supplierId: string;
    status?: RefillOrder["status"];
    priority?: RefillOrder["priority"];
    scheduledAt?: string;
  }): RefillOrder {
    const cyl = cylinderService.getById(input.cylinderId);
    if (!cyl) throw new Error("Cylinder not found");
    const status =
      input.status ??
      (cyl.currentLevel < 10 ? "urgent" : "pending");
    const priority =
      input.priority ?? (status === "urgent" || cyl.currentLevel < 10 ? "urgent" : "normal");
    const order: RefillOrder = {
      id: `RO-${Date.now()}`,
      customerId: input.customerId,
      cylinderId: input.cylinderId,
      supplierId: input.supplierId,
      status,
      priority,
      gasLevelAtRequest: cyl.currentLevel,
      createdAt: new Date().toISOString(),
      scheduledAt: input.scheduledAt,
    };
    getDb().refillOrders.unshift(order);
    cyl.refillStatus = order.status;
    return order;
  },
  toggleAutoRefill(customerId: string, enabled: boolean) {
    const customer = customerService.getById(customerId);
    if (customer) customer.autoRefill = enabled;
    return customer;
  },
};

export const invoiceService = {
  getAll(): Invoice[] {
    return getDb().invoices;
  },
  getBySupplier(supplierId: string): Invoice[] {
    return getDb().invoices.filter((i) => i.supplierId === supplierId);
  },
  getByCustomer(customerId: string): Invoice[] {
    return getDb().invoices.filter((i) => i.customerId === customerId);
  },
  getById(id: string): Invoice | undefined {
    return getDb().invoices.find((i) => i.id === id);
  },
  getTotalRevenue(): number {
    return getDb()
      .invoices.filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
  },
  getOutstanding(invoices: Invoice[]): number {
    return invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount, 0);
  },
  getPaid(invoices: Invoice[]): number {
    return invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
  },
  create(input: {
    customerId: string;
    supplierId: string;
    items: LineItem[];
    notes?: string;
    taxRate?: number;
    billingModel?: Invoice["billingModel"];
    quotationId?: string;
    dueInDays?: number;
  }): Invoice {
    const taxRate = input.taxRate ?? 0.15;
    const totals = calcDocumentTotals(input.items, taxRate);
    const customer = getDb().customers.find((c) => c.id === input.customerId);
    const now = new Date();
    const seq = getDb().invoices.length + 1;
    const id = padId("INV-", 2026200 + seq, 7);
    const invoice: Invoice = {
      id,
      invoiceNumber: id,
      customerId: input.customerId,
      supplierId: input.supplierId,
      amount: totals.total,
      gasUsageKg: input.items
        .filter((i) => i.unit === "kg")
        .reduce((s, i) => s + i.quantity, 0),
      ratePerKg: GAS_RATE_PER_KG,
      status: "pending",
      billingModel: input.billingModel ?? customer?.billingModel ?? "consumption",
      date: now.toISOString(),
      dueDate: new Date(
        now.getTime() + (input.dueInDays ?? 14) * 86400000,
      ).toISOString(),
      description:
        input.items.map((i) => i.description).join("; ").slice(0, 120) ||
        "LPG services invoice",
      items: input.items,
      subtotal: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      notes: input.notes ?? "Payment due within the stated period.",
      quotationId: input.quotationId,
    };
    getDb().invoices.unshift(invoice);
    return invoice;
  },
  markPaid(id: string): Invoice | null {
    const invoice = this.getById(id);
    if (!invoice || invoice.status === "paid") return null;
    invoice.status = "paid";
    const customer = getDb().customers.find((c) => c.id === invoice.customerId);
    if (customer && customer.outstandingBalance > 0) {
      customer.outstandingBalance = Math.max(
        0,
        Math.round((customer.outstandingBalance - invoice.amount) * 100) / 100,
      );
    }
    return invoice;
  },
};

export const quotationService = {
  getAll(): Quotation[] {
    return getDb().quotations;
  },
  getBySupplier(supplierId: string): Quotation[] {
    return getDb().quotations.filter((q) => q.supplierId === supplierId);
  },
  getByCustomer(customerId: string): Quotation[] {
    return getDb().quotations.filter((q) => q.customerId === customerId);
  },
  getById(id: string): Quotation | undefined {
    return getDb().quotations.find((q) => q.id === id);
  },
  create(input: {
    customerId: string;
    supplierId: string;
    items: LineItem[];
    notes?: string;
    taxRate?: number;
    validDays?: number;
    status?: QuotationStatus;
  }): Quotation {
    const taxRate = input.taxRate ?? 0.15;
    const totals = calcDocumentTotals(input.items, taxRate);
    const now = new Date();
    const seq = getDb().quotations.length + 1;
    const quote: Quotation = {
      id: padId("QUO-", seq, 4),
      quoteNumber: padId("Q-2026-", seq, 4),
      customerId: input.customerId,
      supplierId: input.supplierId,
      status: input.status ?? "draft",
      items: input.items,
      ...totals,
      notes: input.notes ?? "Prices valid for the stated period.",
      validUntil: new Date(
        now.getTime() + (input.validDays ?? 14) * 86400000,
      ).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    getDb().quotations.unshift(quote);
    return quote;
  },
  updateStatus(id: string, status: QuotationStatus): Quotation | null {
    const quote = this.getById(id);
    if (!quote) return null;
    if (quote.status === "converted") return quote;
    quote.status = status;
    quote.updatedAt = new Date().toISOString();
    return quote;
  },
  convertToInvoice(id: string): { quote: Quotation; invoice: Invoice } | null {
    const quote = this.getById(id);
    if (!quote) return null;
    if (quote.status === "converted" && quote.convertedInvoiceId) {
      const existing = invoiceService.getById(quote.convertedInvoiceId);
      if (existing) return { quote, invoice: existing };
    }
    if (!["accepted", "sent", "draft"].includes(quote.status)) return null;

    const invoice = invoiceService.create({
      customerId: quote.customerId,
      supplierId: quote.supplierId,
      items: quote.items.map((item, idx) => ({
        ...item,
        id: `LI-CONV-${Date.now()}-${idx}`,
      })),
      notes: `Converted from quotation ${quote.quoteNumber}. ${quote.notes}`,
      taxRate: quote.taxRate,
      quotationId: quote.id,
    });

    quote.status = "converted";
    quote.convertedInvoiceId = invoice.id;
    quote.updatedAt = new Date().toISOString();
    return { quote, invoice };
  },
};

export const platformBillingService = {
  getAll(): PlatformInvoice[] {
    return getDb().platformInvoices;
  },
  getBySupplier(supplierId: string): PlatformInvoice[] {
    return getDb().platformInvoices.filter((i) => i.supplierId === supplierId);
  },
  getPaid(invoices: PlatformInvoice[]): number {
    return invoices
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
  },
  getOutstanding(invoices: PlatformInvoice[]): number {
    return invoices
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount, 0);
  },
  getCurrentPlan(supplierId: string): PlatformInvoice | undefined {
    return [...this.getBySupplier(supplierId)].sort(
      (a, b) => +new Date(b.date) - +new Date(a.date),
    )[0];
  },
  payInvoice(invoiceId: string): PlatformInvoice | null {
    const invoice = getDb().platformInvoices.find((i) => i.id === invoiceId);
    if (!invoice || invoice.status === "paid") return null;
    invoice.status = "paid";
    return invoice;
  },
};

export const notificationService = {
  getForUser(userId: string): Notification[] {
    return getDb()
      .notifications.filter((n) => n.userId === userId)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp));
  },
  getUnreadCount(userId: string): number {
    return getDb().notifications.filter((n) => n.userId === userId && !n.read)
      .length;
  },
  markRead(id: string) {
    const n = getDb().notifications.find((x) => x.id === id);
    if (n) n.read = true;
  },
  markAllRead(userId: string) {
    getDb()
      .notifications.filter((n) => n.userId === userId)
      .forEach((n) => {
        n.read = true;
      });
  },
};

export const analyticsService = {
  getAdminStats(): DashboardStats {
    const db = getDb();
    return {
      totalSuppliers: db.suppliers.length,
      totalCylinders: db.cylinders.length,
      onlineDevices: deviceService.getOnlineCount(),
      activeDevices: deviceService.getOnlineCount(),
      lowGasAlerts: cylinderService.getLowGas(20).length,
      pendingDeliveries: refillService.getPending().length,
      monthlyRevenue: 125400,
      totalCustomers: db.customers.length,
    };
  },
  getSupplierStats(supplierId: string): DashboardStats {
    const cylinders = cylinderService.getBySupplier(supplierId);
    const devices = deviceService.getBySupplier(supplierId);
    const invoices = invoiceService.getBySupplier(supplierId);
    return {
      totalCylinders: cylinders.length,
      onlineDevices: devices.filter((d) => d.status === "online").length,
      lowGasAlerts: cylinders.filter((c) => c.currentLevel < 20).length,
      pendingDeliveries: refillService
        .getBySupplier(supplierId)
        .filter((o) => ["pending", "scheduled", "in_transit", "urgent"].includes(o.status))
        .length,
      monthlyRevenue: invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount, 0),
      totalCustomers: customerService.getBySupplier(supplierId).length,
    };
  },
  getCustomerStats(customerId: string): DashboardStats {
    const cylinders = cylinderService.getByCustomer(customerId);
    const invoices = invoiceService.getByCustomer(customerId);
    return {
      totalCylinders: cylinders.length,
      onlineDevices: cylinders.length,
      lowGasAlerts: cylinders.filter((c) => c.currentLevel < 20).length,
      pendingDeliveries: refillService
        .getByCustomer(customerId)
        .filter((o) => ["pending", "scheduled", "in_transit", "urgent"].includes(o.status))
        .length,
      monthlyRevenue: invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + i.amount, 0),
    };
  },
  getConsumptionSeries() {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((month, i) => ({
      month,
      consumption: 1800 + i * 120 + (i % 3) * 80,
      revenue: 72000 + i * 6500 + (i % 2) * 4000,
      devices: 200 + i * 7,
      customers: 60 + i * 5,
    }));
  },
};
