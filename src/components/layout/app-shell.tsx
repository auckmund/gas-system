"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
  CreditCard,
  Flame,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Package,
  Truck,
  Users,
  X,
  Building2,
  Cpu,
  FileText,
  Receipt,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { notificationService } from "@/services";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const supplierNav: NavItem[] = [
  { href: "/supplier/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/supplier/customers", label: "Customers", icon: Users },
  { href: "/supplier/cylinders", label: "Cylinders", icon: Flame },
  { href: "/supplier/refills", label: "Refills", icon: Truck },
  { href: "/supplier/quotations", label: "Quotations", icon: FileText },
  { href: "/supplier/invoices", label: "Invoices", icon: Receipt },
  { href: "/supplier/map", label: "Map", icon: Map },
  { href: "/supplier/billing", label: "Billing", icon: CreditCard },
];

const customerNav: NavItem[] = [
  { href: "/customer/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customer/cylinders", label: "Cylinders", icon: Package },
  { href: "/customer/orders", label: "Orders", icon: Truck },
  { href: "/customer/quotations", label: "Quotations", icon: FileText },
  { href: "/customer/billing", label: "Billing", icon: CreditCard },
];

const adminNav: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/suppliers", label: "Suppliers", icon: Building2 },
  { href: "/admin/devices", label: "Devices", icon: Cpu },
  { href: "/admin/map", label: "Map", icon: Map },
  { href: "/admin/quotations", label: "Quotations", icon: FileText },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
];

export function getNavForRole(role: string): NavItem[] {
  if (role === "super_admin") return adminNav;
  if (role === "supplier_admin") return supplierNav;
  return customerNav;
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { session, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  if (!session) return null;

  const nav = getNavForRole(session.user.role);
  const unread = notificationService.getUnreadCount(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <div>
            <div className="text-lg font-bold tracking-widest text-primary">{APP_NAME}</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Smart LPG IoT
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-hidden p-3">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-l-2 border-primary bg-muted text-foreground"
                    : "border-l-2 border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border p-4">
          <div className="mb-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{session.user.name}</div>
            <div className="truncate">{session.user.email}</div>
            <div className="mt-1 uppercase tracking-wider text-accent">
              {session.user.role.replace("_", " ")}
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-4">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-semibold tracking-wide md:text-lg">{title}</h1>
              {subtitle && (
                <p className="hidden text-xs text-muted-foreground sm:block">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2 hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <Activity className="h-3.5 w-3.5 text-secondary" />
              <span>Live telemetry</span>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => setNotifOpen(true)}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] text-primary-foreground">
                  {unread}
                </span>
              )}
            </Button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>

        <footer className="shrink-0 border-t border-border px-4 py-3 text-center text-[10px] uppercase tracking-widest text-muted-foreground">
          {APP_NAME} · {APP_TAGLINE}
        </footer>
      </div>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
