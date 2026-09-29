# Hostinger SSH deployment

## Live server layout

```text
/home/u226331299/
└── domains/
    └── biztracktanzania.online/
        └── public_html/                 Laravel application root
            ├── .env                     production secrets; never overwrite
            ├── .htaccess                rewrites requests into public/
            ├── app/
            ├── bootstrap/
            ├── config/
            ├── database/
            ├── public/                  React build and Laravel index.php
            │   ├── assets/
            │   ├── index.html
            │   └── index.php
            ├── resources/
            ├── routes/
            ├── storage/                 persistent runtime/uploads
            ├── vendor/
            └── artisan
```

The website and API share one origin:

- Website: `https://biztracktanzania.online`
- API: `https://biztracktanzania.online/api`
- Health check: `https://biztracktanzania.online/api/health`

## Future updates

From the repository root, run:

```bash
bash .github/scripts/deploy-hostinger-manual.sh
```

The script asks for the SSH password once, builds React, installs production
Composer dependencies in a temporary package, synchronizes the application,
preserves the server `.env` and `storage/`, runs migrations and safe seeders,
refreshes Laravel caches, and verifies `/api/health`.

Connection defaults used by the script:

```text
Host: 217.196.55.217
Port: 65002
User: u226331299
Path: /home/u226331299/domains/biztracktanzania.online/public_html
PHP:  /opt/alt/php84/usr/bin/php
```

Do not add SSH, database, mailbox, JWT, or application secrets to this file or
to the deployment script.

## Scheduler

Hostinger disables command-line crontab editing for this account. Add this cron
job in hPanel so reminders and recurring invoices run:

```cron
* * * * * cd /home/u226331299/domains/biztracktanzania.online/public_html && /opt/alt/php84/usr/bin/php artisan schedule:run >/dev/null 2>&1
```
