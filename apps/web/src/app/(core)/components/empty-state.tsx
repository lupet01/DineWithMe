import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center" padding="lg">
      <div className="mb-4 rounded-full bg-primary-50 p-4">
        <Icon className="h-8 w-8 text-primary-600" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mb-4 text-center text-sm text-gray-600">{description}</p>
      {action}
    </Card>
  );
}
