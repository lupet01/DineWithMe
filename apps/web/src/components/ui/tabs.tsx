"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Segmented-control style tabs — a neutral track with a plain white "raised"
 * pill marking the selected tab. Deliberately no accent color on the active
 * state (matches how Apple/Figma Make reserve the brand accent for primary
 * actions only, not for "this is selected").
 */
export function Tabs({ items, value, onChange, className }: TabsProps) {
  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-full bg-cream-200 p-1", className)}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(item.value)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
              isActive ? "bg-white text-gray-900 shadow-card" : "text-gray-500 hover:text-gray-700"
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
