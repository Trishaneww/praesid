# CLAUDE.md — Praesid

Persistent project memory. Read this before doing any work in this repo and follow it strictly.

## Project

Praesid is a safety and compliance platform for construction and industrial companies. It ingests unstructured safety and maintenance records, codifies them against OIICS (the US Bureau of Labor Statistics Occupational Injury and Illness Classification System), turns them into one searchable, audit-ready record, and connects maintenance signals to incidents. This repository is the monorepo for the web app, the API, and shared code.

## Stack

- Monorepo: pnpm workspaces with Turborepo
- Frontend: Next.js (App Router) with TypeScript, Tailwind CSS, and shadcn/ui components (toasts via sonner)
- Backend: NestJS with TypeScript
- Database: PostgreSQL with the pgvector extension
- ORM: Prisma
- Embeddings: one provider chosen up front (Voyage, OpenAI, or AWS Bedrock), accessed through a single client
- AWS: S3 and any other AWS access through a single client

## Repo structure

```
apps/
  web/      Next.js frontend
  api/      NestJS backend
packages/
  shared/   TypeScript types and DTOs shared by web and api
```

Shared request and response types live in packages/shared so the frontend and backend cannot drift out of sync.

## Coding conventions

These are strict. Prioritize a clean, intuitive, readable structure. Readability wins over cleverness.

### Naming

- Functions are verbs that say what they do: `formatFirstName`, `listIncidents`, `parseIncident`, `embedOiicsCodes`.
- Prefer a longer clear name over a short cryptic one.
- Files are named after their main export.

### React (apps/web)

- Components are const arrow functions: `const IncidentCard = () => { ... }`.
- Pages are default function exports: `export default function DashboardPage() { ... }`.
- A component shows structure, not logic. Its body should read as its JSX tree. Never define helper or formatter functions inside a component.
- All logic lives in `lib/`, organized by feature. A forecasting page's helpers live in `lib/forecasting.ts`.
- When a component accumulates many useState or useEffect calls, move that logic into a custom hook in `hooks/` (for example `hooks/useForecasting.ts`) and keep the component thin.
- Use shadcn/ui components wherever one exists (Card, Table, Button, Input, Dialog, Select, and so on) instead of raw HTML elements. Use sonner for toasts. Reach for a plain HTML element only when no suitable shadcn component exists, and prefer composing shadcn primitives over hand-rolling equivalents.

### NestJS (apps/api)

- Same principle as components: controllers stay thin and only wire HTTP routes to services. No business logic or helpers in controllers.
- Business logic lives in services. Services orchestrate; they do not talk to the database directly.
- Database access lives in per-feature `@Injectable()` **repositories** (`incidents/incidents.repository.ts`, `oiics/oiics.repository.ts`, and so on) that wrap `PrismaService`. A repository holds the queries (including raw pgvector SQL); the service injects it and delegates. Never call `this.prisma.*` from a service. Register each repository as a provider in its module and export it where another module needs it.
- Reusable pure helpers (mappers, formatters, prompt builders — anything stateless with no DB access) live in `lib/`, organized by feature, mirroring the frontend.
- DTOs are classes with class-validator decorators, since they must exist at runtime for validation.

### Shared structure (both apps)

- `lib/` holds all logic and helpers, organized by feature (`lib/forecasting.ts`, `lib/incidents.ts`).
- `lib/clients/` holds singleton clients (Prisma, AWS, embedding provider). Instantiate once and import. Never re-instantiate per call. In NestJS these are singleton providers via dependency injection (for example `PrismaService`, `AwsService`). In Next.js they are module singletons under `lib/clients/`.
- `constants/` mirrors `lib/` and holds constants, organized by feature.
- `hooks/` (web only) holds custom React hooks.

### Comments

- Do not over-comment. Clear names and small functions should carry the meaning on their own.
- Comment only non-obvious or complex workflows that genuinely need explaining.

## Guardrails

- Do not add a library that is not already implied by the task without asking first.
- Reference data such as OIICS codes is versioned and additive. Never overwrite or destructively reload it.
- pgvector columns are declared in the Prisma schema as `Unsupported("vector(N)")?` so `migrate dev` never drops them. Prisma cannot model HNSW indexes, so **every generated migration must be created with `--create-only` and inspected**: if it contains `DROP INDEX "oiics_embedding_hnsw"` (or any other vector index), delete that line before applying.
