"use client";

import { useListQuery } from "./use-list-query";

/**
 * A <select> whose value lives in a URL query param, for server-side
 * filtering (e.g. the Restaurants list's location dropdown). Choosing the
 * default option clears the param.
 */
export function UrlSelect({
  param,
  options,
  allLabel,
  defaultValue = "all",
  className,
  "aria-label": ariaLabel,
}: {
  param: string;
  options: string[];
  allLabel: string;
  defaultValue?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const { searchParams, setParams } = useListQuery();
  const value = searchParams.get(param) ?? defaultValue;
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => setParams({ [param]: e.target.value === defaultValue ? null : e.target.value })}
      className={className}
    >
      <option value={defaultValue}>{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
