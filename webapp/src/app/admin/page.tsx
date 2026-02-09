import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { readStudents } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session.user || session.user.role !== "admin") {
    redirect("/login");
  }

  const students = await readStudents();

  return <AdminDashboard initialStudents={students} />;
}
