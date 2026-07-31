"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { inviteMember, revokeInvite, removeMember } from "../actions";

interface Member {
  userId: string;
  role: "OWNER" | "MANAGER";
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

interface TeamManagerProps {
  restaurantId: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  isOwner: boolean;
}

function daysUntil(dateIso: string): number {
  return Math.max(0, Math.ceil((new Date(dateIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function TeamManager({ restaurantId, members, pendingInvites, isOwner }: TeamManagerProps) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER">("MANAGER");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await inviteMember(restaurantId, email, role);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to send invite");
      return;
    }

    setEmail("");
    setRole("MANAGER");
    setInviting(false);
    router.refresh();
  };

  const handleRevoke = async (inviteId: string) => {
    setBusyId(inviteId);
    const result = await revokeInvite(restaurantId, inviteId);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to revoke invite");
      return;
    }
    router.refresh();
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    setBusyId(userId);
    const result = await removeMember(restaurantId, userId);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to remove team member");
      return;
    }
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card padding="none" className="divide-y divide-gray-100">
        {members.map((member) => {
          const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;
          return (
            <div key={member.userId} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{member.email}</p>
              </div>
              <div className="flex flex-shrink-0 items-center gap-3">
                <Badge tone={member.role === "OWNER" ? "success" : "neutral"}>{member.role}</Badge>
                {isOwner && member.role === "MANAGER" && (
                  <button
                    type="button"
                    onClick={() => handleRemove(member.userId, name)}
                    disabled={busyId === member.userId}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {busyId === member.userId ? "…" : "Remove"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </Card>

      {pendingInvites.length > 0 && (
        <Card padding="none" className="divide-y divide-gray-100">
          <div className="p-4 pb-0">
            <h2 className="text-sm font-semibold text-gray-900">Pending Invites</h2>
          </div>
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{invite.email}</p>
                <p className="text-xs text-gray-500">
                  Pending · {invite.role} · expires in {daysUntil(invite.expiresAt)}d
                </p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={busyId === invite.id}
                  aria-label={`Revoke invite for ${invite.email}`}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </Card>
      )}

      {isOwner && (
        <>
          {!inviting ? (
            <button
              type="button"
              onClick={() => setInviting(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
            >
              + Invite Member
            </button>
          ) : (
            <form
              onSubmit={handleInvite}
              className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/40 p-4"
            >
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Email address</label>
                <input
                  required
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., manager@yourrestaurant.com"
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as "OWNER" | "MANAGER")}
                  disabled={saving}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
                >
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </div>
              <div className="rounded-lg border border-gray-200 bg-cream-100 p-3">
                <p className="text-xs leading-relaxed text-gray-600">
                  <strong className="text-gray-900">Manager</strong> can edit your restaurant
                  profile, create and edit dinners, and view guest data.{" "}
                  <strong className="text-gray-900">Owner</strong> grants everything a Manager can
                  do, plus inviting/removing other team members — reserve it for genuine
                  co-owners, not staff.
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200"
                >
                  {saving ? "Sending…" : "Send Invite"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInviting(false);
                    setError(null);
                  }}
                  disabled={saving}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
              <p className="text-center text-[11px] text-gray-400">
                They&apos;ll get a link by email. It expires in 7 days.
              </p>
            </form>
          )}
        </>
      )}
    </div>
  );
}
