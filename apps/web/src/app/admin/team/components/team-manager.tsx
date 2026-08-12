"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { inviteMember, revokeInvite, removeMember, changeRole } from "../actions";
import { TeamRoster } from "./team-roster";
import { PendingInvites } from "./pending-invites";
import { InviteMemberSheet } from "./invite-member-sheet";
import { ConfirmModal } from "../../components/confirm-modal";
import { useToast } from "@/components/ui/toast";

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
  const { toast } = useToast();
  const [inviting, setInviting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);

  const handleInvite = async (email: string, role: "OWNER" | "MANAGER") => {
    setError(null);
    setSaving(true);
    const result = await inviteMember(restaurantId, email, role);
    setSaving(false);

    if (!result.success) {
      const message = result.error || "Failed to send invite";
      setError(message);
      toast.error(message);
      return;
    }

    setInviting(false);
    toast.success("Invite sent");
    router.refresh();
  };

  const handleRevoke = async (inviteId: string) => {
    setBusyId(inviteId);
    const result = await revokeInvite(restaurantId, inviteId);
    setBusyId(null);
    if (!result.success) {
      const message = result.error || "Failed to revoke invite";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Invite revoked");
    router.refresh();
  };

  // Opens the styled confirm modal (wireframe sec-action-modals) instead of a
  // native confirm(); the actual removal runs from confirmRemove below.
  const handleRemove = (userId: string, name: string) => {
    setRemoveTarget({ userId, name });
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const { userId } = removeTarget;
    setBusyId(userId);
    const result = await removeMember(restaurantId, userId);
    setBusyId(null);
    if (!result.success) {
      const message = result.error || "Failed to remove team member";
      setError(message);
      toast.error(message);
      return;
    }
    setRemoveTarget(null);
    toast.success("Team member removed");
    router.refresh();
  };

  const handleChangeRole = async (userId: string, newRole: "OWNER" | "MANAGER") => {
    setError(null);
    setBusyId(userId);
    const result = await changeRole(restaurantId, userId, newRole);
    setBusyId(null);
    if (!result.success) {
      const message = result.error || "Failed to change role";
      setError(message);
      toast.error(message);
      return;
    }
    toast.success("Role updated");
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

      <ConfirmModal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        tone="red"
        title="Remove Member"
        description={
          removeTarget
            ? `Remove ${removeTarget.name} from the team? They'll immediately lose access to manage ${restaurantName}.`
            : ""
        }
        confirmLabel="Remove Member"
      />
    </>
  );
}
