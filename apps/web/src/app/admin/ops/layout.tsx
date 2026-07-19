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
    <div>
      <div className="border-b border-gray-100 pb-4 mb-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Platform Operations</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage restaurant approvals and platform settings
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
              PLATFORM ADMIN
            </span>
          </div>
        </div>
      </div>

      <main className="py-6">{children}</main>
    </div>
  );
}
