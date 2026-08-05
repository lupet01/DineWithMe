"use client";

import { useEffect, useState } from "react";
import { FilterSheet } from "@/components/ui/filter-sheet";

interface InviteMemberSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: "OWNER" | "MANAGER") => void;
  isSaving: boolean;
  error: string | null;
}

export function InviteMemberSheet({ open, onClose, onSubmit, isSaving, error }: InviteMemberSheetProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "MANAGER">("MANAGER");

  useEffect(() => {
    if (open) {
      setEmail("");
      setRole("MANAGER");
    }
  }, [open]);

  return (
    <FilterSheet open={open} onClose={onClose} title="Invite a Team Member">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email, role);
        }}
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        <div>
          <label className="field-label">Email address</label>
          <input
            required
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., manager@yourrestaurant.com"
            disabled={isSaving}
            className="field-input"
          />
        </div>

        <div>
          <label className="field-label">Role</label>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={() => setRole("OWNER")}
              disabled={isSaving}
              className={`badge ${role === "OWNER" ? "badge-green" : "badge-slate"}`}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => setRole("MANAGER")}
              disabled={isSaving}
              className={`badge ${role === "MANAGER" ? "badge-green" : "badge-slate"}`}
            >
              Manager
            </button>
          </div>
        </div>

        <div className="alert" style={{ background: "var(--bg2)", border: "1px solid var(--bdr)" }}>
          <div style={{ fontSize: 11.5, color: "var(--t2)", lineHeight: 1.4 }}>
            <b>Manager</b> can edit your restaurant profile, create and edit dinners, and view guest
            data. <b>Owner</b> grants everything a Manager can do, plus inviting/removing other team
            members — reserve it for genuine co-owners, not staff.
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--red-txt)", margin: 0 }}>{error}</p>}

        <button type="submit" disabled={isSaving} className="btn btn-primary btn-block">
          {isSaving ? "Sending…" : "Send Invite"}
        </button>
        <p style={{ fontSize: 11, color: "var(--t3)", textAlign: "center", margin: 0 }}>
          They&apos;ll get a link by email. It expires in 7 days.
        </p>
      </form>
    </FilterSheet>
  );
}
