import { redirect } from "next/navigation";
import DashboardClient from "./page.client";

export default async function DashboardPage() {
  return <DashboardClient />;
}