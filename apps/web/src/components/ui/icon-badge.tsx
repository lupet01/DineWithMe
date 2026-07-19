import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconBadgeProps {
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function IconBadge({ icon: Icon, label, className }: IconBadgeProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
