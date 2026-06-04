import { writeFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  const maxSize = parseInt(process.env.MAX_FILE_SIZE_MB ?? "10") * 1024 * 1024;
  if (file.size > maxSize) {
    return Response.json(
      { error: `File size must be under ${process.env.MAX_FILE_SIZE_MB ?? 10}MB` },
      { status: 400 }
    );
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "/app/uploads";
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${session.user.id}_${Date.now()}_${sanitizedName}`;
  const filePath = path.join(uploadDir, fileName);

  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    return Response.json({ error: "Invalid file path" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  return Response.json({ fileName });
}
