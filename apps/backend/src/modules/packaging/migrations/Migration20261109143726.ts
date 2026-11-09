import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109143726 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "packaging_variant" ("id" text not null, "height" real not null, "width" real not null, "depth" real not null, "price" numeric not null, "is_available" boolean not null default true, "rank" integer not null default 0, "packaging_id" text not null, "raw_price" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "packaging_variant_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packaging_variant_packaging_id" ON "packaging_variant" ("packaging_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packaging_variant_deleted_at" ON "packaging_variant" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_packaging_variant_is_available" ON "packaging_variant" ("is_available") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "packaging_variant" add constraint "packaging_variant_packaging_id_foreign" foreign key ("packaging_id") references "packaging_option" ("id") on update cascade on delete cascade;`);

    this.addSql(`alter table if exists "packaging_option" drop column if exists "price", drop column if exists "raw_price";`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "packaging_variant" cascade;`);

    this.addSql(`alter table if exists "packaging_option" add column if not exists "price" numeric not null, add column if not exists "raw_price" jsonb not null;`);
  }

}
