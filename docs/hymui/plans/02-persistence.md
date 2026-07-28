# Plan 02 — Persistence and Identity

> Plan ID: `PER-002`  
> Status: in progress  
> Target: durable runtime milestone  
> Depends on: [Plan 01 — Foundation](01-foundation.md), [Architecture](../architecture.md)

## Outcome

Hymui gains provider-neutral, durable persistence for application state,
accounts, sessions, Projects, jobs, and binary objects. Local works without
Docker through PGlite and the local filesystem. The same contracts support
PostgreSQL for Hosted and PostgreSQL, MySQL, and MariaDB for Self-hosted
deployments.

At the end of this plan, a person can create an owner account or continue with
an account-free Local profile, sign in through a secure persisted session,
create a Project, restart Hymui, and find the authorized Project again.
Restarting the API and Worker also does not lose a diagnostic job or its
history. A stored object can be read through the storage port with validated
metadata and an integrity checksum.

## Current checkpoint

Implementation slices 1–6 are complete for the Local/PGlite path:

- provider-neutral account, session, Project, job, and migration repositories
- versioned, checksum-verified PGlite migration
- immutable Actor IDs and normalized usernames
- Argon2id password hashes and hashed session tokens
- HttpOnly, SameSite sessions with logout invalidation
- explicit password-free Local profile
- owner-authorized Project creation, listing, and revision records
- Web login/profile screen and persistent Project cards
- durable diagnostic jobs with authenticated Worker leases
- heartbeat, cancellation, stale-lease recovery, and duplicate-completion guards
- persisted attempt history and correlation IDs across Worker restarts
- local filesystem object storage with opaque hashed paths
- streamed SHA-256 integrity checks and durable object metadata
- idempotent object deletion and explicit unsupported signed-access behavior
- owner-authorized Project attachment metadata and API routes
- Project attachment upload, listing, integrity-checked download, and deletion
- a reusable Project attachment interface in the English and German Web app
- guarded deletion of archived Projects with exact-name and revision confirmation

The complete Plan 02 remains in progress. PostgreSQL/MySQL/MariaDB adapters,
cloud object-storage adapters, and the full CI matrix are the next slices.

## Non-goals

This plan does not implement:

- multi-workspace roles beyond the first Project owner boundary
- Board, Docs, or Planner records
- passkeys, two-factor authentication, OIDC, or federation
- the macOS/Linux local launcher
- cloud deployment, backups, or production operational tooling
- plugin persistence APIs
- agent execution or AI provider integrations

The persistence contracts must be ready for those later features, but must not
invent their domain schema early.

## Target workspace

```text
apps/
  api/                  selects database and storage adapters at startup
  worker/               claims and completes durable jobs
packages/
  db/                   repository ports, migrations, Drizzle adapters
  storage/              object-storage port and adapters
  core/                 provider-neutral entities and job state transitions
  contracts/            versioned API and event schemas
```

`packages/db` and `packages/storage` expose public interfaces only. Apps and
future features import those interfaces, never an adapter implementation or
Drizzle directly.

## Work packages

### PER-002.1 — Persistence contracts and package boundaries

Progress: the public `@hymui/db` and `@hymui/storage` packages, stable error
types, and runtime adapter selection are in place. Concrete adapters and their
contract suites follow in the next slices.

- add `@hymui/db` and `@hymui/storage` workspace packages
- define repository ports for migrations, transaction boundaries, job records,
  and diagnostic run history
- define a storage port for write, read, stat, delete, and signed access
- make metadata include content type, byte length, checksum, creation time,
  and opaque object key
- keep provider client types and provider error classes private to adapters
- add architecture-boundary checks for forbidden adapter imports

Acceptance:

- Core, Web, and Contracts do not depend on Drizzle or a storage SDK
- all persistence failures map to stable domain error codes
- one contract suite can run against any database or storage adapter

### PER-002.2 — Schema and domain migrations

- establish one versioned schema source and generated migration workflow
- create only the durable tables needed now: schema metadata, actors,
  sessions, Projects, and diagnostic jobs
- represent migrations with stable identifiers, checksums, ordering, and
  transactional application where the database supports it
- detect a changed, missing, or out-of-order applied migration before startup
- provide commands to inspect, apply, and verify migration state

Acceptance:

- a blank database reaches the current schema through migrations alone
- repeated migration application is safe
- an incompatible migration state blocks startup with an actionable error
- migration tests exercise upgrade from the prior schema version

### PER-002.3 — Database adapters and edition selection

- implement PGlite for Local with data held in an explicitly configured local
  directory
- implement PostgreSQL as the Hosted reference adapter
- implement PostgreSQL, MySQL, and MariaDB adapters for Self-hosted
- define experimental Microsoft SQL Server adapter contract coverage without
  making it a supported production target
- select adapters exclusively through validated runtime configuration
- report adapter kind, schema version, and readiness in backend diagnostics

Acceptance:

- Local starts with PGlite and no Docker or cloud account
- supported adapters pass the same repository contract suite
- unsupported adapter and edition combinations fail before serving traffic
- no database credentials or connection details reach the browser

### PER-002.4 — Actor identity, login, and Project ownership

Progress: the first contracts, PGlite records, Argon2id password hashing,
HttpOnly sessions, and owner-authorized Project endpoints are implemented.

- persist immutable Actor IDs separately from usernames and display names
- allow Local to create an account-free local profile
- support initial owner registration and username/password login
- hash passwords with Argon2id and store only session-token hashes
- issue HttpOnly, SameSite session cookies and invalidate them on logout
- require authentication for Project reads and mutations
- persist the first Project record with owner authorization and revision checks

