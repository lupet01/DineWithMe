"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  /** Total rows across all pages (not just the current page). */
  total: number;
}

/**
 * URL-driven pager for the server-paginated Ops lists. Prev/Next are Links
 * that only change the `page` param, preserving any active search/filter.
 */
export function Pagination({ page, pageSize, total }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const start = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const end = Math.min(current * pageSize, total);

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    return `${pathname}?${params.toString()}`;
  };

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-600 shadow-card transition-colors hover:bg-cream-100";
  const disabled = "cursor-not-allowed opacity-40";

  return (
    <div className="flex items-center justify-between gap-3 px-1">
      <div className="text-sm text-gray-500">
        {total === 0 ? "No results" : `Showing ${start}–${end} of ${total}`}
      </div>
      <div className="flex items-center gap-3">
        {current <= 1 ? (
          <span className={cn(btn, disabled)} aria-hidden="true">
            <ChevronLeft className="h-4 w-4" />
          </span>
        ) : (
          <Link href={hrefFor(current - 1)} className={btn} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        )}
        <span className="text-sm text-gray-600">
          Page {current} of {pageCount}
        </span>
        {current >= pageCount ? (
          <span className={cn(btn, disabled)} aria-hidden="true">
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : (
          <Link href={hrefFor(current + 1)} className={btn} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
