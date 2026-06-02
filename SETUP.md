# Setting up hoa-platform on a new computer

You're cloning the same project that's already deployed against a shared
Supabase backend, so you can develop and test from any machine without
having to re-create the database.

---

## 1 · Prerequisites

Install these once on the new machine:

- **Node.js 22+** — https://nodejs.org/ (LTS or current). After install:
  ```
  node --version
  npm --version
  ```
- **Git** — https://git-scm.com/downloads
- **GitHub CLI** (optional but handy) — https://cli.github.com/
- A code editor — VS Code recommended

You do **not** need to install the Supabase CLI globally; the project
pulls it in via `npx`.

---

## 2 · Clone the repo

```
cd C:\dev          # or wherever you want it on the new machine
git clone https://github.com/joekincognito/hoa-platform.git
cd hoa-platform
```

If you're already authenticated to GitHub via `gh`, that's it. Otherwise
clone via HTTPS and enter your GitHub credentials when prompted.

---

## 3 · Install dependencies

```
npm install
```

Takes ~1–2 minutes. This pulls Next.js, React, Tailwind, shadcn/ui,
Supabase client + CLI, Resend SDK, react-email, zod, and friends.

---

## 4 · Environment variables

The repo is gitignore'd from `.env.local`, so you need to recreate it on
the new machine. Two options — pick whichever is easier:

### Option A (easiest): copy `.env.local` from the other machine

On the **first machine**, the file lives at:
```
C:\dev\hoa-platform\.env.local
```

Copy it to the same path on the new machine (via USB, OneDrive,
1Password file attachment, or `scp`). Done.

### Option B: recreate from scratch

Copy the example and fill in:

```
cp .env.local.example .env.local
```

Open `.env.local` and fill these in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://wqccsagzusgptlqluggy.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | https://supabase.com/dashboard/project/wqccsagzusgptlqluggy/settings/api → "anon public" |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → "service_role" (treat as a password) |
| `RESEND_API_KEY` | https://resend.com/api-keys (use the existing `hoa-platform-cli` key or generate a new one) |
| `EMAIL_FROM_ADDRESS` | `onboarding@resend.dev` (until a domain is verified) |
| `EMAIL_FROM_NAME` | `HOA Platform (dev)` |
| `ADMIN_NOTIFICATION_EMAIL` | `hoaplatform123@gmail.com` (Resend test-mode constraint — see notes below) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` |

Leave the `TWILIO_*` vars empty — SMS is feature-flagged off.

---

## 5 · (Optional) Link the Supabase CLI for migrations

You only need this if you're going to push new migrations from this
machine. Skip if you're just running the app.

```
npx supabase login
```

Opens a browser. Sign in to your Supabase account, click **Authorize**,
close the tab. The token persists per-user.

```
npx supabase link --project-ref wqccsagzusgptlqluggy
```

It'll ask for the database password. The password is stored on the
first machine — get it from `1Password` or from
https://supabase.com/dashboard/project/wqccsagzusgptlqluggy/settings/database
(reset it if you don't have it; the migrations don't care).

---

## 6 · Run it

```
npm run dev
```

Open http://localhost:3000

You should see the home page render with the same data you see on the
first machine (the database is shared).

---

## 7 · Bootstrap yourself as admin (first time only)

If you haven't signed up yet on the platform from any machine:

1. Visit `/auth/signup` and create an account.
2. From a second terminal:
   ```
   cd C:\dev\hoa-platform
   npx tsx scripts/make-admin.ts your-email@example.com
   ```

You're now an approved admin. Refresh `/admin` to see the dashboard.

If you already created an account on the first machine, just log in with
those credentials on the new machine — sessions are server-side per
browser, no transfer needed.

---

## Important notes

### Resend test-mode constraint

Until a sending domain is verified at https://resend.com/domains, Resend
will **only deliver emails to `hoaplatform123@gmail.com`** (the email
tied to the Resend account). Everything else silently fails.

If you want emails to actually arrive at other addresses while testing,
either:
- Verify a domain at Resend, OR
- Set every test homeowner email + every admin notification email to
  `hoaplatform123@gmail.com` so you receive them all in one inbox.

The `notifications` and `broadcast_deliveries` tables record what
*would* have been sent regardless — check `/admin/audit` or those
tables directly if you suspect an email isn't reaching you.

### Supabase email confirmation

For dev convenience, email confirmation should be **off** in Supabase
Auth settings:

https://supabase.com/dashboard/project/wqccsagzusgptlqluggy/auth/providers
→ Email provider → toggle off "Confirm email"

(If it's on, signups don't establish a session until the email link is
clicked, and Supabase's built-in SMTP is rate-limited to 3 emails/hour.)

### Same backend, two clients

Both machines hit the same database, so any data you change (members,
properties, requests, etc.) is visible from both. Be aware when testing:
deleting something on one machine deletes it for the other too.

### Dev server cache (Turbopack)

Next 16's Turbopack cache can get stuck after big migrations or branch
switches. If pages start 500'ing after a pull:

```
taskkill /F /IM node.exe
rm -rf .next
npm run dev
```

---

## Quick reference: useful scripts

```
# Bootstrap a user as admin (and approve them) by email
npx tsx scripts/make-admin.ts user@example.com

# Verify schema is in sync with what the app expects
npx tsx scripts/verify-schema.ts

# Seed the DB with placeholder content (DESTRUCTIVE — wipes existing rows)
npx tsx scripts/seed-remote.ts

# Create the documents + attachments storage buckets (idempotent)
npx tsx scripts/setup-storage.ts

# Send a test email via Resend to confirm wiring
npx tsx scripts/test-email.ts you@example.com
```

---

## When in doubt

- `PLAN.md` in the OneDrive workspace has the full architectural plan
- `README.md` has the high-level pitch
- `CUSTOMIZE.md` documents what to override for a customer fork
- The repo's issue tracker on GitHub is where bugs go
