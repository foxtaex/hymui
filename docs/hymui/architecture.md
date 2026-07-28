# Hymui Architecture Plan

> Status: planned foundation  
> Target version: `6.0.0-dev.0`  
> Updated: 2026-07-26

## Product boundary

Hymui is one project-planning product with three equal editions:

- **Local:** account-optional, offline-capable, and Docker-free
- **Self-hosted:** independently operated frontend, API, worker, database, and
  storage
- **Hosted:** managed by Hymui on Google Cloud

All editions use the same domain model, API contracts, web application, and
versioned `.hymui` archive format.

## Applications and packages

```text
apps/
  web/                  Nuxt 4 and Vue 3
  api/                  Fastify HTTP and realtime API
  worker/               agents and background jobs
  local/                macOS/Linux local launcher
packages/
  core/                 provider-neutral domain logic
  contracts/            versioned API and event schemas
  ui/                   reusable Vue components
  styles/               tokens, themes, and SCSS modules
  i18n/                 English and German messages
  plugin-sdk/           stable extension contracts
  db/                   repository ports and adapters
  storage/              storage port and adapters
  agents/               agent runtime and approval policies
```

Frontend, backend, and worker remain separate applications even when Local
starts them together. Vue components never access a database, object store, AI
provider, or repository host directly.

## Technology decisions

- Nuxt 4, Vue 3, and TypeScript for the web application
- Fastify and TypeScript for the backend
- a separate worker process for agents and long-running jobs
- Drizzle behind repository interfaces for data access
- PGlite for Local
- PostgreSQL, MySQL, and MariaDB for supported server deployments
- Microsoft SQL Server as an experimental adapter
- standalone SCSS files; no inline CSS or CSS-in-JS
- Motion for Vue (`motion-v`) for layout, presence, gesture, and spring animation
- contract, unit, integration, migration, and browser tests

## Hosted reference deployment

- Cloud Run services: web frontend and API
- Cloud Run background workloads: workers and bounded jobs
- Cloud SQL for PostgreSQL: primary relational database
- Cloud Storage: uploads, exports, and backups

Google Cloud is a deployment adapter, not a dependency of Hymui Core.
Self-hosted installations can use local storage or S3-compatible storage such
as MinIO.

## Portability contracts

Each supported database adapter must pass the same repository contract suite.
Schema changes are represented as domain migrations and tested against every
supported server database before release.

Every storage adapter implements the same operations for streaming, metadata,
checksums, deletion, and signed access. Exported `.hymui` archives contain no
provider-specific database dumps or object-store URLs.

## Security boundaries

- deny access by default
- authorize on the backend for every object and action
- keep immutable actor IDs separate from display names
- encrypt secrets at rest and never expose them to the frontend
- scope every agent run to explicit tools, data, budget, and time limits
- require human approval for external messages, commands, repository writes,
  destructive actions, and permission changes
- record auditable proposals, approvals, executions, and failures

## Extension model

Plugins integrate through versioned capabilities. A plugin declares its
permissions, UI slots, server hooks, events, and compatibility range. It cannot
import internal application modules or bypass authorization.

Reusable UI pieces are built like Lego: small primitives compose into feature
components, while product features depend on contracts instead of concrete
providers.

## Delivery order

1. monorepo boundaries and shared contracts
2. identical web app in Local, Self-hosted, and Hosted modes
3. database and storage contract suites
4. local launcher for macOS, then Linux
5. authentication, authorization, and decentralized actor IDs
6. resumable agent runtime with approvals
7. Projects, Board, Docs, Planner, and Settings
8. plugin SDK and federation proof

The architecture is newly designed, while proven product ideas from earlier
planning experiments can be carried forward.
