"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export type DeliveryCity = {
  ref: string
  name: string
  area?: string
}

export type DeliveryWarehouse = {
  ref: string
  name: string
  number?: string
  shortAddress?: string
  cityRef: string
}

/**
 * These call the backend's `/store/delivery/*` routes (see backend
 * `src/api/store/delivery/**`), which proxy Nova Poshta / Ukrposhta and keep
 * the carriers' API keys server-side only.
 */

export async function searchNovaPoshtaCities(
  query: string
): Promise<DeliveryCity[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const headers = { ...(await getAuthHeaders()) }

  return sdk.client
    .fetch<{ cities: DeliveryCity[] }>("/store/delivery/nova-poshta/cities", {
      method: "GET",
      query: { q: query },
      headers,
      cache: "no-store",
    })
    .then(({ cities }) => cities)
    .catch(() => [])
}

export async function searchNovaPoshtaWarehouses(
  cityRef: string,
  query?: string,
  type: "warehouse" | "postomat" = "warehouse"
): Promise<DeliveryWarehouse[]> {
  if (!cityRef) {
    return []
  }

  const headers = { ...(await getAuthHeaders()) }

  return sdk.client
    .fetch<{ warehouses: DeliveryWarehouse[] }>(
      "/store/delivery/nova-poshta/warehouses",
      {
        method: "GET",
        query: { cityRef, q: query, type },
        headers,
        cache: "no-store",
      }
    )
    .then(({ warehouses }) => warehouses)
    .catch(() => [])
}

export async function searchUkrposhtaCities(
  query: string
): Promise<DeliveryCity[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  const headers = { ...(await getAuthHeaders()) }

  return sdk.client
    .fetch<{ cities: DeliveryCity[] }>("/store/delivery/ukrposhta/cities", {
      method: "GET",
      query: { q: query },
      headers,
      cache: "no-store",
    })
    .then(({ cities }) => cities)
    .catch(() => [])
}

export async function searchUkrposhtaWarehouses(
  cityRef: string,
  query?: string
): Promise<DeliveryWarehouse[]> {
  if (!cityRef) {
    return []
  }

  const headers = { ...(await getAuthHeaders()) }

  return sdk.client
    .fetch<{ warehouses: DeliveryWarehouse[] }>(
      "/store/delivery/ukrposhta/warehouses",
      {
        method: "GET",
        query: { cityRef, q: query },
        headers,
        cache: "no-store",
      }
    )
    .then(({ warehouses }) => warehouses)
    .catch(() => [])
}
