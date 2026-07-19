import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import {
  userRepository,
  trustProfileRepository,
  paymentIntentRepository,
  feedbackRepository,
  seatRepository,
} from "@dinewithme/db";
import { formatAmount } from "@dinewithme/config/src/payment";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { ActivityFeed, ActivityItem } from "@/components/ui/activity-feed";
import { FlagUserButton } from "./components/flag-user-button";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await userRepository.findById(params.id);
  if (!user) {
    notFound();
  }

  const [trustProfile, paymentStats, feedbackStats, seats] = await Promise.all([
    trustProfileRepository.findByUserId(user.id),
    paymentIntentRepository.getUserPaymentStats(user.id),
    feedbackRepository.getUserFeedbackStats(user.id),
    seatRepository.findByUser(user.id),
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
    </div>
  );
}
