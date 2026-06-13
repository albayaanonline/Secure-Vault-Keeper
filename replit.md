# My Secrets

A premium encrypted vault for storing and managing sensitive information — passwords, API keys, SSH keys, tokens, database credentials, crypto wallets, and private notes. Feels like 1Password meets a cybersecurity operations center.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/my-secrets run dev` — run the frontend (port assigned by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY` — Replit-managed Clerk (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind v4, Framer Motion, Clerk Auth, Wouter
- API: Express 5 + Clerk middleware
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (single source of truth)
- `lib/db/src/schema/` — DB schema: users, categories, secrets, activity
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/routes/auth-middleware.ts` — Clerk auth + JIT user provisioning
- `artifacts/my-secrets/src/` — React frontend
- `artifacts/my-secrets/src/lib/crypto.ts` — AES-256-GCM client-side encryption utilities
- `artifacts/my-secrets/src/pages/` — All pages (landing, dashboard, secrets, activity, settings, categories)

## Architecture decisions

- **Client-side encryption:** Secrets are encrypted with AES-256-GCM using the Web Crypto API before being sent to the server. The server never sees plaintext values.
- **Clerk Auth (Replit-managed):** Authentication is handled by Replit-provisioned Clerk. Dev and production have separate user stores.
- **JIT user provisioning:** On first authenticated API call, the server creates a DB user record linked to the Clerk userId.
- **System categories:** 9 built-in categories (Passwords, API Keys, Tokens, SSH Keys, Database, Crypto Wallets, Documents, Notes, Server Credentials) are auto-created per user on first category list call.
- **OpenAPI-first:** All API contracts defined in `lib/api-spec/openapi.yaml` and codegen'd to React Query hooks and Zod validators.

## Product

My Secrets is a private encrypted vault where users securely store sensitive credentials. Features: Clerk-authenticated accounts, AES-256 client-side encryption, 9 built-in secret categories + custom categories, dashboard with security score, search/filter/favorite/archive, activity log, and a cinematic dark cybersecurity UI.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Run `pnpm run typecheck:libs` after schema changes before checking artifact typechecks — stale lib declarations cause false errors.
- After changing `lib/api-spec/openapi.yaml`, always re-run `pnpm --filter @workspace/api-spec run codegen`.
- The Clerk proxy middleware must be mounted BEFORE body parsers in `app.ts` — it streams raw bytes.
- `tailwindcss({ optimize: false })` in vite.config.ts is required for Clerk themes to work in production builds.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/clerk-auth/references/setup-and-customization.md` for Clerk wiring details
