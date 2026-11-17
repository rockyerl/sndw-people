---
sessionId: session-261111-152427-1pqb
---

# Requirements

### Overview
**Sundawa AI QA Platform** adalah platform AI-assisted untuk quality engineering yang meng-generate test scenario dari requirement dokumen (PRD, user story, dll), lalu melalui proses review dan approval sebelum bisa di-export. Platform ini multi-tenant, dengan RBAC, audit trail, dan integrasi AI provider.

### Goals
- AI generate test scenario dari requirement yang di-upload
- Semua AI output harus di-review dan di-approve oleh manusia (no auto-approve)
- Traceability 100%: setiap scenario linked ke requirement version
- Coverage visibility: dashboard menampilkan requirement coverage
- Multi-tenant isolation dari hari pertama
- Audit trail untuk semua aksi sensitif

### Scope — MVP (M01-M07)
**In Scope:**
- M01: Identity, Organization & Project (OIDC Auth, RBAC, Tenant/Project management)
- M02: Requirements & Source Library (Upload dokumen, Parse, Versioning, Baseline)
- M03: Integration Registry & MCP (Basic connector management, P1: GitHub/Playwright)
- M04: AI Scenario Generator (Queue, AI adapter, Structured JSON output, Validation)
- M05: Scenario & Test Case Management (CRUD, Traceability, Search/Filter)
- M06: Human Review & Approval (Review workflow, Segregation, Immutable approval)
- M07: Coverage, Reporting & Export (Dashboard, JSON/CSV/Markdown export)

**Out of Scope (MVP):**
- M08: Phase 2 Execution & Defects (P1)
- M09: Phase 3 Regression Intelligence (P2)
- Billing, public marketplace, self-service signup
- Full autonomous browser execution

### Key Personas
- **Organization Admin**: Konfigurasi member, AI budget, policies
- **Project Manager**: Kelola project, monitor progress
- **QA Lead**: Define strategy, approve test suites
- **QA Engineer**: Generate, edit, review scenarios
- **Developer**: View approved cases
- **BA/PO**: Maintain requirement interpretation


# Technical Design

### Current State
Project saat ini (`com.sndw-people-frontend`) adalah HRIS frontend (Next.js 15 + Tailwind). AI QA Platform akan menjadi **project baru terpisah** dengan arsitektur monorepo.

### Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                    Monorepo (pnpm workspaces)           │
│                                                         │
│  apps/                    packages/                     │
│  ├── web/ (Next.js)     ├── database/ (Prisma)          │
│  ├── api/ (NestJS)      ├── contracts/ (Zod, DTOs)      │
│  └── worker/ (BullMQ)   ├── ai-core/ (prompts, adapter) │
│                         ├── qa-domain/ (logic)          │
│                         ├── mcp-gateway/                │
│                         ├── authz/ (permissions)        │
│                         └── ui/ (shared components)     │
│                                                         │
│  Infrastructure:                                         │
│  ├── PostgreSQL (data)                                  │
│  ├── Redis (queue)                                      │
│  └── S3-compatible (files)                              │
└─────────────────────────────────────────────────────────┘
```

### Key Decisions
1. **Monorepo dengan pnpm workspaces** — Mengikuti PRD, memisahkan apps (web, api, worker) dan packages (shared code). Memudahkan code sharing dan type safety.
2. **NestJS untuk backend** — REST API dengan module boundaries, guards, DI. Cocok untuk RBAC dan domain services.
3. **Prisma + PostgreSQL** — Schema management, type-safe queries. 20+ tabel dengan tenant isolation (composite FKs, RLS).
4. **BullMQ (Redis)** — Async AI generation jobs. Job payload hanya ID, bukan raw data.
5. **AI Provider Adapter** — Tidak hardcode satu vendor. Strict JSON output via Zod validation.
6. **OIDC Authentication** — Tidak pakai password-based auth. Menggunakan OIDC provider (misal Auth0, Keycloak).
7. **Feature-Driven di frontend** — Mengikuti pola HRIS project: `features/` dengan `actions/`, `components/`, `hooks/`.

### Database Schema (Core Tables)
20+ tabel dengan tenant isolation:
- `users`, `tenants`, `tenant_memberships` — Auth & org
- `projects`, `project_members` — Project management
- `source_documents`, `document_versions`, `source_sections` — Source library
- `requirements`, `requirement_versions` — Requirements
- `baselines`, `baseline_requirements` — Frozen snapshots
- `generation_runs` — AI job tracking
- `scenarios`, `scenario_versions`, `scenario_requirements` — Scenarios
- `test_cases` — Executable steps
- `review_decisions` — Append-only audit
- `mcp_connections`, `mcp_call_logs` — MCP integration
- `export_jobs`, `audit_events`, `outbox_events` — Ops

### API Layer (NestJS)
- Base path: `/api/v1`
- Cursor-based pagination, UUID IDs, ISO8601 dates
- Idempotency-Key header untuk jobs
- RFC 9457 error responses
- 30+ endpoints (lihat PRD section 12.1)

### AI Generation Pipeline
1. User trigger → API enqueue (202 Accepted)
2. Worker claim → Load baseline → Fetch context
3. AI generate → Validate JSON (Zod) → Check duplicates
4. Persist drafts → Update run status
5. QA review → Approve/Reject → Coverage update

### Security
- Tenant/project isolation via composite FKs + RLS
- OIDC auth, no password storage
- Self-approval prohibited (segregation policy)
- Immutable version hashes (SHA-256)
- Audit trail untuk semua aksi sensitif
- Prompt injection protection (untrusted data boundary)


# File Structure

### New Project: `com.sndw-ai-qa`
```
com.sndw-ai-qa/
├── pnpm-workspace.yaml
├── turbo.json
├── docker-compose.yml              # PostgreSQL, Redis, MinIO
├── .env.example
├── .nvmrc
│
├── apps/
│   ├── web/                        # Next.js 15 App Router
│   │   ├── src/
│   │   │   ├── app/                # Routes (login, projects, scenarios, dll)
│   │   │   ├── components/         # Shared UI (layout, ui)
│   │   │   ├── features/           # Feature modules
│   │   │   │   ├── auth/           # M01: Login, OIDC
│   │   │   │   ├── organization/   # M01: Tenant, Members
│   │   │   │   ├── projects/       # M01: Project CRUD
│   │   │   │   ├── sources/        # M02: Document upload, parse
│   │   │   │   ├── requirements/   # M02: Requirements, baselines
│   │   │   │   ├── generation/     # M04: AI generation runs
│   │   │   │   ├── scenarios/      # M05: Scenario CRUD, traceability
│   │   │   │   ├── review/         # M06: Review workflow
│   │   │   │   ├── coverage/       # M07: Dashboard, metrics
│   │   │   │   ├── export/         # M07: Export jobs
│   │   │   │   ├── mcp/            # M03: MCP connections
│   │   │   │   └── dashboard/      # Overview
│   │   │   ├── hooks/              # Global hooks
│   │   │   ├── lib/                # HTTP client, utils
│   │   │   ├── providers/          # QueryProvider, AuthProvider
│   │   │   ├── styles/             # globals.css
│   │   │   └── types/              # TypeScript types
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── api/                        # NestJS REST API
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # OIDC, guards
│   │   │   │   ├── tenant/         # Tenant management
│   │   │   │   ├── project/        # Project CRUD
│   │   │   │   ├── membership/     # RBAC
│   │   │   │   ├── source/         # Document upload/parse
│   │   │   │   ├── requirement/    # Requirements
│   │   │   │   ├── baseline/       # Baselines
│   │   │   │   ├── generation/     # Generation runs
│   │   │   │   ├── scenario/       # Scenarios
│   │   │   │   ├── review/         # Review decisions
│   │   │   │   ├── coverage/       # Coverage metrics
│   │   │   │   ├── export/         # Export jobs
│   │   │   │   ├── mcp/            # MCP connections
│   │   │   │   ├── audit/          # Audit events
│   │   │   │   └── health/         # Health checks
│   │   │   ├── common/             # Guards, interceptors, filters
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── worker/                     # BullMQ processors
│       ├── src/
│       │   ├── processors/
│       │   │   ├── generation.processor.ts
│       │   │   ├── document-parse.processor.ts
│       │   │   └── export.processor.ts
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   ├── database/                   # Prisma schema, migrations
│   │   ├── prisma/schema.prisma
│   │   └── package.json
│   ├── contracts/                  # Zod schemas, DTOs
│   │   ├── src/
│   │   │   ├── auth.dto.ts
│   │   │   ├── project.dto.ts
│   │   │   ├── source.dto.ts
│   │   │   ├── requirement.dto.ts
│   │   │   ├── scenario.dto.ts
│   │   │   └── review.dto.ts
│   │   └── package.json
│   ├── ai-core/                    # AI provider adapter
│   │   ├── src/
│   │   │   ├── providers/
│   │   │   ├── prompts/
│   │   │   └── validator.ts
│   │   └── package.json
│   ├── qa-domain/                  # Domain logic
│   │   ├── src/
│   │   │   ├── coverage.ts
│   │   │   ├── dedupe.ts
│   │   │   └── review.ts
│   │   └── package.json
│   ├── mcp-gateway/                # MCP client
│   │   ├── src/
│   │   │   ├── client.ts
│   │   │   └── policy.ts
│   │   └── package.json
│   ├── authz/                      # Permission engine
│   │   ├── src/
│   │   │   ├── permissions.ts
│   │   │   └── guards.ts
│   │   └── package.json
│   └── ui/                         # Shared design system
│       ├── src/
│       │   ├── components/
│       │   └── styles/
│       └── package.json
│
├── infra/
│   ├── docker/
│   └── monitoring/
├── tests/
│   ├── contract/
│   ├── integration/
│   └── e2e/
└── docs/
    ├── adr/
    └── api/openapi.yaml
