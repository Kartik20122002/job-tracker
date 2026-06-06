import { unparse } from "papaparse";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: applications } = await supabaseAdmin
    .from("Application")
    .select("*")
    .eq("userId", session.user.id)
    .order("appliedDate", { ascending: false });

  const rows = (applications ?? []).map((app) => ({
    Company: app.company,
    Position: app.position,
    Country: app.country,
    Location: app.location ?? "",
    Status: app.status,
    "Applied Date": formatDate(app.appliedDate),
    "Next Interview": formatDate(app.nextInterviewDate),
    "Offer Date": formatDate(app.offerDate),
    Source: app.source,
    "Application Type": app.applicationType,
    "Visa Sponsorship": app.visaSponsorship ? "Yes" : "No",
    "Relocation Required": app.relocation ? "Yes" : "No",
    "Target Salary": app.targetSalary ?? "",
    Currency: app.currency,
    "Recruiter Name": app.recruiterName ?? "",
    "Recruiter Email": app.recruiterEmail ?? "",
    "Job Link": app.jobLink ?? "",
  }));

  const csv = unparse(rows);
  const timestamp = new Date().toISOString().split("T")[0];

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="applications_${timestamp}.csv"`,
    },
  });
}
