import { Role } from "@dinewithme/shared";
import { requireUserRole } from "@/lib/auth/server";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single cached call - checks auth, syncs user if needed, validates role
  await requireUserRole([Role.PLATFORM_ADMIN]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Platform Operations</h1>
              <p className="text-sm text-slate-600 mt-1">
                Manage restaurant approvals and platform settings
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                PLATFORM ADMIN
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {children}
      </main>
    </div>
  );
}
