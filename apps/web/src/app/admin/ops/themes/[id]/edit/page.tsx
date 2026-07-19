import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { themeRepository } from "@dinewithme/db";
import { ThemeForm } from "../../components/theme-form";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

export default async function EditThemePage({
  params,
}: {
  params: { id: string };
}) {
  const theme = await themeRepository.findById(params.id);
  if (!theme) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ops/themes"
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">Edit Theme</h2>
      </div>
      <ThemeForm
        mode="edit"
        themeId={theme.id}
        initialValues={{
          key: theme.key,
          title: theme.title,
          shortDescription: theme.shortDescription,
          whatToExpect: theme.whatToExpect,
          boundaries: theme.boundaries,
          conversationStarters: toStringArray(theme.conversationStarters),
        }}
      />
    </div>
  );
}
