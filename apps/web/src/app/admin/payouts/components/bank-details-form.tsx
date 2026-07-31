"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <Card padding="lg" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Payout Destination</h2>
        {hasBankDetails && !editing && (
          <Badge tone={verifiedAt ? "success" : "primary"}>
            {verifiedAt ? (
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Pending Verification
              </span>
            )}
          </Badge>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          {hasBankDetails ? (
            <div className="rounded-lg border border-gray-100 bg-cream-100 p-4 text-sm">
              <p className="font-semibold text-gray-900">{bankAccountHolderName}</p>
              <p className="text-gray-600">
                {bankName} · {maskedAccountNumber}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No payout destination on file yet - add your bank details to receive payouts.
            </p>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            {hasBankDetails ? "Change Bank Details" : "Add Bank Details"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {hasBankDetails && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Changing your bank details will require Platform Ops to re-verify this payout
              destination before your next payout can be processed.
            </p>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Bank Name</label>
            <input
              required
              value={form.bankName}
              onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Account Number</label>
            <input
              required
              inputMode="numeric"
              placeholder={maskedAccountNumber ? `Currently ${maskedAccountNumber}` : undefined}
              value={form.bankAccountNumber}
              onChange={(e) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Account Holder Name</label>
            <input
              required
              value={form.bankAccountHolderName}
              onChange={(e) => setForm((f) => ({ ...f, bankAccountHolderName: e.target.value }))}
              disabled={saving}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary-500 focus:outline-none disabled:opacity-60"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:bg-primary-200"
            >
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
