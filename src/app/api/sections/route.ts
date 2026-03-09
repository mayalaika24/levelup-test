import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { NextResponse } from "next/server";
import { gradeSchema } from "@/lib/validations/grade";
import { sectionPayloadSchema, sectionSchema, sectionUpdateSchema, type SectionInput } from "@/lib/validations/section";

export const runtime = "nodejs";

const sectionsFilePath = path.join(process.cwd(), "src", "data", "sections.json");
const gradesFilePath = path.join(process.cwd(), "src", "data", "grades.json");
const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");

const userSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
});

async function readSectionsFile() {
  const content = await fs.readFile(sectionsFilePath, "utf-8");
  const parsed = sectionSchema.array().safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Invalid sections file shape.");
  }
  return parsed.data;
}

async function writeSectionsFile(data: SectionInput[]) {
  await fs.writeFile(sectionsFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

async function ensureGradeExists(gradeId: string) {
  const content = await fs.readFile(gradesFilePath, "utf-8");
  const parsed = gradeSchema.array().safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Invalid grades file shape.");
  }
  return parsed.data.some((grade) => grade.id === gradeId);
}

async function ensureUserExists(userId: string) {
  const content = await fs.readFile(usersFilePath, "utf-8");
  const parsed = userSchema.array().safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error("Invalid users file shape.");
  }
  return parsed.data.some((user) => user.id === userId);
}

export async function GET() {
  try {
    const data = await readSectionsFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read sections file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = sectionPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid section payload." }, { status: 400 });
    }

    const [gradeExists, userExists] = await Promise.all([
      ensureGradeExists(parsed.data.gradeId),
      ensureUserExists(parsed.data.supervisorUserId),
    ]);

    if (!gradeExists) {
      return NextResponse.json({ message: "Grade not found." }, { status: 404 });
    }

    if (!userExists) {
      return NextResponse.json({ message: "Supervisor not found." }, { status: 404 });
    }

    const current = await readSectionsFile();
    const created: SectionInput = {
      ...parsed.data,
      id: randomUUID(),
    };

    const next = [...current, created];
    await writeSectionsFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to create section." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = sectionUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid section payload." }, { status: 400 });
    }

    const [gradeExists, userExists] = await Promise.all([
      ensureGradeExists(parsed.data.gradeId),
      ensureUserExists(parsed.data.supervisorUserId),
    ]);

    if (!gradeExists) {
      return NextResponse.json({ message: "Grade not found." }, { status: 404 });
    }

    if (!userExists) {
      return NextResponse.json({ message: "Supervisor not found." }, { status: 404 });
    }

    const current = await readSectionsFile();
    const targetIndex = current.findIndex((item) => item.id === parsed.data.id);

    if (targetIndex === -1) {
      return NextResponse.json({ message: "Section not found." }, { status: 404 });
    }

    const updated: SectionInput = {
      ...current[targetIndex],
      ...parsed.data,
    };

    const next = [...current];
    next[targetIndex] = updated;
    await writeSectionsFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to update section." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ message: "Missing section id." }, { status: 400 });
    }

    const current = await readSectionsFile();
    const target = current.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ message: "Section not found." }, { status: 404 });
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeSectionsFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Failed to delete section." }, { status: 500 });
  }
}
