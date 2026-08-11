import type { DinnerWithRestaurant } from "@dinewithme/db";
import { Card } from "@/components/ui/card";
import { OpsDinnerRow } from "./ops-dinner-row";

interface OpsDinnersTableProps {
  /** Already server-paginated, filtered, and searched by the page. */
  dinners: DinnerWithRestaurant[];
}

export function OpsDinnersTable({ dinners }: OpsDinnersTableProps) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-cream-100 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Restaurant
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Theme
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Date / Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Seats
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dinners.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No dinners found for this filter
                </td>
              </tr>
            ) : (
              dinners.map((dinner) => <OpsDinnerRow key={dinner.id} dinner={dinner} />)
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
