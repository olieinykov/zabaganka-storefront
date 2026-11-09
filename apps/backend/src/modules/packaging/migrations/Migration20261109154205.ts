import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109154205 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "packaging_default" ("id" text not null, "title" text not null, "description" text null, "image_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "packaging_default_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packaging_default_deleted_at" ON "packaging_default" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "packaging_default" cascade;`);
  }

}
