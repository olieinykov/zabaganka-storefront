import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109162357 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "packaging_option" drop column if exists "rank";`);

    this.addSql(`alter table if exists "packaging_variant" drop column if exists "rank";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "packaging_option" add column if not exists "rank" integer not null default 0;`);

    this.addSql(`alter table if exists "packaging_variant" add column if not exists "rank" integer not null default 0;`);
  }

}
