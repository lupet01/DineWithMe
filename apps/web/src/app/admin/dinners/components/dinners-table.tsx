"use client";

import { useMemo, useState } from "react";
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { SortableColumnHeader, type SortDirection } from "@/components/ui/sortable-column-header";
import { DinnerRow, DinnerRowCard } from "./dinner-row";

interface DinnersTableProps {
  dinners: DinnerWithRestaurant[];
}

type FilterValue = "all" | "upcoming" | "past";

interface DateThemeFilter {
  from: string;
  to: string;
  themeTitle: string;
}

const EMPTY_FILTER: DateThemeFilter = { from: "", to: "", themeTitle: "" };
const PAGE_SIZE = 10;

function isUpcoming(dinner: DinnerWithRestaurant, now: Date) {
  const dinnerDate = new Date(dinner.startsAt);
  return dinnerDate >= now && dinner.status !== "CANCELLED" && dinner.status !== "COMPLETED";
}

function isPast(dinner: DinnerWithRestaurant, now: Date) {
  const dinnerDate = new Date(dinner.startsAt);
  return dinnerDate < now || dinner.status === "COMPLETED" || dinner.status === "CANCELLED";
}

export function DinnersTable({ dinners }: DinnersTableProps) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [dateSort, setDateSort] = useState<SortDirection>("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Mobile-only "Filter Dinners" panel (§16.3 wireframe) - date range +
  // theme, staged in draft state and only applied to the list on "Apply"
  // (or cleared on "Reset"), matching the wireframe's explicit Reset/Apply
  // pair rather than filtering live on every keystroke. Desktop applies
  // its date/theme fields live instead - it already has room to show the
  // toolbar inline, so there's no panel to open/close in the first place.
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [draftFilter, setDraftFilter] = useState<DateThemeFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<DateThemeFilter>(EMPTY_FILTER);
  const [desktopFilter, setDesktopFilter] = useState<DateThemeFilter>(EMPTY_FILTER);

  const themeOptions = useMemo(() => {
    const seen = new Set<string>();
    for (const dinner of dinners) {
      if (dinner.theme?.title) seen.add(dinner.theme.title);
    }
    return Array.from(seen).sort();
  }, [dinners]);

  const tabCounts = useMemo(() => {
    const now = new Date();
    let upcoming = 0;
    let past = 0;
    for (const dinner of dinners) {
      if (isUpcoming(dinner, now)) upcoming += 1;
      if (isPast(dinner, now)) past += 1;
    }
    return { all: dinners.length, upcoming, past };
  }, [dinners]);

  const filterTabs = [
    { value: "all" as const, label: `All (${tabCounts.all})` },
    { value: "upcoming" as const, label: `Upcoming (${tabCounts.upcoming})` },
    { value: "past" as const, label: `Past (${tabCounts.past})` },
  ];

  const isMobileFilterActive = appliedFilter.from !== "" || appliedFilter.to !== "" || appliedFilter.themeTitle !== "";
  const isDesktopFilterActive = desktopFilter.from !== "" || desktopFilter.to !== "" || desktopFilter.themeTitle !== "";

  // Filter dinners based on selected tab + search + the date/theme filter
  // (mobile's applied-on-submit panel, desktop's live inline toolbar).
  const filteredDinners = useMemo(() => {
    const now = new Date();
    const activeFilter = isDesktopFilterActive ? desktopFilter : appliedFilter;

    const filtered = dinners.filter((dinner) => {
      const dinnerDate = new Date(dinner.startsAt);

      if (filter === "upcoming" && !isUpcoming(dinner, now)) return false;
      if (filter === "past" && !isPast(dinner, now)) return false;

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const haystack = `${dinner.theme?.title ?? ""} ${dinner.description ?? ""}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }

      if (activeFilter.from && dinnerDate < new Date(activeFilter.from)) return false;
      if (activeFilter.to && dinnerDate > new Date(`${activeFilter.to}T23:59:59`)) return false;
      if (activeFilter.themeTitle && dinner.theme?.title !== activeFilter.themeTitle) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      return dateSort === "asc" ? diff : -diff;
    });
  }, [dinners, filter, dateSort, search, appliedFilter, desktopFilter, isDesktopFilterActive]);

  const totalCount = filteredDinners.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedDinners = filteredDinners.slice(pageStart, pageStart + PAGE_SIZE);

  const changeFilter = (next: FilterValue) => {
    setFilter(next);
    setPage(1);
  };

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
    setPage(1);
  };

  const handleResetFilter = () => {
    setDraftFilter(EMPTY_FILTER);
    setAppliedFilter(EMPTY_FILTER);
    setPage(1);
  };

  return (
    <div>
      {/* Desktop: search + date range + theme select + tabs, all inline —
          every other list screen (Guests, Reviews, Restaurant Queue) already
          surfaces filters this way; Dinners was the one screen still hiding
          them behind mobile's icon-triggered panel with no way to narrow by
          date/theme on desktop at all. */}
      <div className="search-toolbar only-desktop-flex">
        <div className="search-bar">
          <Search className="h-4 w-4" />
          <input
            className="field-input"
            placeholder="Search by dinner name…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <input
          type="date"
          className="field-input"
          style={{ width: "auto" }}
          title="From"
          value={desktopFilter.from}
          onChange={(e) => { setDesktopFilter((f) => ({ ...f, from: e.target.value })); setPage(1); }}
        />
        <input
          type="date"
          className="field-input"
          style={{ width: "auto" }}
          title="To"
          value={desktopFilter.to}
          onChange={(e) => { setDesktopFilter((f) => ({ ...f, to: e.target.value })); setPage(1); }}
        />
        <select
          className="field-input"
          style={{ width: "auto" }}
          value={desktopFilter.themeTitle}
          onChange={(e) => { setDesktopFilter((f) => ({ ...f, themeTitle: e.target.value })); setPage(1); }}
        >
          <option value="">All Themes</option>
          {themeOptions.map((title) => (
            <option key={title} value={title}>{title}</option>
          ))}
        </select>
        <div className="tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`tab ${filter === tab.value ? "active" : ""}`}
              onClick={() => changeFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: tabs + filter toggle */}
      <div className="only-mobile-flex" style={{ alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div className="tabs" style={{ flex: 1 }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`tab ${filter === tab.value ? "active" : ""}`}
              onClick={() => changeFilter(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`m-icon-btn${isMobileFilterActive ? " filter-active" : ""}`}
          aria-label="Toggle Filter Dinners panel"
          title={isMobileFilterActive ? "1 filter applied" : undefined}
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

      {/* Mobile: stacked row-cards. Desktop: table. Same filtered+paged data. */}
      <div className="only-mobile">
        {pagedDinners.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", color: "var(--t3)" }}>
            No dinners found for this filter
          </div>
        ) : (
          pagedDinners.map((dinner) => <DinnerRowCard key={dinner.id} dinner={dinner} />)
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
                <th>Revenue</th>
                <th>Status</th>
                <th className="r">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedDinners.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--t3)" }}>
                    No dinners found for this filter
                  </td>
                </tr>
              ) : (
                pagedDinners.map((dinner) => (
                  <DinnerRow key={dinner.id} dinner={dinner} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalCount > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, totalCount)} of {totalCount}
          </div>
          <div className="pagination-controls">
            <button
              type="button"
              className={`m-icon-btn${currentPage <= 1 ? " disabled" : ""}`}
              aria-label="Previous page"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="pagination-page">Page {currentPage} of {pageCount}</span>
            <button
              type="button"
              className={`m-icon-btn${currentPage >= pageCount ? " disabled" : ""}`}
              aria-label="Next page"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
