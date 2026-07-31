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
    <div className="din">
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 className="pg-title">Dinners</h1>
            <p className="pg-sub">Manage your upcoming and past dinner events</p>
          </div>
          <Link href="/admin/dinners/new" className="btn btn-primary">
            Create Dinner
          </Link>
        </div>
      </div>

      <DinnersTable dinners={dinners} />
    </div>
  );
}
