import { BottomNav } from "./components/bottom-nav";
import { requireAuthUser } from "@/lib/auth/server";

export default async function CoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Single cached call - checks auth and redirects if needed
  await requireAuthUser();

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      {/* Main content area */}
      <main className="flex-1 pb-20">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  );
}
