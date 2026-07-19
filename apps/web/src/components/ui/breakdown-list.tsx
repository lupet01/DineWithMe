import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BreakdownRow {
  label: string;
  value: ReactNode;
  color: string;
}

interface BreakdownListProps {
  rows: BreakdownRow[];
  className?: string;
}

export function BreakdownList({ rows, className }: BreakdownListProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-gray-600">{row.label}</span>
          </div>
          <span className="font-semibold text-gray-900">{row.value}</span>
        </div>
      ))}
    </div>
  );
}
