import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-zinc-800 text-zinc-300 border-zinc-700",
  success: "bg-emerald-900/50 text-emerald-400 border-emerald-800",
  warning: "bg-amber-900/50 text-amber-400 border-amber-800",
  danger: "bg-red-900/50 text-red-400 border-red-800",
  info: "bg-blue-900/50 text-blue-400 border-blue-800",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
