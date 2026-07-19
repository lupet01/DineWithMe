export interface ProgressRow {
  label: string;
  value: number;
  /** Bar fill = value / max. */
  max: number;
  caption?: string;
}

interface ProgressListProps {
  rows: ProgressRow[];
}

export function ProgressList({ rows }: ProgressListProps) {
  return (
    <div className="divide-y divide-gray-100">
      {rows.map((row) => {
        const pct = row.max === 0 ? 0 : Math.min(100, Math.round((row.value / row.max) * 100));
        return (
          <div key={row.label} className="flex items-center gap-4 px-5 py-3">
            <span className="w-40 flex-shrink-0 truncate text-sm font-semibold text-gray-900">
              {row.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-cream-300">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-400"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-12 flex-shrink-0 text-right text-sm tabular-nums text-gray-500">
              {row.caption ?? row.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
