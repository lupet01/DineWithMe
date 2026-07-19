import { User, Bell, CreditCard, HelpCircle, ShieldCheck } from "lucide-react";
import { PageHeader } from "../components/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAuthUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

function ComingSoonRow({
  icon: Icon,
  label,
}: {
  icon: typeof Bell;
  label: string;
}) {
  return (
    <div
      className="flex w-full cursor-not-allowed items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-0"
      aria-disabled="true"
    >
      <Icon className="h-5 w-5 text-gray-400" />
      <span className="flex-1 text-sm font-medium text-gray-400">{label}</span>
      <Badge tone="neutral">Coming soon</Badge>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect("/sign-in");
  }

  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || "User";

  return (
    <div className="min-h-screen bg-cream-100">
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
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                <User className="h-8 w-8 text-primary-600" />
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
              <ComingSoonRow icon={Bell} label="Notifications" />
              <ComingSoonRow icon={CreditCard} label="Payment Methods" />
            </Card>
          </div>

          {/* Trust & Safety */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Trust &amp; Safety
            </h3>
            <Card padding="none" className="overflow-hidden">
              <ComingSoonRow icon={ShieldCheck} label="Trust & Safety" />
            </Card>
          </div>

          {/* Support section */}
          <div>
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Support
            </h3>
            <Card padding="none" className="overflow-hidden">
              <ComingSoonRow icon={HelpCircle} label="Help & Support" />
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
