import { NextResponse } from "next/server";
import { extractUniqueCourses, readStudents } from "@/lib/data";

export async function GET() {
  const students = await readStudents();
  const courses = extractUniqueCourses(students);
  return NextResponse.json({ courses });
}
