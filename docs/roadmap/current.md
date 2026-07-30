# Current Focus

**Active milestone:** Device Operation Lock → tag **v0.9.0-beta.1**

## Why this next

Public beta was blocked on concurrent Flash/Identify/Filesystem ownership. This safety lock is the final engineering gate before the public beta tag.

## In scope

1. Shared device-scoped operation lock (reuse `CommunicationSession`)
2. Flash catalog error state + Retry
3. Light-theme status contrast tokens
4. Tag `v0.9.0-beta.1` after merge

## Out of scope

OTA, NVS, partitions, Monaco, new product features

## Related documents

- [Device Operation Lock](../features/device-operation-lock.md)
- [Version roadmap](./versions.md)
- [Release notes v0.9.0-beta.1](../releases/v0.9.0-beta.1.md)
- [Backlog](./backlog.md)
