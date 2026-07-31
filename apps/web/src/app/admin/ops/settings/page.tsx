import { userRepository, teamInviteRepository } from "@dinewithme/db";
import { Role } from "@dinewithme/shared";
import { PlatformTeamManager } from "./components/platform-team-manager";

export default async function PlatformSettingsPage() {
  const admins = await userRepository.findByRole(Role.PLATFORM_ADMIN);
  const invites = await teamInviteRepository.findPlatformInvites();
  const pendingInvites = invites.filter((i) => i.status === "PENDING" && i.expiresAt > new Date());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Platform Settings</h2>
        <p className="mt-1 text-gray-600">Platform-wide team and configuration</p>
      </div>

      <PlatformTeamManager
        admins={admins.map((a) => ({
          id: a.id,
          email: a.email,
          firstName: a.firstName,
          lastName: a.lastName,
        }))}
        pendingInvites={pendingInvites.map((i) => ({
          id: i.id,
          email: i.email,
          expiresAt: i.expiresAt.toISOString(),
        }))}
      />
    </div>
  );
}
