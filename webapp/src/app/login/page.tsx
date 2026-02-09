import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { extractUniqueCourses, readStudents } from "@/lib/data";
import { getSession } from "@/lib/session";

export default async function LoginPage() {
  const session = await getSession();
  if (session.user) {
    if (session.user.role === "admin") {
      redirect("/admin");
    }
    if (session.user.role === "course") {
      redirect(`/courses/${encodeURIComponent(session.user.course)}`);
    }
  }

  const students = await readStudents();
  const courses = extractUniqueCourses(students);

  return <LoginForm initialCourses={courses} />;
}
