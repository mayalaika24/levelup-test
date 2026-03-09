import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  educationalStagePayloadSchema,
  educationalStageSchema,
  educationalStageUpdateSchema,
  type EducationalStageInput,
} from "@/lib/validations/educational-stage";

export const runtime = "nodejs";

const educationalStagesFilePath = path.join(process.cwd(), "src", "data", "educational-stages.json");

async function readEducationalStagesFile() {
  const fileContent = await fs.readFile(educationalStagesFilePath, "utf-8");
  const parsed = educationalStageSchema.array().safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid educational stages file shape.");
  }

  return parsed.data;
}

async function writeEducationalStagesFile(data: EducationalStageInput[]) {
  await fs.writeFile(educationalStagesFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function GET() {
  try {
    const data = await readEducationalStagesFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read educational stages file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = educationalStagePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid educational stage payload." }, { status: 400 });
    }

    const current = await readEducationalStagesFile();
    const created: EducationalStageInput = {
      ...parsed.data,
      id: randomUUID(),
    };

    const next = [...current, created];
    await writeEducationalStagesFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to create educational stage." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = educationalStageUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid educational stage payload." }, { status: 400 });
    }

    const current = await readEducationalStagesFile();
    const targetIndex = current.findIndex((item) => item.id === parsed.data.id);

    if (targetIndex === -1) {
      return NextResponse.json({ message: "Educational stage not found." }, { status: 404 });
    }

    const updated: EducationalStageInput = {
      ...current[targetIndex],
      ...parsed.data,
    };

    const next = [...current];
    next[targetIndex] = updated;
    await writeEducationalStagesFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to update educational stage." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ message: "Missing educational stage id." }, { status: 400 });
    }

    const current = await readEducationalStagesFile();
    const target = current.find((item) => item.id === id);

    if (!target) {
      return NextResponse.json({ message: "Educational stage not found." }, { status: 404 });
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeEducationalStagesFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Failed to delete educational stage." }, { status: 500 });
  }
}
