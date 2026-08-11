"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Shared helper for the URL-driven Ops list toolbars (Users, Restaurants,
 * Dinners). Filters/search/pagination all live in the query string so the
 * server component can read them and page in the DB. Any filter or search
 * change resets `page` to 1 — otherwise narrowing the results could strand
 * the view on a page that no longer exists.
 */
export function useListQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParams = useCallback(
    (updates: Record<string, string | null>, options?: { replace?: boolean }) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      params.delete("page");
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (options?.replace) router.replace(url);
      else router.push(url);
    },
    [router, pathname, searchParams]
  );

  return { searchParams, setParams };
}
