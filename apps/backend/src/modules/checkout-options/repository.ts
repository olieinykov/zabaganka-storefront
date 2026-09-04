type KnexLike = any

export type PrepaymentSettingsRow = {
  id: string
  amount_minor: number
  currency_code: string
  updated_at: Date
}

export class CheckoutOptionsRepository {
  constructor(private readonly pg: KnexLike) {}

  async getPrepaymentSettings(): Promise<PrepaymentSettingsRow> {
    const row = await this.pg("checkout_prepayment_settings")
      .where({ id: "default" })
      .first()

   return (
      row ?? {
        id: "default",
        amount_minor: 0,
        currency_code: "uah",
        updated_at: new Date(),
      }
    )
  }

  async setPrepaymentSettings(input: {
    amountMinor: number
    currencyCode: string
  }): Promise<PrepaymentSettingsRow> {
    const existing = await this.pg("checkout_prepayment_settings")
      .where({ id: "default" })
      .first()

    if (!existing) {
      const [inserted] = await this.pg("checkout_prepayment_settings")
        .insert({
          id: "default",
          amount_minor: input.amountMinor,
          currency_code: input.currencyCode,
          updated_at: new Date(),
        })
        .returning("*")
      return inserted
    }

    const [updated] = await this.pg("checkout_prepayment_settings")
      .where({ id: "default" })
      .update({
        amount_minor: input.amountMinor,
        currency_code: input.currencyCode,
        updated_at: new Date(),
      })
      .returning("*")
    return updated
  }
}
