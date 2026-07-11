# Project Management Tool

A full-stack project management application (Jira/Trello/Asana-style) with projects, tasks, a drag-and-drop Kanban board, collaborators, comments with attachments, activity logs, and a dashboard.

## Live Demo

- **App:** https://project-management-system-tau-one.vercel.app
- **API:** https://project-management-system-1osq.onrender.com/api/health

**Test login** (any of these — password `Password123!`):
`alice@example.com` (owner) · `bob@example.com` (member) · `carol@example.com` (member)

> ⚠️ The backend is on Render's free tier and **sleeps after ~15 min of inactivity**. The **first request may take ~30–50 seconds** to wake it (the login button will spin) — subsequent requests are fast.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router, Tailwind CSS, `@dnd-kit` (Kanban) |
| Backend | Express.js (REST API), plain JavaScript (ESM) |
| Database | PostgreSQL via Supabase (used as a plain Postgres DB) |
| Auth | Custom — `bcrypt` password hashing + JWT |
| Storage | Supabase Storage (comment attachments) |
| Email | Nodemailer (OTP password reset, collaborator notifications) |

> **Note on stack:** the assessment suggested Next.js + TypeScript. This implementation uses **React + Express (JavaScript)** as a deliberate architecture choice: a clean SPA client and a separate REST API, with Supabase used purely as a managed Postgres + object store (auth handled in Express with bcrypt/JWT rather than Supabase Auth).

## Features

**Authentication** — register, login, logout, JWT-protected routes, password reset via emailed OTP, change password.

**Projects** — create/edit/delete, dashboard of project cards with task counts and collaborator counts, search, filter (status, owner/member), sort (name, created date), project settings modal, collaborator management with email notifications, per-project history log.

**Tasks** — create/edit/delete, assignee, due date, priority, status; auto-generated task keys (`ENG-1`); filter (status, priority) and search (key/title); details modal with per-task activity log.

**Kanban** — drag-and-drop between To Do / In Progress / Done, with optimistic updates.

**Comments & attachments** — add/view/delete-own comments; file attachments stored in Supabase Storage with signed download URLs.

**Activity log** — tracks `PROJECT_CREATED`, `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`; viewable per-task and per-project.

**Dashboard** — total projects, tasks assigned to you (completed/pending), and recent tasks.

**Responsive** — works across desktop, tablet, and mobile (collapsible sidebar).

**Bonus features — all 5 implemented** (only 2 were required):
1. **Dark / Light mode** — theme toggle, persisted
2. **File Attachments** — on comments, stored in Supabase Storage
3. **Calendar View** — tasks by due date
4. **Export Tasks (CSV)** — per-project download
5. **Team Members** — project collaborators with owner/member roles, add/remove, and email invitations (see Collaborators below)

### Permission model

| Action | Who |
|---|---|
| Create task | owner / member |
| Edit / delete / assign task, set priority & due date | owner / task creator |
| Update status (incl. Kanban drag) | owner / task creator / assignee |
| View project & tasks | owner / member |
| Edit/delete project, manage collaborators | owner only |
| Delete comment | comment author / project owner |

All permissions are enforced server-side and mirrored in the UI.

## Project Structure

```
.
├─ client/          # React + Vite frontend
│  ├─ src/
│  │  ├─ api/         # fetch wrappers per resource
│  │  ├─ components/  # shared UI (Modal, Sidebar, ui primitives)
│  │  ├─ context/     # AuthContext, ThemeContext
│  │  ├─ features/    # projects/, tasks/ feature components
│  │  ├─ layouts/     # AppLayout, AuthLayout
│  │  ├─ pages/       # route pages
│  │  └─ routes/      # router + ProtectedRoute
│  └─ vercel.json
├─ server/          # Express API
│  ├─ src/
│  │  ├─ config/      # env, db pool, mailer, storage
│  │  ├─ controllers/ # request handlers
│  │  ├─ db/          # schema.sql, seed, runner
│  │  ├─ middleware/  # auth (JWT), error handler
│  │  ├─ routes/      # auth, projects, tasks, comments, dashboard, users
│  │  └─ services/    # business logic + permissions
│  └─ .env.example
├─ render.yaml       # API deployment blueprint
└─ PLAN.md           # full build plan
```

## Local Setup

### Prerequisites
- Node.js 18+ and npm
- A Supabase project (for Postgres + Storage) — or any Postgres instance

### 1. Backend

```bash
cd server
npm install
cp .env.example .env      # then fill in the values (see below)
npm run db:schema         # create tables, enums, functions, RLS
npm run db:seed           # insert test users, a project, tasks
npm run dev               # starts API on http://localhost:4000
```

**`server/.env`:**
```
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:PASSWORD@db.<ref>.supabase.co:5432/postgres
JWT_SECRET=<long-random-string>
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<sb_secret_... or service_role JWT>   # for attachments
SUPABASE_STORAGE_BUCKET=attachments
SMTP_HOST=...            # optional — without it, OTPs are returned in dev responses
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="PM Tool <no-reply@example.com>"
```

- **DATABASE_URL:** Supabase → Project Settings → Database → Connection string (URI).
- **SUPABASE_SERVICE_ROLE_KEY:** Project Settings → API Keys → Secret keys. Only needed for file attachments. Also create a Storage bucket named `attachments`.
- **SMTP:** any provider (Brevo, Mailgun, Gmail app password, or Mailtrap for testing). If omitted, the password-reset OTP is returned in the API response (dev only) and emails are logged to the console.

### 2. Frontend

```bash
cd client
npm install
npm run dev               # starts client on http://localhost:5173
```

The Vite dev server proxies `/api` to `http://localhost:4000`, so no client env is needed locally. For production set `VITE_API_URL` to the deployed API origin.

### Test credentials (from the seed)

| Email | Password | Role in "Engineering" project |
|---|---|---|
| `alice@example.com` | `Password123!` | owner |
| `bob@example.com` | `Password123!` | member |
| `carol@example.com` | `Password123!` | member |

## Deployment

**Frontend → Vercel:** import the repo, set the project root to `client/`. `vercel.json` handles the SPA rewrite and build. Set `VITE_API_URL` to your API URL.

**Backend → Render/Railway:** deploy from `server/` (see `render.yaml`). Set `CLIENT_ORIGIN` to your Vercel URL and all secret env vars. Health check: `GET /api/health`.

**Database:** already hosted on Supabase. Run `npm run db:schema` (and optionally `npm run db:seed`) once against the production database.

## API Overview

```
Auth       POST /api/auth/register|login|logout|forgot-password|reset-password|change-password
           GET  /api/auth/me
Projects   GET/POST /api/projects   GET/PATCH/DELETE /api/projects/:id
           GET  /api/projects/:id/logs
           POST /api/projects/:id/collaborators   DELETE /api/projects/:id/collaborators/:userId
Tasks      GET/POST /api/projects/:projectId/tasks
           GET/PATCH/DELETE /api/tasks/:id   PATCH /api/tasks/:id/status   GET /api/tasks/:id/logs
Comments   GET/POST /api/tasks/:taskId/comments   DELETE /api/comments/:id
           GET  /api/attachments/:id/url
Dashboard  GET  /api/dashboard
Users      GET  /api/users?query=
Health     GET  /api/health
```

All routes except `register`, `login`, `forgot/reset-password`, and `health` require an `Authorization: Bearer <token>` header.

## Database scripts

- `npm run db:schema` — (re)create schema (drops & recreates all tables)
- `npm run db:seed` — reset domain data and insert seed data
- `node src/db/run.js reset` — schema + seed in one step
