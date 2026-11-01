# DTA Certificate Verification & Staff Portal

Public site and certificate verification for Data Technology Academy, plus a staff
dashboard for managing cohorts, students, programs, certificates and staff.

- **Public:** landing page (`/`), certificate verification (`/verify`), PDF/PNG/HTML downloads.
- **Staff portal:** `/dashboard` (sign in at `/login`).
- **Stack:** Next.js 16, PostgreSQL + Prisma 7, Better Auth, EdgeStore (staff photos,
  signatures and files), Puppeteer + Chromium (certificate PDF/PNG rendering).

## Roles

| | Admin | Staff |
|---|---|---|
| Cohorts, programs, students | ✅ | ✅ |
| Issue certificates | ✅ | ✅ |
| Revoke / reinstate certificates, change issue dates | ✅ | — |
| Delete cohorts, programs, students | ✅ | — |
| Invite / create / deactivate staff, change roles, reset passwords | ✅ | — |
| Own profile, photo, signature, files | ✅ | ✅ |

Public sign-up is disabled. The first admin is created once at `/setup`; everyone else
joins through an invite link or an account an admin creates.

## Certificates

- Certificate IDs are issued sequentially (`DTA2069`, `DTA2070`, …) from a cohort page
  (bulk) or a student page (single).
- Each cohort lists up to four **signatories**. Their uploaded signature, name and printed
  title appear on every certificate in that cohort. Cohorts without signatories show blank
  Director / CEO / CTO lines.
- Revoked certificates show as revoked on `/verify` (with the reason) and can't be downloaded.

## Environment variables

See [.env.example](.env.example).

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Random secret, e.g. `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Public URL of the site, e.g. `https://verify.dta.gm`. Also used in invite links |
| `SETUP_TOKEN` | Required on `/setup` to create the first admin. Remove it afterwards |
| `EDGESTORE_ACCESS_KEY`, `EDGESTORE_SECRET_KEY` | From [dashboard.edgestore.dev](https://dashboard.edgestore.dev) |

## Local development

```bash
cp .env.example .env        # then fill it in
npm install
npm run db:migrate          # create tables
npm run db:seed             # import the Cohort 2 graduates (safe to re-run)
npm run dev
```

Open `http://localhost:3000/setup` to create the admin account.

## Deploying with Docker

```bash
docker build -t dta-cert-verify .
docker run -d --name dta --restart unless-stopped -p 3000:3000 --env-file .env.production dta-cert-verify
```

- Database migrations run automatically on container start (`RUN_MIGRATIONS=false` to skip).
- Import the Cohort 2 graduates once: `docker exec dta /app/migrate/seed.sh`
- Then visit `https://your-domain/setup`, create the admin, and remove `SETUP_TOKEN`.
- Serve the site over HTTPS (reverse proxy) — sign-in cookies and "Copy link" need it.

## Scripts

| Script | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run db:migrate` | Create/apply a migration in development |
| `npm run db:deploy` | Apply migrations (production) |
| `npm run db:seed` | Run `prisma/seed.sql` |
