export const APP_NAME = "AUGMUND";
export const APP_TAGLINE = "Predictive Gas Management Through Connected Intelligence";
export const APP_FULL_NAME = "AUGMUND Smart LPG Monitoring System";

export const AUTH_STORAGE_KEY = "augmund_session";

export const DEMO_CREDENTIALS = [
  {
    email: "admin@augmund.com",
    password: "Admin123!",
    role: "super_admin" as const,
    label: "Super Admin",
  },
  {
    email: "supplier@namgas.com",
    password: "Supplier123!",
    role: "supplier_admin" as const,
    label: "Supplier Admin",
  },
  {
    email: "customer@test.com",
    password: "Customer123!",
    role: "customer" as const,
    label: "Customer",
  },
];

export const NAMIBIA_CITIES = [
  {
    city: "Windhoek",
    points: [
      { label: "CBD", lat: -22.5609, lng: 17.0658 },
      { label: "Eros", lat: -22.5529, lng: 17.0825 },
      { label: "Khomasdal", lat: -22.5716, lng: 17.0459 },
      { label: "Katutura", lat: -22.5541, lng: 17.0394 },
      { label: "Pioneers Park", lat: -22.5872, lng: 17.0778 },
    ],
  },
  {
    city: "Walvis Bay",
    points: [
      { label: "Center", lat: -22.9576, lng: 14.5053 },
      { label: "Narraville", lat: -22.9494, lng: 14.5278 },
      { label: "Kuisebmond", lat: -22.9708, lng: 14.5059 },
    ],
  },
  {
    city: "Swakopmund",
    points: [
      { label: "Center", lat: -22.6833, lng: 14.527 },
      { label: "Tamariskia", lat: -22.6628, lng: 14.5436 },
      { label: "Vineta", lat: -22.6719, lng: 14.5068 },
    ],
  },
  {
    city: "Oshakati",
    points: [
      { label: "Center", lat: -17.783, lng: 15.6887 },
      { label: "Oneshila", lat: -17.7764, lng: 15.7012 },
      { label: "Okatana Rd", lat: -17.7978, lng: 15.6735 },
    ],
  },
  {
    city: "Rundu",
    points: [
      { label: "Center", lat: -17.9227, lng: 19.7731 },
      { label: "Sikanduko", lat: -17.9096, lng: 19.7889 },
      { label: "Sauyemwa", lat: -17.9378, lng: 19.7546 },
    ],
  },
] as const;

export const MAP_CENTER = { lat: -22.5, lng: 17.1 };
export const MAP_DEFAULT_ZOOM = 6;

export const GAS_RATE_PER_KG = 4;
export const CYLINDER_CAPACITIES = [9, 19, 48] as const;

/** Default full-refill retail prices by capacity (N$) */
export const CYLINDER_REFILL_PRICES: Record<number, number> = {
  9: 140,
  19: 280,
  48: 620,
};

export function getCylinderPricing(capacityKg: number) {
  const refillPrice = CYLINDER_REFILL_PRICES[capacityKg] ?? Math.round(capacityKg * 15);
  return {
    refillPrice,
    pricePerKg: GAS_RATE_PER_KG,
  };
}

export function cylinderGasValue(cylinder: {
  currentWeightKg: number;
  pricePerKg: number;
}) {
  return Math.round(cylinder.currentWeightKg * cylinder.pricePerKg * 100) / 100;
}

export function cylinderRefillCost(cylinder: {
  capacityKg: number;
  currentWeightKg: number;
  refillPrice: number;
  pricePerKg: number;
}) {
  const neededKg = Math.max(0, cylinder.capacityKg - cylinder.currentWeightKg);
  const byKg = Math.round(neededKg * cylinder.pricePerKg * 100) / 100;
  // Prefer proportional refill of listed full price when capacity matches catalog
  const proportional =
    Math.round((neededKg / cylinder.capacityKg) * cylinder.refillPrice * 100) / 100;
  return proportional > 0 ? proportional : byKg;
}

export const FIRST_NAMES = [
  "John", "Maria", "Petrus", "Anna", "David", "Helena", "Thomas", "Grace",
  "Andreas", "Lydia", "Samuel", "Nadia", "Michael", "Esther", "Joseph", "Faith",
  "Daniel", "Ruth", "Peter", "Sarah", "James", "Martha", "Paul", "Elizabeth",
];

export const LAST_NAMES = [
  "Smith", "Nangolo", "Shilongo", "Trading", "Amukoto", "Hausiku", "van Wyk",
  "Nghishi", "Katjivikua", "Mwila", "Iipinge", "Gariseb", "Ndjodhi", "Hamukwaya",
  "Shikongo", "Muyenga", "Uusiku", "Amadhila", "Kadhila", "Shipanga",
];

export const BUSINESS_SUFFIXES = [
  "Trading", "Enterprises", "Stores", "Services", "Logistics", "Holdings", "Energy",
];

export const SUPPLIER_NAMES = [
  "NamGas Solutions",
  "Desert Flame Energy",
  "Atlantic LPG Supply",
  "Kalahari Gas Partners",
  "Coastal Cylinder Co",
  "Northern Gas Networks",
  "Oshikoto Fuel Systems",
  "Etosha Energy Group",
  "Caprivi Gas Distributors",
  "Khomas Smart Fuel",
];
