"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";

interface UsersTableProps {
  users: User[];
  flaggedUserIds: string[];
}

function roleTone(role: string): "primary" | "neutral" {
  return role === "PLATFORM_ADMIN" || role === "RESTAURANT_ADMIN" ? "primary" : "neutral";
}

export function UsersTable({ users, flaggedUserIds }: UsersTableProps) {
  const [search, setSearch] = useState("");
  const flaggedSet = useMemo(() => new Set(flaggedUserIds), [flaggedUserIds]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => {
      const name = [user.firstName, user.lastName].filter(Boolean).join(" ").toLowerCase();
      return name.includes(query) || user.email.toLowerCase().includes(query);
    });
  }, [users, search]);

  return (
    <div className="space-y-4">
      <SearchBar
        placeholder="Search by name or email..."
        value={search}
        onValueChange={setSearch}
        className="sm:w-72"
      />

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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                    No users match your search
                  </td>
                </tr>
              ) : (
                filtered.map((user) => {
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
    </div>
  );
}
