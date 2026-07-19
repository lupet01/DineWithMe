"use client";

import { Search } from "lucide-react";
import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  onValueChange?: (value: string) => void;
}

export function SearchBar({
  className,
  onValueChange,
  onChange,
  ...props
}: SearchBarProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        className="w-full rounded-full border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 shadow-card placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
        onChange={(e) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        {...props}
      />
    </div>
  );
}
