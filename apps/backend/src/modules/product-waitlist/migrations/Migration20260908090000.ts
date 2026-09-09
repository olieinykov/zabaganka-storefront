import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260908090000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_waitlist_entry" (
        "id" text not null,
        "product_id" text not null,
        "product_handle" text not null,
        "product_title" text not null,
        "product_thumbnail" text null,
        "variant_id" text null,
        "variant_title" text null,
        "contact_method" text check ("contact_method" in ('email', 'phone')) not null,
        "contact_value" text not null,
        "email" text null,
        "phone" text null,
        "is_archived" boolean not null default false,
        "archived_at" timestamptz null,
        "notified_at" timestamptz null,
        "notify_error" text null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_waitlist_entry_pkey" primary key ("id")
      );`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_product_id"
        on "product_waitlist_entry" ("product_id")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_variant_id"
        on "product_waitlist_entry" ("variant_id")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_is_archived"
        on "product_waitlist_entry" ("is_archived")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_contact_value"
        on "product_waitlist_entry" ("contact_value")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_dedup"
        on "product_waitlist_entry" ("product_id", "variant_id", "contact_value")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_deleted_at"
        on "product_waitlist_entry" ("deleted_at")
        where "deleted_at" is null;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "product_waitlist_entry" cascade;`)
  }
}