```

# Delivery Steps

###   Step 1: Setup monorepo & infrastructure
Inisialisasi monorepo pnpm workspaces dengan struktur apps/ dan packages/ sesuai PRD.

- Buat folder `com.sndw-ai-qa` dengan `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc`
- Setup `docker-compose.yml` untuk PostgreSQL, Redis, MinIO (S3-compatible)
- Buat `packages/database` dengan Prisma schema (20+ tabel dari PRD section 11.3)
- Buat `packages/contracts` dengan Zod DTOs (auth, project, source, requirement, scenario, review)
- Buat `packages/authz` dengan permission engine (role-based, tenant/project scoped)
- Buat `.env.example` dengan semua variabel environment
- Setup CI pipeline dasar (lint, typecheck, test)

###   Step 2: Apps API — NestJS foundation & Auth module
Setup NestJS backend dengan Auth, Tenant, Project, dan Membership modules.

- Inisialisasi `apps/api` dengan NestJS CLI
- Implementasi `AuthModule`: OIDC strategy, JWT guard, AccessContext
- Implementasi `TenantModule`: CRUD tenant, tenant isolation
- Implementasi `ProjectModule`: CRUD project, project status
- Implementasi `MembershipModule`: Tenant membership, Project membership, RBAC
- Implementasi `HealthModule`: Liveness dan readiness checks
- Buat common guards (`@RequirePermission`), interceptors, dan exception filters
- Setup Prisma service, migration pipeline
- API endpoints: `/me`, `/projects`, `/projects/:id`, `/health`

###   Step 3: Apps API — Source, Requirement & Baseline modules
Implementasi modul untuk manage dokumen source, requirements, dan baselines.

- Implementasi `SourceModule`: Upload dokumen (MD/TXT/DOCX/PDF), parse ke sections, versioning
- Implementasi `RequirementModule`: CRUD requirement, immutable versions, review status
- Implementasi `BaselineModule`: Freeze baseline, link requirement versions
- Setup S3 integration untuk object storage (signed URLs, checksum verification)
- Implementasi document parser (Markdown headings → sections)
- API endpoints: `/documents`, `/documents/:id/versions`, `/requirements`, `/baselines`
- Setup BullMQ queue infrastructure (`document.parse` queue)

###   Step 4: Apps API — Generation, Scenario & Review modules
Implementasi modul AI generation, scenario management, dan review workflow.

- Implementasi `GenerationModule`: Enqueue generation run, idempotency, status tracking
- Implementasi `ScenarioModule`: CRUD scenario, versioning, traceability (scenario ↔ requirement)
- Implementasi `ReviewModule`: Submit review, approve/reject/request changes, segregation policy
- Implementasi `CoverageModule`: Requirement coverage metrics, gap detection
- Implementasi `ExportModule`: JSON/CSV/Markdown export jobs
- Implementasi `AuditModule`: Audit event logging
- API endpoints: `/generation-runs`, `/scenarios`, `/scenario-versions/:id/decision`, `/coverage`, `/exports`
- Setup `ai.generation` dan `export.build` queues

###   Step 5: Apps Worker — AI generation processor
Implementasi BullMQ worker untuk proses AI generation async.

- Inisialisasi `apps/worker` dengan BullMQ
- Implementasi `GenerationProcessor`: Claim run → Load baseline → AI generate → Validate → Persist
- Buat `packages/ai-core`: AI provider adapter (OpenAI/Anthropic), prompt registry, Zod validation
- Implementasi multi-stage pipeline: Extraction → Technique selection → Generation → Validation
- Implementasi `ScenarioValidationService`: Schema check, traceability, duplicate detection
- Implementasi `packages/qa-domain`: Coverage calculation, dedupe logic, review logic
- Setup retry policy, dead-letter queue, cancellation handling
- Implementasi `DocumentParseProcessor` dan `ExportProcessor`

###   Step 6: Apps Web — Next.js setup & Auth UI
Setup Next.js frontend dengan auth, layout, dan basic navigation.

- Inisialisasi `apps/web` dengan Next.js 15 App Router + TypeScript + Tailwind CSS 4
- Setup design tokens Sundawa People (Navy, Brand Blue, Gold, Montserrat font)
- Implementasi `features/auth`: Login page (OIDC), AuthLayout (split-screen branding)
- Implementasi `features/organization`: Member management, invite
- Implementasi `features/projects`: Project CRUD, project list
- Buat layout komponen: Sidebar (role-based nav), Topbar (search, notifications, user menu)
- Setup API client layer (Axios + interceptors) ke NestJS backend
- Setup React Query provider, Zustand store untuk auth state
- Routes: `/sign-in`, `/app`, `/app/projects`, `/app/org/members`

###   Step 7: Apps Web — Source, Requirements & Generation UI
Implementasi UI untuk upload dokumen, manage requirements, dan trigger AI generation.

- Implementasi `features/sources`: Upload dokumen (drag & drop), document list, version history, section viewer
- Implementasi `features/requirements`: Requirement CRUD, version history, baseline management
- Implementasi `features/generation`: Configure generation (select baseline, mode, options), run status tracker
- Buat shared UI components: FileUpload, DataTable, Modal, Select, Badge, StatusIndicator
- Implementasi polling/WebSocket untuk real-time generation status
- Routes: `/app/projects/:id/sources`, `/app/projects/:id/requirements`, `/app/projects/:id/generation`

###   Step 8: Apps Web — Scenarios, Review & Coverage UI
Implementasi UI untuk scenario management, review workflow, dan coverage dashboard.

- Implementasi `features/scenarios`: Scenario list (filter/search), scenario detail, version diff
- Implementasi `features/review`: Review queue, approve/reject modal dengan komentar, segregation enforcement
- Implementasi `features/coverage`: Coverage dashboard (metrics, gap detection, requirement coverage table)
- Implementasi `features/export`: Export list, request export, download
- Implementasi `features/dashboard`: Project overview (stats, recent activity, quick actions)
- Routes: `/app/projects/:id/scenarios`, `/app/projects/:id/coverage`, `/app/projects/:id/exports`
- Setup PWA (manifest, service worker)