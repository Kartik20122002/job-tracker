// To switch to DB-based tier checks, replace this function body with a DB lookup
// e.g. query a `users` table for a `tier` column and return `tier === "pro"`.
export async function isProUser(email: string): Promise<boolean> {
  const emails = (process.env.PRO_USERS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.includes(email.toLowerCase());
}
