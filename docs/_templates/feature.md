# Feature Documentation Template

Use this template for every new ESP Studio feature. Copy it to `docs/features/<feature-name>.md` and fill in each section **before** writing code.

---

# Feature: \<Name\>

## Goal

One or two sentences describing the user-facing or architectural outcome.

## Background

Why this feature exists, what problem it solves, and how it fits the roadmap.

## Architecture

How the feature is structured, where code will live, and how it interacts with other modules. Include diagrams when helpful (Mermaid preferred).

## Responsibilities

| Component | Responsibility |
| --------- | -------------- |
| `…`       | `…`            |

## Public Interfaces

List types, functions, events, and error contracts that other modules may depend on. Prefer TypeScript signatures.

## Dependencies

| Dependency | Required? | Notes |
| ---------- | --------- | ----- |
| `…`        | yes/no    | `…`   |

Explicitly call out forbidden dependencies (for example: no browser APIs in core modules).

## Acceptance Criteria

- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Future Improvements

Ideas deferred from the initial implementation.

## TODO Checklist

- [ ] Documentation reviewed
- [ ] Interfaces designed
- [ ] Implementation complete
- [ ] Tests added (if applicable)
- [ ] `pnpm lint` / `pnpm typecheck` / `pnpm build` pass
- [ ] Roadmap updated (`docs/roadmap/current.md`, `backlog.md` if needed)

---

## Process reminder

1. Create or update documentation first.
2. Implement only after the feature doc is complete.
3. Do not overwrite unrelated existing documentation.
4. Prefer the most maintainable architectural option when trade-offs appear.
