"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { updateBankDetails } from "../actions";

interface BankDetailsFormProps {
  restaurantId: string;
  bankName: string | null;
  maskedAccountNumber: string | null;
  bankAccountHolderName: string | null;
  verifiedAt: string | null;
}

export function BankDetailsForm({
  restaurantId,
  bankName,
  maskedAccountNumber,
  bankAccountHolderName,
  verifiedAt,
}: BankDetailsFormProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    bankName: bankName ?? "",
    bankAccountNumber: "",
    bankAccountHolderName: bankAccountHolderName ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await updateBankDetails(restaurantId, form);
    setSaving(false);

    if (!result.success) {
      setError(result.error || "Failed to save bank details");
      return;
    }

    setEditing(false);
    setForm((f) => ({ ...f, bankAccountNumber: "" }));
    router.refresh();
  };

  const hasBankDetails = bankName && maskedAccountNumber;

  return (
    <div className="card card-pad">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div className="card-title">Payout Details</div>
        {hasBankDetails && !editing && (
          <span className={`badge ${verifiedAt ? "badge-green" : "badge-yellow"}`}>
            {verifiedAt ? (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <ShieldAlert className="h-3 w-3" /> Pending Verification
              </span>
            )}
          </span>
        )}
      </div>

      {!editing ? (
        <div>
          {hasBankDetails ? (
            <div className="field-grid-2">
              <div>
                <label className="field-label">Bank</label>
                <div style={{ fontSize: 13.5, color: "var(--text)" }}>{bankName}</div>
              </div>
              <div>
                <label className="field-label">Account Number</label>
                <div style={{ fontSize: 13.5, color: "var(--text)" }}>{maskedAccountNumber}</div>
              </div>
              <div>
                <label className="field-label">Account Holder Name</label>
                <div style={{ fontSize: 13.5, color: "var(--text)" }}>{bankAccountHolderName}</div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--t3)", marginBottom: 12 }}>
              No payout destination on file yet - add your bank details to receive payouts.
            </p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn btn-outline btn-sm"
            style={{ marginTop: 14 }}
          >
            {hasBankDetails ? "Update Bank Details" : "Add Bank Details"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {hasBankDetails && (
            <div className="alert alert-yellow" style={{ marginBottom: 14 }}>
              <div className="alert-body" style={{ color: "var(--yellow-txt2)" }}>
                Changing your bank details will require Platform Ops to re-verify this payout
                destination before your next payout can be processed.
              </div>
            </div>
          )}
          <div className="field-grid-2">
            <div>
              <label className="field-label">Bank Name</label>
              <input
                required
                value={form.bankName}
                onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
                disabled={saving}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Account Number</label>
              <input
                required
                inputMode="numeric"
                placeholder={maskedAccountNumber ? `Currently ${maskedAccountNumber}` : undefined}
                value={form.bankAccountNumber}
                onChange={(e) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
                disabled={saving}
                className="field-input"
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="field-label">Account Holder Name</label>
            <input
              required
              value={form.bankAccountHolderName}
              onChange={(e) => setForm((f) => ({ ...f, bankAccountHolderName: e.target.value }))}
              disabled={saving}
              className="field-input"
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: "var(--red-txt)", marginTop: 10 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? "Saving…" : "Save Bank Details"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
                setForm({
                  bankName: bankName ?? "",
                  bankAccountNumber: "",
                  bankAccountHolderName: bankAccountHolderName ?? "",
                });
              }}
              disabled={saving}
              className="btn btn-outline btn-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
