# Feature: Continuous Deployment

## Goal

Deploy ESP Studio automatically to shared hosting via GitHub Actions. No new end-user product features beyond displaying build metadata on the About / Settings page.

## Background

The public-beta feature set is complete. Release engineering needs a repeatable CI gate and a FTP deploy path for static `dist/` hosting. Credentials stay in GitHub Secrets only.

See also:

- [Current roadmap](../roadmap/current.md)
- [Architecture overview](../architecture/overview.md)
- [README](../../README.md)

## Build pipeline

```text
pnpm install
     │
     ▼
scripts/generate-build-info.mjs  →  public/build.json
     │
     ▼
pnpm lint / typecheck / test     (CI only)
     │
     ▼
tsc -b && vite build             →  dist/ (+ build.json copied from public/)
```

`build.json` fields:

| Field | Meaning |
| ----- | ------- |
| `version` | `package.json` version |
| `commit` | Git SHA (`GITHUB_SHA` in Actions, else `git rev-parse`) |
| `builtAt` | ISO-8601 UTC timestamp |

## GitHub Actions

| Workflow | File | Triggers | Purpose |
| -------- | ---- | -------- | ------- |
| CI | `.github/workflows/ci.yml` | `pull_request`, `push` | install → lint → typecheck → test → build |
| Deploy | `.github/workflows/deploy.yml` | `push` to `main`, `workflow_dispatch` | install → build → FTP upload `dist/` only |

Both workflows use Node 20 + pnpm (packageManager pin).

## Secrets

Configure in the GitHub repository **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
| ------ | ------- |
| `FTP_HOST` | FTP server hostname |
| `FTP_PORT` | FTP port (usually `21`) |
| `FTP_USER` | FTP username |
| `FTP_PASSWORD` | FTP password |
| `FTP_REMOTE_PATH` | Remote directory for site root (e.g. `/public_html/esp-studio/`) |

Never commit credentials. Do not put FTP values in `.env` files committed to git.

## Release flow

1. Merge feature work to `main` (CI must be green on the PR).
2. Push to `main` triggers **Deploy** (or run **Deploy** manually via `workflow_dispatch`).
3. Workflow builds production assets and uploads **only** `dist/` over FTP.
4. Settings → About shows the deployed `version` / `commit` / `builtAt` from `/build.json`.

## Manual deployment

```bash
pnpm install
pnpm build
# Upload contents of dist/ to the shared host (FTP/SFTP/cPanel file manager)
```

Ensure `/build.json` is present at the site root alongside `index.html`.

## Rollback

1. Identify the last known-good commit (About page commit hash or GitHub Actions run).
2. Re-run Deploy for that commit (`workflow_dispatch` on the commit SHA via GitHub UI “Re-run jobs” on a prior successful deploy, or temporarily reset `main` and push — prefer re-deploy of an artifact from a prior green run when available).
3. Or manually FTP the previous `dist/` backup if the host retains one.

Practical approach for shared hosting: keep a local/CI artifact of the previous `dist/` and re-upload it if a bad release ships.

## About page

Settings includes an **About** card that loads `/build.json` and displays version, short commit, and build date. In local `pnpm dev`, a generated or fallback build info may show `development` commit when git metadata is unavailable.

## Acceptance Criteria

- [ ] `docs/features/deployment.md` complete.
- [ ] `.github/workflows/ci.yml` runs lint/typecheck/test/build on PR and push.
- [ ] `.github/workflows/deploy.yml` builds and FTP-deploys `dist/` on `main` / manual dispatch.
- [ ] Secrets documented; none committed.
- [ ] `build.json` generated on build with version, commit, builtAt.
- [ ] About section on Settings shows build info.
- [ ] `pnpm lint` / `typecheck` / `test` / `build` pass locally.

## TODO Checklist

- [x] Documentation reviewed
- [ ] Implementation complete
- [ ] Quality gates pass
- [ ] Roadmap updated
