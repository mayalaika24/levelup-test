import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { academicYearSchema } from "@/lib/validations/academic-year";
import {
  semesterPayloadSchema,
  semesterSchema,
  semesterUpdateSchema,
  type SemesterInput,
} from "@/lib/validations/semester";

export const runtime = "nodejs";

const semestersFilePath = path.join(process.cwd(), "src", "data", "semesters.json");
const academicYearsFilePath = path.join(process.cwd(), "src", "data", "academic-years.json");

async function readSemestersFile() {
  const fileContent = await fs.readFile(semestersFilePath, "utf-8");
  const parsed = semesterSchema.array().safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid semesters file shape.");
  }

  return parsed.data;
}

async function readAcademicYearsFile() {
  const fileContent = await fs.readFile(academicYearsFilePath, "utf-8");
  const parsed = academicYearSchema.array().safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid academic years file shape.");
  }

  return parsed.data;
}

async function writeSemestersFile(data: SemesterInput[]) {
  await fs.writeFile(semestersFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

async function ensureAcademicYearExists(academicYearId: string) {
  const years = await readAcademicYearsFile();
  return years.some((item) => item.id === academicYearId);
}

export async function GET() {
  try {
    const data = await readSemestersFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read semesters file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = semesterPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid semester payload." }, { status: 400 });
    }

    const yearExists = await ensureAcademicYearExists(parsed.data.academicYearId);
    if (!yearExists) {
      return NextResponse.json({ message: "Academic year not found." }, { status: 404 });
    }

    const current = await readSemestersFile();
    const created: SemesterInput = {
      ...parsed.data,
      id: randomUUID(),
    };

    const next = [...current, created];
    await writeSemestersFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to create semester." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = semesterUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid semester payload." }, { status: 400 });
    }

    const yearExists = await ensureAcademicYearExists(parsed.data.academicYearId);
    if (!yearExists) {
      return NextResponse.json({ message: "Academic year not found." }, { status: 404 });
    }

    const current = await readSemestersFile();
    const index = current.findIndex((item) => item.id === parsed.data.id);

    if (index === -1) {
      return NextResponse.json({ message: "Semester not found." }, { status: 404 });
    }

    const updated: SemesterInput = {
      ...current[index],
      ...parsed.data,
    };

    const next = [...current];
    next[index] = updated;
    await writeSemestersFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to update semester." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ message: "Missing semester id." }, { status: 400 });
    }

    const current = await readSemestersFile();
    const target = current.find((item) => item.id === id);

    if (!target) {
      return NextResponse.json({ message: "Semester not found." }, { status: 404 });
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeSemestersFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Failed to delete semester." }, { status: 500 });
  }
}
