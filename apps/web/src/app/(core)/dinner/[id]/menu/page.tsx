import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { dinnerRepository, menuItemRepository } from "@dinewithme/db";
import { MenuCourse, type MenuItem } from "@prisma/client";

interface FullMenuPageProps {
  params: {
    id: string;
  };
}

const COURSE_LABELS: Record<MenuCourse, string> = {
  [MenuCourse.STARTER]: "Starters",
  [MenuCourse.MAIN]: "Mains",
  [MenuCourse.DESSERT]: "Desserts",
};

const COURSE_ORDER: MenuCourse[] = [
  MenuCourse.STARTER,
  MenuCourse.MAIN,
  MenuCourse.DESSERT,
];

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function FullMenuPage({ params }: FullMenuPageProps) {
  const dinner = await dinnerRepository.findByIdWithRestaurant(params.id);

  if (!dinner) {
    notFound();
  }

  const menuItems = await menuItemRepository.findAvailableByRestaurant(
    dinner.restaurant.id
  );

  const itemsByCourse = COURSE_ORDER.map((course) => ({
    course,
    label: COURSE_LABELS[course],
    items: menuItems
      .filter((item: MenuItem) => item.course === course)
      .sort((a: MenuItem, b: MenuItem) => a.position - b.position),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-cream-100 pb-16">
      <div className="mx-auto max-w-lg px-4 pt-6">
        <Link
          href={`/dinner/${params.id}`}
          className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-soft transition-colors hover:bg-gray-50"
          aria-label="Back to dinner"
        >
          <ArrowLeft className="h-4 w-4 text-gray-900" />
        </Link>

        <h1 className="text-[22px] font-bold leading-tight text-gray-900">
          Full Menu
        </h1>
        <p className="mt-1 text-sm text-gray-500">{dinner.restaurant.name}</p>

        {itemsByCourse.length === 0 ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-card">
            <p className="text-sm text-gray-500">
              This restaurant hasn&apos;t published a menu yet.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {itemsByCourse.map(({ course, label, items }) => (
              <div
                key={course}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card"
              >
                <h2 className="px-4 pt-4 pb-2 text-[17px] font-bold text-gray-900">
                  {label}
                </h2>
                <div className="divide-y divide-gray-50">
                  {items.map((item: MenuItem) => (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="flex-shrink-0 text-sm font-semibold text-gray-700">
                          {formatPrice(item.priceCents)}
                        </p>
                      </div>
                      {item.description && (
                        <p className="mt-0.5 text-xs text-gray-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
