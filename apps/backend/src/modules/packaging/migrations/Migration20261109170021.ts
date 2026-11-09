import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109170021 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "packaging_variant" add column if not exists "image_url" text null;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_packaging_variant_unique_size" ON "packaging_variant" ("packaging_id", "height", "width", "depth") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_packaging_variant_unique_size";`);
    this.addSql(`alter table if exists "packaging_variant" drop column if exists "image_url";`);
  }

}
