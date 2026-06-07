import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { isProUser } from "@/lib/pro-access";

const BUCKET = "resumes";
const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!(await isProUser(session.user.email ?? ""))) {
    return Response.json({ error: "Resume upload is not enabled for your account" }, { status: 403 });
  }

  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return Response.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  if (file.size > MAX_SIZE_BYTES) {
    return Response.json({ error: "File size must be under 1 MB" }, { status: 400 });
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${session.user.id}/${Date.now()}_${sanitizedName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: "application/pdf" });

  if (error) {
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }

  return Response.json({ fileName: storagePath });
}
