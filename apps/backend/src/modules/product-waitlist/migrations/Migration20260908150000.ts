import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260908150000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `alter table if exists "product_waitlist_entry"
        add column if not exists "closed_reason" text
        check ("closed_reason" in ('manual', 'product_deleted', 'variant_deleted'))
        null;`
    )

    this.addSql(
      `create index if not exists "IDX_product_waitlist_entry_closed_reason"
        on "product_waitlist_entry" ("closed_reason")
        where "deleted_at" is null;`
    )
  }

  async down(): Promise<void> {
    this.addSql(
      `drop index if exists "IDX_product_waitlist_entry_closed_reason";`
    )
    this.addSql(
      `alter table if exists "product_waitlist_entry" drop column if exists "closed_reason";`
    )
  }
}