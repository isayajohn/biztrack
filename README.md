# BizTrack

BizTrack is organized as a monorepo containing three independent applications:

```text
biztrack/
├── frontend/   React, TypeScript, and Vite web application
├── backend/    Laravel API
├── mobile/     Flutter application for Android and iOS
├── docs/       Shared project documentation
└── tools/      Shared development tools
```

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default. Set
`VITE_API_URL` in `frontend/.env` to the Laravel API URL.

## Backend

```bash
cd backend
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate
php artisan serve
```

The Laravel API runs at `http://127.0.0.1:8000` by default. Configure the
database, mail, SMS, payment, and authentication values in `backend/.env`.

To make the API reachable from a physical phone on the same local network,
start a LAN-facing development server:

```bash
cd backend
php artisan serve --host=0.0.0.0 --port=8002
```

## Mobile

```bash
cd mobile
flutter pub get
flutter run
```

The default API URL is
`https://biztracktanzania.online/api`. For local development on
an Android emulator, run with
`--dart-define=BIZTRACK_API_BASE_URL=http://10.0.2.2:8002/api`. For an iOS
simulator, use `http://127.0.0.1:8002/api`.

## Production builds

```bash
cd frontend && npm run build
cd mobile && flutter build apk
```

For the current same-origin Hostinger deployment, the CI/CD workflow builds the
React application into Laravel's `public/` directory and deploys the combined
application as one custom PHP/Laravel website. This keeps the frontend and
`/api` on the same origin.

## Git workflow and CI/CD

The repository uses these long-lived branches:

- `develop` deploys to the development environment.
- `staging` deploys to testing/UAT.
- `main` deploys to production after CI and environment approval.

Create features and normal fixes from `develop` using `feature/*` and
`bugfix/*`. Create emergency production fixes from `main` using `hotfix/*`.
Production deployment is disabled until the GitHub environments and Hostinger
SSH settings are configured explicitly.

See [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) for practical commands,
promotion rules, required GitHub variables and secrets, branch protections,
Hostinger preparation, and rollback procedures.

For the verified manual Hostinger update workflow and live server layout, see
[docs/HOSTINGER_SSH_DEPLOY.md](docs/HOSTINGER_SSH_DEPLOY.md).
