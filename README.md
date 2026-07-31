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

The default physical-device URL is
`http://Isayas-MacBook-Pro.local:8002/api`. For an Android emulator, run with
`--dart-define=BIZTRACK_API_BASE_URL=http://10.0.2.2:8002/api`. For an iOS
simulator, use `http://127.0.0.1:8002/api`.

## Production builds

```bash
cd frontend && npm run build
cd mobile && flutter build apk
```

For Hostinger deployment, deploy `frontend/` as the Vite web application and
deploy `backend/` as the custom PHP/Laravel application.
