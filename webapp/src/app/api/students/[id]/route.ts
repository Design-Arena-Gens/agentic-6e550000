import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  assertCourseLimit,
  extractUniqueCourses,
  normaliseArray,
  readStudents,
  writeStudents,
} from "@/lib/data";
import { getSession } from "@/lib/session";

const adminUpdateSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  gender: z.string().trim().min(1),
  birthDate: z.string().trim().min(1),
  school: z.string().trim().min(1),
  desiredCourse: z.string().trim().optional().default(""),
  courses: z.array(z.string()).max(6).optional(),
  attendance: z.array(z.string()).max(6).optional(),
  av: z.string().optional(),
  sv: z.string().optional(),
});

const courseUpdateSchema = z.object({
  attendance: z.array(z.string()).max(6).optional(),
  av: z.string().optional(),
  sv: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const students = await readStudents();
  const index = students.findIndex((student) => student.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "Schüler nicht gefunden." }, { status: 404 });
  }

  const target = students[index];
  const body = await request.json();

  if (session.user.role === "admin") {
    const parsed = adminUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ungültige Daten." },
        { status: 400 },
      );
    }

    const updated = {
      ...target,
      ...parsed.data,
      desiredCourse: parsed.data.desiredCourse ?? "",
      courses: normaliseArray(parsed.data.courses),
      attendance: normaliseArray(parsed.data.attendance),
      av: parsed.data.av ?? "",
      sv: parsed.data.sv ?? "",
    };

    const nextStudents = [...students];
    nextStudents[index] = updated;
    assertCourseLimit(extractUniqueCourses(nextStudents));
    await writeStudents(nextStudents);

    return NextResponse.json({ student: updated });
  }

  if (session.user.role === "course") {
    const parsed = courseUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ungültige Daten." },
        { status: 400 },
      );
    }

    const courseName = session.user.course;
    const participates =
      target.courses.some((course) => course === courseName) ||
      target.desiredCourse === courseName;

    if (!participates) {
      return NextResponse.json(
        { error: "Keine Berechtigung für diesen Kurs." },
        { status: 403 },
      );
    }

    const updated = {
      ...target,
      attendance: parsed.data.attendance
        ? normaliseArray(parsed.data.attendance)
        : target.attendance,
      av: parsed.data.av ?? target.av,
      sv: parsed.data.sv ?? target.sv,
    };

    const nextStudents = [...students];
    nextStudents[index] = updated;
    await writeStudents(nextStudents);

    return NextResponse.json({ student: updated });
  }

  return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const session = await getSession();
  if (!session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const students = await readStudents();
  const nextStudents = students.filter((student) => student.id !== id);

  if (nextStudents.length === students.length) {
    return NextResponse.json(
      { error: "Schüler nicht gefunden." },
      { status: 404 },
    );
  }

  await writeStudents(nextStudents);
  return NextResponse.json({ ok: true });
}
