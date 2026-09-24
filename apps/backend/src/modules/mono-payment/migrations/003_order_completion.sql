alter table "mono_invoice" add column if not exists "order_completion_checked_at" timestamptz null;
alter table "mono_invoice" add column if not exists "order_completion_error" text null;
