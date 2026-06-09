# Job Tracker

A personal full-stack job application tracker built with Next.js, Supabase, and NextAuth.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Auth | NextAuth v5 (Auth.js) — Google OAuth |
| Database | PostgreSQL via Supabase |
| DB Client | Supabase JS (`@supabase/supabase-js`) |
| Charts | Recharts |
| Forms | react-hook-form + Zod v4 |
| Font | Geist (`geist` package) |

## Features

- **Applications** — track job applications with status, dates, recruiter info, notes, and interview feedback
- **Resume Links** — save named external resume links (Google Drive, Notion, etc.) and attach them to applications
- **Referral Ask Template** — one-click copy of a referral message with job link and resume link auto-appended
- **Gmail Integration** *(Pro)* — auto-match recruiter emails to applications via Gmail OAuth
- **Email Tracking** *(Pro)* — view matched recruiter emails per application
- **Analytics** — status breakdown charts and application trend graphs
- **Companies** — company directory with career page links
- **Dashboard** — summary stats, recent applications, upcoming interviews

## Access Tiers

| Feature | Free | Pro |
|---|---|---|
| Applications | Unlimited | Unlimited |
| Resume links | 5 | 15 |
| Gmail integration | No | Yes |
| Email tracking | No | Yes |

To request Pro access, email **kartikhatwar98@gmail.com**.

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Protected routes (dashboard, applications, profile, etc.)
│   ├── (auth)/         # Login page
│   └── api/            # Route handlers (auth, gmail, resumes, export)
├── components/         # Shared UI (Sidebar, Header, StatusBadge, etc.)
├── features/
│   ├── applications/   # Application form, table, resume section, referral template
│   ├── gmail/          # Gmail connection card, sync, email list
│   ├── resumes/        # Resume links manager (Profile page)
│   ├── analytics/      # Charts
│   └── dashboard/      # Dashboard widgets
├── lib/                # Auth, Supabase client, utils, enums, validations
├── server/
│   ├── actions/        # Server actions (applications, resumes, gmail)
│   └── queries/        # DB queries (applications, resumes, gmail, companies, analytics)
└── types/              # TypeScript types (database, auth)
```

## Database

Full schema: [`supabase/schema.sql`](supabase/schema.sql)  
Migrations: [`supabase/migrations/`](supabase/migrations/)

### Tables

| Table | Description |
|---|---|
| `User` | Users (Google OAuth, subscription tier) |
| `Application` | Job applications (23+ fields) |
| `UserResume` | Named external resume links per user |
| `StatusHistory` | Application status change audit log |
| `GmailConnection` | Per-user Gmail OAuth tokens |
| `GmailSync` | Gmail sync run history |
| `EmailActivity` | Recruiter emails matched to applications |
| `Company` | Company directory |

## Key Architectural Notes

- **Next.js 16**: `middleware.ts` → `proxy.ts`, export `proxy` (not `default`). `params`/`searchParams` are Promises — must be awaited.
- **shadcn Base UI**: Uses Base UI primitives instead of Radix UI. No `asChild` — use `render={<Component />}` prop. `SelectValue` renders raw value strings; pass the display label explicitly as children when values are non-human-readable (e.g. UUIDs).
- **Zod v4**: Use `.issues` (not `.errors`) on `ZodError`. Use `z.input<>` for form input types, `z.infer<>` for output.
- **NextAuth v5**: Use `auth()` instead of `getServerSession()`. Session augmented in `src/types/auth.ts`.
- **Geist font**: Import from `geist/font/sans` package — NOT from `next/font/google` (Geist is not a Google Font).
- **Supabase client**: Server-side only via `supabaseAdmin` (service role key). All DB operations go through `src/lib/supabase.ts`.

## Environment Variables

```env
NEXTAUTH_SECRET=
NEXTAUTH_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Getting Started

```bash
npm install
npm run dev
```
