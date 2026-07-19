import { User, ChevronRight, Bell, CreditCard, HelpCircle } from "lucide-react";
import { PageHeader } from "../components/page-header";
import { Card } from "@/components/ui/card";
import { getAuthUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

export default async function ProfilePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || "User";

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Profile" />

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6">
        {/* User info card */}
        <Card className="mb-6" padding="lg">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <User className="h-8 w-8 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {displayName}
              </h2>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          </div>
        </Card>

        {/* Settings sections */}
        <div className="space-y-6">
          {/* Account section */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Account
            </h3>
            <Card padding="none" className="overflow-hidden">
              <button className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors hover:bg-gray-50">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="flex-1 text-sm font-medium text-gray-900">
                  Notifications
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <span className="flex-1 text-sm font-medium text-gray-900">
                  Payment Methods
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </Card>
          </div>

          {/* Support section */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Support
            </h3>
            <Card padding="none" className="overflow-hidden">
              <button className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50">
                <HelpCircle className="h-5 w-5 text-gray-600" />
                <span className="flex-1 text-sm font-medium text-gray-900">
                  Help & Support
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </Card>
          </div>

          {/* Sign out */}
          <Card padding="none" className="overflow-hidden">
            <SignOutButton />
          </Card>
        </div>

        {/* App version */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">DineWithMe v1.0.0</p>
        </div>
      </div>
    </div>
  );
}
