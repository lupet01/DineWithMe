import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ArrowLeft, Calendar, Flag } from "lucide-react";
import {
  userRepository,
  trustProfileRepository,
  paymentIntentRepository,
  feedbackRepository,
  seatRepository,
  safetyReportRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ActivityFeed, ActivityItem } from "@/components/ui/activity-feed";
import { FlagUserButton } from "./components/flag-user-button";
import { RoleSelect } from "./components/role-select";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await userRepository.findById(params.id);
  if (!user) {
    notFound();
  }

  const { userId: clerkUserId } = await auth();
  const viewer = clerkUserId ? await userRepository.findByAuthProviderId(clerkUserId) : null;

  const [trustProfile, paymentStats, feedbackStats, seats, safetyReportsReceived] =
    await Promise.all([
      trustProfileRepository.findByUserId(user.id),
      paymentIntentRepository.getUserPaymentStats(user.id),
      feedbackRepository.getUserFeedbackStats(user.id),
      seatRepository.findByUser(user.id),
      safetyReportRepository.findByReportedUser(user.id),
    ]);

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const recentSeats = seats.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ops/users"
          className="p-2 hover:bg-cream-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
          <p className="text-gray-600 mt-1">{user.email}</p>
        </div>
        <Badge tone={user.role === "PLATFORM_ADMIN" || user.role === "RESTAURANT_ADMIN" ? "primary" : "neutral"}>
          {user.role}
        </Badge>
        <RoleSelect userId={user.id} currentRole={user.role} isSelf={viewer?.id === user.id} />
        <FlagUserButton userId={user.id} isFlagged={trustProfile?.flagged ?? false} />
      </div>

      <StatGrid className="md:grid-cols-4">
        <StatCard
          label="Trust Score"
          value={trustProfile ? `${Math.round(trustProfile.trustScore * 100)}%` : "—"}
        />
        <StatCard
          label="Attendance Rate"
          value={trustProfile ? `${Math.round(trustProfile.attendanceRate * 100)}%` : "—"}
        />
        <StatCard label="Total Spent" value={formatAmount(paymentStats.totalAmountPaid)} />
        <StatCard
          label="Feedback Received"
          value={feedbackStats.totalReceived}
          caption={
            feedbackStats.totalReceived > 0
              ? `${feedbackStats.positiveCount} positive`
              : undefined
          }
        />
      </StatGrid>

      <Card padding="none">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
        </div>
        <ActivityFeed isEmpty={recentSeats.length === 0} className="mt-4">
          {recentSeats.map((seat) => (
            <ActivityItem
              key={seat.id}
              icon={Calendar}
              title={`Seat ${seat.status.toLowerCase()}`}
              timestamp={new Date(seat.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            />
          ))}
        </ActivityFeed>
      </Card>

      <Card padding="none">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold text-gray-900">Safety Reports Received</h2>
        </div>
        {safetyReportsReceived.length === 0 ? (
          <p className="p-6 pt-4 text-sm text-gray-500">No safety reports naming this user.</p>
        ) : (
          <div className="mt-4 divide-y divide-gray-100">
            {safetyReportsReceived.map((report) => {
              const reporterName =
                [report.reporter.firstName, report.reporter.lastName].filter(Boolean).join(" ") ||
                report.reporter.email;
              return (
                <div key={report.id} className="flex items-start gap-3 px-6 py-4">
                  <Flag className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-gray-900">
                        Reported by{" "}
                        <Link
                          href={`/admin/ops/users/${report.reporter.id}`}
                          className="font-medium hover:text-primary-600 hover:underline"
                        >
                          {reporterName}
                        </Link>
                      </span>
                      <Badge
                        tone={
                          report.status === "PENDING"
                            ? "warning"
                            : report.status === "ACTIONED"
                              ? "danger"
                              : report.status === "REVIEWED"
                                ? "primary"
                                : "neutral"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {report.reason.replace(/_/g, " ")}
                      {report.dinner ? ` · ${report.dinner.theme?.title ?? "Dinner"}` : ""}
                    </p>
                    {report.reasonDetail && (
                      <p className="mt-1 text-sm text-gray-500">&ldquo;{report.reasonDetail}&rdquo;</p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(report.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
