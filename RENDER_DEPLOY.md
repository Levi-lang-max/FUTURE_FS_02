# Deploying the Mini CRM to Render

This app is a single-page React app (TanStack Router) backed by **Lovable Cloud**
(Supabase) for the database and authentication. Everything the browser needs is
served as static files plus direct calls to Lovable Cloud — no Node server is
required at runtime.

The recommended Render deployment is therefore a **Static Site** (free tier
available). The included `render.yaml` is already configured for it.

## 1. Push the code to GitHub

In Lovable, click **GitHub → Connect project**, create a repo, and let Lovable
sync the code.

## 2. Create the Render service from the blueprint

1. Go to https://dashboard.render.com → **New + → Blueprint**.
2. Pick the GitHub repo you just created.
3. Render reads `render.yaml` and proposes a static site called `mini-crm`.

## 3. Set environment variables

Render will prompt for three variables. Copy these from your Lovable project's
`.env` file (or from **Cloud → Settings**):

| Render var | Source |
|---|---|
| `VITE_SUPABASE_URL` | `VITE_SUPABASE_URL` in `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env` |
| `VITE_SUPABASE_PROJECT_ID` | `VITE_SUPABASE_PROJECT_ID` in `.env` |

These are publishable keys (safe to embed in the browser bundle). Row-Level
Security policies in Lovable Cloud enforce who can read/write each table.

## 4. Deploy

Click **Apply**. Render runs `bun install && bun run build` and publishes
`dist/client`. The first build takes ~2 minutes.

## 5. First admin user

Open the deployed URL → **Admin login** → **Sign up**. The very first account
created is automatically promoted to `admin`. All subsequent signups become
regular users with no dashboard access.

## How the auth model works

- Public visitors hit `/` and submit the contact form. RLS allows anonymous
  inserts into the `leads` table only — they cannot read anything back.
- Admins log in at `/login` and access `/dashboard` and `/leads/:id`. RLS
  restricts every read/update/delete to users with the `admin` role
  (checked via the `has_role` SECURITY DEFINER function).

## Local production preview

```bash
bun install
bun run build
bunx vite preview
```
