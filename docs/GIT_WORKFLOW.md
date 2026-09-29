# Git workflow and CI/CD

## Branch architecture

| Branch | Purpose | Deployment |
| --- | --- | --- |
| `main` | Stable, releasable production code | GitHub `production` environment |
| `staging` | QA, integration testing, and UAT | GitHub `staging` environment |
| `develop` | Development integration | GitHub `development` environment |
| `feature/*` | New work created from `develop` | None |
| `bugfix/*` | Normal fixes created from `develop` | None |
| `hotfix/*` | Emergency fixes created from `main` | None until merged to `main` |
| `release/*` | Optional release stabilization from `develop` | None until promoted |

The normal promotion path is:

```text
feature/* or bugfix/* -> develop -> staging -> main
                              |          |        |
                              v          v        v
                         development  staging  production
```

Do not merge `develop` directly to `main`. Promote the exact code that passed QA by opening a pull request from `staging` to `main`.

## Daily development

Create feature and normal bug-fix branches from the latest `develop`:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/example-feature
```

Use `bugfix/example-fix` for a normal defect. Commit using Conventional Commits where practical:

```bash
git add .
git commit -m "feat: add example feature"
git push -u origin feature/example-feature
```

Open a pull request into `develop`. Delete the short-lived branch after the pull request is merged.

Recommended commit prefixes are `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `build:`, and `ci:`.

## Staging and production promotion

When `develop` is ready for QA:

1. Open a pull request from `develop` to `staging`.
2. Merge only after all CI checks pass.
3. Validate the deployment in the staging/UAT environment.
4. Open a pull request from `staging` to `main`.
5. Obtain the required approval and merge only after CI and UAT pass.
6. The protected `production` GitHub Environment requests its deployment approval before production changes are published.

Production must deploy only from `main`. Direct pushes to `main` and `staging` should be blocked in GitHub settings.

## Hotfixes

Start emergency production fixes from `main`:

```bash
git switch main
git pull --ff-only origin main
git switch -c hotfix/production-login-error
```

Open the hotfix pull request into `main`. After the production fix is verified, propagate the same commit through pull requests into `staging` and `develop`. Do not rely on a later release to recreate the fix.

## Optional release branches

Use a release branch only when a larger release needs stabilization beyond the normal staging cycle:

```bash
git switch develop
git pull --ff-only origin develop
git switch -c release/v1.1.0
```

Promote `release/*` into `staging`, then `staging` into `main`. Merge approved release corrections back into `develop` so the branches remain synchronized.

## Continuous integration

`.github/workflows/ci.yml` runs for pull requests into and pushes to `develop`, `staging`, and `main`.

- Frontend: `npm ci`, TypeScript checking and Vite production build, then a high-severity production dependency audit.
- Backend: Composer validation and installation, PHP syntax checks, Laravel/PHPUnit tests, then a Composer security audit.
- Mobile: dependency installation, Flutter analysis, tests, and a debug APK build.

Laravel Pint is intentionally not a blocking repository-wide check yet because the existing application has pre-existing formatting debt. PHP syntax and tests are blocking. Add Pint as a required check after the existing code has been formatted in a dedicated, reviewable change.

## Continuous deployment

`.github/workflows/deploy.yml` runs only after a successful `CI` workflow caused by a push in this repository. Fork pull requests and feature branches cannot deploy.

| Source branch | GitHub Environment | Target |
| --- | --- | --- |
| `develop` | `development` | Development Hostinger website |
| `staging` | `staging` | Testing/UAT Hostinger website |
| `main` | `production` | Production Hostinger website |

Deployment is disabled unless the repository variable `HOSTINGER_DEPLOY_ENABLED` is exactly `true`. Keep it unset or `false` until all three environments are prepared.

The deployment job:

1. Checks out the exact commit that passed CI.
2. Builds React with the selected environment's `APP_URL`.
3. Installs production Laravel dependencies.
4. Places the frontend build inside `backend/public` for same-origin hosting.
5. Synchronizes the combined application over SSH while preserving `.env`, SQLite files, and `storage/`.
6. Runs migrations and Laravel optimization.
7. Calls `/api/health` and fails the deployment if the application is unhealthy.

### GitHub repository variable

Create this under **Settings -> Secrets and variables -> Actions -> Variables**:

