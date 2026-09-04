import { useEffect, useState } from "react"
import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { usePrepaymentSettings, useSavePrepaymentSettings } from "./use-prepayment-settings"

const CheckoutOptionsPage = () => {
  const { data, isLoading } = usePrepaymentSettings()
  const save = useSavePrepaymentSettings()

  const [amount, setAmount] = useState<string>("")

  useEffect(() => {
    if (data) {
      setAmount(String(data.amount))
    }
  }, [data])

  const handleSave = () => {
    const parsed = Number(amount.replace(",", "."))
    if (!Number.isFinite(parsed) || parsed < 0) {
      toast.error("Некоректна сума", {
        description: "Введіть невід'ємне число, наприклад 500.",
      })
      return
    }

    save.mutate(
      { amount: parsed, currency_code: data?.currency_code ?? "uah" },
      {
        onSuccess: () => {
          toast.success("Збережено", {
            description: "Сума передоплати для накладеного платежу оновлена.",
          })
        },
        onError: (err: any) => {
          toast.error("Не вдалося зберегти", {
            description: err?.message ?? "Спробуйте ще раз.",
          })
        },
      }
    )
  }

  return (
    <Container className="p-0 divide-y-0">
      <div className="px-6 py-4 border-b border-ui-border-base">
        <Heading level="h1">Передоплата для накладеного платежу</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Сума, яку покупець сплачує одразу через Plata by mono, якщо на сайті
          обрано спосіб оплати «Наложений платіж (з передоплатою)». Решту суми
          він сплачує при отриманні.
        </Text>
      </div>

      <div className="px-6 py-6 max-w-sm">
        {isLoading ? (
          <Text size="small" className="text-ui-fg-muted">
            Завантаження…
          </Text>
        ) : (
          <div className="flex flex-col gap-y-4">
            <div className="flex flex-col gap-y-2">
              <Label htmlFor="prepayment-amount">
                Сума передоплати, {(data?.currency_code ?? "uah").toUpperCase()}
              </Label>
              <Input
                id="prepayment-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
              />
              <Text size="xsmall" className="text-ui-fg-muted">
                0 означає, що спосіб оплати ще не готовий до використання —
                увімкнення його для регіону при нульовій сумі призведе до
                помилки на сторінці оплати.
              </Text>
            </div>

            <Button onClick={handleSave} isLoading={save.isPending} className="w-fit">
              Зберегти
            </Button>

            <Text size="xsmall" className="text-ui-fg-muted pt-2 border-t border-ui-border-base">
              Щоб увімкнути або вимкнути сам спосіб оплати на сайті, перейдіть у
              Налаштування → Регіони → [ваш регіон] → Провайдери оплати і
              позначте потрібні варіанти: «Plata by mono» (повна оплата),
              «Manual Payment» (наложений платіж без передоплати) і
              «Mono Prepayment» (наложений платіж з передоплатою).
            </Text>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Prepayment",
  icon: CurrencyDollar,
})

export default CheckoutOptionsPage
