import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { educationalStageSchema } from "@/lib/validations/educational-stage";
import { gradePayloadSchema, gradeSchema, gradeUpdateSchema, type GradeInput } from "@/lib/validations/grade";

export const runtime = "nodejs";

const gradesFilePath = path.join(process.cwd(), "src", "data", "grades.json");
const educationalStagesFilePath = path.join(process.cwd(), "src", "data", "educational-stages.json");

async function readGradesFile() {
  const fileContent = await fs.readFile(gradesFilePath, "utf-8");
  const parsed = gradeSchema.array().safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid grades file shape.");
  }

  return parsed.data;
}

async function writeGradesFile(data: GradeInput[]) {
  await fs.writeFile(gradesFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

async function readEducationalStagesFile() {
  const fileContent = await fs.readFile(educationalStagesFilePath, "utf-8");
  const parsed = educationalStageSchema.array().safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid educational stages file shape.");
  }

  return parsed.data;
}

async function ensureEducationalStageExists(educationalStageId: string) {
  const stages = await readEducationalStagesFile();
  return stages.some((stage) => stage.id === educationalStageId);
}

function normalizedName(value: string) {
  return value.trim().toLowerCase();
}

export async function GET() {
  try {
    const data = await readGradesFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read grades file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = gradePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid grade payload." }, { status: 400 });
    }

    const stageExists = await ensureEducationalStageExists(parsed.data.educationalStageId);
    if (!stageExists) {
      return NextResponse.json({ message: "Educational stage not found." }, { status: 404 });
    }

    const current = await readGradesFile();
    const duplicateExists = current.some((item) => normalizedName(item.name) === normalizedName(parsed.data.name));
    if (duplicateExists) {
      return NextResponse.json({ message: "Duplicate grade name." }, { status: 409 });
    }

    const created: GradeInput = {
      ...parsed.data,
      id: randomUUID(),
    };

    const next = [...current, created];
    await writeGradesFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to create grade." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = gradeUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid grade payload." }, { status: 400 });
    }

    const stageExists = await ensureEducationalStageExists(parsed.data.educationalStageId);
    if (!stageExists) {
      return NextResponse.json({ message: "Educational stage not found." }, { status: 404 });
    }

    const current = await readGradesFile();
    const targetIndex = current.findIndex((item) => item.id === parsed.data.id);

    if (targetIndex === -1) {
      return NextResponse.json({ message: "Grade not found." }, { status: 404 });
    }

    const duplicateExists = current.some(
      (item) => item.id !== parsed.data.id && normalizedName(item.name) === normalizedName(parsed.data.name),
    );
    if (duplicateExists) {
      return NextResponse.json({ message: "Duplicate grade name." }, { status: 409 });
    }

    const updated: GradeInput = {
      ...current[targetIndex],
      ...parsed.data,
    };

    const next = [...current];
    next[targetIndex] = updated;
    await writeGradesFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to update grade." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ message: "Missing grade id." }, { status: 400 });
    }

    const current = await readGradesFile();
    const target = current.find((item) => item.id === id);

    if (!target) {
      return NextResponse.json({ message: "Grade not found." }, { status: 404 });
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeGradesFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Failed to delete grade." }, { status: 500 });
  }
}
