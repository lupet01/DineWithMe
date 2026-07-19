import { userRepository, trustProfileRepository } from "@dinewithme/db";
import { UsersTable } from "./components/users-table";

export default async function UsersPage() {
  const [users, flaggedProfiles] = await Promise.all([
    userRepository.findMany(),
    trustProfileRepository.getFlaggedUsers(),
  ]);

  const flaggedUserIds = new Set(flaggedProfiles.map((p) => p.userId));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Users</h2>
        <p className="text-gray-600 mt-1">
          {users.length} user{users.length !== 1 ? "s" : ""} on the platform
        </p>
      </div>

      <UsersTable users={users} flaggedUserIds={Array.from(flaggedUserIds)} />
    </div>
  );
}
