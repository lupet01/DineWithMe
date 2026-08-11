import { Trash2 } from "lucide-react";

interface Member {
  userId: string;
  role: "OWNER" | "MANAGER";
  firstName: string | null;
  lastName: string | null;
  email: string;
}

interface TeamRosterProps {
  members: Member[];
  isOwner: boolean;
  onRemove: (userId: string, name: string) => void;
  onChangeRole: (userId: string, newRole: "OWNER" | "MANAGER") => void;
  busyId: string | null;
  currentUserId: string;
}

export function TeamRoster({ members, isOwner, onRemove, onChangeRole, busyId, currentUserId }: TeamRosterProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {members.map((member) => {
        const name = `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.email;
        return (
          <div key={member.userId} className="team-roster-row">
            <div className="team-roster-identity">
              <div className="d-avatar" style={{ width: 38, height: 38 }} />
              <div style={{ minWidth: 0 }}>
                <div className="team-roster-name">
                  {name}
                  {member.userId === currentUserId && " (you)"}
                </div>
                <div className="team-roster-email">{member.email}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {/* Owner's own row has no select — there's always exactly one
                  restaurant creator. A Manager viewer also always sees
                  plain text, same as a pending invite's role — only the
                  Owner viewer gets a live select on a MANAGER row, and
                  choosing OWNER there is a real ownership transfer (see
                  restaurant.repository.ts's updateMemberRole doc comment). */}
              {isOwner && member.role === "MANAGER" ? (
                <select
                  className="badge badge-blue"
                  style={{ border: "none", cursor: "pointer", font: "inherit" }}
                  value={member.role}
                  disabled={busyId === member.userId}
                  onChange={(e) => onChangeRole(member.userId, e.target.value as "OWNER" | "MANAGER")}
                  aria-label={`Change ${name}'s role`}
                >
                  <option value="MANAGER">MANAGER</option>
                  <option value="OWNER">OWNER</option>
                </select>
              ) : (
                <span className={`badge ${member.role === "OWNER" ? "badge-purple" : "badge-blue"}`}>
                  {member.role}
                </span>
              )}
              {isOwner && member.role === "MANAGER" && (
                <button
                  type="button"
                  onClick={() => onRemove(member.userId, name)}
                  disabled={busyId === member.userId}
                  aria-label={`Remove ${name}`}
                  className="m-icon-btn"
                  style={{ color: "var(--red-txt)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
