import { ReactNode } from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: LucideIcon;
  title: ReactNode;
  timestamp: string;
  href?: string;
}

export function ActivityItem({ icon: Icon, title, timestamp, href }: ActivityItemProps) {
  const content = (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
        <Icon className="h-4 w-4 text-primary-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-gray-900">{title}</div>
        <div className="mt-0.5 text-xs text-gray-500">{timestamp}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block transition-colors hover:bg-cream-100">
        {content}
      </Link>
    );
  }

  return content;
}

interface ActivityFeedProps {
  children: ReactNode;
  emptyLabel?: string;
  isEmpty?: boolean;
  className?: string;
}

export function ActivityFeed({
  children,
  emptyLabel = "No recent activity",
  isEmpty = false,
  className,
}: ActivityFeedProps) {
  if (isEmpty) {
    return (
      <div className={cn("py-12 text-center text-sm text-gray-500", className)}>
        {emptyLabel}
      </div>
    );
  }

  return <div className={cn("divide-y divide-gray-100", className)}>{children}</div>;
}
