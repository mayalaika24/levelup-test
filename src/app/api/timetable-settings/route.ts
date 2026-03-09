import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  timetableSettingsPayloadSchema,
  timetableSettingsSchema,
  type TimetableSessionInput,
  type TimetableSettingsInput,
} from "@/lib/validations/timetable-settings";

export const runtime = "nodejs";

const timetableSettingsFilePath = path.join(process.cwd(), "src", "data", "timetable-settings.json");

function calculateDurationMinutes(startTime: string, endTime: string) {
  if (!startTime || !endTime) {
    return 0;
  }

  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

function normalizeSession(session: TimetableSessionInput): TimetableSessionInput {
  const durationMinutes = calculateDurationMinutes(session.startTime, session.endTime);
  const breakDurationMinutes =
    session.hasBreakAfter && session.breakStartTime && session.breakEndTime
      ? calculateDurationMinutes(session.breakStartTime, session.breakEndTime)
      : 0;

  return {
    ...session,
    durationMinutes,
    breakName: session.hasBreakAfter ? session.breakName : "",
    breakStartTime: session.hasBreakAfter ? session.breakStartTime : "",
    breakEndTime: session.hasBreakAfter ? session.breakEndTime : "",
    breakDurationMinutes,
  };
}

function normalizePayload(data: TimetableSettingsInput): TimetableSettingsInput {
  return {
    numberOfSessions: data.numberOfSessions,
    sessions: data.sessions.map(normalizeSession),
  };
}

async function readTimetableSettingsFile() {
  const fileContent = await fs.readFile(timetableSettingsFilePath, "utf-8");
  const parsed = timetableSettingsSchema.safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid timetable settings file shape.");
  }

  return parsed.data;
}

export async function GET() {
  try {
    const data = await readTimetableSettingsFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read timetable settings file." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = timetableSettingsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid timetable settings payload." }, { status: 400 });
    }

    const normalized = normalizePayload(parsed.data);
    const revalidated = timetableSettingsSchema.safeParse(normalized);
    if (!revalidated.success) {
      return NextResponse.json({ message: "Invalid normalized timetable payload." }, { status: 400 });
    }

    await fs.writeFile(timetableSettingsFilePath, `${JSON.stringify(revalidated.data, null, 2)}\n`, "utf-8");
    return NextResponse.json(revalidated.data);
  } catch {
    return NextResponse.json({ message: "Failed to update timetable settings file." }, { status: 500 });
  }
}
