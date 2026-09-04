import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import fs from "node:fs"
import path from "node:path"


export default async function checkoutOptionsMigrate({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const pg = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const migrationsDir = path.join(
    __dirname,
    "..",
    "modules",
    "checkout-options",
    "migrations"
  )
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()

  for (const file of files) {
    logger.info(`Checkout options: applying schema from ${file} ...`)
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
    await pg.raw(sql)
  }

  logger.info("Checkout options: schema is up to date.")
}
