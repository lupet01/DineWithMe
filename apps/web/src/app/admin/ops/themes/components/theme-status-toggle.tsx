"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { toggleThemeActive } from "../actions";

interface ThemeStatusToggleProps {
  themeId: string;
  isActive: boolean;
}

export function ThemeStatusToggle({ themeId, isActive }: ThemeStatusToggleProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    const result = await toggleThemeActive(themeId, !isActive);
    setIsUpdating(false);
    if (!result.success) {
      alert(result.error || "Failed to update theme");
      return;
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isUpdating}
      className="disabled:opacity-50"
    >
      <Badge tone={isActive ? "success" : "neutral"}>
        {isActive ? "Active" : "Inactive"}
      </Badge>
    </button>
  );
}
