# Projects Plan

> Status: planned core model  
> Role: default Hymui entry point

## Goal

A project is the shared context for people, goals, content, work, links, and AI
agents. Projects must work for technical and non-technical use cases.

## Content model

A project can contain:

- Boards
- Markdown Docs
- Planner items and milestones
- external links and repository links
- agent runs, proposals, approvals, and artifacts
- plugin-defined item types such as a future Whiteboard

Items are linked to a project, not copied. Removing a link does not delete the
content. Deleting a project requires an explicit decision about its items and
defaults to preserving exportable content.

## Folders

- items may live at project root or in one folder
- exactly one folder level is supported initially
- a folder can contain Docs, Boards, links, and future plugin item types
- moving an item changes organization, not ownership or identity

The one-level constraint keeps navigation predictable while leaving the model
open to deeper trees in a future contract version.

## Links and repositories

Projects accept normal HTTPS links and optional repository connections.
Repository providers live behind an adapter and never become a requirement for
using Projects.

Secrets are stored server-side. The UI receives provider status and permitted
actions, never access tokens.

## Navigation

- the Hymui logo opens Projects
- Projects is the application home and does not need a duplicate navbar item
- primary product navigation exposes Planner, Board, and Docs
- opening an item retains project context and offers a route back

## Core records

```text
Project
ProjectFolder
ProjectItem
ProjectLink
ProjectMembership
```

`ProjectItem` uses a versioned type discriminator and references a concrete
item. Database constraints and service validation prevent one item from being
assigned to conflicting projects.

## Authorization

Every list, option picker, search result, deadline aggregation, and direct item
request applies the same project authorization policy. Admin status does not
implicitly reveal private content unless the deployment policy explicitly
grants that capability.

## Delivery stages

1. project CRUD, membership, and visibility
2. one-level folders
3. Board and Doc links
4. deadlines and Planner aggregation
5. external links and repository adapters
6. agent context and plugin-defined project items
