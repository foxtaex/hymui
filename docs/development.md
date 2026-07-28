# Hymui Development

## Prerequisites

- Node.js 24 LTS is recommended; Node.js 22 remains compatible.
- pnpm 11
- macOS or Linux

Docker and a cloud account are not required for Foundation development.

## First run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://127.0.0.1:3000`.

The development command starts:

- Nuxt Web at `127.0.0.1:3000`
- Fastify API at `127.0.0.1:4000`
- the separate Worker at `127.0.0.1:4001`

On first launch, choose one identity mode:

- create the initial Owner account with username and password, or
- continue with the explicit password-free Local profile.

The two modes are intentionally exclusive for the first Local installation. Passwords are hashed
with Argon2id. Browser sessions use an HttpOnly, SameSite cookie; only its SHA-256 token hash is
persisted.

Create a Project and reload the page to exercise the first durable PGlite flow. Use the Foundation
diagnostic in the Projects screen to exercise one complete Web → API → Worker job.

The Worker does not open the Local PGlite file. It claims durable jobs from the API through an
internal lease endpoint, heartbeats long work, and completes with a one-time lease token. Configure
the shared server-side secret through `HYMUI_INTERNAL_TOKEN`; it must contain at least 24 characters
and must never use the `NUXT_PUBLIC_` prefix.

If a Worker stops while a job is running, the claim becomes eligible after its lease expires.
Another Worker can then resume it as a new persisted attempt. Cancelled and completed jobs remain
terminal and stale completion calls are rejected.

## Local persistence

The default development data lives below `.hymui/` and is ignored by Git:

```text
.hymui/
  data/                 PGlite data directory
  objects/              reserved Local object-storage directory
```

Override the database location with `HYMUI_DATABASE_URL` and the storage root with
`HYMUI_STORAGE_PATH`. Use explicit, dedicated directories only.

To reset an intentionally disposable development instance, first stop Hymui, verify that the target
is this repository's `.hymui` directory, and then move that directory to the Trash. Never point a
reset operation at a home, workspace, or repository root.

## Verification

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run every non-browser check with:

```bash
pnpm verify
```

Install Playwright Chromium once and run the browser smoke test:

```bash
pnpm exec playwright install chromium
pnpm test:browser
```

## Workspace boundaries

Applications under `apps/` are independently runnable. They may use public packages under
`packages/`, but they must not import another application's private source.

Vue components receive state through typed props and events. They never access databases, object
stores, AI providers, or repository hosts directly.

All visual styles live in standalone SCSS. Vue and TypeScript files do not contain local style
blocks or CSS strings.

## Animation standard

Use [Motion for Vue](https://motion.dev/docs/vue) (`motion-v`) for stateful product animation:

- layout and shared-layout transitions
- enter and exit orchestration
- drag, press, hover, and touch gestures
- reorderable content
- scroll-linked or interruptible animation
- spring-based Liquid Glass movement

Keep static colors, spacing, typography, surfaces, and responsive layout in standalone SCSS. Simple
self-contained effects such as a color change on hover remain CSS transitions. Do not duplicate the
same interaction in Motion and CSS.

Every Motion interaction must respect reduced-motion preferences. Prefer transform and opacity, keep
animation interruptible, and never delay access to content or actions until an animation finishes.

## Environment

Copy `.env.example` for the documented development defaults. Runtime configuration is validated
before API or Worker startup.

Browser-visible values use Nuxt's `NUXT_PUBLIC_` prefix. Secrets must never use that prefix and must
not be returned from an API diagnostics route.

## Local object storage

Local binary content uses the filesystem adapter selected by `HYMUI_STORAGE_DRIVER=filesystem`. Set
`HYMUI_STORAGE_PATH` to its dedicated runtime directory; the development example uses
`./.hymui/storage`, which is ignored by Git.

Object keys are opaque identifiers. The adapter hashes them before resolving a filesystem path,
streams writes through SHA-256, and verifies both byte length and checksum while reading. Metadata
contains the content type, byte length, checksum, creation time, and original opaque key.

The Project overview can attach files up to 20 MB. The API stores only owner-authorized attachment
metadata in PGlite; binary content stays behind the storage port. Upload, list, download, and delete
requests all require the Project owner's persisted session.

Run the portable adapter checks with:

```bash
pnpm test:adapters
```

To reset local storage, stop Hymui first and remove only the exact configured `HYMUI_STORAGE_PATH`.
Never point this setting at a repository root, home directory, or another shared folder.

## Troubleshooting

Hymui is a pnpm workspace. Run `pnpm install`, never `npm install`. npm cannot safely manage the
existing pnpm symlink layout and older npm Arborist releases may fail with
`Cannot read properties of null (reading 'matches')`. The root `devEngines` guard now stops npm
before dependency resolution with a package-manager error. If npm was already attempted, restore the
intended dependency graph with:

```bash
pnpm install --frozen-lockfile
```

If a port is already occupied, stop the existing process on `3000`, `4000`, or `4001` before
starting Hymui again. Do not silently move only one service to a different port because the public
API and Worker URLs are validated as one runtime configuration.

`pnpm dev` stops all three child processes when one process fails. Read the first named log line
from `web`, `api`, or `worker`, fix that service, and restart the root command.

If package installation reports ignored native builds, keep the explicit `allowBuilds` entries in
`pnpm-workspace.yaml` and run `pnpm install` again. Do not approve arbitrary dependency scripts.

## Adding a workspace package

1. Create the package below `packages/` with a unique `@hymui/*` name.
2. Extend `tsconfig.base.json` and expose only a public `src/index.ts`.
3. Add `build`, `typecheck`, and `test` scripts so root verification includes it.
4. Reference it with `workspace:*`; never import another package's private source.
5. Add at least one contract or unit test before consuming it from an application.

## Adding a reusable component

Place Vue primitives in `packages/ui/src/components`, export them from `packages/ui/src/index.ts`,
and keep every visual rule in `packages/ui/src/styles/index.scss` or a shared SCSS module.
Components must accept typed props and events, use translation input for visible text, and cover
focus, disabled, loading, and error states where relevant.
