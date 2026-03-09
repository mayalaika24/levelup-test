import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const logosDirectory = path.join(process.cwd(), "public", "logos");
const schoolUploadsDirectory = path.join(process.cwd(), "public", "uploads", "school-settings");
const maxFileSizeBytes = 5 * 1024 * 1024;

function resolveFileExtension(file: File) {
  const originalExtension = path.extname(file.name).toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  if (file.type === "image/png") {
    return ".png";
  }
  if (file.type === "image/jpeg") {
    return ".jpg";
  }
  if (file.type === "image/webp") {
    return ".webp";
  }
  if (file.type === "image/svg+xml") {
    return ".svg";
  }

  return "";
}

function buildStoredFileName(prefix: "logo" | "seal", file: File) {
  const extension = resolveFileExtension(file);
  return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}${extension}`;
}

async function persistFile(file: File, prefix: "logo" | "seal", targetDirectory: string, webBasePath: string) {
  const storedFileName = buildStoredFileName(prefix, file);
  const destinationPath = path.join(targetDirectory, storedFileName);
  const arrayBuffer = await file.arrayBuffer();

  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.writeFile(destinationPath, Buffer.from(arrayBuffer));

  return `${webBasePath}/${storedFileName}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const logoInput = formData.get("logo");
    const sealInput = formData.get("seal");

    const logoFile = logoInput instanceof File && logoInput.size > 0 ? logoInput : null;
    const sealFile = sealInput instanceof File && sealInput.size > 0 ? sealInput : null;

    if (!logoFile && !sealFile) {
      return NextResponse.json({ message: "No files uploaded." }, { status: 400 });
    }

    if (logoFile && !logoFile.type.startsWith("image/")) {
      return NextResponse.json({ message: "Logo file must be an image." }, { status: 400 });
    }

    if (logoFile && logoFile.size > maxFileSizeBytes) {
      return NextResponse.json({ message: "Logo file is too large." }, { status: 400 });
    }

    if (sealFile && sealFile.size > maxFileSizeBytes) {
      return NextResponse.json({ message: "Seal file is too large." }, { status: 400 });
    }

    const result: { logoFileName?: string; sealFileName?: string } = {};

    if (logoFile) {
      result.logoFileName = await persistFile(logoFile, "logo", logosDirectory, "/logos");
    }

    if (sealFile) {
      result.sealFileName = await persistFile(
        sealFile,
        "seal",
        schoolUploadsDirectory,
        "/uploads/school-settings",
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Failed to upload school assets." }, { status: 500 });
  }
}
