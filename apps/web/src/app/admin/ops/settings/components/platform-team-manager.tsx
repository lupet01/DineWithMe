"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { invitePlatformMember, revokePlatformInvite } from "../actions";

interface PlatformAdmin {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface PendingInvite {
  id: string;
  email: string;
  expiresAt: string;
}

function daysUntil(dateIso: string): number {
  return Math.max(0, Math.ceil((new Date(dateIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function PlatformTeamManager({
  admins,
  pendingInvites,
}: {
  admins: PlatformAdmin[];
  pendingInvites: PendingInvite[];
}) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await invitePlatformMember(email);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to send invite");
      return;
    }

    setEmail("");
    setInviting(false);
    router.refresh();
  };

  const handleRevoke = async (inviteId: string) => {
    setBusyId(inviteId);
    const result = await revokePlatformInvite(inviteId);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to revoke invite");
      return;
    }
    router.refresh();
  };

  return (
    <Card padding="lg" className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Platform Team</h2>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
        {admins.map((admin) => {
          const name = `${admin.firstName ?? ""} ${admin.lastName ?? ""}`.trim() || admin.email;
          return (
            <div key={admin.id} className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
                <p className="truncate text-xs text-gray-500">{admin.email}</p>
              </div>
              <Badge tone="success">PLATFORM_ADMIN</Badge>
            </div>
          );
        })}
      </div>

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pending Invites</h3>
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-100">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{invite.email}</p>
                  <p className="text-xs text-gray-500">Pending · expires in {daysUntil(invite.expiresAt)}d</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={busyId === invite.id}
                  aria-label={`Revoke invite for ${invite.email}`}
                  className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!inviting ? (
        <button
          type="button"
          onClick={() => setInviting(true)}
          className="flex items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
        >
          + Invite Platform Team Member
        </button>
      ) : (
        <form
          onSubmit={handleInvite}
          className="space-y-3 rounded-xl border border-primary-200 bg-primary-50/40 p-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Email</label>
            <input
              required
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="newadmin@example.com"
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
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
        </form>
      )}
    </Card>
  );
}
