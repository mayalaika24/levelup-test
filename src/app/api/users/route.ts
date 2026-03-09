import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const usersFilePath = path.join(process.cwd(), "src", "data", "users.json");

const userSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.string().trim().min(1),
});

export async function GET() {
  try {
    const content = await fs.readFile(usersFilePath, "utf-8");
    const parsed = userSchema.array().safeParse(JSON.parse(content));

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid users file shape." }, { status: 500 });
    }

    return NextResponse.json(parsed.data);
  } catch {
    return NextResponse.json({ message: "Failed to read users file." }, { status: 500 });
  }
}
