# Lundrii student web app

Mobile-first Next.js 16 student client for Lundrii. It talks to the Django API
via `NEXT_PUBLIC_API_BASE` (`src/lib/api.ts`). Signed-out and `/demo` screens
still use the in-memory seed in `src/data/mock/seed.json`.

The app fills the whole window at every size. Screens are laid out against a
phone-width viewport, so on wide screens the gradient still bleeds edge to edge
while the content sits in a centred column capped at `--app-column` (440px).

## Run

```bash
cd web
cp .env.example .env.local
# edit NEXT_PUBLIC_API_BASE if the API is not on http://localhost:8000/api/v1
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unsigned users land on `/auth/sign-in`.

Institute emails must match the backend allowlist (typically `@gim.ac.in` /
`@student.gim.ac.in`). Create a student through the API or seed — there are no
hard-coded demo passwords in this app.

```bash
npm run build   # production compile
npm start       # serve the build
```

## Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_API_BASE` | `.env.local` / Vercel | Django API root, including `/api/v1`. Example: `https://<railway-host>/api/v1`. Inlined at **build** time. |

See [`.env.example`](.env.example). Do not commit `.env.local` or secrets.

Ticket photos from Cloudinary are shown with a native `<img>` (not `next/image`).
`next.config.ts` still allows `https://res.cloudinary.com/**` so `next/image` can
be used later without a config change.

## Deploy on Vercel

This app is the **student** Next.js project under `web/` only. Admin and marketing
sites are separate. Default Vercel settings are enough: **Build Command**
`npm run build`, **Output** Next.js, **Install** `npm install`. No `vercel.json`
is required.

### Vercel project settings

1. Root Directory: `web` (if the Git repo is the monorepo root).
2. Framework Preset: Next.js.
3. Environment variable (Production, and Preview if you use preview deploys):
   - `NEXT_PUBLIC_API_BASE` = `https://<your-railway-host>/api/v1`
4. Redeploy after changing `NEXT_PUBLIC_*` vars so the client bundle picks them up.

### Backend must allow this origin

The Django API will reject browser calls unless the Vercel origin is listed.

On the **backend** (Railway), set:

- `FRONTEND_URL` — production student app URL, e.g. `https://lundrii.vercel.app` (no trailing slash). Used in email verify/reset links.
- `CORS_ORIGINS` — must include that same origin, e.g. `https://lundrii.vercel.app`. Comma-separate extras if needed.

Preview deployments (`https://<project>-<hash>-<team>.vercel.app`) are **not**
covered by the production origin. Either add each preview URL (or a documented
extra list) to `CORS_ORIGINS`, or skip API-backed preview deploys.

After the first production URL is known, add it to backend `CORS_ORIGINS` and
`FRONTEND_URL` before expecting login, cookies/CORS, or email links to work.

### Vercel checklist

- [ ] Project root is `web/`
- [ ] `NEXT_PUBLIC_API_BASE` points at the Railway `/api/v1` URL
- [ ] Production deploy completed after the env var was set
- [ ] Backend `CORS_ORIGINS` includes the Vercel origin (`https://…`)
- [ ] Backend `FRONTEND_URL` is that same origin (email links)
- [ ] Preview URLs: extra CORS entries, or do not use previews against prod API

## Install as an app

The app is installable as a PWA — manifest at `src/app/manifest.ts`, icons in
`public/`, app-shell worker at `public/sw.js`.

The worker only registers in production builds; in dev it would sit in front of
the dev server and serve stale chunks between rebuilds. So use `npm run build &&
npm start` to exercise install or offline behaviour, not `npm run dev`.

Browsers only offer installation over HTTPS or on `localhost`. Once installed
the app launches standalone at `/today` and opens offline to a fallback screen.

## Stack

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- Live API client in `src/lib/api.ts`; seed fixture for demo/signed-out UI

## Screens

| Area | Paths |
|------|--------|
| Auth | `/auth/sign-in`, `/auth/sign-up`, `/auth/domain-rejected`, `/auth/verify`, `/auth/forgot`, `/auth/reset` |
| Tabs | `/home`, `/book`, `/bookings`, `/profile` |
| Book | `/book/:machineId/day`, `/dryer`, `/confirm` → dryer, `/success`, `/exchange` |
| Manage | `/bookings/move` |
| Activity | `/activity`, `/exchanges`, `/exchanges/:id`, `/exchanges/sent/:id`, `/exchanges/swap-done` |
| Tickets | `/tickets`, `/tickets/report`, `/tickets/raised`, `/tickets/:ticketId` (old `/tickets/type` and `/tickets/conflict` redirect to report) |
| Edges | `/demo` and `/demo/*` (rule-blocked, late-cancel, offline, suspended, …) |

Frosted bottom tabs show only on the four tab roots.

## Booking rules

Enforced by the API (and mirrored client-side in `src/lib/rules.ts`), matching
`shared/contract.md`:

- 3 washer bookings / rolling 7-day window (dryers do not consume quota)
- 6-hour cooldown after a wash ends
- 7-day advance window
- Late cancel (within 6 hours of the slot) does not refund quota
