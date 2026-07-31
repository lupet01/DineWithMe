import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/server";
import { restaurantRepository, teamInviteRepository } from "@dinewithme/db";
import { TeamManager } from "./components/team-manager";

export default async function TeamPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/sign-in");
  }

  const restaurants = await restaurantRepository.findManyForUser(user.id);
  const restaurant = restaurants[0];
  if (!restaurant) {
    redirect("/admin/restaurant");
  }

  const invites = await teamInviteRepository.findByRestaurant(restaurant.id);
  const pendingInvites = invites.filter((i) => i.status === "PENDING" && i.expiresAt > new Date());

  const isOwner = restaurant.members.some((m) => m.userId === user.id && m.role === "OWNER");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
        <p className="mt-1 text-gray-600">Who has access to manage {restaurant.name}</p>
      </div>

      <TeamManager
        restaurantId={restaurant.id}
        members={restaurant.members.map((m) => ({
          userId: m.userId,
          role: m.role,
          firstName: m.user.firstName,
          lastName: m.user.lastName,
          email: m.user.email,
        }))}
        pendingInvites={pendingInvites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
        }))}
        isOwner={isOwner}
      />
    </div>
  );
}
