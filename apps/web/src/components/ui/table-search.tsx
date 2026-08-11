"use client";

import { useEffect, useRef, useState } from "react";
import { SearchBar } from "./search-bar";
import { useListQuery } from "./use-list-query";

/**
 * URL-driven search box for the server-paginated Ops lists. Debounces
 * keystrokes into a `q` query param (replace, so typing doesn't spam
 * history) and resets pagination via useListQuery. Stays a client component
 * so it keeps focus across the server re-render each edit triggers.
 */
export function TableSearch({ placeholder, className }: { placeholder?: string; className?: string }) {
  const { searchParams, setParams } = useListQuery();
  const [value, setValue] = useState(searchParams.get("q") ?? "");
  const firstRun = useRef(true);

  useEffect(() => {
    // Don't fire on mount — that would push a redundant navigation for the
    // value already reflected in the URL.
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const timer = setTimeout(() => {
      setParams({ q: value.trim() || null }, { replace: true });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <SearchBar placeholder={placeholder} value={value} onValueChange={setValue} className={className} />
  );
}
