import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "accent" | "warning" | "destructive" | "outline" | "success";
}) {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    accent: "bg-accent text-accent-foreground",
    warning: "bg-destructive text-destructive-foreground",
    destructive: "bg-primary text-primary-foreground",
    outline: "border border-border text-foreground",
    success: "bg-secondary text-secondary-foreground",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-medium uppercase tracking-wide",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
