import { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";

interface RowCardProps {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  className?: string;
}

export function RowCard({ leading, title, subtitle, trailing, href, className }: RowCardProps) {
  const inner = (
    <div className="flex items-center gap-3 p-4">
      {leading ? <div className="flex-shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-gray-900">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</div>
        ) : null}
      </div>
      {trailing ? (
        <div className="flex-shrink-0">{trailing}</div>
      ) : href ? (
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card padding="none" className={cn("transition-colors hover:bg-cream-100", className)}>
          {inner}
        </Card>
      </Link>
    );
  }

  return (
    <Card padding="none" className={className}>
      {inner}
    </Card>
  );
}
