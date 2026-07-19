"use client";

import { useState } from "react";
import type { User } from "@prisma/client";
import { UserRow } from "./user-row";

interface UsersTableProps {
  users: User[];
  currentUserId: string | null;
}

type RoleFilter = "all" | "diner" | "restaurant_admin" | "platform_admin";

export function UsersTable({ users, currentUserId }: UsersTableProps) {
  const [filter, setFilter] = useState<RoleFilter>("all");

  const filteredUsers = users.filter((user) => {
    if (filter === "all") return true;
    return user.role === filter.toUpperCase();
  });

  const counts = {
    diner: users.filter((u) => u.role === "DINER").length,
    restaurant_admin: users.filter((u) => u.role === "RESTAURANT_ADMIN").length,
    platform_admin: users.filter((u) => u.role === "PLATFORM_ADMIN").length,
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No users yet</h3>
          <p className="text-slate-600">Users will appear here once they sign up</p>
        </div>
      </div>
    );
  }

  const tabs: Array<{ key: RoleFilter; label: string; count: number }> = [
    { key: "all", label: "All", count: users.length },
    { key: "diner", label: "Diners", count: counts.diner },
    { key: "restaurant_admin", label: "Restaurant Admins", count: counts.restaurant_admin },
    { key: "platform_admin", label: "Platform Admins", count: counts.platform_admin },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
              filter === tab.key
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Change Role
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    No users found for this filter
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} currentUserId={currentUserId} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
