import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import {
  assertCourseLimit,
  extractUniqueCourses,
  normaliseArray,
  readStudents,
  writeStudents,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import type { Student } from "@/lib/types";

const baseSchema = z.object({
  firstName: z.string().trim().min(1, "Vorname ist erforderlich."),
  lastName: z.string().trim().min(1, "Nachname ist erforderlich."),
  gender: z.string().trim().min(1, "Geschlecht ist erforderlich."),
  birthDate: z.string().trim().min(1, "Geburtsdatum ist erforderlich."),
  school: z.string().trim().min(1, "Schule ist erforderlich."),
  desiredCourse: z.string().trim().optional().default(""),
  courses: z.array(z.string()).max(6).optional(),
  attendance: z.array(z.string()).max(6).optional(),
  av: z.string().optional(),
  sv: z.string().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session.user) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const students = await readStudents();
  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Keine Berechtigung." }, { status: 403 });
  }

  const body = await request.json();
  const parsed = baseSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Die Schülerdaten sind ungültig.",
      },
      { status: 400 },
    );
  }

  const students = await readStudents();

  const newStudent: Student = {
    id: uuid(),
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    gender: parsed.data.gender,
    birthDate: parsed.data.birthDate,
    school: parsed.data.school,
    desiredCourse: parsed.data.desiredCourse?.trim() ?? "",
    courses: normaliseArray(parsed.data.courses),
    attendance: normaliseArray(parsed.data.attendance),
    av: parsed.data.av ?? "",
    sv: parsed.data.sv ?? "",
  };

  const nextStudents = [...students, newStudent];
  assertCourseLimit(extractUniqueCourses(nextStudents));
  await writeStudents(nextStudents);

  return NextResponse.json({ student: newStudent }, { status: 201 });
}
