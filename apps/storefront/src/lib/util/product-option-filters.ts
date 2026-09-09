export const OPTION_VALUE_QUERY_KEY = "optionValueIds"
export const IN_STOCK_ONLY_QUERY_KEY = "inStockOnly"

export type OptionValueIds = string[]

export const parseOptionValueIds = (
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): OptionValueIds => {
  if (typeof (searchParams as URLSearchParams).getAll === "function") {
    const values = (searchParams as URLSearchParams).getAll(OPTION_VALUE_QUERY_KEY)
    return Array.from(new Set(values.filter(Boolean)))
  }

  const paramValue = (
    searchParams as Record<string, string | string[] | undefined>
  )[OPTION_VALUE_QUERY_KEY]

  if (Array.isArray(paramValue)) {
    return Array.from(new Set(paramValue.filter(Boolean)))
  }

  if (typeof paramValue === "string" && paramValue.length > 0) {
    return paramValue.split(",").filter(Boolean)
  }

  return []
}

export const parseInStockOnly = (
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>
): boolean => {
  if (typeof (searchParams as URLSearchParams).get === "function") {
    return (searchParams as URLSearchParams).get(IN_STOCK_ONLY_QUERY_KEY) === "true"
  }

  const paramValue = (
    searchParams as Record<string, string | string[] | undefined>
  )[IN_STOCK_ONLY_QUERY_KEY]

  const value = Array.isArray(paramValue) ? paramValue[0] : paramValue
  return value === "true"
}
