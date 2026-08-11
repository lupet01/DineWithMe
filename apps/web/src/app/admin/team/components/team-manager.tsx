"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { inviteMember, revokeInvite, removeMember, changeRole } from "../actions";
import { TeamRoster } from "./team-roster";
import { PendingInvites } from "./pending-invites";
import { InviteMemberSheet } from "./invite-member-sheet";

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
  restaurantName: string;
  members: Member[];
  pendingInvites: PendingInvite[];
  isOwner: boolean;
  currentUserId: string;
}

export function TeamManager({
  restaurantId,
  restaurantName,
  members,
  pendingInvites,
  isOwner,
  currentUserId,
}: TeamManagerProps) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleInvite = async (email: string, role: "OWNER" | "MANAGER") => {
    setError(null);
    setSaving(true);
    const result = await inviteMember(restaurantId, email, role);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to send invite");
      return;
    }

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

  const handleChangeRole = async (userId: string, newRole: "OWNER" | "MANAGER") => {
    setError(null);
    setBusyId(userId);
    const result = await changeRole(restaurantId, userId, newRole);
    setBusyId(null);
    if (!result.success) {
      setError(result.error || "Failed to change role");
      return;
    }
    router.refresh();
  };

  return (
    <>
      {/* Back-chevron to Restaurant Profile, not a Profile/Team/Media/Settings
          tab row — that switcher went stale once Restaurant Profile's own
          Overview stopped using it (Team/Media are inline sections there
          now, Settings a header icon); this is a drill-down reached from a
          specific entry point, same convention as Guest Profile/Dinner
          Detail. */}
      <div className="only-mobile-flex" style={{ justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <Link href="/admin/restaurant" className="m-icon-btn" aria-label="Back to Restaurant Profile">
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <h1 className="pg-title" style={{ flex: 1, textAlign: "center" }}>Team</h1>
        {isOwner ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setInviting(true);
            }}
            className="m-icon-btn"
            aria-label="Invite Member"
          >
            +
          </button>
        ) : (
          <div style={{ width: 44 }} />
        )}
      </div>
      <div className="only-desktop-flex" style={{ justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 className="pg-title">Team</h1>
          <p className="pg-sub">Who has access to manage {restaurantName}</p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setInviting(true);
            }}
            className="btn btn-primary"
          >
            + Invite Member
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-yellow">
          <p style={{ fontSize: 13, color: "var(--yellow-txt)" }}>{error}</p>
        </div>
      )}

      <div className="card card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <TeamRoster
          members={members}
          isOwner={isOwner}
          onRemove={handleRemove}
          onChangeRole={handleChangeRole}
          busyId={busyId}
          currentUserId={currentUserId}
        />
        <PendingInvites invites={pendingInvites} isOwner={isOwner} onRevoke={handleRevoke} busyId={busyId} />
      </div>

      <InviteMemberSheet
        open={inviting}
        onClose={() => {
          setInviting(false);
          setError(null);
        }}
        onSubmit={handleInvite}
        isSaving={saving}
        error={error}
      />
    </>
  );
}
