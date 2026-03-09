import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  classroomPayloadSchema,
  classroomSchema,
  classroomUpdateSchema,
  type ClassroomInput,
} from "@/lib/validations/classroom";

export const runtime = "nodejs";

const classroomsFilePath = path.join(process.cwd(), "src", "data", "classrooms.json");

async function readClassroomsFile() {
  const fileContent = await fs.readFile(classroomsFilePath, "utf-8");
  const parsed = classroomSchema.array().safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid classrooms file shape.");
  }

  return parsed.data;
}

async function writeClassroomsFile(data: ClassroomInput[]) {
  await fs.writeFile(classroomsFilePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

export async function GET() {
  try {
    const data = await readClassroomsFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read classrooms file." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = classroomPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid classroom payload." }, { status: 400 });
    }

    const current = await readClassroomsFile();
    const created: ClassroomInput = {
      ...parsed.data,
      id: randomUUID(),
    };

    const next = [...current, created];
    await writeClassroomsFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to create classroom." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = classroomUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid classroom payload." }, { status: 400 });
    }

    const current = await readClassroomsFile();
    const targetIndex = current.findIndex((item) => item.id === parsed.data.id);
    if (targetIndex === -1) {
      return NextResponse.json({ message: "Classroom not found." }, { status: 404 });
    }

    const updated: ClassroomInput = {
      ...current[targetIndex],
      ...parsed.data,
    };

    const next = [...current];
    next[targetIndex] = updated;
    await writeClassroomsFile(next);
    return NextResponse.json(next);
  } catch {
    return NextResponse.json({ message: "Failed to update classroom." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ message: "Missing classroom id." }, { status: 400 });
    }

    const current = await readClassroomsFile();
    const target = current.find((item) => item.id === id);
    if (!target) {
      return NextResponse.json({ message: "Classroom not found." }, { status: 404 });
    }

    const filtered = current.filter((item) => item.id !== id);
    await writeClassroomsFile(filtered);
    return NextResponse.json(filtered);
  } catch {
    return NextResponse.json({ message: "Failed to delete classroom." }, { status: 500 });
  }
}
