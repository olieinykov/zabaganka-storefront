alter table "mono_invoice" add column if not exists "fiscal_check_url" text null;
alter table "mono_invoice" add column if not exists "fiscal_check_status" text null;
alter table "mono_invoice" add column if not exists "fiscal_check_checked_at" timestamptz null;
