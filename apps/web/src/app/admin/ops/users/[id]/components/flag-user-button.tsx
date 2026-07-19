"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setUserFlagged } from "../actions";

interface FlagUserButtonProps {
  userId: string;
  isFlagged: boolean;
}

export function FlagUserButton({ userId, isFlagged }: FlagUserButtonProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleClick = async () => {
    if (isUpdating) return;
    const confirmed = confirm(
      isFlagged ? "Remove the flag from this user?" : "Flag this user for review?"
    );
    if (!confirmed) return;

    setIsUpdating(true);
    const result = await setUserFlagged(userId, !isFlagged);
    setIsUpdating(false);

    if (!result.success) {
      alert(result.error || "Failed to update user");
      return;
    }
    router.refresh();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isUpdating}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
        isFlagged
          ? "bg-red-50 text-red-700 hover:bg-red-100"
          : "border-2 border-red-200 bg-white text-red-600 hover:bg-red-50"
      }`}
    >
      {isFlagged ? "Unflag User" : "Flag User"}
    </button>
  );
}
