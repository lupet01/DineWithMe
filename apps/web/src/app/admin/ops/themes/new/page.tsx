import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ThemeForm } from "../components/theme-form";

export default function NewThemePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ops/themes"
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h2 className="text-xl font-semibold text-gray-900">New Theme</h2>
      </div>
      <ThemeForm mode="create" />
    </div>
  );
}
