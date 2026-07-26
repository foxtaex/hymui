# Plan 01 — Foundation

> Plan ID: `FND-001`  
> Status: ready  
> Target: first implementation milestone  
> Depends on: [Architecture](../architecture.md)

## Outcome

Hymui has one runnable, tested foundation for Local, Self-hosted, and Hosted.
The milestone proves the application boundaries and one complete
Web → API → Worker flow before product features or database adapters are added.

At the end of this plan, a contributor can clone the repository, run one
documented command, open the Hymui shell, and see a job travel through the
three applications.

## Non-goals

This plan does not implement:

- user accounts or federation
- Projects, Board, Docs, or Planner records
- production database or storage adapters
- AI model providers
- plugin installation
- desktop packaging
- Google Cloud deployment

Those features depend on the contracts established here.

## Target workspace

```text
apps/
  web/                  Nuxt 4 and Vue 3
  api/                  Fastify
  worker/               background process
packages/
  config/               validated runtime configuration
  contracts/            API, event, and error schemas
  core/                 provider-neutral domain primitives
  i18n/                 English and German messages
  styles/               tokens, themes, and SCSS
  ui/                   reusable Vue components
```

`apps/local` starts in a later milestone after the three runtime applications
work independently.

## Work packages

### FND-001.1 — Repository tooling

- initialize a `pnpm` workspace
- pin the supported Node.js LTS and pnpm versions
- add shared TypeScript configuration
- configure ESLint, Prettier, and EditorConfig
- add root commands for development, build, type checking, linting, and tests
- document setup without requiring global tools other than the pinned runtime

Acceptance:

- a fresh clone installs with the locked dependency graph
- every workspace package participates in root checks
- generated output, secrets, and local state are ignored by Git

### FND-001.2 — Application boundaries

- scaffold `apps/web`, `apps/api`, and `apps/worker`
- prevent applications from importing each other's private source
- allow applications to depend only on public workspace packages
- give each application an independent build and start command
- add graceful startup and shutdown behavior

Acceptance:

- all three applications build independently
- terminating development mode closes every child process
- architecture-boundary checks fail on forbidden imports

### FND-001.3 — Versioned contracts

- define a versioned `/api/v1` namespace
- define shared request, response, event, and error envelopes
- add runtime validation at every application boundary
- add `GET /api/v1/health`
- return version, edition, service state, and correlation ID
- generate or expose machine-readable API documentation from the same schemas

Acceptance:

- invalid input is rejected with a stable error code
- TypeScript types and runtime validation come from one contract source
- web and API contract tests detect a breaking schema change

### FND-001.4 — Runtime configuration

- define `local`, `self-hosted`, `hosted`, `development`, and `test` modes
- validate environment variables before an application starts
- expose only explicitly public configuration to the browser
- keep secrets server-side
- include edition and deployment mode in diagnostics

Acceptance:

- missing required configuration produces a clear startup error
- unknown configuration is reported
- Local development starts without Google Cloud or Docker

### FND-001.5 — Web shell and design foundation

- add the Hymui logo and responsive `AppShell`
- add English-first navigation with German translation support
- create initial color, spacing, typography, radius, and motion tokens
- implement styles in standalone SCSS files
- implement `HmButton`, `HmIconButton`, `HmInput`, `HmSelect`, and `HmPanel`
- cover keyboard, focus, disabled, loading, empty, and error states

Acceptance:

- no component or TypeScript file contains inline CSS
- primitives are reused by the shell instead of copied
- the shell works with keyboard navigation and reduced motion
- browser tests run once in English and once in German

### FND-001.6 — Worker proof

- define a provider-neutral job contract
- implement a temporary development transport behind a `JobTransport` port
- let the web shell submit a diagnostic job through the API
- process the job in the separate worker
- stream or poll its state until completion
- propagate correlation IDs across Web, API, and Worker

The development transport is disposable. Plan 02 replaces it with durable
database and queue adapters without changing the job contract.

Acceptance:

- a diagnostic job reaches `queued`, `running`, and `completed`
- cancellation reaches the worker
- a worker failure becomes a structured, visible error
- logs from all services share one correlation ID

### FND-001.7 — Test and CI baseline

- unit tests for Core, Config, and UI primitives
- contract tests for Web ↔ API and API ↔ Worker
- integration test for the diagnostic job
- browser smoke test for the Hymui shell
- CI checks for formatting, linting, types, tests, and builds
- macOS and Linux compatibility checks where runner support is practical

Acceptance:

- one root verification command reproduces required CI checks
- CI blocks broken contracts and forbidden imports
- test failures identify the responsible application or package

### FND-001.8 — Developer documentation

- add prerequisites and first-run instructions
- document the workspace boundaries and commands
- document configuration precedence
- add troubleshooting for occupied ports and failed child processes
- describe how a new package or reusable component is registered

Acceptance:

- a clean-machine setup follows only repository documentation
- every documented command is exercised in CI or a smoke script

## Implementation slices

Build the milestone as reviewable vertical slices:

1. workspace tooling and empty applications
2. shared contracts and health endpoint
3. configuration and edition modes
4. SCSS tokens, UI primitives, and application shell
5. diagnostic job across Web, API, and Worker
6. complete tests, CI, and developer documentation

Each slice must keep the repository buildable. Do not create a large
scaffolding commit followed by delayed fixes.

## Required root commands

The final command names may be refined during implementation, but the root
must provide these capabilities:

```text
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm test:integration
pnpm test:browser
pnpm verify
```

## Definition of done

Plan 01 is complete only when:

- `pnpm dev` starts Web, API, and Worker together
- each application also starts and builds independently
- the Hymui shell renders with the real logo and shared SCSS design tokens
- English and German switching affects the complete shell
- one diagnostic job completes across Web, API, and Worker
- Local development needs neither Docker nor a cloud account
- no provider-specific dependency exists in Hymui Core
- linting, type checks, tests, browser smoke tests, and builds pass
- setup and architecture documentation match the actual repository

## Next plan

Plan 02 establishes durable database, migration, job, and storage ports:

- PGlite for Local
- PostgreSQL as the Hosted reference
- PostgreSQL, MySQL, and MariaDB for Self-hosted
- experimental Microsoft SQL Server contract coverage
- local filesystem, Google Cloud Storage, and S3-compatible storage
