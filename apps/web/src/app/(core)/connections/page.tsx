"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, Users } from "lucide-react";
import { PageHeader } from "../components/page-header";
import { EmptyState } from "../components/empty-state";
import { RowCard } from "@/components/ui/row-card";
import type { Connection } from "@/app/api/users/me/connections/route";

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users/me/connections", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setConnections(d.data.connections ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-cream-100 pb-28">
      <PageHeader
        title="Connections"
        subtitle="People you'd dine with again"
      />

      <div className="mx-auto max-w-lg px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-cream-300" />
            ))}
          </div>
        ) : connections.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No connections yet"
            description="When you and someone else both say you'd dine together again, they'll show up here."
            action={
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
              >
                Find a dinner
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {connections.map((connection) => {
              const name =
                [connection.firstName, connection.lastName].filter(Boolean).join(" ") ||
                connection.email;
              const dinnerDate = new Date(connection.dinnerDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <RowCard
                  key={connection.id}
                  href={`/dinner/${connection.dinnerId}`}
                  leading={
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                      {connection.avatarUrl ? (
                        <img
                          src={connection.avatarUrl}
                          alt={name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  }
                  title={name}
                  subtitle={
                    connection.dinnerTheme
                      ? `${connection.dinnerTheme} · ${dinnerDate}`
                      : dinnerDate
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
