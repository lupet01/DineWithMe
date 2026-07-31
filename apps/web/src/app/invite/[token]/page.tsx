import Link from "next/link";
import { teamInviteRepository, restaurantRepository } from "@dinewithme/db";
import { getAuthUser } from "@/lib/auth/server";
import { AcceptInviteButton } from "./components/accept-invite-button";

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-card">
        {children}
      </div>
    </div>
  );
}

export default async function AcceptInvitePage({ params }: { params: { token: string } }) {
  const invite = await teamInviteRepository.findByToken(params.token);

  if (!invite) {
    return (
      <InviteShell>
        <h1 className="text-lg font-semibold text-gray-900">Invite Not Found</h1>
        <p className="mt-2 text-sm text-gray-500">
          This invite link doesn&apos;t exist or has already been removed.
        </p>
      </InviteShell>
    );
  }

  if (invite.status === "ACCEPTED") {
    return (
      <InviteShell>
        <h1 className="text-lg font-semibold text-gray-900">Already Accepted</h1>
        <p className="mt-2 text-sm text-gray-500">This invite has already been used.</p>
        <Link href="/sign-in" className="mt-4 inline-block text-sm font-semibold text-primary-600">
          Sign in →
        </Link>
      </InviteShell>
    );
  }

  if (invite.status === "DECLINED") {
    return (
      <InviteShell>
        <h1 className="text-lg font-semibold text-gray-900">Invite Declined</h1>
        <p className="mt-2 text-sm text-gray-500">
          You declined this invite. If that was a mistake, ask whoever sent it to send a new one.
        </p>
      </InviteShell>
    );
  }

  if (invite.status === "REVOKED") {
    return (
      <InviteShell>
        <h1 className="text-lg font-semibold text-gray-900">Invite Revoked</h1>
        <p className="mt-2 text-sm text-gray-500">
          This invite is no longer valid. Ask whoever sent it to send a new one.
        </p>
      </InviteShell>
    );
  }

  if (invite.status === "EXPIRED" || invite.expiresAt < new Date()) {
    return (
      <InviteShell>
        <h1 className="text-lg font-semibold text-gray-900">Invite Expired</h1>
        <p className="mt-2 text-sm text-gray-500">
          This invite expired on{" "}
          {invite.expiresAt.toLocaleDateString("en-ZA", { month: "long", day: "numeric", year: "numeric" })}.
          Ask whoever sent it to send a new one.
        </p>
      </InviteShell>
    );
  }

  const restaurant = invite.restaurantId ? await restaurantRepository.findById(invite.restaurantId) : null;
  const roleLabel = invite.role === "OWNER" ? "Owner" : "Manager";

  const user = await getAuthUser();
  const redirectParam = encodeURIComponent(`/invite/${params.token}`);

  return (
    <InviteShell>
      <div className="text-4xl mb-2">🤝</div>
      <h1 className="text-lg font-semibold text-gray-900">You&apos;ve been invited</h1>
      <p className="mt-2 text-sm text-gray-600">
        {restaurant ? (
          <>
            You&apos;ve been invited to join <strong className="text-gray-900">{restaurant.name}</strong> as a{" "}
            <strong className="text-gray-900">{roleLabel}</strong>.
          </>
        ) : (
          "You've been invited to join the DineWithMe platform team."
        )}
      </p>
      <p className="mt-1 text-xs text-gray-400">Sent to {invite.email}</p>

      {!user ? (
        <div className="mt-6 space-y-2">
          <Link
            href={`/sign-up?redirect_url=${redirectParam}`}
            className="block w-full rounded-full bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-primary-600"
          >
            Create Account &amp; Accept
          </Link>
          <Link
            href={`/sign-in?redirect_url=${redirectParam}`}
            className="block w-full rounded-full border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50"
          >
            I already have an account
          </Link>
        </div>
      ) : user.email.toLowerCase() !== invite.email.toLowerCase() ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          This invite was sent to {invite.email}, but you&apos;re signed in as {user.email}. Sign in with
          the invited email to accept.
        </p>
      ) : (
        <AcceptInviteButton token={params.token} />
      )}
    </InviteShell>
  );
}
