<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/logo/hymui/mark-subtle.svg">
    <img src="./public/logo/hymui/mark-vivid.svg" width="120" alt="Hymui logo">
  </picture>
  <h1>Hymui</h1>
  <p><strong>Plan anything. Together.</strong></p>
</div>

**English** · [Deutsch](./README.de.md)

Hymui is a local-first project planning tool where people and AI agents work
together on any kind of project. Boards, documents, schedules, links, and agent
runs belong to one connected project model instead of separate tools.

> [!IMPORTANT]
> **Hymui starts with a new codebase.** It carries forward useful product ideas
> and lessons from earlier planning experiments, while its architecture and
> implementation are designed from scratch.

Hymui is currently in its architecture and prototyping phase. There is no
installable Hymui release yet. This README describes the committed product
direction, not features that have already shipped.

## Why Hymui?

Project work is often spread across several services: requirements live in
documents, tasks on boards, dates in a calendar, and decisions in chats. AI
assistants are frequently added as yet another isolated conversation without
reliable project context, controlled tools, or traceable approvals.

People also have to choose between convenience and control:

- Hosted platforms are convenient, but often bind data and identities to one
  provider.
- Self-hosted software returns control, but commonly behaves like a different
  product.
- Local applications work offline, but are difficult to integrate into
  portable collaboration.
- AI automation can save time, but without clear boundaries it can create
  uncontrolled changes, costs, and risks.

Hymui is designed to remove these divisions:

- **One project model:** Board, Docs, Planner, links, and agents share the same
  context.
- **Local-first:** Personal projects work locally, offline, and without a
  mandatory account.
- **One application, three editions:** Local, Self-hosted, and Hosted use the
  same web app, API, and domain logic.
- **Portable instead of trapped:** Projects can be exported and restored
  through a database-neutral `.hymui` format.
- **Agents with boundaries:** Agents create reviewable proposals. People decide
  what is actually changed or sent outside Hymui.
- **Decentralized collaboration:** Self-hosted instances do not require a
  central Hymui user database.

## Why the name?

**Hymui** is intentionally not named after a single feature. It does not limit
the product to Kanban, software development, or AI. Hymui can therefore support
personal, creative, organizational, and technical projects without changing
its identity for every new use case.

The brand represents independent parts forming one working system: people,
projects, documents, boards, agents, plugins, and instances.

## The shared project model

A project provides the common frame for goals, participants, content, and work.
It can start empty or use a template and may contain:

- boards and cards
- Markdown documents
- Planner entries
- external links
- optional repository connections
- agent runs, proposals, and approvals

Software and web development will be the first extensive template and agent
pack. A project must nevertheless remain fully usable without a repository,
source code, or technical terminology.

## Planned product areas

### Board

- Kanban boards with freely sortable columns and cards
- archiving and restoration
- search across cards, metadata, and linked Docs
- Docs as card descriptions or attachments
- board settings for appearance, visibility, and language

### Docs

- Markdown editor and reader
- synchronized writing, preview, and split views
- safe Markdown rendering
- code blocks with syntax highlighting
- images and attachments
- robust persistence during long sessions

### Planner

- events and tasks originating from projects and board cards
- clear type and source indicators
- links back to the originating project, board, or card
- consistent language, time zone, and date formatting

### AI agents

Hymui does not treat an agent as an uncontrolled chat. Every run has a scope,
visible state, budget, set of permitted tools, and approval policy.

```text
Project goal
  -> agent analyzes the approved context
      -> agent creates a reviewable proposal
          -> a person reviews and approves it
              -> Hymui applies Docs, milestones, or cards
```

Planned general-purpose agent profiles:

- Goal Agent
- Planning Agent
- Research Agent
- Risk Agent
- Review Agent
- Documentation Agent

An optional development pack adds Requirements, Architecture, Repository,
Implementation, and Code Review agents.

Write operations, commands, repository changes, and external messages require
explicit approval. Agents cannot expand their own permissions.

## Three equal editions

| Edition | Intended for | Runtime and data |
| --- | --- | --- |
| **Local** | personal and fully local projects | Docker-free, PGlite, local filesystem, and offline operation |
| **Self-hosted** | teams on their own infrastructure | separate services, PostgreSQL/MySQL/MariaDB or experimental MSSQL, local or S3-compatible storage |
| **Hosted** | managed use without operating a server | Google Cloud Run, Cloud SQL for PostgreSQL, Cloud Storage, and managed backups |

The editions will not be developed as separate forks. Local starts the same
components together, while Self-hosted and Hosted can operate and scale them
independently.

## Local-first without lock-in

Every edition is intended to read and write the same versioned archive:

