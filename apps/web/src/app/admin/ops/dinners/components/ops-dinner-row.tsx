import Link from "next/link";
import type { DinnerWithRestaurant } from "@dinewithme/db";
import { Badge } from "@/components/ui/badge";

interface OpsDinnerRowProps {
  dinner: DinnerWithRestaurant;
}

function getStatusTone(status: string): "info" | "success" | "danger" | "neutral" {
  switch (status) {
    case "SCHEDULED":
      return "info";
    case "LIVE":
      return "success";
    case "CANCELLED":
      return "danger";
    case "COMPLETED":
    default:
      return "neutral";
  }
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OpsDinnerRow({ dinner }: OpsDinnerRowProps) {
  return (
    <tr className="hover:bg-cream-100 transition-colors">
      <td className="px-6 py-4">
        <Link
          href={`/admin/ops/restaurants/${dinner.restaurant.id}`}
          className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline"
        >
          {dinner.restaurant.name}
        </Link>
      </td>
      <td className="px-6 py-4 text-sm text-gray-700">{dinner.theme?.title ?? "No theme"}</td>
      <td className="px-6 py-4 text-sm text-gray-700">{formatDateTime(dinner.startsAt)}</td>
      <td className="px-6 py-4 text-sm text-gray-700">{dinner.seatCount}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <Badge tone={getStatusTone(dinner.status)}>{dinner.status}</Badge>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <Link
          href={`/admin/dinners/${dinner.id}`}
          className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-cream-200 rounded-lg hover:bg-cream-300 transition-colors"
        >
          View
        </Link>
      </td>
    </tr>
  );
}
