import { cn } from "@/lib/utils";

type BadgeVariant = "yellow" | "green" | "red" | "blue" | "purple" | "slate";

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  className?: string;
}

// Semantic status colors — intentionally separate from the primary-orange
// brand accent. These communicate state (pending/active/paused/etc.), not
// "this is the primary action."
const variantClasses: Record<BadgeVariant, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-700",
  slate: "bg-cream-300 text-gray-600",
};

export function Badge({ children, variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
