# hoa-platform

A modern, generic HOA community platform. Forked per HOA for branding + content; the workflow engine is shared upstream.

**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind v4 + shadcn/ui + Supabase (Postgres + Auth + Storage) + Resend (email) + Twilio (SMS broadcasts, optional).

## Features (MVP)

- Public marketing site (home, events, board)
- Member auth with admin approval
- Document library (member-gated, RLS-enforced)
- Resident directory (opt-in, per-field privacy)
- Tree removal requests + ARC (architectural approval) requests on a unified workflow engine
- Violation workflow with escalating warnings + tokenized appeal links for non-account homeowners
- HOA-wide notifications (email + opt-in SMS, with emergency flag)
- Admin dashboard + audit log

See `PLAN.md` (kept in the planning workspace, not in this repo) for the full design doc.

## Local development

```bash
cp .env.local.example .env.local
# fill in Supabase URL + keys, Resend API key, etc.

npm install
npm run dev
```

Migrations live in `supabase/migrations/`. To apply them to a Supabase project:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

## Customizing for a specific HOA

See `CUSTOMIZE.md`.

## License

MIT (placeholder — confirm before publishing).
