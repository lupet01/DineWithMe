"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50"
    >
      <LogOut className="h-5 w-5 text-red-600" />
      <span className="flex-1 text-sm font-medium text-red-600">
        Sign Out
      </span>
    </button>
  );
}
