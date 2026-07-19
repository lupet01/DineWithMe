"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SortDirection = "asc" | "desc" | null;

interface SortableColumnHeaderProps {
  label: string;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  className?: string;
}

export function SortableColumnHeader({
  label,
  active,
  direction,
  onSort,
  className,
}: SortableColumnHeaderProps) {
  const Icon = !active || direction === null ? ArrowUpDown : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-500 transition-colors hover:text-gray-700",
        active && "text-gray-900",
        className
      )}
    >
      {label}
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
