# PRD → Sprint Planner

An AI-powered workflow system that converts a feature idea into a structured Product Requirements Document, breaks it into engineering tasks, scores/prioritizes them with a deterministic logic layer, and allocates them into sprints based on team velocity.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, serves /api)
- `pnpm --filter @workspace/prd-planner run dev` — run the frontend (port 23870, serves /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `OPENAI_API_KEY`, `ADMIN_PASSWORD`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, shadcn/ui, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI GPT-4o (user's own OPENAI_API_KEY)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (prds, tasks, sprintConfig, adminLogs)
- `artifacts/api-server/src/routes/prds.ts` — PRD generation + retrieval routes
- `artifacts/api-server/src/routes/admin.ts` — Admin routes (all protected by requireAdminAuth)
- `artifacts/api-server/src/lib/scoringEngine.ts` — Smart Logic Layer (zero AI, fully deterministic)
- `artifacts/api-server/src/middlewares/adminAuth.ts` — In-memory token store, requireAdminAuth middleware
- `artifacts/api-server/src/lib/openaiClient.ts` — OpenAI SDK singleton
- `artifacts/prd-planner/src/` — React frontend

## Architecture decisions

- **Smart Logic Layer is zero-AI**: Effort normalization (Fibonacci), dependency detection (keywords + category rules), priority scoring, risk flagging, and sprint allocation are all deterministic rule-based logic in `scoringEngine.ts`.
- **Admin auth is server-side only**: Tokens issued by `POST /api/admin/login` (compares against `process.env.ADMIN_PASSWORD`). All `/api/admin/*` routes run `requireAdminAuth` middleware. Frontend stores token in localStorage under `"admin_token"`.
- **ADMIN_PASSWORD never touches the frontend**: It is read only via `process.env` on the server. No VITE_ prefix.
- **Sprint config is a singleton row**: The `sprint_config` table holds one row. Routes create it if missing.
- **GPT-4o for PRD generation**: Uses `response_format: { type: "json_object" }` to get structured output. Dependencies are inferred post-generation by the scoring engine.

## Product

- **Input page**: Paste any feature idea, click Generate. GPT-4o produces a full PRD and task breakdown.
- **PRD View**: 3 tabs — PRD (problem/goals/user stories), Tasks (table with risk badges), Sprint Plan (Kanban by sprint).
- **History sidebar**: All past PRDs, newest first, clickable.
- **Admin dashboard** (`/admin`): Login with ADMIN_PASSWORD. Shows total PRDs/tasks, tasks-per-sprint chart, risk distribution chart, recent logs, editable sprint config.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change in `lib/db/src/schema/`, run `pnpm run typecheck:libs` before checking artifact packages — otherwise the DB table exports won't be visible to the API server typecheck.
- The scoring engine detects dependencies post-GPT — the AI is instructed to return empty `dependencies: []`; the engine infers them from keywords and category rules.
- Admin tokens are in-memory only; they reset on server restart (intended for dev simplicity).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
