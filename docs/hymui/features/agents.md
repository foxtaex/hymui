# AI Agents Plan

> Status: planned foundation and product area  
> Principle: agents propose; authorized people approve.

## Goal

AI agents help plan and execute work while remaining useful outside software
development. They operate on explicit project context and never gain implicit
authority from a chat message.

## General profiles

- Goal Agent
- Planning Agent
- Research Agent
- Risk Agent
- Review Agent
- Documentation Agent

An optional software-development pack adds Requirements, Architecture,
Repository, Implementation, and Code Review agents.

## Run model

Every run records:

- initiating actor and project
- goal, context scope, and selected profile
- model and provider configuration
- allowed tools and data
- token, cost, time, and action budgets
- progress, checkpoints, artifacts, and errors
- proposal, approval decision, execution, and audit events

Runs are cancellable and resumable. A worker may restart without losing the
last durable checkpoint.

## Approval boundaries

Human approval is required before an agent:

- writes or deletes project content outside its draft
- runs a command
- changes a repository
- sends an external message
- spends beyond its approved budget
- changes permissions, providers, plugins, or federation policy

Approvals bind to an exact proposal revision. Editing a proposal invalidates its
previous approval.

## Provider model

Model providers sit behind a capability contract. Hymui Core depends on
capabilities such as text generation, tools, structured output, vision, and
streaming—not on a provider-specific SDK.

Local models and remote providers can coexist. Secrets remain in the backend
and are never exposed to plugins or the browser.

## Delivery stages

1. durable run state machine and audit events
2. provider-neutral model adapter
3. scoped project context and artifact drafts
4. approval and execution workflow
5. general agent profiles
6. optional domain packs and plugin-provided agents
