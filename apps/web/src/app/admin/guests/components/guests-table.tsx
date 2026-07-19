"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SearchBar } from "@/components/ui/search-bar";

interface Guest {
  id: string;
  status: string;
  dietaryNotes: string | null;
  confirmedByUser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  } | null;
  dinner: {
    id: string;
    startsAt: Date | string;
    theme: { title: string } | null;
  };
}

interface GuestsTableProps {
  guests: Guest[];
}

function statusTone(status: string): "primary" | "success" | "neutral" {
  if (status === "ATTENDED" || status === "COMPLETED") return "success";
  if (status === "CONFIRMED") return "primary";
  return "neutral";
}

export function GuestsTable({ guests }: GuestsTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return guests;

    return guests.filter((guest) => {
      const name = [guest.confirmedByUser?.firstName, guest.confirmedByUser?.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const email = guest.confirmedByUser?.email.toLowerCase() ?? "";
      return name.includes(query) || email.includes(query);
    });
  }, [guests, search]);

  if (guests.length === 0) {
    return (
      <Card padding="lg" className="text-center text-gray-600">
        No bookings yet.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SearchBar
        placeholder="Search by guest name or email..."
        value={search}
        onValueChange={setSearch}
        className="sm:w-72"
      />

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream-100 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Dinner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Dietary Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No guests match your search
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => {
                  const name =
                    [guest.confirmedByUser?.firstName, guest.confirmedByUser?.lastName]
                      .filter(Boolean)
                      .join(" ") || guest.confirmedByUser?.email || "Unknown guest";

                  return (
                    <tr key={guest.id} className="hover:bg-cream-100 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{name}</div>
                        {guest.confirmedByUser && (
                          <div className="text-sm text-gray-500">
                            {guest.confirmedByUser.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/dinners/${guest.dinner.id}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          {guest.dinner.theme?.title || "Dinner"}
                        </Link>
                        <div className="text-sm text-gray-500">
                          {new Date(guest.dinner.startsAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {guest.dietaryNotes || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge tone={statusTone(guest.status)}>{guest.status}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
