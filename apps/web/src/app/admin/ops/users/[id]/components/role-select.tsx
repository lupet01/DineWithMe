"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Role } from "@dinewithme/shared";
import { updateUserRole } from "../actions";

interface RoleSelectProps {
  userId: string;
  currentRole: string;
  isSelf: boolean;
}

const ROLE_OPTIONS: Role[] = [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN];

export function RoleSelect({ userId, currentRole, isSelf }: RoleSelectProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (newRole: Role) => {
    if (isUpdating || newRole === currentRole) return;

    const confirmed = confirm(`Change this user's role from ${currentRole} to ${newRole}?`);
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await updateUserRole(userId, newRole);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || "Failed to update role");
      return;
    }
    router.refresh();
  };

  return (
    <select
      value={currentRole}
      disabled={isUpdating}
      onChange={(e) => handleChange(e.target.value as Role)}
      className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 disabled:opacity-50"
      aria-label="Change user role"
    >
      {ROLE_OPTIONS.map((role) => (
        <option key={role} value={role} disabled={isSelf && role !== Role.PLATFORM_ADMIN}>
          {role}
        </option>
      ))}
    </select>
  );
}
