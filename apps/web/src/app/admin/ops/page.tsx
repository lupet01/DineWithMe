import { redirect } from "next/navigation";

export default function OpsPage() {
  // Redirect to the restaurants approval page
  redirect("/admin/ops/restaurants");
}
