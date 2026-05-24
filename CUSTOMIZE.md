# Customizing for a specific HOA

This is a fork-per-HOA platform. To deploy for a new HOA, fork this repo and override only the files below — leave the workflow engine, schema, and components alone so upstream changes can merge in cleanly.

## 1. Branding

- `siteConfig.ts` — HOA name, contact info, amenities, features flags, email identity
- `app/globals.css` — color tokens (search for `--color-` and override the values)
- `tailwind.config.*` (if present) — font families
- `public/logo.png`, `public/og-image.png`, `public/hero.jpg` — replace with HOA assets
- `public/favicon.ico` — replace

## 2. Static copy

- Home page sections live in `app/(public)/page.tsx` — most copy is pulled from `siteConfig.ts`. Override there first.
- Footer in `components/site/Footer.tsx` — most copy from `siteConfig.contact`.

## 3. Seed data

After running migrations, populate:
- `properties` — CSV of every address in the HOA + homeowner-of-record + contact email
- `board_members` — names, roles, committees
- `announcements` — at least one active "Community Reminder"
- `documents` — upload PDFs to Supabase Storage, insert metadata rows

A starter seed script lives at `supabase/seed.sql`. Replace its contents per HOA.

## 4. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:
- Supabase project URL + keys (one Supabase project per HOA)
- Resend API key + verified sending domain
- Twilio credentials (only if `siteConfig.features.smsEnabled = true`)

## 5. Deploy

- One Vercel project per HOA.
- One Supabase project per HOA.
- Custom domain per HOA.

## What NOT to fork

Don't modify these unless you're contributing back upstream:
- `lib/workflow/`, `lib/email/`, `lib/audit/`, `lib/supabase/`
- `supabase/migrations/`
- `app/api/`
- `components/workflow/`
- Anything under `components/ui/`

If you change these in a fork, you'll lose merges from upstream.
