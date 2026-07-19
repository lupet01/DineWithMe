"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SafetyReportWithRelations } from "@dinewithme/db";
import { dismissReport, warnReportedUser, suspendReportedUser } from "../actions";

interface ReportCardProps {
  report: SafetyReportWithRelations;
}

const statusTone: Record<string, "warning" | "primary" | "danger" | "neutral"> = {
  PENDING: "warning",
  REVIEWED: "primary",
  ACTIONED: "danger",
  DISMISSED: "neutral",
};

function displayName(person: { firstName: string | null; lastName: string | null; email: string } | null) {
  if (!person) return null;
  return [person.firstName, person.lastName].filter(Boolean).join(" ") || person.email;
}

export function ReportCard({ report }: ReportCardProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const isPending = report.status === "PENDING" || report.status === "REVIEWED";

  const runAction = async (
    action: () => Promise<{ success: boolean; error?: string }>
  ) => {
    if (isUpdating) return;
    setIsUpdating(true);
    const result = await action();
    setIsUpdating(false);
    if (!result.success) {
      alert(result.error || "Action failed");
      return;
    }
    router.refresh();
  };

  const handleDismiss = () => {
    if (!confirm("Dismiss this report with no action?")) return;
    runAction(() => dismissReport(report.id));
  };

  const handleWarn = () => {
    const resolution = prompt("Warning note (visible in the audit trail):", "Warned for reported behavior");
    if (resolution === null) return;
    runAction(() => warnReportedUser(report.id, resolution));
  };

  const handleSuspend = () => {
    if (!report.reportedUserId) return;
    const resolution = prompt(
      "Suspension note (visible in the audit trail):",
      "Suspended following safety report"
    );
    if (resolution === null) return;
    if (!confirm(`Suspend ${displayName(report.reportedUser) || "this user"}? This is a serious action.`)) return;
    runAction(() => suspendReportedUser(report.id, resolution));
  };

  const reporterName = displayName(report.reporter);
  const reportedName = displayName(report.reportedUser);

  return (
    <Card padding="md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone[report.status] ?? "neutral"}>{report.status}</Badge>
            <span className="text-xs font-medium text-gray-500">{report.reason.replace(/_/g, " ")}</span>
          </div>
          <p className="text-sm text-gray-900">
            Reported by{" "}
            <Link href={`/admin/ops/users/${report.reporterId}`} className="font-semibold hover:underline">
              {reporterName}
            </Link>
            {reportedName && report.reportedUserId && (
              <>
                {" "}
                about{" "}
                <Link href={`/admin/ops/users/${report.reportedUserId}`} className="font-semibold hover:underline">
                  {reportedName}
                </Link>
              </>
            )}
          </p>
          {report.dinner && (
            <p className="text-xs text-gray-500">
              {report.dinner.theme?.title || "Dinner"} · {report.dinner.restaurant.name} ·{" "}
              {new Date(report.dinner.startsAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {report.reasonDetail && (
            <p className="mt-2 rounded-lg bg-cream-200 px-3 py-2 text-sm text-gray-700">
              &ldquo;{report.reasonDetail}&rdquo;
            </p>
          )}
          {report.resolution && (
            <p className="mt-2 text-xs text-gray-500">
              Resolution: {report.resolution}
              {report.reviewedBy && ` — ${displayName(report.reviewedBy)}`}
            </p>
          )}
        </div>

        {isPending && (
          <div className="flex flex-shrink-0 flex-col gap-2">
            <button
              onClick={handleDismiss}
              disabled={isUpdating}
              className="rounded-full border-2 border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Dismiss
            </button>
            <button
              onClick={handleWarn}
              disabled={isUpdating}
              className="rounded-full border-2 border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50"
            >
              Warn
            </button>
            {report.reportedUserId && (
              <button
                onClick={handleSuspend}
                disabled={isUpdating}
                className="rounded-full border-2 border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                Suspend
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
