import Link from "next/link";
import type { DinnerDetail } from "@dinewithme/shared";
import { BookedDinnerView } from "../../components/booked-dinner-view";

interface ConfirmationSuccessProps {
  dinner: DinnerDetail;
}

export function ConfirmationSuccess({ dinner }: ConfirmationSuccessProps) {
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

        <BookedDinnerView dinner={dinner} />

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
