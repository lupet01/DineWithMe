"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@prisma/client";
import { updateUserRole } from "../actions";
import { CheckCircle2, XCircle } from "lucide-react";
import { Role } from "@dinewithme/shared";

interface UserRowProps {
  user: User;
  currentUserId: string | null;
}

const ROLE_OPTIONS: Role[] = [Role.DINER, Role.RESTAURANT_ADMIN, Role.PLATFORM_ADMIN];

export function UserRow({ user, currentUserId }: UserRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const isSelf = currentUserId !== null && user.id === currentUserId;

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "PLATFORM_ADMIN":
        return "bg-purple-100 text-purple-800";
      case "RESTAURANT_ADMIN":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const showToast = (success: boolean, msg: string) => {
    setMessage(msg);
    if (success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const handleRoleChange = async (newRole: Role) => {
    if (isUpdating || newRole === user.role) return;

    // Client-side mirror of the server-side self-demotion guard - gives
    // instant feedback without a round trip, but the action re-checks too.
    if (isSelf && newRole !== Role.PLATFORM_ADMIN) {
      showToast(false, "You cannot remove your own platform admin role");
      return;
    }

    const confirmed = confirm(
      `Change ${user.email}'s role from ${user.role} to ${newRole}?`
    );
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await updateUserRole(user.id, newRole);
    setIsUpdating(false);

    if (result.success) {
      showToast(true, `${user.email}'s role updated to ${newRole}.`);
      router.refresh();
    } else {
      showToast(false, result.error || "Failed to update role");
    }
  };

  return (
    <>
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-md animate-in slide-in-from-top">
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">{message}</p>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {showError && (
        <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg flex items-start gap-3 max-w-md animate-in slide-in-from-top">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{message}</p>
          </div>
        </div>
      )}

      <tr className="hover:bg-slate-50 transition-colors">
        {/* User */}
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-slate-900">
            {user.firstName || user.lastName
              ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
              : "—"}
          </div>
          <div className="text-sm text-slate-500">{user.email}</div>
        </td>

        {/* Role */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
              user.role
            )}`}
          >
            {user.role}
          </span>
          {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
        </td>

        {/* Status */}
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-slate-600 capitalize">{user.status}</span>
        </td>

        {/* Created */}
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-slate-600">{formatDate(user.createdAt)}</div>
        </td>

        {/* Change Role */}
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
          <select
            value={user.role}
            disabled={isUpdating}
            onChange={(e) => handleRoleChange(e.target.value as Role)}
            className="text-xs font-medium border border-slate-300 rounded-lg px-2 py-1.5 bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </td>
      </tr>
    </>
  );
}
