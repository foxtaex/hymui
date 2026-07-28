# Hymui Component Plan

> Status: planned registry  
> Rule: add a component here before treating its public API as stable.

## Component layers

### Primitives

| Component | Purpose |
| --- | --- |
| `HmButton` | button and link-button variants |
| `HmIconButton` | accessible icon-only action |
| `HmInput` | text, search, and validated inputs |
| `HmTextarea` | multiline text and autosizing |
| `HmSelect` | platform-neutral custom selection control |
| `HmCheckbox` | checkbox with label and help text |
| `HmSwitch` | binary setting |
| `HmAvatar` | uploaded image, generated icon, or initials |
| `HmBadge` | status, type, and source labels |
| `HmIcon` | shared icon contract |
| `HmSpinner` | loading state |

### Overlays and feedback

| Component | Purpose |
| --- | --- |
| `HmDialog` | modal flows with focus trapping |
| `HmPopover` | anchored non-destructive controls |
| `HmMenu` | action menus and keyboard navigation |
| `HmTooltip` | short accessible explanations |
| `HmToast` | transient operation feedback |
| `HmConfirmDialog` | explicit destructive confirmation |
| `HmEmptyState` | empty, filtered, or unavailable content |
| `HmErrorState` | recoverable errors with retry action |

### Layout

| Component | Purpose |
| --- | --- |
| `AppShell` | global application frame |
| `AppNavigation` | Projects, Planner, Board, and Docs navigation |
| `WorkspaceSidebar` | project tree and contextual actions |
| `PageHeader` | title, breadcrumbs, and page actions |
| `SplitView` | adjustable two-pane layout |
| `Panel` | reusable bordered surface |

### Product components

| Component | Purpose |
| --- | --- |
| `ProjectWorkspace` | project overview and linked content |
| `ProjectTree` | one-level folders and project items |
| `BoardView` | columns, cards, filters, and archive |
| `BoardColumn` | sortable column and card drop target |
| `CardItem` | compact board card |
| `CardDetails` | card fields, Doc description, and attachments |
| `ArchiveColumn` | archived cards and restoration |
| `DocsEditor` | document list, title, content, and persistence |
| `MarkdownEditor` | edit, preview, split, and reverse split modes |
| `PlannerView` | calendar, agenda, and timeline |
| `PlannerItem` | source-labelled project, card, or event |
| `AgentRunPanel` | scope, progress, proposal, and approval |
| `ProfileSettings` | identity, avatar, and language |
| `WorkspaceSettings` | workspace and edition configuration |

## Styling rules

- component behavior lives in `.vue` and `.ts` files
- styles live in standalone `.scss` files
- design tokens live in `packages/styles`
- no inline static styles, CSS-in-JS, or copied one-off controls
- feature styles consume tokens instead of hard-coded colors
- Motion for Vue handles stateful layout, presence, gesture, reorder, and spring animation
- simple color, focus, and hover transitions remain in SCSS
- every animation respects the reduced-motion preference
- all interaction states include focus, hover, active, disabled, loading, and
  error behavior

## Public component contract

Every reusable component must define:

- typed props and emitted events
- accessible name and keyboard behavior
- supported slots
- loading, empty, error, and disabled states where relevant
- responsive behavior
- unit tests and a visual example
- whether it is public to plugins

Components do not fetch domain data directly. Feature composables call typed
API clients and pass state into components.
