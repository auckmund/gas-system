export type UserRole = "super_admin" | "supplier_admin" | "customer";

export type DeviceStatus = "online" | "offline";
export type ConnectionType = "WiFi" | "GSM" | "LoRaWAN";
export type RefillStatus =
  | "pending"
  | "scheduled"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "urgent";
export type InvoiceStatus = "paid" | "pending" | "overdue" | "draft";
export type QuotationStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "converted";
export type NotificationType = "urgent" | "warning" | "info" | "success";
export type NotificationChannel = "in_app" | "sms" | "whatsapp" | "email";
export type BillingModel = "subscription" | "consumption";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  supplierId?: string;
  customerId?: string;
}

export interface Supplier {
  id: string;
  name: string;
  location: string;
  city: string;
  phone: string;
  email: string;
  activeCustomers: number;
  activeCylinders: number;
  monthlyRevenue: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  supplierId: string;
  billingModel: BillingModel;
  autoRefill: boolean;
  outstandingBalance: number;
}

export interface Cylinder {
  id: string;
  serialNumber: string;
  customerId: string;
  supplierId: string;
  capacityKg: number;
  currentLevel: number;
  currentWeightKg: number;
  /** Full refill price for this cylinder size (N$) */
  refillPrice: number;
  /** Pay-as-you-use rate (N$/kg) */
  pricePerKg: number;
  lat: number;
  lng: number;
  city: string;
  lastUpdated: string;
  refillStatus?: RefillStatus;
}

export interface Device {
  id: string;
  deviceSerial: string;
  cylinderId: string;
  battery: number;
  status: DeviceStatus;
  connection: ConnectionType;
  signalStrength: number;
  lastReading: string;
}

export interface SensorReading {
  id: string;
  deviceId: string;
  cylinderId: string;
  weight: number;
  gasPercentage: number;
  battery: number;
  signalStrength: number;
  timestamp: string;
}

export interface RefillOrder {
  id: string;
  customerId: string;
  cylinderId: string;
  supplierId: string;
  status: RefillStatus;
  priority: "normal" | "urgent";
  gasLevelAtRequest: number;
  createdAt: string;
  scheduledAt?: string;
  completedAt?: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  supplierId: string;
  amount: number;
  gasUsageKg: number;
  ratePerKg: number;
  status: InvoiceStatus;
  billingModel: BillingModel;
  date: string;
  dueDate: string;
  description: string;
  items?: LineItem[];
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  notes?: string;
  quotationId?: string;
  invoiceNumber?: string;
}

export interface Quotation {
  id: string;
  quoteNumber: string;
  customerId: string;
  supplierId: string;
  status: QuotationStatus;
  items: LineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  convertedInvoiceId?: string;
}

/** Platform SaaS fees billed by auckmund to suppliers */
export interface PlatformInvoice {
  id: string;
  supplierId: string;
  amount: number;
  plan: "starter" | "growth" | "enterprise";
  deviceCount: number;
  status: InvoiceStatus;
  date: string;
  dueDate: string;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  read: boolean;
  timestamp: string;
  relatedCylinderId?: string;
}

export interface AuthSession {
  user: Omit<User, "password">;
  token: string;
  loggedInAt: string;
}

export interface DashboardStats {
  totalCylinders: number;
  onlineDevices: number;
  lowGasAlerts: number;
  pendingDeliveries: number;
  monthlyRevenue: number;
  totalSuppliers?: number;
  totalCustomers?: number;
  activeDevices?: number;
}
