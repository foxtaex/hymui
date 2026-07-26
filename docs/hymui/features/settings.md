# Settings Plan

> Status: planned product area  
> Scopes: Device, User, Workspace, Board, and Administration

## Principles

- show settings only when they apply to the active edition
- separate personal preferences from shared workspace policy
- apply safe visual preferences immediately
- require confirmation and backend authorization for security-sensitive changes
- use shared Hymui controls instead of browser-native dropdown styling

## Profile

- display name, username, email, bio, and locale
- uploaded profile image
- selectable Hymui avatar icons
- generated initials as fallback
- crop, size, format, and accessibility validation

Federated identities display a short `@username` when unambiguous. Conflicts and
security-sensitive views use the full `§instance.example@username` identity.

## Appearance and accessibility

- light, dark, and system theme
- density and text-size preferences
- reduced motion and high-contrast support
- keyboard shortcut overview
- date, time, timezone, and first-day-of-week preferences

The dark, slightly macOS-inspired visual language remains platform-neutral.
Controls look consistent on macOS, Linux, and the web.

## Language

English and German are available from the first setup. Changing language updates
navigation, Boards, Docs, Planner, Projects, Settings, errors, empty states, and
dialogs—not only the current page.

## Security

- password or configured identity-provider management
- passkeys and two-factor authentication
- active session inspection and revocation
- personal access tokens with scopes and expiry
- security event history

Local account-free mode hides irrelevant account controls.

## Workspace and board settings

Workspace settings include name, icon, default locale, timezone, membership,
roles, agent policy, allowed plugins, and edition information.

Board settings include name, icon, appearance, visibility, locale behavior,
archive defaults, labels, and workflow limits.

## Hosted and Self-hosted administration

- database and storage adapter status
- background worker health
- backup and restore status
- email, AI, federation, and repository providers
- plugin installation and permissions
- audit and retention policy

Secret values are write-only after creation and never returned to the browser.

## Delivery stages

1. profile, avatar, language, and theme
2. workspace and board settings
3. sessions, password, passkeys, and two-factor authentication
4. notifications and personal access tokens
5. deployment health, providers, backups, plugins, and federation policy
