# Hostinger deployment

This Laravel application requires PHP 8.3 or newer. The included
`hostinger.htaccess` selects PHP 8.4 and rewrites a Hostinger document root to
Laravel's `public/` directory.

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
