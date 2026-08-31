# Hostinger deployment

This Laravel application requires PHP 8.3 or newer. The included
`hostinger.htaccess` selects PHP 8.4 and rewrites a Hostinger document root to
Laravel's `public/` directory.

The GitHub Actions deployment builds the React frontend and copies its output
into `public/` before uploading the Laravel application. Laravel serves the SPA
and the `/api` routes from one origin. The server's `.env`, SQLite files, and
`storage/` directory are preserved during synchronization.

## First deployment

1. Copy `.env.production.example` to `.env` and set the public `APP_URL`,
   `CORS_ALLOWED_ORIGINS`, absolute `DB_DATABASE`, and secrets.
2. Install production dependencies with PHP 8.4. On hosts where Sodium is
   installed but not enabled in CLI, use:

   ```sh
   /opt/alt/php84/usr/bin/php -d extension=sodium /usr/local/bin/composer install --no-dev --optimize-autoloader --no-interaction
   ```

3. Generate secrets, migrate, and cache Laravel configuration:

   ```sh
   /opt/alt/php84/usr/bin/php artisan key:generate --force
   /opt/alt/php84/usr/bin/php artisan jwt:secret --force
   /opt/alt/php84/usr/bin/php artisan migrate --force
   /opt/alt/php84/usr/bin/php artisan optimize
   ```

4. For a disposable demo environment only, set `SEED_DEMO_DATA=true` while
   running `php artisan db:seed --force`, then set it back to `false`.

5. Run Laravel's scheduler every minute so debt reminders are processed:

   ```cron
   * * * * * cd /absolute/path/to/backend && /opt/alt/php84/usr/bin/php artisan schedule:run >/dev/null 2>&1
   ```

Never commit `.env` or a live SQLite database. Keep the database and `.env`
mode `600`, and keep `storage/` plus `bootstrap/cache/` writable by the web
process.

## Automated branch deployments

After CI succeeds, `.github/workflows/deploy.yml` maps branches to GitHub
Environments:

- `develop` -> `development`
- `staging` -> `staging`
- `main` -> `production`

The deployment remains off until the repository variable
`HOSTINGER_DEPLOY_ENABLED` is set to `true`. Before enabling it, create the
three GitHub Environments, add their Hostinger variables and SSH secrets, and
create a server-side `.env` in each deployment directory. Production should
require a GitHub Environment reviewer.

See `docs/GIT_WORKFLOW.md` at the repository root for the complete setup,
branch protection, release, and rollback instructions.
