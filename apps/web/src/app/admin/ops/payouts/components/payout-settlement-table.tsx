"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { PayoutWithDinnerAndRestaurant } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { processSelectedPayouts } from "../actions";

interface PayoutSettlementTableProps {
  payouts: PayoutWithDinnerAndRestaurant[];
}

const filterTabs = [
  { value: "READY", label: "Ready to Pay" },
  { value: "HELD", label: "Held" },
  { value: "PAID", label: "Paid" },
  { value: "ALL", label: "All" },
];

function formatCurrency(cents: number): string {
  return `R${(cents / 100).toFixed(2)}`;
}

const STATUS_TONE: Record<string, "primary" | "success" | "neutral"> = {
  HELD: "neutral",
  READY: "primary",
  PAID: "success",
};

export function PayoutSettlementTable({ payouts }: PayoutSettlementTableProps) {
  const router = useRouter();
  const [filter, setFilter] = useState("READY");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPayouts = useMemo(
    () => (filter === "ALL" ? payouts : payouts.filter((p) => p.status === filter)),
    [payouts, filter]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    const readyIds = filteredPayouts.filter((p) => p.status === "READY").map((p) => p.id);
    setSelectedIds((prev) => (prev.length === readyIds.length ? [] : readyIds));
  };

  const handleProcess = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Process ${selectedIds.length} selected payout(s)? This marks them as paid.`)) return;

    setError(null);
    setProcessing(true);
    const result = await processSelectedPayouts(selectedIds);
    setProcessing(false);

    if (!result.success) {
      setError(result.error || "Failed to process payouts");
      return;
    }

    setSelectedIds([]);
    router.refresh();
  };

  if (payouts.length === 0) {
    return (
      <Card>
        <div className="p-12 text-center">
          <div className="text-6xl mb-4">💸</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No payouts yet</h3>
          <p className="text-gray-600">Payouts appear here once dinners start completing</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs items={filterTabs} value={filter} onChange={setFilter} />
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={handleProcess}
            disabled={processing}
            className="rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 disabled:opacity-50"
          >
            {processing ? "Processing…" : `Process Selected Payouts (${selectedIds.length})`}
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-gray-100">
              <tr>
                <th className="w-10 px-6 py-3">
                  {filteredPayouts.some((p) => p.status === "READY") && (
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length === filteredPayouts.filter((p) => p.status === "READY").length
                      }
                      onChange={toggleSelectAll}
                      aria-label="Select all ready payouts"
                      className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                  )}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Dinner
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Net
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No payouts for this filter
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((payout) => (
                  <tr key={payout.id}>
                    <td className="px-6 py-4">
                      {payout.status === "READY" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(payout.id)}
                          onChange={() => toggleSelect(payout.id)}
                          aria-label={`Select payout for ${payout.restaurant.name}`}
                          className="h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {payout.restaurant.name}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{payout.dinner.theme?.title || "Dinner"}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payout.dinner.startsAt).toLocaleDateString("en-ZA", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                      {formatCurrency(payout.netAmountCents)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={STATUS_TONE[payout.status] || "neutral"}>{payout.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/ops/payouts/${payout.id}`}
                        className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
