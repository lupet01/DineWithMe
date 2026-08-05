type MediaTab = "ALL" | "PROFILE" | "DISH" | "DINNER";

interface MediaTabsProps {
  active: MediaTab;
  counts: { all: number; profile: number; dish: number; dinner: number };
  onChange: (tab: MediaTab) => void;
}

const TABS: { value: MediaTab; label: string; countKey: keyof MediaTabsProps["counts"] }[] = [
  { value: "ALL", label: "All", countKey: "all" },
  { value: "PROFILE", label: "Profile", countKey: "profile" },
  { value: "DISH", label: "Dishes", countKey: "dish" },
  { value: "DINNER", label: "By Dinner", countKey: "dinner" },
];

export function MediaTabs({ active, counts, onChange }: MediaTabsProps) {
  return (
    <div className="tabs">
      {TABS.map(({ value, label, countKey }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`tab ${active === value ? "active" : ""}`}
        >
          {label} ({counts[countKey]})
        </button>
      ))}
    </div>
  );
}
