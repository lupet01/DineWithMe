"use client";

import { X } from "lucide-react";

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
}

function daysUntil(dateIso: string): number {
  return Math.max(0, Math.ceil((new Date(dateIso).getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function PendingInvites({
  invites,
  isOwner,
  onRevoke,
  busyId,
}: {
  invites: PendingInvite[];
  isOwner: boolean;
  onRevoke: (inviteId: string) => void;
  busyId: string | null;
}) {
  if (invites.length === 0) return null;

  return (
    <>
      {invites.map((invite) => (
        <div key={invite.id} className="pending-invite-row">
          <div style={{ fontSize: 13, color: "var(--t3)" }}>Invited: {invite.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="badge badge-yellow">
              Pending · expires in {daysUntil(invite.expiresAt)}d
            </span>
            {isOwner && (
              <button
                type="button"
                onClick={() => onRevoke(invite.id)}
                disabled={busyId === invite.id}
                aria-label={`Revoke invite for ${invite.email}`}
                className="m-icon-btn"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
