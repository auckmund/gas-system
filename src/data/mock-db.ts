import {
  BUSINESS_SUFFIXES,
  CYLINDER_CAPACITIES,
  FIRST_NAMES,
  GAS_RATE_PER_KG,
  LAST_NAMES,
  NAMIBIA_CITIES,
  SUPPLIER_NAMES,
  getCylinderPricing,
} from "@/lib/constants";
import { createRng, jitter, pick, randFloat, randInt } from "@/lib/rng";
import { calcDocumentTotals, padId } from "@/lib/utils";
import type {
  ConnectionType,
  Customer,
  Cylinder,
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
} from "@/types";

export interface MockDatabase {
  users: User[];
  suppliers: Supplier[];
  customers: Customer[];
  cylinders: Cylinder[];
  devices: Device[];
  sensorReadings: SensorReading[];
  refillOrders: RefillOrder[];
  invoices: Invoice[];
  quotations: Quotation[];
  platformInvoices: PlatformInvoice[];
  notifications: Notification[];
}

function allCityPoints() {
  return NAMIBIA_CITIES.flatMap((c) =>
    c.points.map((p) => ({ city: c.city, ...p })),
  );
}

function generateMockDatabase(): MockDatabase {
  const rng = createRng(20260712);
  const points = allCityPoints();
  const now = Date.now();

  const suppliers: Supplier[] = SUPPLIER_NAMES.map((name, i) => {
    const loc = pick(rng, points);
    return {
      id: padId("SUP-", i + 1, 3),
      name,
      location: `${loc.label}, ${loc.city}`,
      city: loc.city,
      phone: `+264 81 ${randInt(rng, 100, 999)} ${randInt(rng, 1000, 9999)}`,
      email: `${name.toLowerCase().replace(/\s+/g, "")}@gas.na`,
      activeCustomers: 0,
      activeCylinders: 0,
      monthlyRevenue: 0,
    };
  });

  const namGas = suppliers[0]!;

  const customers: Customer[] = [];
  for (let i = 0; i < 100; i++) {
    const loc = pick(rng, points);
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const isBiz = rng() > 0.55;
    const name = isBiz
      ? `${last} ${pick(rng, BUSINESS_SUFFIXES)}`
      : `${first} ${last}`;
    const supplier = i === 0 ? namGas : pick(rng, suppliers);
    customers.push({
      id: padId("CUS-", i + 1, 4),
      name: i === 0 ? "John Smith" : name,
      phone: `+264 81 ${randInt(rng, 100, 999)} ${randInt(rng, 1000, 9999)}`,
      email:
        i === 0
          ? "customer@test.com"
          : `${first.toLowerCase()}.${last.toLowerCase()}${i}@mail.na`,
      address: `${randInt(rng, 1, 120)} ${loc.label} Road`,
      city: loc.city,
      lat: jitter(rng, loc.lat, 0.02),
      lng: jitter(rng, loc.lng, 0.02),
      supplierId: supplier.id,
      billingModel: rng() > 0.4 ? "consumption" : "subscription",
      autoRefill: rng() > 0.5,
      outstandingBalance: randFloat(rng, 0, 450, 0),
    });
  }

  const cylinders: Cylinder[] = [];
  for (let i = 0; i < 250; i++) {
    const customer = i < 3 ? customers[0]! : pick(rng, customers);
    const capacity = pick(rng, CYLINDER_CAPACITIES);
    let level: number;
    const roll = rng();
    if (roll < 0.08) level = randFloat(rng, 2, 9, 0);
    else if (roll < 0.18) level = randFloat(rng, 10, 19, 0);
    else if (roll < 0.4) level = randFloat(rng, 20, 49, 0);
    else level = randFloat(rng, 50, 98, 0);

    let refillStatus: Cylinder["refillStatus"];
    if (level < 10) refillStatus = "urgent";
    else if (level < 20 && customer.autoRefill) refillStatus = "pending";
    else if (rng() > 0.92) refillStatus = "scheduled";

    cylinders.push({
      id: padId("CYL-", i + 1, 5),
      serialNumber: padId("AUG-CYL-", 10000 + i, 5),
      customerId: customer.id,
      supplierId: customer.supplierId,
      capacityKg: capacity,
      currentLevel: level,
      currentWeightKg: Math.round((capacity * level) / 100 * 10) / 10,
      ...getCylinderPricing(capacity),
      lat: jitter(rng, customer.lat, 0.008),
      lng: jitter(rng, customer.lng, 0.008),
      city: customer.city,
      lastUpdated: new Date(now - randInt(rng, 1, 180) * 60000).toISOString(),
      refillStatus,
    });
  }

  const devices: Device[] = cylinders.map((cyl, i) => {
    const offline = rng() > 0.95;
    const connections: ConnectionType[] = ["WiFi", "GSM", "LoRaWAN"];
    return {
      id: padId("DEV-", i + 1, 5),
      deviceSerial: padId("AUG-ESP32-", i + 1, 5),
      cylinderId: cyl.id,
      battery: offline ? randInt(rng, 5, 25) : randInt(rng, 45, 100),
      status: offline ? "offline" : "online",
      connection: pick(rng, connections),
      signalStrength: offline ? randInt(rng, 10, 40) : randInt(rng, 55, 100),
      lastReading: cyl.lastUpdated,
    };
  });

  // 5000 sensor readings across devices (sampled history)
  const sensorReadings: SensorReading[] = [];
  const readingsPerDevice = Math.ceil(5000 / devices.length);
  let readingIdx = 0;
  for (const device of devices) {
    const cyl = cylinders.find((c) => c.id === device.cylinderId)!;
    let level = Math.min(100, cyl.currentLevel + randInt(rng, 10, 40));
    for (let r = 0; r < readingsPerDevice && readingIdx < 5000; r++) {
      level = Math.max(1, level - randFloat(rng, 0.2, 2.5, 1));
      const ts = new Date(
        now - (readingsPerDevice - r) * randInt(rng, 30, 90) * 60000,
      ).toISOString();
      sensorReadings.push({
        id: padId("SR-", ++readingIdx, 6),
        deviceId: device.id,
        cylinderId: cyl.id,
        weight: Math.round((cyl.capacityKg * level) / 100 * 10) / 10,
        gasPercentage: Math.round(level),
        battery: device.battery,
        signalStrength: device.signalStrength,
        timestamp: ts,
      });
    }
  }

  const refillOrders: RefillOrder[] = [];
  const lowCylinders = cylinders.filter((c) => c.currentLevel < 25);
  for (let i = 0; i < 20; i++) {
    const cyl = lowCylinders[i % lowCylinders.length] ?? pick(rng, cylinders);
    const statuses: RefillOrder["status"][] = [
      "pending",
      "scheduled",
      "in_transit",
      "completed",
      "urgent",
    ];
    const status =
      cyl.currentLevel < 10 ? "urgent" : pick(rng, statuses);
    const created = new Date(now - randInt(rng, 1, 14) * 86400000);
    refillOrders.push({
      id: padId("RO-", i + 1, 4),
      customerId: cyl.customerId,
      cylinderId: cyl.id,
      supplierId: cyl.supplierId,
      status,
      priority: cyl.currentLevel < 10 ? "urgent" : "normal",
      gasLevelAtRequest: cyl.currentLevel,
      createdAt: created.toISOString(),
      scheduledAt:
        status !== "pending"
          ? new Date(created.getTime() + 86400000).toISOString()
          : undefined,
      completedAt:
        status === "completed"
          ? new Date(created.getTime() + 2 * 86400000).toISOString()
          : undefined,
    });
  }

  const invoices: Invoice[] = [];
  for (let i = 0; i < 30; i++) {
    const customer = i < 5 ? customers[0]! : pick(rng, customers);
    const usage = randFloat(rng, 12, 55, 0);
    const amount =
      customer.billingModel === "subscription"
        ? randInt(rng, 180, 350)
        : usage * GAS_RATE_PER_KG;
    const statuses: Invoice["status"][] = ["paid", "pending", "overdue", "paid"];
    const date = new Date(now - randInt(rng, 5, 90) * 86400000);
    const items: LineItem[] =
      customer.billingModel === "subscription"
        ? [
            {
              id: `LI-${i}-1`,
              description: "Monthly LPG monitoring subscription",
              quantity: 1,
              unit: "month",
              unitPrice: amount,
            },
          ]
        : [
            {
              id: `LI-${i}-1`,
              description: "LPG consumption (Pay-As-You-Use)",
              quantity: usage,
              unit: "kg",
              unitPrice: GAS_RATE_PER_KG,
            },
          ];
    const totals = calcDocumentTotals(items, 0);
    invoices.push({
      id: padId("INV-", 2026000 + i + 1, 7),
      invoiceNumber: padId("INV-", 2026000 + i + 1, 7),
      customerId: customer.id,
      supplierId: customer.supplierId,
      amount: totals.total || amount,
      gasUsageKg: usage,
      ratePerKg: GAS_RATE_PER_KG,
      status: pick(rng, statuses),
      billingModel: customer.billingModel,
      date: date.toISOString(),
      dueDate: new Date(date.getTime() + 14 * 86400000).toISOString(),
      description:
        customer.billingModel === "subscription"
          ? "Monthly LPG monitoring subscription"
          : `Pay-As-You-Use: ${usage}kg @ R${GAS_RATE_PER_KG}/kg`,
      items,
      subtotal: totals.subtotal || amount,
      taxRate: 0,
      taxAmount: 0,
      notes: "Thank you for choosing connected LPG monitoring.",
    });
  }

  const quoteCatalog = [
    { description: "LPG cylinder refill (19kg)", unit: "cyl", unitPrice: 280 },
    { description: "LPG cylinder refill (48kg)", unit: "cyl", unitPrice: 620 },
    { description: "IoT device installation", unit: "unit", unitPrice: 450 },
    { description: "Monthly monitoring fee", unit: "month", unitPrice: 120 },
    { description: "Emergency delivery surcharge", unit: "trip", unitPrice: 85 },
    { description: "Bulk LPG supply", unit: "kg", unitPrice: GAS_RATE_PER_KG },
    { description: "Cylinder deposit", unit: "unit", unitPrice: 350 },
  ];

  const quotations: Quotation[] = [];
  const namGasCustomers = customers.filter((c) => c.supplierId === namGas.id);
  for (let i = 0; i < 18; i++) {
    const customer =
      i < 3 ? customers[0]! : pick(rng, i < 10 ? namGasCustomers : customers);
    const itemCount = randInt(rng, 1, 3);
    const items: LineItem[] = [];
    for (let j = 0; j < itemCount; j++) {
      const catalog = pick(rng, quoteCatalog);
      const quantity =
        catalog.unit === "kg" ? randInt(rng, 15, 60) : randInt(rng, 1, 4);
      items.push({
        id: `QLI-${i}-${j}`,
        description: catalog.description,
        quantity,
        unit: catalog.unit,
        unitPrice: catalog.unitPrice,
      });
    }
    const taxRate = 0.15;
    const totals = calcDocumentTotals(items, taxRate);
    const created = new Date(now - randInt(rng, 1, 45) * 86400000);
    let status: QuotationStatus = pick(rng, [
      "draft",
      "sent",
      "accepted",
      "rejected",
      "expired",
      "converted",
    ]);
    if (i === 0) status = "sent";
    if (i === 1) status = "accepted";
    if (i === 2) status = "draft";

    const quote: Quotation = {
      id: padId("QUO-", i + 1, 4),
      quoteNumber: padId("Q-2026-", i + 1, 4),
      customerId: customer.id,
      supplierId: customer.supplierId,
      status,
      items,
      ...totals,
      notes:
        status === "draft"
          ? "Draft quote — review before sending."
          : "Prices valid for the stated period. Delivery subject to route schedule.",
      validUntil: new Date(created.getTime() + 14 * 86400000).toISOString(),
      createdAt: created.toISOString(),
      updatedAt: created.toISOString(),
    };

    if (status === "converted") {
      const invId = padId("INV-", 2026100 + i + 1, 7);
      const invDate = new Date(created.getTime() + 2 * 86400000);
      invoices.push({
        id: invId,
        invoiceNumber: invId,
        customerId: customer.id,
        supplierId: customer.supplierId,
        amount: totals.total,
        gasUsageKg: items
          .filter((it) => it.unit === "kg")
          .reduce((s, it) => s + it.quantity, 0),
        ratePerKg: GAS_RATE_PER_KG,
        status: pick(rng, ["paid", "pending"] as const),
        billingModel: customer.billingModel,
        date: invDate.toISOString(),
        dueDate: new Date(invDate.getTime() + 14 * 86400000).toISOString(),
        description: `Invoice from quotation ${quote.quoteNumber}`,
        items,
        subtotal: totals.subtotal,
        taxRate: totals.taxRate,
        taxAmount: totals.taxAmount,
        notes: `Converted from ${quote.quoteNumber}`,
        quotationId: quote.id,
      });
      quote.convertedInvoiceId = invId;
    }

    quotations.push(quote);
  }

  const platformPlans = [
    { plan: "starter" as const, base: 2500 },
    { plan: "growth" as const, base: 6500 },
    { plan: "enterprise" as const, base: 12000 },
  ];
  const platformInvoices: PlatformInvoice[] = [];
  suppliers.forEach((s, si) => {
    const plan = platformPlans[si % platformPlans.length]!;
    const deviceCount = cylinders.filter((c) => c.supplierId === s.id).length;
    for (let m = 0; m < 3; m++) {
      const date = new Date(now - (m * 30 + randInt(rng, 1, 5)) * 86400000);
      const amount = plan.base + deviceCount * 15;
      // Ensure the primary demo supplier always has an unpaid current invoice
      let status: PlatformInvoice["status"];
      if (si === 0 && m === 0) status = "pending";
      else if (si === 0 && m === 1) status = "overdue";
      else status = pick(rng, m === 0 ? (["pending", "paid", "overdue"] as const) : (["paid", "paid"] as const));
      platformInvoices.push({
        id: padId("PINV-", si * 10 + m + 1, 4),
        supplierId: s.id,
        amount,
        plan: plan.plan,
        deviceCount,
        status,
        date: date.toISOString(),
        dueDate: new Date(date.getTime() + 14 * 86400000).toISOString(),
        description: `auckmund ${plan.plan} plan · ${deviceCount} devices @ R15/device`,
      });
    }
  });

  // Update supplier aggregates
  for (const s of suppliers) {
    s.activeCustomers = customers.filter((c) => c.supplierId === s.id).length;
    s.activeCylinders = cylinders.filter((c) => c.supplierId === s.id).length;
    s.monthlyRevenue = invoices
      .filter((inv) => inv.supplierId === s.id && inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
  }

  const users: User[] = [
    {
      id: "USR-ADMIN",
      name: "Platform Admin",
      email: "admin@auckmund.com",
      password: "Admin123!",
      role: "super_admin",
    },
    {
      id: "USR-SUP-001",
      name: "NamGas Operator",
      email: "supplier@namgas.com",
      password: "Supplier123!",
      role: "supplier_admin",
      supplierId: namGas.id,
    },
    {
      id: "USR-CUS-001",
      name: "John Smith",
      email: "customer@test.com",
      password: "Customer123!",
      role: "customer",
      customerId: customers[0]!.id,
      supplierId: customers[0]!.supplierId,
    },
  ];

  // Add supplier users for other suppliers (for completeness)
  suppliers.slice(1).forEach((s, i) => {
    users.push({
      id: padId("USR-SUP-", i + 2, 3),
      name: `${s.name} Admin`,
      email: s.email,
      password: "Supplier123!",
      role: "supplier_admin",
      supplierId: s.id,
    });
  });

  const notifications: Notification[] = [];
  const criticalCyls = cylinders.filter((c) => c.currentLevel < 10).slice(0, 12);
  const warnCyls = cylinders
    .filter((c) => c.currentLevel >= 10 && c.currentLevel < 20)
    .slice(0, 15);

  criticalCyls.forEach((cyl, i) => {
    const cust = customers.find((c) => c.id === cyl.customerId)!;
    notifications.push({
      id: padId("NTF-", i + 1, 3),
      userId: "USR-ADMIN",
      title: "URGENT: Critical gas level",
      message: `Cylinder ${cyl.serialNumber} gas level below 10% (${cyl.currentLevel}%). Customer: ${cust.name}`,
      type: "urgent",
      channels: ["in_app", "sms", "whatsapp", "email"],
      read: false,
      timestamp: new Date(now - randInt(rng, 5, 120) * 60000).toISOString(),
      relatedCylinderId: cyl.id,
    });
  });

  warnCyls.forEach((cyl, i) => {
    const cust = customers.find((c) => c.id === cyl.customerId)!;
    notifications.push({
      id: padId("NTF-", criticalCyls.length + i + 1, 3),
      userId: "USR-SUP-001",
      title: "WARNING: Low gas",
      message: `Cylinder ${cyl.serialNumber} gas level ${cyl.currentLevel}%. Customer: ${cust.name}`,
      type: "warning",
      channels: ["in_app", "email"],
      read: rng() > 0.5,
      timestamp: new Date(now - randInt(rng, 30, 600) * 60000).toISOString(),
      relatedCylinderId: cyl.id,
    });
  });

  while (notifications.length < 50) {
    const n = notifications.length;
    const types: Notification["type"][] = ["info", "success", "warning"];
    const type = pick(rng, types);
    notifications.push({
      id: padId("NTF-", n + 1, 3),
      userId: pick(rng, ["USR-ADMIN", "USR-SUP-001", "USR-CUS-001"]),
      title:
        type === "success"
          ? "Refill completed successfully"
          : type === "info"
            ? "Device telemetry sync"
            : "Battery advisory",
      message:
        type === "success"
          ? `Refill order ${padId("RO-", randInt(rng, 1, 20), 4)} completed.`
          : type === "info"
            ? `${randInt(rng, 180, 248)} devices reported within the last hour.`
            : `Device ${padId("AUG-ESP32-", randInt(rng, 1, 250), 5)} battery below 30%.`,
      type,
      channels: pick(rng, [
        ["in_app"],
        ["in_app", "email"],
        ["in_app", "sms"],
        ["in_app", "whatsapp", "email"],
      ]),
      read: rng() > 0.4,
      timestamp: new Date(now - randInt(rng, 60, 5000) * 60000).toISOString(),
    });
  }

  // Customer-specific notifications
  const custCyls = cylinders.filter((c) => c.customerId === customers[0]!.id);
  custCyls.forEach((cyl, i) => {
    if (cyl.currentLevel < 50) {
      notifications.push({
        id: padId("NTF-C-", i + 1, 2),
        userId: "USR-CUS-001",
        title:
          cyl.currentLevel < 20
            ? "Your cylinder needs refill"
            : "Gas level update",
        message: `Cylinder ${cyl.serialNumber} is at ${cyl.currentLevel}%.`,
        type: cyl.currentLevel < 20 ? "warning" : "info",
        channels: ["in_app", "sms"],
        read: false,
        timestamp: cyl.lastUpdated,
        relatedCylinderId: cyl.id,
      });
    }
  });

  return {
    users,
    suppliers,
    customers,
    cylinders,
    devices,
    sensorReadings,
    refillOrders,
    invoices,
    quotations,
    platformInvoices,
    notifications,
  };
}

let _db: MockDatabase | null = null;

export function getDb(): MockDatabase {
  if (!_db) {
    _db = generateMockDatabase();
  }
  return _db;
}

export function resetDb() {
  _db = generateMockDatabase();
  return _db;
}
