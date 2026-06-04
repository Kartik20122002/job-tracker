import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { fileName } = await params;
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  const application = await prisma.application.findFirst({
    where: { userId: session.user.id, resumeFilePath: fileName },
  });

  if (!application) {
    return new Response("Not found", { status: 404 });
  }

  const uploadDir = process.env.UPLOAD_DIR ?? "/app/uploads";
  const filePath = path.join(uploadDir, fileName);

  const resolvedPath = path.resolve(filePath);
  const resolvedUploadDir = path.resolve(uploadDir);
  if (!resolvedPath.startsWith(resolvedUploadDir)) {
    return new Response("Forbidden", { status: 403 });
  }

  let fileData: Buffer;
  try {
    fileData = await readFile(filePath);
  } catch {
    return new Response("File not found", { status: 404 });
  }

  const disposition =
    mode === "inline"
      ? `inline; filename="${fileName}"`
      : `attachment; filename="${application.resumeFileName ?? fileName}"`;

  return new Response(new Uint8Array(fileData), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Content-Length": fileData.length.toString(),
    },
  });
}
