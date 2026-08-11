"use client";

import { Tabs, type TabItem } from "./tabs";
import { useListQuery } from "./use-list-query";

/**
 * Segmented tabs whose selection lives in a URL query param, so the server
 * component can filter in the DB. Selecting the default value clears the
 * param (keeps the URL clean for the "all" case).
 */
export function UrlTabs({
  param,
  items,
  defaultValue = "all",
  className,
}: {
  param: string;
  items: TabItem[];
  defaultValue?: string;
  className?: string;
}) {
  const { searchParams, setParams } = useListQuery();
  const value = searchParams.get(param) ?? defaultValue;
  return (
    <Tabs
      items={items}
      value={value}
      onChange={(next) => setParams({ [param]: next === defaultValue ? null : next })}
      className={className}
    />
  );
}
