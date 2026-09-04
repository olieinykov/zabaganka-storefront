-- Checkout options (COD / prepayment) settings — own storage.
--
-- Same pattern as src/modules/mono-payment/migrations: this is plain SQL
-- against the shared PG_CONNECTION, not a full Medusa module with its own
-- MikroORM entities, because all we need is a single settings row that a
-- payment provider, an admin route and a store route all read/write.
--
-- Apply with:
--   npx medusa exec ./src/scripts/checkout-options-migrate.ts

create table if not exists "checkout_prepayment_settings" (
  "id" text not null primary key default 'default',
  "amount_minor" int not null default 0,
  "currency_code" text not null default 'uah',
  "updated_at" timestamptz not null default now()
);

insert into "checkout_prepayment_settings" ("id", "amount_minor", "currency_code")
values ('default', 0, 'uah')
on conflict ("id") do nothing;
