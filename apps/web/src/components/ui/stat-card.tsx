import { ReactNode } from "react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  caption?: string;
  className?: string;
}

export function StatCard({ label, value, caption, className }: StatCardProps) {
  return (
    <Card padding="lg" className={className}>
      <div className="mb-1 text-sm font-medium text-gray-600">{label}</div>
      <div className="text-3xl font-semibold text-gray-900">{value}</div>
      {caption ? (
        <div className="mt-2 text-xs text-gray-500">{caption}</div>
      ) : null}
    </Card>
  );
}

interface StatGridProps {
  children: ReactNode;
  className?: string;
}

export function StatGrid({ children, className }: StatGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-3", className)}>
      {children}
    </div>
  );
}
