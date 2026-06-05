# Job Tracker

A full-stack job application tracking system built with Next.js 16, PostgreSQL, and Gmail integration. Designed for active job seekers who want a single source of truth across all their applications, recruiter communications, and interview pipeline.

## Features

### Application Management
- Track applications across 13 granular statuses — from `Applied` through `OA`, `Technical Rounds`, `HR Round`, `Offer Received`, to `Accepted` / `Rejected` / `Withdrawn`
- Full status timeline with timestamped history on every application
- Store recruiter details (name, email, LinkedIn), job links, salary targets, visa/relocation preferences
- Resume upload and management per application
- Markdown-supported notes and interview feedback fields
- Filter by status, source, country; debounced search; sort by date or company

### Gmail Integration
- OAuth 2.0 with `gmail.readonly` scope — read-only, no write access, no send, no delete
- Tokens stored server-side only, never exposed to the frontend
- Deterministic email matching engine using O(1) lookup maps:
  - Exact recruiter email match (score 100)
  - Sender domain match (score 80)
  - Company name in subject (score 70)
  - Company name in snippet (score 60)
  - Position title in subject (score 50)
- Optimised sync strategy: recruiter email batch queries + one broad keyword query — scales to 200+ applications without hitting Gmail's per-user rate limit (250 quota units/sec)
- List queries run in parallel batches of 50 (50 × 5 = 250 units/round, exactly at the limit)
- `messages.get` calls run in parallel batches of 10 (10 × 20 = 200 units/sec, safely under the limit)
- DB deduplication before any `messages.get` call — repeat syncs are near-instant
- 30-minute sync cooldown to prevent quota abuse
- Per-application "Fetch latest" for on-demand recruiter email lookup
- Email detail page with full body parsing (text/plain preferred, HTML stripped as fallback) and direct "Open in Gmail" link

### Analytics & Dashboard
- Dashboard with summary stats, recent applications, upcoming interviews, status breakdown chart
- Recruiter Updates widget showing latest matched emails
- Dedicated Email Tracking page with last 50 matched emails

### Architecture
- **Next.js 16 App Router** with server components, server actions, and API routes
- **PostgreSQL** with Prisma ORM (v7, adapter pattern)
- **NextAuth v5** with JWT strategy and credential-based auth
- **Docker Compose** for both local development (Postgres only) and production (full stack)
- File uploads served from a persistent Docker volume

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma v7 with `@prisma/adapter-pg` |
| Auth | NextAuth v5 beta (JWT) |
| UI Components | Base UI (shadcn) + Tailwind CSS v4 |
| Charts | Recharts |
| Email | Gmail API v1 (native fetch, no SDK) |
| Containerisation | Docker + Docker Compose |

## Local Development

### Prerequisites
- Node.js 20+
- Docker Desktop

### Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd job-tracker

# 2. Copy and fill environment variables
cp .env.example .env

# 3. Start Postgres, run migrations, and start Next.js
npm run docker-dev
```

The `docker-dev` script starts Postgres in Docker (waits for healthcheck), deploys migrations, generates the Prisma client, then starts the Next.js dev server on `http://localhost:3000`.

### Gmail Integration Setup

Follow `instructions.md` for the full step-by-step guide to set up a Google Cloud project, OAuth credentials, and connect your Gmail account.

## Production Deployment

See `DEPLOY.md` for a complete guide to deploying on a VPS (Oracle Cloud / any Ubuntu server) with Nginx, Docker Compose, and a custom domain via Cloudflare.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `NEXTAUTH_URL` | Full URL of the deployed app |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL (`/api/gmail/callback`) |
| `UPLOAD_DIR` | Directory for resume file uploads |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app routes
│   │   ├── dashboard/
│   │   ├── applications/
│   │   ├── analytics/
│   │   ├── email-tracking/
│   │   └── settings/
│   └── api/
│       └── gmail/          # connect, callback, disconnect, status, sync, sync-application
├── features/
│   ├── applications/       # Application form, filters, table, timeline
│   ├── dashboard/          # Charts
│   └── gmail/              # Gmail components and sync logic
├── lib/
│   ├── gmail.ts            # Gmail API client (native fetch)
│   └── gmail-matcher.ts    # Deterministic matching engine
└── server/
    ├── actions/            # Server actions (create, update, delete)
    └── queries/            # DB read queries
```
