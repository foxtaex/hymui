# Planner Plan

> Status: planned product area  
> Views: Agenda, Calendar, and Timeline

## Goal

Planner combines dates from projects, board cards, and standalone events. Every
item clearly shows what it is and where it came from.

## Source types

| Type | Source | Display |
| --- | --- | --- |
| Project deadline | Project | Project badge and project link |
| Card due date | Board card | Card badge, board name, and card link |
| Event | Planner | Event badge and optional project link |
| Milestone | Project | Milestone badge and project link |

Source-backed items update their source instead of creating a disconnected
copy. Removing a date removes the Planner occurrence but not the source object.

## Views

- **Agenda:** chronological, grouped list optimized for quick scanning
- **Month:** compact calendar with overflow handling
- **Week/Day:** time slots with timezone-safe positioning
- **Timeline:** projects, phases, and milestones across a date range

## Event behavior

- title, Markdown notes, start, end, all-day mode, timezone, and color
- optional project relation
- recurring rules with an explicit timezone
- reminders stored independently from delivery providers
- pointer and keyboard rescheduling
- iCalendar import and export

## Data model

Planner returns a normalized read model while keeping source ownership:

```typescript
type PlannerItem =
  | ProjectDeadlineItem
  | CardDueDateItem
  | EventItem
  | MilestoneItem;
```

Every item includes a stable ID, source type, source link, time range, timezone,
visibility context, and revision.

## API surface

```text
GET    /api/v1/planner/items
POST   /api/v1/events
PATCH  /api/v1/events/:eventId
DELETE /api/v1/events/:eventId
POST   /api/v1/events/:eventId/move
POST   /api/v1/planner/import
GET    /api/v1/planner/export
```

## Quality requirements

- store instants and timezone identifiers explicitly
- test daylight-saving transitions
- localize dates without localizing stored values
- show source badges in every view, not only detail dialogs
- preserve navigation and unsaved state during long sessions
- authorize source objects before including them in aggregated Planner results

## Delivery stages

1. Agenda with project and card dates
2. standalone event CRUD
3. Month, Week, and Day views
4. drag and drop, reminders, and recurring events
5. Timeline, milestones, and iCalendar exchange
6. approval-gated AI scheduling suggestions
