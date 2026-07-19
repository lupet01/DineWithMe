import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { dinnerRepository, userRepository } from "@dinewithme/db";
import { DinnersTable } from "./components/dinners-table";

export default async function DinnersPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Get user from database
  const dbUser = await userRepository.findByAuthProviderId(userId);
  
  if (!dbUser) {
    redirect("/dashboard");
  }

  // Fetch all dinners (in production, filter by selected restaurant)
  const dinners = await dinnerRepository.findManyWithTheme();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Dinners</h1>
          <p className="text-slate-600 mt-1">
            Manage your upcoming and past dinner events
          </p>
        </div>
        <Link
          href="/admin/dinners/new"
          className="inline-flex items-center justify-center px-4 py-2.5 text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
        >
          Create Dinner
        </Link>
      </div>

      <DinnersTable dinners={dinners} />
    </div>
  );
}