| Variable | Value |
| --- | --- |
| `HOSTINGER_DEPLOY_ENABLED` | Start with `false`; change to `true` after setup and a reviewed test deployment |

### GitHub Environments

Create `development`, `staging`, and `production` under **Settings -> Environments**. Add the following separately to each environment.

Environment variables (not secrets):

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Public URL for that environment, without a trailing slash |
| `GOOGLE_CLIENT_ID` | Optional public Google OAuth client ID for that environment |
| `HOSTINGER_HOST` | SSH hostname from hPanel |
| `HOSTINGER_PORT` | SSH port from hPanel, commonly `65002` |
| `HOSTINGER_USER` | SSH username from hPanel |
| `HOSTINGER_PATH` | Exact absolute application directory below `/home`, such as the website's `public_html` |
| `HOSTINGER_PHP_BINARY` | PHP 8.4 CLI path, normally `/opt/alt/php84/usr/bin/php` |

Environment secrets:

| Secret | Purpose |
| --- | --- |
| `HOSTINGER_SSH_KEY` | Private SSH deployment key |
| `HOSTINGER_KNOWN_HOSTS` | Verified SSH known-hosts entry for the selected Hostinger host and port |

Verify the server fingerprint against hPanel or Hostinger support before saving `HOSTINGER_KNOWN_HOSTS`. Never copy `.env`, database credentials, private keys, tokens, or provider secrets into GitHub-tracked files.

### Server preparation

Each environment needs its own Hostinger website, database, application directory, and server-side `.env`. The deployment stops before changing files if `${HOSTINGER_PATH}/.env` is missing.

Prepare `.env` from `backend/.env.production.example` and set at minimum:

- `APP_ENV`, `APP_KEY`, `APP_DEBUG`, `APP_URL`, `FRONTEND_URL`, and `CORS_ALLOWED_ORIGINS`
- database connection values
- JWT secret
- mail, SMS, payment, AI, and other provider values used in that environment
- safe queue, cache, session, and filesystem drivers supported by the hosting plan

Configure the Laravel scheduler in hPanel for every environment that needs scheduled reminders or recurring invoices. Keep development, staging, and production databases and provider credentials isolated.

## Detected URLs

- Local frontend: `http://localhost:5173`
- Local API: `http://127.0.0.1:8000`
- Production Hostinger URL: `https://biztracktanzania.online`
- Development deployment URL: not configured; set `APP_URL` in the `development` GitHub Environment.
- Staging/UAT deployment URL: not configured; set `APP_URL` in the `staging` GitHub Environment.

Do not reuse the production URL, database, or external-provider credentials for development or staging.

## Branch protection settings

Configure these manually in **Settings -> Branches** or repository rulesets.

For `main`:

- Require a pull request and at least one approval.
- Dismiss stale approvals when new commits are pushed.
- Require the `Frontend checks`, `Backend checks`, and `Mobile checks` status checks.
- Require the branch to be up to date before merging.
- Block direct pushes, force pushes, and branch deletion.
- Restrict bypass permissions to trusted administrators.

For `staging`:

- Require a pull request and all three CI checks.
- Require QA/UAT approval before promotion to `main`.
- Block force pushes and deletion.

For `develop`:

- Require pull requests for normal work.
- Require all three CI checks.
- Block force pushes and deletion.

On the `production` GitHub Environment, add required reviewers, prevent administrator bypass where appropriate, and limit deployment branches to `main`. Limit `staging` to `staging` and `development` to `develop`.

## Releases and rollback

After a production deployment is verified, create an annotated semantic-version tag on the deployed `main` commit:

```bash
git switch main
git pull --ff-only origin main
git tag -a v1.1.0 -m "Release v1.1.0"
git push origin v1.1.0
```

Do not tag an unverified or arbitrary commit.

The preferred rollback is forward-moving and auditable:

1. Identify the last stable tag and the faulty `main` changes.
2. Create a `hotfix/rollback-<issue>` branch from current `main`.
3. Revert the faulty commit(s) with `git revert`; do not reset or rewrite history.
4. Open an urgent pull request into `main` and let CI pass.
5. Approve the production environment deployment.
6. Verify `/api/health` and critical user journeys.
7. Propagate the rollback commit into `staging` and `develop`.

If a database migration is not backward compatible, restore from the tested Hostinger/database backup according to its migration-specific runbook before or during the rollback. Never run `migrate:rollback` blindly in production.
