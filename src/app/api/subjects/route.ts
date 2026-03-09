import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { NextResponse } from "next/server";
import { gradeSchema } from "@/lib/validations/grade";
import { subjectPayloadSchema, subjectSchema, subjectUpdateSchema, type SubjectInput } from "@/lib/validations/subject";

export const runtime = "nodejs";

const subjectsFilePath = path.join(process.cwd(), "src", "data", "subjects.json");
const gradesFilePath = path.join(process.cwd(), "src", "data", "grades.json");
const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");

const userSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
});

async function readSubjectsFile() {
  const content = await fs.readFile(subjectsFilePath, "utf-8");
  const parsed = subjectSchema.array().safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Invalid subjects file shape.");
  }
  return parsed.data;
}

async function writeSubjectsFile(data: SubjectInput[]) {
  await fs.writeFile(subjectsFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

async function readGradeIds() {
  const content = await fs.readFile(gradesFilePath, "utf-8");
  const parsed = gradeSchema.array().safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Invalid grades file shape.");
  }
  return new Set(parsed.data.map((item) => item.id));
}

async function readUserIds() {
  const content = await fs.readFile(usersFilePath, "utf-8");
  const parsed = userSchema.array().safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Invalid users file shape.");
  }
  return new Set(parsed.data.map((item) => item.id));
}

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

async function validateRelations(gradeIds: string[], teacherIds: string[]) {
  const [validGradeIds, validUserIds] = await Promise.all([readGradeIds(), readUserIds()]);
  const invalidGrade = gradeIds.find((id) => !validGradeIds.has(id));
  if (invalidGrade) {
    return { ok: false as const, message: "Grade not found." };
  }
  const invalidTeacher = teacherIds.find((id) => !validUserIds.has(id));
  if (invalidTeacher) {
    return { ok: false as const, message: "Teacher not found." };
  }
  return { ok: true as const };
}

export async function GET() {
  try {
    const data = await readSubjectsFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read subjects file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = subjectPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid subject payload." }, { status: 400 });
    }

    const relationValidation = await validateRelations(
      parsed.data.gradeConfigs.map((item) => item.gradeId),
      parsed.data.teacherIds,
    );
    if (!relationValidation.ok) {
      return NextResponse.json({ message: relationValidation.message }, { status: 404 });
    }

    const current = await readSubjectsFile();
    const duplicateName = current.some((item) => normalizedName(item.name) === normalizedName(parsed.data.name));
    if (duplicateName) {
      return NextResponse.json({ message: "Duplicate subject name." }, { status: 409 });
    }

    const created: SubjectInput = {
      ...parsed.data,
      id: randomUUID(),
    };

    const next = [...current, created];
    await writeSubjectsFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to create subject." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = subjectUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid subject payload." }, { status: 400 });
    }

    const relationValidation = await validateRelations(
      parsed.data.gradeConfigs.map((item) => item.gradeId),
      parsed.data.teacherIds,
    );
    if (!relationValidation.ok) {
      return NextResponse.json({ message: relationValidation.message }, { status: 404 });
    }

    const current = await readSubjectsFile();
    const targetIndex = current.findIndex((item) => item.id === parsed.data.id);
    if (targetIndex === -1) {
      return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const duplicateName = current.some(
      (item) => item.id !== parsed.data.id && normalizedName(item.name) === normalizedName(parsed.data.name),
    );
    if (duplicateName) {
      return NextResponse.json({ message: "Duplicate subject name." }, { status: 409 });
    }

    const updated: SubjectInput = {
      ...current[targetIndex],
      ...parsed.data,
    };

    const next = [...current];
    next[targetIndex] = updated;
    await writeSubjectsFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to update subject." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ message: "Missing subject id." }, { status: 400 });
    }

    const current = await readSubjectsFile();
    const target = current.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ message: "Subject not found." }, { status: 404 });
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeSubjectsFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Failed to delete subject." }, { status: 500 });
  }
}
