# Docs Plan

> Status: planned product area  
> Format: Markdown

## Goal

Docs provides portable project knowledge that can stand alone, become a card
description, or appear as a card attachment. Markdown remains the stored source
of truth.

## Editor modes

- **Write:** source editing with Markdown assistance
- **Preview:** rendered output that can also accept edits
- **Split:** source and preview side by side
- **Reverse split:** preview before source

All views use one document state. Switching views cannot discard text, restore
stale content, or cause two independent save streams.

## Markdown behavior

- CommonMark-compatible text with documented extensions
- headings, lists, tables, links, images, quotes, and task lists
- inline code and fenced code blocks
- language-aware syntax highlighting when a fence declares a language
- sanitized HTML output
- predictable copy and paste between source and editable preview

Code fences follow the familiar form:

````markdown
```javascript
const greeting = "Hello, Hymui";
```
````

## Persistence

- local draft updates immediately
- saves are debounced, revision-aware, and observable
- navigation flushes or safely queues pending changes
- reconnect resumes unsaved work
- conflicts show both revisions instead of silently overwriting either one
- long sessions refresh authentication without breaking Board or Docs loading

## Board relations

A card may reference a Doc in one of two explicit modes:

- **Description:** the Doc title and rendered body replace the card's local
  description
- **Attachment:** the card shows a Docs icon and the current Doc title near its
  attachments

Changing the Doc title updates every reference. The UI never shows placeholder
content such as “Hello World” in place of the real title.

## Portability and security

Docs export as Markdown with separately addressed attachments. Rendered output
is sanitized, external resources follow workspace policy, and users must be
authorized for both the card and linked Doc before the relationship is shown.

## Delivery stages

1. source editor, reader, and revision-safe saving
2. synchronized Preview and Split modes
3. Markdown sanitization and code highlighting
4. images, files, import, and export
5. card description and attachment relations
6. collaborative editing and offline conflict resolution
