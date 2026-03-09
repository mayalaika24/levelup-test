import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { NextResponse } from "next/server";
import {
  academicYearPayloadSchema,
  academicYearSchema,
  academicYearUpdateSchema,
  type AcademicYearInput,
} from "@/lib/validations/academic-year";

export const runtime = "nodejs";

const academicYearsFilePath = path.join(process.cwd(), "src", "data", "academic-years.json");
const studentsFilePath = path.join(process.cwd(), "src", "data", "students.json");

const studentSchema = z.object({
  id: z.string().trim().min(1),
  academicYearId: z.string().trim().min(1),
  isActive: z.boolean(),
});

async function readAcademicYearsFile() {
  const fileContent = await fs.readFile(academicYearsFilePath, "utf-8");
  const raw = JSON.parse(fileContent) as unknown;
  const parsed = academicYearSchema.array().safeParse(raw);

  if (!parsed.success) {
    throw new Error("Invalid academic years file shape.");
  }

  return parsed.data;
}

async function readStudentsFile() {
  const fileContent = await fs.readFile(studentsFilePath, "utf-8");
  const raw = JSON.parse(fileContent) as unknown;
  const parsed = studentSchema.array().safeParse(raw);

  if (!parsed.success) {
    throw new Error("Invalid students file shape.");
  }

  return parsed.data;
}

function withStudentLinks(academicYears: AcademicYearInput[], students: Array<z.infer<typeof studentSchema>>) {
  return academicYears.map((academicYear) => ({
    ...academicYear,
    hasActiveStudentRecord: students.some(
      (student) => student.isActive && student.academicYearId === academicYear.id,
    ),
  }));
}

async function writeAcademicYearsFile(data: AcademicYearInput[]) {
  await fs.writeFile(academicYearsFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function GET() {
  try {
    const [academicYears, students] = await Promise.all([readAcademicYearsFile(), readStudentsFile()]);
    return NextResponse.json(withStudentLinks(academicYears, students));
  } catch {
    return NextResponse.json({ message: "Failed to read academic years file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = academicYearPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid academic year payload." }, { status: 400 });
    }

    const current = await readAcademicYearsFile();
    const created: AcademicYearInput = {
      ...parsed.data,
      id: randomUUID(),
      hasActiveStudentRecord: false,
    };

    const next = created.isActive
      ? [...current.map((item) => ({ ...item, isActive: false })), created]
      : [...current, created];

    await writeAcademicYearsFile(next);
    const students = await readStudentsFile();
    return NextResponse.json(withStudentLinks(next, students));
  } catch {
    return NextResponse.json({ message: "Failed to create academic year." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = academicYearUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid academic year payload." }, { status: 400 });
    }

    const current = await readAcademicYearsFile();
    const targetIndex = current.findIndex((item) => item.id === parsed.data.id);

    if (targetIndex === -1) {
      return NextResponse.json({ message: "Academic year not found." }, { status: 404 });
    }

    const existing = current[targetIndex];
    const updated: AcademicYearInput = {
      ...existing,
      ...parsed.data,
    };

    const base = parsed.data.isActive ? current.map((item) => ({ ...item, isActive: false })) : [...current];
    base[targetIndex] = updated;

    await writeAcademicYearsFile(base);
    const students = await readStudentsFile();
    return NextResponse.json(withStudentLinks(base, students));
  } catch {
    return NextResponse.json({ message: "Failed to update academic year." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ message: "Missing academic year id." }, { status: 400 });
    }

    const [current, students] = await Promise.all([readAcademicYearsFile(), readStudentsFile()]);
    const target = current.find((item) => item.id === id);

    if (!target) {
      return NextResponse.json({ message: "Academic year not found." }, { status: 404 });
    }

    const hasActiveStudentRecord = students.some(
      (student) => student.isActive && student.academicYearId === target.id,
    );

    if (hasActiveStudentRecord) {
      return NextResponse.json(
        { message: "Cannot delete academic year linked to an active student record." },
        { status: 409 },
      );
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeAcademicYearsFile(filtered);
    return NextResponse.json(withStudentLinks(filtered, students));
  } catch {
    return NextResponse.json({ message: "Failed to delete academic year." }, { status: 500 });
  }
}
