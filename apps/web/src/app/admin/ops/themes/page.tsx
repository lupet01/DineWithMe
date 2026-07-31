import Link from "next/link";
import { Plus } from "lucide-react";
import { themeRepository, analyticsRepository } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { ThemeStatusToggle } from "./components/theme-status-toggle";

export default async function ThemeLibraryPage() {
  const [themes, enabledCounts, themeAnalytics] = await Promise.all([
    themeRepository.findMany(),
    themeRepository.countEnabledRestaurantsByTheme(),
    analyticsRepository.getThemeAnalytics(),
  ]);

  const fillRateByTheme = new Map(
    themeAnalytics.map((t) => [t.themeId, Math.round(t.confirmationRate * 100)])
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Theme Library</h2>
          <p className="text-gray-600 mt-1">
            Manage the conversation themes restaurants can enable for dinners
          </p>
        </div>
        <Link
          href="/admin/ops/themes/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
        >
          <Plus className="h-4 w-4" />
          New Theme
        </Link>
      </div>

      {themes.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-gray-600">No themes yet.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="divide-y divide-gray-100">
            {themes.map((theme) => {
              const enabledCount = enabledCounts[theme.id] ?? 0;
              const fillRate = fillRateByTheme.get(theme.id);
              return (
                <div key={theme.id} className={`flex items-center gap-4 p-4 ${!theme.isActive ? "opacity-60" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/ops/themes/${theme.id}`}
                        className="text-sm font-semibold text-gray-900 hover:text-primary-600"
                      >
                        {theme.title}
                      </Link>
                      {!theme.isActive && (
                        <span className="rounded-full bg-cream-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {theme.shortDescription}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {enabledCount} restaurant{enabledCount === 1 ? "" : "s"} enabled
                      {fillRate !== undefined && ` · ${fillRate}% avg fill`}
                    </p>
                  </div>
                  <ThemeStatusToggle themeId={theme.id} isActive={theme.isActive} />
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
