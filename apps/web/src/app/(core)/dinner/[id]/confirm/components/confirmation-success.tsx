import Link from "next/link";
import { MapPin, Clock, Users, Ticket } from "lucide-react";
import type { DinnerDetail } from "@dinewithme/shared";

interface ConfirmationSuccessProps {
  dinner: DinnerDetail;
}

function InfoRow({
  icon,
  label,
  sublabel,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-t border-gray-50 px-4 py-3 first:border-0">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>
        )}
      </div>
    </div>
  );
}

export function ConfirmationSuccess({ dinner }: ConfirmationSuccessProps) {
  const startsAt = new Date(dinner.startsAt);
  const endsAt = new Date(dinner.endsAt);

  const dateStr = startsAt.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const timeStr = `${startsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })} – ${endsAt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })}`;

  const now = new Date();
  const msUntil = startsAt.getTime() - now.getTime();
  const daysUntil = Math.floor(msUntil / (1000 * 60 * 60 * 24));
  const hoursUntil = Math.floor(
    (msUntil % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const countdownStr =
    daysUntil > 0 ? `${daysUntil}d ${hoursUntil}h` : `${hoursUntil}h`;

  // Generate a simple confirmation code from the dinner id
  const confirmationCode = `DWM-${dinner.id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-cream-100 pb-12">

      {/* Success header */}
      <div className="px-4 pb-6 pt-10 text-center">
        <div className="mx-auto mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-primary-500">
          <span className="text-3xl text-white">✓</span>
        </div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-gray-900">
          You&apos;re In!
        </h1>
        <p className="mt-1.5 text-base text-gray-500">Your seat has been reserved</p>
      </div>

      <div className="mx-auto max-w-lg space-y-3 px-4">

        {/* Countdown */}
        {msUntil > 0 && (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-5 py-5 text-center">
            <p className="mb-1 text-sm text-gray-500">Time until dinner</p>
            <p className="text-[42px] font-extrabold leading-none tracking-tight text-primary-500">
              {countdownStr}
            </p>
            <p className="mt-2 text-xs text-gray-400">
              We&apos;ll send you a reminder 30 minutes before
            </p>
          </div>
        )}

        {/* Reservation Details */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
            Reservation Details
          </h2>
          <InfoRow
            icon={<MapPin className="h-5 w-5 text-primary-500" />}
            label={dinner.restaurant.name}
            sublabel={dinner.restaurant.address ?? dinner.restaurant.city ?? undefined}
          />
          <InfoRow
            icon={<Clock className="h-5 w-5 text-primary-500" />}
            label={`${dateStr}`}
            sublabel={timeStr}
          />
          <InfoRow
            icon={<Users className="h-5 w-5 text-primary-500" />}
            label={`${dinner.seats.total} people at the table`}
          />
          <InfoRow
            icon={<Ticket className="h-5 w-5 text-primary-500" />}
            label="Confirmation"
            sublabel={confirmationCode}
          />
        </div>

        {/* Icebreaker Questions */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
            Icebreaker Questions for {dinner.theme.title}
          </h2>
          {dinner.theme.conversationStarters.slice(0, 3).map((q, i) => (
            <div
              key={i}
              className="flex items-start gap-3 border-t border-gray-50 px-4 py-3 first:border-0"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-500">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed text-gray-800">{q}</p>
            </div>
          ))}
        </div>

        {/* What's Next */}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
          <h2 className="px-4 pt-4 pb-3 text-[17px] font-bold text-gray-900">
            What&apos;s Next?
          </h2>
          <div className="space-y-2 px-4 pb-4">
            {[
              "Meet your table companions at the restaurant",
              "Names will be revealed when everyone arrives",
              "Enjoy your meal and conversation!",
            ].map((step, i) => (
              <div key={i} className="flex gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{i + 1}.</span>
                {step}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="space-y-2 pt-1">
          <Link
            href="/my-dinners"
            className="block w-full rounded-full bg-primary-500 py-4 text-center text-base font-semibold text-white shadow-soft transition-colors hover:bg-primary-600 active:scale-[0.98]"
          >
            View My Reservations
          </Link>
          <Link
            href="/discover"
            className="block w-full rounded-full border-2 border-gray-200 bg-white py-4 text-center text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 active:scale-[0.98]"
          >
            Browse More Tables
          </Link>
          <Link
            href="/my-dinners"
            className="block w-full py-3 text-center text-sm font-medium text-primary-500"
          >
            Cancel Reservation
          </Link>
        </div>

      </div>
    </div>
  );
}
