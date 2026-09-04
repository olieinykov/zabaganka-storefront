import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

export type PrepaymentSettingsDTO = {
  amount: number
  currency_code: string
  updated_at: string | null
}

const queryKey = ["checkout-options", "prepayment"]

export function usePrepaymentSettings() {
  return useQuery({
    queryKey,
    queryFn: () =>
      sdk.client.fetch<PrepaymentSettingsDTO>("/admin/checkout-options/prepayment"),
  })
}

export function useSavePrepaymentSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: { amount: number; currency_code?: string }) =>
      sdk.client.fetch<PrepaymentSettingsDTO>("/admin/checkout-options/prepayment", {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })
}
