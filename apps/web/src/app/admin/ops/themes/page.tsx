import Link from "next/link";
import { Plus } from "lucide-react";
import { themeRepository } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { ThemeStatusToggle } from "./components/theme-status-toggle";

export default async function ThemeLibraryPage() {
  const themes = await themeRepository.findMany();

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
            {themes.map((theme) => (
              <div key={theme.id} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/ops/themes/${theme.id}/edit`}
                    className="text-sm font-semibold text-gray-900 hover:text-primary-600"
                  >
                    {theme.title}
                  </Link>
                  <p className="mt-0.5 truncate text-sm text-gray-500">
                    {theme.shortDescription}
                  </p>
                </div>
                <ThemeStatusToggle themeId={theme.id} isActive={theme.isActive} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
