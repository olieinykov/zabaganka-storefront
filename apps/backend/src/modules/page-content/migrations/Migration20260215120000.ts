import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260215120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "page_content_block" (
        "id" text not null,
        "page" text not null default 'home',
        "block_key" text not null,
        "content" jsonb not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "page_content_block_pkey" primary key ("id")
      );`
    )

    this.addSql(
      `create unique index if not exists "IDX_page_content_block_page_block_key_unique"
        on "page_content_block" ("page", "block_key")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_page_content_block_deleted_at"
        on "page_content_block" ("deleted_at")
        where "deleted_at" is null;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "page_content_block" cascade;`)
  }
}
