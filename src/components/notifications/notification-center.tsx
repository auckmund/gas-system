"use client";

import { useAuth } from "@/hooks/use-auth";
import { notificationService } from "@/services";
import { formatRelativeTime, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Notification } from "@/types";

export function NotificationCenter({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { session } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    if (open && session) {
      setItems(notificationService.getForUser(session.user.id));
    }
  }, [open, session]);

  if (!open || !session) return null;

  const markAll = () => {
    notificationService.markAllRead(session.user.id);
    setItems(notificationService.getForUser(session.user.id));
  };

  const markOne = (id: string) => {
    notificationService.markRead(id);
    setItems(notificationService.getForUser(session.user.id));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <h2 className="font-semibold tracking-wide">Notifications</h2>
            <p className="text-xs text-muted-foreground">In-app · SMS · WhatsApp · Email</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={markAll}>
              Mark all read
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">No notifications</p>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markOne(n.id)}
              className={cn(
                "w-full border-b border-border p-4 text-left transition-colors hover:bg-muted/40",
                !n.read && "bg-muted/30",
              )}
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <Badge
                  variant={
                    n.type === "urgent"
                      ? "destructive"
                      : n.type === "warning"
                        ? "warning"
                        : n.type === "success"
                          ? "success"
                          : "accent"
                  }
                >
                  {n.type}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(n.timestamp)}
                </span>
              </div>
              <div className="text-sm font-medium">{n.title}</div>
              <p className="mt-1 text-xs text-muted-foreground">{n.message}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {n.channels.map((c) => (
                  <span
                    key={c}
                    className="border border-border px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground"
                  >
                    {c.replace("_", "-")}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
}
