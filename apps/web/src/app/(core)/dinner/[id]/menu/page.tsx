import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { dinnerRepository, mealRepository } from "@dinewithme/db";
import { MenuCourse } from "@prisma/client";

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
  return `R${(cents / 100).toFixed(2)}`;
}

export default async function FullMenuPage({ params }: FullMenuPageProps) {
  const dinner = await dinnerRepository.findByIdWithRestaurant(params.id);

  if (!dinner) {
    notFound();
  }

  const meal = dinner.mealId ? await mealRepository.findByIdWithCourses(dinner.mealId) : null;

  const itemsByCourse = COURSE_ORDER.map((course) => ({
    course,
    label: COURSE_LABELS[course],
    items:
      meal?.courses
        .find((c) => c.courseType === course)
        ?.options.filter((option) => option.menuItem.isAvailable)
        .map((option) => option.menuItem) ?? [],
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
              This restaurant hasn&apos;t published a menu for this dinner yet.
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
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/dinner/${params.id}/menu/${item.id}`}
                      className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-cream-100"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <p className="text-sm font-semibold text-gray-700">
                          {formatPrice(item.priceCents)}
                        </p>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                      </div>
                    </Link>
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
