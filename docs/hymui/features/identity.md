# Identity and Federation Plan

> Status: planned architecture proof  
> Local mode: usable without a central Hymui account

## Identity format

An account belongs to a home instance. The canonical visible form is:

```text
§instance.example@username
```

The normal interface may show `@bob` when that name is unambiguous. If two
actors share the same username, or an action is security-sensitive, Hymui shows
the complete identity. Backend relations use immutable actor IDs rather than
display names.

On the managed Hymui Hosted instance, its own local username wins the short
form. A remote actor with the same name is shown using the full identity.

## Local and server accounts

- Local can start without an account.
- Self-hosted accounts are authoritative on their own instance.
- Hosted accounts are authoritative on the managed Hymui instance.
- no central Hymui directory is required for Self-hosted operation
- account linking never merges immutable identities silently

## Federation

Federation is oriented around ActivityPub with a versioned Hymui vocabulary for
project invitations, membership, proposals, and approvals.

Self-hosted administrators can disable federation or restrict it through
allowlists, blocklists, and capability policy. Remote content is treated as
untrusted input and cannot grant local permissions.

## Security requirements

- signed server-to-server requests with replay protection
- explicit trust and membership decisions
- full identities in invitations, audit logs, and approval screens
- remote actor and instance blocking
- controlled media fetching and storage
- portable account and project export without transferring server secrets

## Delivery stages

1. immutable local actor IDs and canonical handles
2. ambiguity-aware short-name display
3. federation discovery and signed inbox proof
4. invitations and membership exchange
5. proposal and approval federation
6. moderation, migration, and recovery workflows
