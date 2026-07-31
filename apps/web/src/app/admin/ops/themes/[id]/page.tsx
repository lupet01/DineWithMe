import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { themeRepository, themeIcebreakerRepository } from "@dinewithme/db";
import { ThemeProfile } from "./components/theme-profile";

export default async function ThemeProfilePage({ params }: { params: { id: string } }) {
  const theme = await themeRepository.findByIdWithPerformance(params.id);
  if (!theme) {
    notFound();
  }

  const [icebreakers, enabledRestaurants] = await Promise.all([
    themeIcebreakerRepository.findByTheme(theme.id),
    themeRepository.findEnabledRestaurants(theme.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/ops/themes" className="rounded-lg p-2 transition-colors hover:bg-cream-200">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">{theme.title}</h2>
      </div>

      <ThemeProfile
        theme={{
          id: theme.id,
          key: theme.key,
          title: theme.title,
          shortDescription: theme.shortDescription,
          whatToExpect: theme.whatToExpect,
          boundaries: theme.boundaries,
          isActive: theme.isActive,
          performance: theme.themePerformance,
        }}
        icebreakers={icebreakers.map((i) => ({
          id: i.id,
          text: i.text,
          usageCount: i.usageCount,
          avgRating: i.avgRating,
        }))}
        enabledRestaurants={enabledRestaurants}
      />
    </div>
  );
}
