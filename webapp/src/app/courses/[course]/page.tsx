import { redirect } from "next/navigation";
import CourseDashboard from "@/components/CourseDashboard";
import { readStudents } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

export default async function CoursePage({
  params,
}: {
  params: { course: string };
}) {
  const session = await getSession();

  if (!session.user) {
    redirect("/login");
  }

  const courseName = decodeURIComponent(params.course);
  const students = await readStudents();

  if (session.user.role === "course") {
    const assignedCourse = session.user.course;
    if (normalise(assignedCourse) !== normalise(courseName)) {
      redirect(`/courses/${encodeURIComponent(assignedCourse)}`);
    }
  }

  const filtered = students.filter((student) => {
    if (normalise(student.desiredCourse) === normalise(courseName)) {
      return true;
    }
    return student.courses.some(
      (course) => normalise(course) === normalise(courseName),
    );
  });

  return (
    <CourseDashboard
      courseName={courseName}
      students={filtered}
      canEdit={session.user.role === "course"}
    />
  );
}
