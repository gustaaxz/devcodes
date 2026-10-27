-- Run after enabling Vault and creating the three secrets listed in
-- docs/BACKUP_SETUP.md. This script attempts to install pg_cron and pg_net.

create extension if not exists pg_cron;
create schema if not exists extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule(jobid)
from cron.job
where jobname = 'devcodes-daily-backups';

select cron.schedule(
  'devcodes-daily-backups',
  '0 3 * * *',
  $$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'devcodes_project_url') || '/functions/v1/create-backup',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'devcodes_publishable_key'),
        'x-backup-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'devcodes_backup_cron_secret')
      ),
      body := '{}'::jsonb
    );
  $$
);
