## Client Lead Management System (Mini CRM)

A TanStack Start app backed by Lovable Cloud (Postgres + Auth), with a public lead-capture form and an authenticated admin dashboard. Deployable to Render as a Node Web Service.

### Pages / Routes

- `/` — Landing page with a public **Contact form** (name, email, phone, company, message, source). Submissions create a `lead` row with status `new`. No login required.
- `/login` — Email + password login (and signup) for admins.
- `/_authenticated/dashboard` — Lead listing table:
  - Columns: name, email, source, status, created date, actions
  - Filter by status (new / contacted / converted / lost)
  - Search by name/email
- `/_authenticated/leads/$id` — Lead detail:
  - View/edit lead fields
  - Change status (new → contacted → converted / lost)
  - Add timestamped notes / follow-ups (separate `lead_notes` table)
  - Delete lead
- `404` and error boundaries (already present in `__root.tsx`).

### Data Model (Lovable Cloud / Postgres)

- `leads`
  - `id uuid pk`, `name text`, `email text`, `phone text null`, `company text null`, `message text null`, `source text` (e.g. "website"), `status text check in ('new','contacted','converted','lost') default 'new'`, `created_at`, `updated_at`
- `lead_notes`
  - `id uuid pk`, `lead_id uuid fk → leads.id on delete cascade`, `body text`, `author_id uuid → auth.users.id`, `created_at`
- `user_roles` (per security guidelines)
  - `id`, `user_id uuid → auth.users.id`, `role app_role enum('admin','user')`
  - `has_role(uuid, app_role)` SECURITY DEFINER function
- First user to sign up is auto-promoted to `admin` via a DB trigger; subsequent signups default to `user`.

### RLS Policies

- `leads`
  - INSERT: anyone (anon + authenticated) — public contact form
  - SELECT / UPDATE / DELETE: only `has_role(auth.uid(), 'admin')`
- `lead_notes`
  - All operations: admin only
- `user_roles`
  - SELECT: own row or admin; INSERT/UPDATE/DELETE: admin only

### Auth

- Email + password via Lovable Cloud auth (no email confirmation for fast testing; can be toggled later).
- `_authenticated` layout route gates admin pages; non-admins are redirected to `/login`.
- Auth state hook listens via `onAuthStateChange` and exposes `isAuthenticated` + `isAdmin` to router context.

### UI

- shadcn components: Card, Table, Badge (status colors), Select, Input, Textarea, Button, Dialog, Sonner toasts, Form + zod validation.
- Clean, professional theme using existing design tokens in `src/styles.css` (no hardcoded colors).
- Status badge color mapping via semantic tokens.

### Validation

- Zod schemas for contact form and lead edit form (trimmed strings, email format, max lengths) — applied client-side and re-validated in server functions.

### Render Deployment

TanStack Start is configured for Cloudflare Workers in this template (`wrangler.jsonc`). To deploy to Render as a Node web service we'll add a Node-target build:

1. Add a `render.yaml` blueprint at repo root:
   ```yaml
   services:
     - type: web
       name: mini-crm
       runtime: node
       plan: free
       buildCommand: bun install && bun run build
       startCommand: bun run start
       envVars:
         - key: VITE_SUPABASE_URL
           sync: false
         - key: VITE_SUPABASE_PUBLISHABLE_KEY
           sync: false
         - key: SUPABASE_URL
           sync: false
         - key: SUPABASE_PUBLISHABLE_KEY
           sync: false
         - key: SUPABASE_SERVICE_ROLE_KEY
           sync: false
   ```
2. Update `vite.config.ts` so the TanStack Start plugin targets `node-server` (instead of Cloudflare) when building for Render — keep Cloudflare config available for the Lovable preview but switch the production target.
3. Add `start` script to `package.json` that runs the built Node server entry.
4. Add a short `RENDER_DEPLOY.md` with step-by-step instructions: connect GitHub repo → Render reads `render.yaml` → user pastes the 5 env vars from Lovable Cloud → deploy.

### Out of scope (call out to user)

- Email notifications on new leads (can be added later via a server function + email provider).
- File attachments on leads.
- CSV export of leads.

### Deliverable

A working CRM at `/` (public form) and `/dashboard` (admin), with Render blueprint + deploy instructions ready to push to GitHub.
