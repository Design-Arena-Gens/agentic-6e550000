import { NextResponse } from "next/server";
import { z } from "zod";
import { extractUniqueCourses, readStudents } from "@/lib/data";
import { ADMIN_PASSWORD, COURSE_PASSWORD, getSession } from "@/lib/session";

const loginSchema = z.object({
  role: z.enum(["admin", "course"]),
  password: z.string().optional(),
  course: z.string().optional(),
});

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Login-Daten." },
      { status: 400 },
    );
  }

  const { role, password, course } = parsed.data;
  const session = await getSession();

  if (role === "admin") {
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Falsches Passwort für Administratoren." },
        { status: 401 },
      );
    }

    session.user = { role: "admin" };
    await session.save();

    return NextResponse.json({ redirect: "/admin" });
  }

  const selectedCourse = (course ?? "").trim();
  if (!selectedCourse) {
    return NextResponse.json(
      { error: "Bitte einen Kurs auswählen." },
      { status: 400 },
    );
  }

  if (password && password !== COURSE_PASSWORD) {
    return NextResponse.json(
      { error: "Falsches Passwort für Kursleitungen." },
      { status: 401 },
    );
  }

  const students = await readStudents();
  const availableCourses = extractUniqueCourses(students);

  if (
    availableCourses.length > 0 &&
    !availableCourses.includes(selectedCourse)
  ) {
    return NextResponse.json(
      { error: "Dieser Kurs ist noch nicht angelegt." },
      { status: 404 },
    );
  }

  session.user = { role: "course", course: selectedCourse };
  await session.save();

  return NextResponse.json({
    redirect: `/courses/${encodeURIComponent(selectedCourse)}`,
  });
}
