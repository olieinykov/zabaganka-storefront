import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261109184636 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "packaging_variant" rename column "depth" to "length";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "packaging_variant" rename column "length" to "depth";`);
  }

}
