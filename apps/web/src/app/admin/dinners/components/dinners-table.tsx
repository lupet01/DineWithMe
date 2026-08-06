"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { SortableColumnHeader, type SortDirection } from "@/components/ui/sortable-column-header";
import { DinnerRow, DinnerRowCard } from "./dinner-row";

interface DinnersTableProps {
  dinners: DinnerWithRestaurant[];
}

const filterTabs = [
  { value: "all", label: "All Dinners", mobileLabel: "All" },
  { value: "upcoming", label: "Upcoming", mobileLabel: "Upcoming" },
  { value: "past", label: "Past", mobileLabel: "Past" },
] as const;

interface DateThemeFilter {
  from: string;
  to: string;
  themeTitle: string;
}

const EMPTY_FILTER: DateThemeFilter = { from: "", to: "", themeTitle: "" };

export function DinnersTable({ dinners }: DinnersTableProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [dateSort, setDateSort] = useState<SortDirection>("asc");

  // Mobile-only "Filter Dinners" panel (§16.3 wireframe) - date range +
  // theme, staged in draft state and only applied to the list on "Apply"
  // (or cleared on "Reset"), matching the wireframe's explicit Reset/Apply
  // pair rather than filtering live on every keystroke.
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [draftFilter, setDraftFilter] = useState<DateThemeFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<DateThemeFilter>(EMPTY_FILTER);

  const themeOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const dinner of dinners) {
      if (dinner.theme?.title) seen.add(dinner.theme.title);
    }
    return Array.from(seen).sort();
  }, [dinners]);

  // Filter dinners based on selected tab + the mobile date/theme panel
  const filteredDinners = useMemo(() => {
    const filtered = dinners.filter((dinner) => {
      const now = new Date();
      const dinnerDate = new Date(dinner.startsAt);

      if (filter === "upcoming") {
        if (!(dinnerDate >= now && dinner.status !== "CANCELLED" && dinner.status !== "COMPLETED")) return false;
      }
      if (filter === "past") {
        if (!(dinnerDate < now || dinner.status === "COMPLETED" || dinner.status === "CANCELLED")) return false;
      }

      if (appliedFilter.from && dinnerDate < new Date(appliedFilter.from)) return false;
      if (appliedFilter.to && dinnerDate > new Date(`${appliedFilter.to}T23:59:59`)) return false;
      if (appliedFilter.themeTitle && dinner.theme?.title !== appliedFilter.themeTitle) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return dateSort === "asc" ? diff : -diff;
    });
  }, [dinners, filter, dateSort, appliedFilter]);

  if (dinners.length === 0) {
    return (
      <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🍽️</div>
        <div className="card-title" style={{ marginBottom: 6 }}>No dinners yet</div>
        <p style={{ fontSize: 13, color: "var(--t3)" }}>
          Create your first dining experience to get started
        </p>
      </div>
    );
  }

  const handleApplyFilter = () => {
    setAppliedFilter(draftFilter);
    setShowFilterPanel(false);
  };

  const handleResetFilter = () => {
    setDraftFilter(EMPTY_FILTER);
    setAppliedFilter(EMPTY_FILTER);
  };

  return (
    <div>
      {/* Desktop tabs */}
      <div className="tabs only-desktop-flex" style={{ marginBottom: 16 }}>
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`tab ${filter === tab.value ? "active" : ""}`}
            onClick={() => setFilter(tab.value)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile: tabs + filter toggle */}
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div className="tabs" style={{ flex: 1 }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`tab ${filter === tab.value ? "active" : ""}`}
              onClick={() => setFilter(tab.value)}
            >
              {tab.mobileLabel}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="m-icon-btn"
          aria-label="Toggle Filter Dinners panel"
          onClick={() => setShowFilterPanel((v) => !v)}
        >
          <Filter className="h-4 w-4" />
        </button>
      </div>

      {showFilterPanel && (
        <div className="card card-pad only-mobile" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ fontSize: 13, marginBottom: 12 }}>
            Filter Dinners
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="field-grid-2">
              <div>
                <label className="field-label">From</label>
                <input
                  type="date"
                  className="field-input"
                  value={draftFilter.from}
                  onChange={(e) => setDraftFilter((f) => ({ ...f, from: e.target.value }))}
                />
              </div>
              <div>
                <label className="field-label">To</label>
                <input
                  type="date"
                  className="field-input"
                  value={draftFilter.to}
                  onChange={(e) => setDraftFilter((f) => ({ ...f, to: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="field-label">Theme</label>
              <select
                className="field-input"
                value={draftFilter.themeTitle}
                onChange={(e) => setDraftFilter((f) => ({ ...f, themeTitle: e.target.value }))}
              >
                <option value="">All Themes</option>
                {themeOptions.map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <button type="button" className="btn btn-sm btn-outline" style={{ flex: 1 }} onClick={handleResetFilter}>
                Reset
              </button>
              <button type="button" className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={handleApplyFilter}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: stacked row-cards. Desktop: table. Same filtered data. */}
      <div className="only-mobile">
        {filteredDinners.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
            No dinners found for this filter
          </div>
        ) : (
          filteredDinners.map((dinner) => <DinnerRowCard key={dinner.id} dinner={dinner} />)
        )}
      </div>

      <div className="only-desktop table-wrap">
        <div className="table-scroll">
          <table className="dtable">
            <thead>
              <tr>
                <th>
                  <SortableColumnHeader
                    label="Date & Time"
                    active
                    direction={dateSort}
                    onSort={() => setDateSort(dateSort === "asc" ? "desc" : "asc")}
                  />
                </th>
                <th>Theme</th>
                <th>Seats</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDinners.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--t3)" }}>
                    No dinners found for this filter
                  </td>
                </tr>
              ) : (
                filteredDinners.map((dinner) => (
                  <DinnerRow key={dinner.id} dinner={dinner} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
