create table if not exists "mono_invoice" (
  "id" text not null primary key,
  "cart_id" text null,
  "payment_session_id" text not null,
  "payment_collection_id" text null,
  "order_id" text null,
  "invoice_id" text null,
  "reference" text not null,
  "attempt_number" int not null default 1,
  "amount_minor" int not null,
  "currency_code" text not null,
  "payment_type" text not null default 'debit'
    check ("payment_type" in ('debit', 'hold')),
  "status" text not null default 'created'
    check ("status" in ('created','processing','hold','success','failure','reversed','expired','removed')),
  "last_processed_status" text null,
  "last_modified_date" text null,
  "failure_reason" text null,
  "err_code" text null,
  "page_url" text null,
  "redirect_url" text null,
  "webhook_url" text null,
  "expires_at" timestamptz null,
  "raw_last_payload" jsonb null,
  "refunded_amount_minor" int not null default 0,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

create unique index if not exists "mono_invoice_invoice_id_unique"
  on "mono_invoice" ("invoice_id") where "invoice_id" is not null;
create unique index if not exists "mono_invoice_reference_unique"
  on "mono_invoice" ("reference");
create unique index if not exists "mono_invoice_payment_session_id_unique"
  on "mono_invoice" ("payment_session_id");
create index if not exists "mono_invoice_cart_id_idx" on "mono_invoice" ("cart_id");
create index if not exists "mono_invoice_order_id_idx" on "mono_invoice" ("order_id");
create index if not exists "mono_invoice_status_idx" on "mono_invoice" ("status");
create index if not exists "mono_invoice_expires_at_idx" on "mono_invoice" ("expires_at");

create table if not exists "mono_webhook_log" (
  "id" text not null primary key,
  "invoice_id" text null,
  "status" text null,
  "signature_valid" boolean not null,
  "outcome" text not null check ("outcome" in (
    'processed','skipped_duplicate','skipped_stale',
    'rejected_invalid_signature','rejected_unknown_invoice','error'
  )),
  "error_message" text null,
  "payload" jsonb not null,
  "created_at" timestamptz not null default now()
);

create index if not exists "mono_webhook_log_invoice_id_idx" on "mono_webhook_log" ("invoice_id");
create index if not exists "mono_webhook_log_outcome_idx" on "mono_webhook_log" ("outcome");
