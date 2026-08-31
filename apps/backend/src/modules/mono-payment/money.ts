import { BigNumber } from "@medusajs/framework/utils"
import type { BigNumberInput } from "@medusajs/framework/types"

export function toMajorNumeric(amount: BigNumberInput): number {
  return new BigNumber(amount).numeric
}


const ZERO_DECIMAL_CURRENCIES = new Set(["jpy", "krw", "vnd", "clp", "pyg"])

export function currencyExponent(currencyCode: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currencyCode.toLowerCase()) ? 0 : 2
}

const ISO_4217_NUMERIC: Record<string, number> = {
  uah: 980,
  usd: 840,
  eur: 978,
  pln: 985,
  gbp: 826,
}

export function currencyToCcy(currencyCode: string): number {
  const code = ISO_4217_NUMERIC[currencyCode.toLowerCase()]
  if (!code) {
    throw new Error(
      `Plata by mono: unsupported currency "${currencyCode}". ` +
        `Add its ISO 4217 numeric code to ISO_4217_NUMERIC in money.ts.`
    )
  }
  return code
}

export function toMinorUnits(
  amount: BigNumberInput,
  currencyCode: string
): number {
  const exponent = currencyExponent(currencyCode)
  const amountStr = toMajorNumeric(amount).toString()

  if (!/^-?\d+(\.\d+)?$/.test(amountStr)) {
    throw new Error(`Plata by mono: cannot convert amount "${amountStr}" to minor units`)
  }

  const negative = amountStr.startsWith("-")
  const unsigned = negative ? amountStr.slice(1) : amountStr
  const [intPart, fracPart = ""] = unsigned.split(".")

  const fracPadded = (fracPart + "0".repeat(exponent)).slice(0, exponent)
  // Round based on the first dropped digit instead of truncating.
  const firstDroppedDigit = Number(fracPart[exponent] ?? "0")
  let minorUnits = BigInt(intPart + fracPadded)
  if (firstDroppedDigit >= 5) {
    minorUnits += 1n
  }

  const result = Number(minorUnits)
  return negative ? -result : result
}

/** Converts mono's integer minor units back to a Medusa-friendly major unit number. */
export function fromMinorUnits(minorUnits: number, currencyCode: string): number {
  const exponent = currencyExponent(currencyCode)
  return minorUnits / 10 ** exponent
}
