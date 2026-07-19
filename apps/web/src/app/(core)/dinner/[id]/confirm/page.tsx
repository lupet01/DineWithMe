import { redirect } from "next/navigation";

interface ConfirmationPageProps {
  params: {
    id: string;
  };
  searchParams: {
    seatId?: string;
  };
}

export default function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  // Redirect to new callback page
  const seatId = searchParams.seatId || "";
  redirect(`/dinner/${params.id}/callback?seatId=${seatId}`);
}
