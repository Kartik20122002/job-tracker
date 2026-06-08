# Job Tracker

A full-stack job application tracking system built with Next.js, Supabase, and Gmail integration. Designed for active job seekers who want a single source of truth across all their applications, recruiter communications, interview pipeline, and company research.

## Features

### Application Management

- Track applications with 15 granular statuses — from `Started` and `Referral Asked` through `OA`, `Technical Rounds 1–3`, `Managerial Round`, `HR Round`, `Offer Received`, to `Accepted` / `Rejected` / `Withdrawn`
- Full status timeline with timestamped history on every application
- Store recruiter details: name, email, LinkedIn
- Job metadata: source (LinkedIn, Naukri, Indeed, Company Website, Referral, Glassdoor, Other), type (Remote / Hybrid / Onsite), country, location, job link
- Salary target with currency (INR, USD, EUR, GBP), visa sponsorship, relocation, and referral flags
- Notes and interview feedback per application
- Filter by status, source, country; active-only toggle; debounced search; sort by date or company
- CSV export of all applications
- Duplicate application shortcut

### Resume Management _(Pro)_

- Upload a PDF resume (max 1 MB) per application
- Stored in Supabase Storage, served securely via a signed API route
- Inline preview and download from the application detail page

### Company Directory

- Global shared directory of companies, visible to all authenticated users
- Columns: Company Name, Company Type (Product Based / Service Based / Other), Tags, Career Page, Find Connections
- Search by company name
- Career page opens in a new tab; Find Connections links to a LinkedIn people search for that company (no network filter — useful for exploring and building connections before applying)
- FREE users can browse the first page of results; page 2+ requires Pro with an upgrade prompt
- Pro users can add, edit, and delete companies via inline dialogs with confirmation on delete
- Company names are unique across the directory

### Gmail Integration _(Pro)_

- OAuth 2.0 with `gmail.readonly` scope — read-only, no write, no send, no delete
- Access and refresh tokens stored server-side only, never exposed to the frontend
- Deterministic email matching engine using O(1) lookup maps across all applications:
  - Exact recruiter email match (score 100)
  - Sender domain match (score 80)
  - Company name in subject (score 70)
  - Company name in snippet (score 60)
  - Position title in subject (score 50)
- Optimised sync strategy: recruiter email batch queries + one broad keyword query, scales to 200+ applications without hitting Gmail's per-user rate limit
- List queries run in parallel batches of 50; `messages.get` calls in batches of 10
- DB deduplication before any `messages.get` call — repeat syncs are near-instant
- 30-minute sync cooldown to prevent quota abuse
- Per-application "Fetch latest" for on-demand recruiter email lookup

### Analytics & Dashboard

- Dashboard with summary stats: Total, Active, Rejected, Offers
- Status breakdown chart across all applications
- Recent active applications and upcoming interviews widgets
- Recruiter Updates widget showing latest matched emails (Pro)
- Dedicated Email Tracking page with the last 50 matched recruiter emails across all applications (Pro)

### Auth

- Google OAuth only — sign in with your Google account, no passwords
- JWT session strategy via NextAuth v5
- Subscription tier (`free` / `pro`) stored in the database, read once at sign-in and cached in the JWT token for the session lifetime

### Subscription Tiers

Access is controlled via the `subscription` column on the `User` table (`free` or `pro`). To upgrade a user, update their row directly in Supabase and have them sign out and back in.

| Feature | FREE | PRO |
|---|---|---|
| Application tracking | All | All |
| Company directory (page 1) | Yes | Yes |
| Company directory (all pages) | — | Yes |
| Add / Edit / Delete companies | — | Yes |
| Resume upload | — | Yes |
| Gmail integration | — | Yes |
| Email tracking | — | Yes |
| Analytics | Yes | Yes |
| CSV export | Yes | Yes |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL 17) |
| Auth | NextAuth v5 (JWT, Google OAuth) |
| UI Components | Base UI + shadcn/ui + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Email | Gmail API v1 (native fetch, no SDK) |
| Storage | Supabase Storage (resumes) |

## Local Development

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd job-tracker

# 2. Copy and fill environment variables
cp .env.example .env.local

# 3. Apply the database schema to your Supabase project
#    Run supabase/schema.sql in the Supabase SQL editor

# 4. (Optional) Grant Pro access to a user
#    UPDATE "User" SET "subscription" = 'pro' WHERE "email" = 'you@gmail.com';

# 5. Install dependencies and start the dev server
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### Google OAuth & Gmail Setup

The same Google OAuth credentials are used for both sign-in and Gmail integration.

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable the Gmail API
3. Create OAuth 2.0 credentials (Web application)
4. Add all of the following as authorised redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (sign-in)
   - `http://localhost:3000/api/gmail/callback` (Gmail)
5. Copy the Client ID and Secret into `.env.local`

## Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_SECRET` | Random secret for JWT signing — generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Full URL of the app (e.g. `http://localhost:3000`) |
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (used for both sign-in and Gmail) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | Gmail OAuth callback URL (`/api/gmail/callback`) |

## Project Structure

```
src/
├── app/
│   ├── (app)/                  # Authenticated routes
│   │   ├── dashboard/
│   │   ├── applications/       # List, detail, new, edit
│   │   ├── analytics/
│   │   ├── companies/          # Global company directory
│   │   ├── email-tracking/
│   │   └── settings/
│   └── api/
│       ├── auth/               # NextAuth handler
│       ├── gmail/              # connect, callback, disconnect, status, sync, sync-application
│       ├── resumes/            # upload, download
│       └── export/             # CSV export
├── features/
│   ├── applications/           # Form, filters, table, timeline, resume section
│   ├── auth/                   # Login page (Google sign-in button)
│   ├── companies/              # Companies table with add/edit/delete dialogs
│   ├── analytics/              # Charts
│   └── gmail/                  # Gmail connection card, email section
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── pro-access.ts           # Pro tier check
│   ├── enums.ts                # Shared enums
│   └── validations/            # Zod schemas
├── server/
│   ├── actions/                # Server actions (create, update, delete)
│   └── queries/                # DB read queries
└── supabase/
    ├── schema.sql              # Full database schema
    └── migrations/             # Incremental migration files
```
