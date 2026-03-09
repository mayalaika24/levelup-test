import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  basicSchoolSettingsSchema,
  contactAndSocialSchoolSettingsSchema,
  persistedSchoolSettingsSchema,
  schoolSettingsSchema,
  type PersistedSchoolSettingsInput,
} from "@/lib/validations/school-settings";

export const runtime = "nodejs";

const schoolSettingsFilePath = path.join(process.cwd(), "src", "data", "school-settings.json");

async function readSchoolSettingsFile() {
  const fileContent = await fs.readFile(schoolSettingsFilePath, "utf-8");
  const parsed = persistedSchoolSettingsSchema.safeParse(JSON.parse(fileContent));

  if (!parsed.success) {
    throw new Error("Invalid school settings file shape.");
  }

  return parsed.data;
}

export async function GET() {
  try {
    const data = await readSchoolSettingsFile();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ message: "Failed to read school settings file." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as PersistedSchoolSettingsInput;
    const parsed = schoolSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid school settings payload." }, { status: 400 });
    }

    const payloadToPersist: PersistedSchoolSettingsInput = {
      ...parsed.data,
      logoFileName: typeof body.logoFileName === "string" ? body.logoFileName : "",
      sealFileName: typeof body.sealFileName === "string" ? body.sealFileName : "",
    };

    await fs.writeFile(schoolSettingsFilePath, `${JSON.stringify(payloadToPersist, null, 2)}\n`, "utf-8");
    return NextResponse.json(payloadToPersist);
  } catch {
    return NextResponse.json({ message: "Failed to update school settings file." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      section?: "basic" | "contactSocial";
      data?: unknown;
    };
    const section = body.section;
    const current = await readSchoolSettingsFile();

    if (section === "basic") {
      const basicPayload = basicSchoolSettingsSchema
        .extend({
          logoFileName: persistedSchoolSettingsSchema.shape.logoFileName,
          sealFileName: persistedSchoolSettingsSchema.shape.sealFileName,
        })
        .safeParse(body.data);

      if (!basicPayload.success) {
        return NextResponse.json({ message: "Invalid basic settings payload." }, { status: 400 });
      }

      const merged: PersistedSchoolSettingsInput = {
        ...current,
        ...basicPayload.data,
      };

      await fs.writeFile(schoolSettingsFilePath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
      return NextResponse.json(merged);
    }

    if (section === "contactSocial") {
      const contactSocialPayload = contactAndSocialSchoolSettingsSchema.safeParse(body.data);

      if (!contactSocialPayload.success) {
        return NextResponse.json({ message: "Invalid contact and social settings payload." }, { status: 400 });
      }

      const merged: PersistedSchoolSettingsInput = {
        ...current,
        ...contactSocialPayload.data,
      };

      await fs.writeFile(schoolSettingsFilePath, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
      return NextResponse.json(merged);
    }

    return NextResponse.json({ message: "Invalid section." }, { status: 400 });
  } catch {
    return NextResponse.json({ message: "Failed to patch school settings file." }, { status: 500 });
  }
}
