# Data services

The app uses Firebase Authentication for admin sign-in and Turso for member
profiles and photos, clan settings, profile audit history, announcements, events,
and tournament results. Recruitment applications and impersonation reports remain
in Firestore.

## Local development

1. Add the service URLs and keys to the ignored `.env.local` file. The Turso URL
   and auth token must stay server-only; do not give them a `VITE_` prefix.
2. Run `npm install`, then `npm run dev`. Vite proxies `/api` to the Express API.
   The API initializes its Turso tables on startup.
3. Sign in as the bootstrap owner. The Admin Dashboard synchronizes existing
   Firebase admin roles to Turso.
4. Use **Migrate Firebase Profiles** once to copy existing member profiles,
   clan settings, and member audit history. Existing Turso rows are kept when
   the migration is retried; the original Firestore records are not deleted.

## Deployment

The `Dockerfile` builds the client and runs the API and static app from one Node
service. Configure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` as server
environment variables/secrets. Route the public app and `/api/*` through the
same origin.

For Vercel, the API functions under `api/` forward API requests to the
Turso-backed Express API. Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the
Vercel project's Environment Variables for Production (and Preview if needed),
then redeploy. Both are required; without them, `/api/*` returns an explicit
configuration error. Keep these server-side variables unprefixed with `VITE_`.

Never expose the Turso auth token in client-side variables, source control, or
build arguments. Rotate any Turso token shared outside a trusted secret store
before production deployment.
