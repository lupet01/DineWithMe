import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dinnerRepository, userRepository } from "@dinewithme/db";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsvRow(fields: string[]): string {
  return fields.map(csvEscape).join(",");
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await userRepository.findByAuthProviderId(clerkUserId);
  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isAuthorized = await dinnerRepository.isAuthorizedToManage(params.id, dbUser.id);
  if (!isAuthorized) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dinner = await dinnerRepository.findByIdWithDetails(params.id);
  if (!dinner) {
    return NextResponse.json({ error: "Dinner not found" }, { status: 404 });
  }

  const rows = [
    toCsvRow(["Name", "Email", "Status", "Dietary Notes", "Checked In At"]),
    ...dinner.seats
      .filter((seat) => ["CONFIRMED", "ATTENDED", "COMPLETED"].includes(seat.status))
      .map((seat) => {
        const guest = seat.confirmedByUser;
        const name = guest
          ? [guest.firstName, guest.lastName].filter(Boolean).join(" ") || guest.email
          : "Unknown guest";
        return toCsvRow([
          name,
          guest?.email ?? "",
          seat.status,
          seat.dietaryNotes ?? "",
          seat.checkedInAt ? new Date(seat.checkedInAt).toISOString() : "",
        ]);
      }),
  ];

  const csv = rows.join("\n");
  const filename = `dinner-${dinner.id}-guests.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