Acceptance:

- passwords and raw session tokens are never stored or returned
- Local remains usable without a password through its explicit local profile
- unauthenticated Project requests return a stable `AUTH_REQUIRED` error
- one actor cannot read or mutate another actor's Projects
- Project data survives API restart on the Local PGlite path

### PER-002.5 — Durable job transport

Progress: the API now owns the durable queue, while Workers claim jobs through
an internally authenticated lease API. PGlite is opened by only one process in
Local, avoiding unsafe concurrent embedded-database access.

- replace Plan 01's development transport with a database-backed `JobTransport`
- persist enqueue, cancellation, claim, heartbeat, retry, completion, and
  structured failure transitions
- make claim and retry semantics safe for concurrent workers
- preserve the correlation ID from Web through API and Worker records
- make the existing diagnostic job recoverable after API or Worker restart
- retain job history for diagnostic inspection under a documented local policy

Acceptance:

- the diagnostic job reaches `queued`, `running`, and `completed` durably
- a cancelled job is not claimed again
- a worker interruption leaves the job recoverable or fails it visibly
- duplicate delivery cannot complete the same attempt twice

### PER-002.6 — Object storage adapters

Progress: the Local filesystem adapter is implemented with streamed writes,
opaque key hashing, metadata sidecars, SHA-256 verification during reads,
idempotent deletion, and adapter contract tests. GCS and S3-compatible adapters
remain pending.

- implement a local-filesystem adapter with a configured root outside source
  control
- implement Google Cloud Storage and S3-compatible adapters behind the same
  storage port
- use opaque object keys; never expose provider paths or credentials in API
  responses
- calculate and verify checksums while writing streamed content
- define signed-access semantics and an explicit unsupported result where an
  adapter cannot provide them
- ensure delete is idempotent and metadata is removed consistently

Acceptance:

- an object written through one adapter can be read and verified through its
  contract suite
- modified object content is detected by checksum verification
- missing objects return a stable not-found error
- Local storage works with no cloud configuration

### PER-002.7 — Runtime wiring and diagnostics

- wire selected repositories and storage into API and Worker composition roots
- run and verify database migrations before an application declares readiness
- replace the temporary diagnostic state with durable job and history reads
- add readiness checks that distinguish configuration, migration, database,
  queue, and storage failures
- document local data locations and safe reset procedures without deleting
  unvalidated paths

Acceptance:

- API and Worker reject readiness until their required adapters are available
- restarting all runtime applications preserves a completed diagnostic history
- diagnostics identify the failing persistence layer without revealing secrets

### PER-002.8 — Test and CI matrix

- unit-test ports, state transitions, error mapping, and object metadata
- run repository and storage contract suites for every locally practical adapter
- add migration upgrade, concurrent job-claim, restart-recovery, and checksum
  integration tests
- retain a browser flow that submits and observes the durable diagnostic job
- use service containers in CI for PostgreSQL, MySQL, and MariaDB where needed
- isolate Microsoft SQL Server coverage as experimental and non-blocking until
  its adapter is declared supported

Acceptance:

- root verification remains deterministic for the Local/PGlite path
- CI identifies the adapter and contract that fails
- a breaking repository, migration, or storage change cannot merge unnoticed

### PER-002.9 — Developer documentation

- document adapter support and edition compatibility
- document migration workflow, rollback policy, and local reset procedure
- document storage configuration, key handling, and checksum behavior
- document how a future feature adds a repository and migration safely
- document the test matrix and required services for adapter verification

Acceptance:

- a contributor can run Local persistence from repository documentation alone
- an operator can identify whether a failed startup is configuration, schema,
  database, job, or storage related

## Implementation slices

1. persistence packages, ports, and contract suites
2. schema source, migrations, and PGlite Local path
3. Actor, account, session, and owner-authorized Project vertical slice
4. durable diagnostic jobs and restart recovery
5. local filesystem storage and object integrity flow
6. Project attachment metadata, authorization, API, and Web workflow
7. PostgreSQL reference adapter and Hosted wiring
8. Self-hosted PostgreSQL, MySQL, and MariaDB matrix
9. cloud and S3-compatible storage adapters, diagnostics, CI, and docs

Each slice must keep the PGlite Local path buildable and verified. Add a new
provider only after the provider-neutral contract suite is passing.

## Required root commands

Plan 01 commands remain available. Add or refine commands so the root provides:

```text
pnpm db:migrate
pnpm db:status
pnpm test:migrations
pnpm test:adapters
pnpm test:integration
pnpm verify
```

The default `pnpm verify` must not require Docker, cloud credentials, or an
externally running database.

## Definition of done

Plan 02 is complete only when:

- Local runs durably on PGlite and the local filesystem without Docker
- Local supports both an explicit local profile and a password-backed owner
- Hosted and Self-hosted can use persisted login sessions
- an authenticated actor can create and reload only authorized Projects
- supported database adapters pass one repository contract suite
- storage adapters implement streaming, metadata, checksums, deletion, and
  signed-access semantics through one port
- migrations are versioned, checked, and tested against upgrades
- the diagnostic job survives process restart and preserves its correlation ID
- API and Worker diagnostics distinguish persistence-layer failures safely
- CI covers migrations, adapter contracts, job recovery, and browser flow
- developer and operator documentation match the actual commands and behavior

## Next plan

Plan 03 introduces the Local launcher for macOS first, Linux second, using the
durable Local adapters established here. It then expands identity into
workspace memberships, roles, passkeys, two-factor authentication, and
federation proofs.