```text
workspace.hymui
  manifest.json
  data/
    records.ndjson
  uploads/
  checksums.json
```

The archive contains no database-specific SQL dumps. Tested import paths are
planned between PGlite, PostgreSQL, MySQL, MariaDB, and experimental Microsoft
SQL Server.

Local uses the filesystem. Hosted uses a native Google Cloud Storage adapter.
Self-hosted supports the filesystem and S3-compatible object storage, including
MinIO. All storage providers sit behind the same port so project archives stay
portable and Hymui's core does not depend on Google Cloud.

## Decentralized identity

An account belongs to its home instance. Self-hosted instances do not require a
central Hymui account. Visible Hymui identities use an unambiguous form:

```text
§hymui.example@bob
```

In the normal interface, an unambiguous local user may appear as `@bob`.
Invitations, backend operations, audit logs, and security-sensitive views
always use the complete identity or immutable Actor ID.

Federation is oriented around ActivityPub and adds a versioned Hymui profile
for projects, memberships, and approvals. Self-hosted instances can disable it
completely or control it through allowlists and blocklists.

## Target architecture

```text
Nuxt 4 / Vue 3 Frontend
          |
          | /api/v1 + Events
          v
Fastify Backend API
          |
          +-- Hymui Core
          +-- Agent Runtime
          +-- Database Ports
          +-- Storage Ports
          +-- Federation Port
          +-- Repository Port
          |
          v
       Worker
```

Committed foundations for the rebuild:

- **Frontend:** Nuxt 4, Vue 3, and TypeScript
- **Backend:** Fastify and TypeScript
- **Worker:** a separate process for agents and long-running background work
- **Data access:** Drizzle ORM behind a repository layer
- **Local database:** PGlite
- **Server databases:** PostgreSQL, MySQL, MariaDB, and experimental MSSQL
- **Styling:** standalone SCSS files
- **Languages:** English and German from the initial setup
- **Extensibility:** a plugin contract and extension points from the beginning
- **Quality:** unit, contract, integration, and browser tests

### Hosted reference deployment

Google Cloud is the reference platform for the managed Hosted edition:

- [Cloud Run](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run)
  runs the web frontend, API, and isolated background workloads.
- [Cloud SQL for PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/introduction)
  provides the managed primary database.
- [Cloud Storage](https://docs.cloud.google.com/storage/docs/introduction)
  stores uploads, exports, and backups.

These are deployment adapters, not dependencies of Hymui Core. Local and
Self-hosted editions remain fully supported without a Google Cloud account.

### Not part of the new foundation

- Astro
- React
- Prisma
- Tailwind
- CSS-in-JS
- inline CSS in Vue or TypeScript files
- application server logic in Nuxt routes

Frontend, backend, and worker remain separate applications even inside the
monorepo. Vue components never access databases, storage providers, or model
providers directly.

## Design principles

- calm, dark, slightly macOS-inspired, but platform-neutral
- reusable components instead of copied controls
- accessible by mouse, touch, and keyboard
- no hard-coded interface text outside the translation system
- central design tokens and standalone SCSS modules
- plugin-ready building blocks instead of hard-wired one-off solutions

## Development path

Hymui starts with technical proofs before product features:

1. an identical web app for Local, Self-hosted, and Hosted
2. separate frontend, backend, and worker applications
3. portable database and storage adapters
4. Docker-free Local packaging for macOS and Linux
5. controlled, cancellable, and resumable agent runs
6. federation between two independent instances
7. projects, Boards, Docs, and Planner only after those foundations work

This prevents portability, local operation, security, or provider neutrality
from being attached later to an architecture that can no longer support them
cleanly.

## Initial platform targets

- Web: modern browsers on macOS, Linux, and Windows
- Local/Desktop: macOS first, followed by Linux
- Windows Local/Desktop: after the first stable release
- Self-hosted: Docker Compose on amd64 and arm64

## Project status

Hymui is currently being designed and built from the ground up. Architecture
prototypes and contract tests come before the production interface. Earlier
product ideas may return when they fit the new foundations.

There is intentionally no Hymui installation guide yet. Setup, development,
self-hosting, backup, and update documentation will follow once the technical
prototype works reproducibly.

The planned SemVer version of the first development release is `6.0.0-dev.0`.

## Product plans

The active architecture and feature plans live in
[`docs/hymui`](./docs/hymui/README.md). They define the current Hymui product
direction and its new technical foundation.

## Contributing

At this early stage, feedback is especially useful around:

- local-first installation and updates
- database and storage portability
- safe agent approvals
- decentralized identity and federation
- accessible, reusable interface components
- general project templates beyond software development

No stable plugin or integration API has been published yet.
