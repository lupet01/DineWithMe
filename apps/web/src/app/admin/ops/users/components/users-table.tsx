import Link from "next/link";
import type { User } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UsersTableProps {
  /** Already server-paginated + searched by the page. */
  users: User[];
  flaggedUserIds: string[];
}

function roleTone(role: string): "primary" | "neutral" {
  return role === "PLATFORM_ADMIN" || role === "RESTAURANT_ADMIN" ? "primary" : "neutral";
}

export function UsersTable({ users, flaggedUserIds }: UsersTableProps) {
  const flaggedSet = new Set(flaggedUserIds);

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cream-100 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                  No users match your search
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const name =
                  [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
                return (
                  <tr key={user.id} className="hover:bg-cream-100 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/ops/users/${user.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {name}
                      </Link>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge tone={roleTone(user.role)}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {flaggedSet.has(user.id) ? (
                        <Badge tone="danger">Flagged</Badge>
                      ) : (
                        <Badge tone="success">Good standing</Badge>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
