import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109135741 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "packaging_option" ("id" text not null, "title" text not null, "description" text null, "price" numeric not null, "image_url" text null, "is_available" boolean not null default true, "rank" integer not null default 0, "raw_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "packaging_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packaging_option_deleted_at" ON "packaging_option" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packaging_option_is_available" ON "packaging_option" ("is_available") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "packaging_option" cascade;`);
  }

}
