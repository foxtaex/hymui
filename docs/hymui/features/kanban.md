# Board Plan

> Status: planned product area  
> Parent model: Project

## Goal

Board provides flexible Kanban planning without making Kanban the product's
top-level data model. A project may contain multiple boards, and cards can link
to Docs and Planner entries.

## Core behavior

### Boards

- create, rename, reorder, duplicate, and archive boards
- configure visibility, language, appearance, and defaults
- place a board directly in a project or in one project folder
- search within one board or across authorized project content

### Columns

- create, rename, reorder, and delete columns
- configure optional work-in-progress limits
- move cards with pointer, touch, or keyboard
- provide a dedicated Archive column

### Cards

- title, optional Markdown body, labels, assignees, due dates, and checklist
- stable ordering within and between columns
- a linked Doc can act as the card description
- linked Docs can instead appear as attachments with a Docs icon and title
- code fences support language-aware syntax highlighting
- archive and restore while retaining the originating board
- show project, board, and source context outside the board

## Archive

Archiving removes a card from active columns but does not delete it. The
Archive column can filter by originating board. Restoring a card asks for the
destination board and column, defaulting to its previous location when it
still exists.

## Data boundaries

```text
Board
  Column
    Card
      CardDocLink
      CardAttachment
      ChecklistItem
      LabelAssignment
```

Positions use a sortable key that avoids rewriting every sibling during normal
drag and drop. All mutations are authorized by project membership and use
optimistic concurrency to avoid silent overwrites.

## API surface

```text
GET    /api/v1/projects/:projectId/boards
POST   /api/v1/projects/:projectId/boards
GET    /api/v1/boards/:boardId
PATCH  /api/v1/boards/:boardId
POST   /api/v1/boards/:boardId/columns
POST   /api/v1/columns/:columnId/cards
PATCH  /api/v1/cards/:cardId
POST   /api/v1/cards/:cardId/move
POST   /api/v1/cards/:cardId/archive
POST   /api/v1/cards/:cardId/restore
```

The exact wire format belongs to the versioned contracts package.

## UI requirements

- an icon-only create action has an accessible label and visible tooltip
- empty, loading, permission, and failure states are explicit
- long sessions recover from expired requests without trapping navigation
- filters and search never request fields unsupported by an active database
  adapter
- narrow screens scroll columns horizontally without hiding card actions

## Delivery stages

1. board, column, and card CRUD
2. accessible drag and drop plus conflict handling
3. archive and restore
4. Docs descriptions and attachments
5. search, filters, labels, assignees, and due dates
6. templates, WIP limits, and cross-board relations
