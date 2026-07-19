import { CreditCard } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Billing</h2>
        <p className="text-gray-600 mt-1">Platform billing and payouts</p>
      </div>

      <Card padding="lg" className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
          <CreditCard className="h-8 w-8 text-primary-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Billing is coming soon</h3>
        <p className="max-w-sm text-sm text-gray-600">
          Payout schedules, restaurant fee breakdowns, and platform revenue reporting will live
          here once billing operations are ready to launch.
        </p>
      </Card>
    </div>
  );
}
