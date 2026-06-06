import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "resumes";

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

  // fileName here is URL-encoded — decode it to get the real storage path
  const storagePath = decodeURIComponent(fileName);

  const { data: application } = await supabaseAdmin
    .from("Application")
    .select("resumeFileName")
    .eq("userId", session.user.id)
    .eq("resumeFilePath", storagePath)
    .single();

  if (!application) {
    return new Response("Not found", { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60, {
      download: mode !== "inline" ? (application.resumeFileName ?? true) : false,
    });

  if (error || !data) {
    return new Response("File not found", { status: 404 });
  }

  return Response.redirect(data.signedUrl);
}
