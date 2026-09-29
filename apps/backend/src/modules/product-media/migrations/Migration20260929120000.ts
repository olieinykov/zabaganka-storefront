import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260929120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `create table if not exists "product_video_file" (
        "id" text not null,
        "url" text not null,
        "file_id" text not null,
        "mime_type" text null,
        "rank" integer not null default 0,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "product_video_file_pkey" primary key ("id")
      );`
    )

    this.addSql(
      `create index if not exists "IDX_product_video_file_url"
        on "product_video_file" ("url")
        where "deleted_at" is null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_video_file_deleted_at"
        on "product_video_file" ("deleted_at")
        where "deleted_at" is null;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`drop table if exists "product_video_file" cascade;`)
  }
}
