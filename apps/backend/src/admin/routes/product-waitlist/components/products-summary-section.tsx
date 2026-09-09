import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Text } from "@medusajs/ui"
import { useWaitlistProducts } from "../use-product-waitlist"
import PaginationBar from "./pagination-bar"

const LIMIT = 20
const FETCH_LIMIT = 200

export default function ProductsSummarySection() {
  const navigate = useNavigate()
  const [productId, setProductId] = useState("")
  const [offset, setOffset] = useState(0)

  const { data, isLoading, isError } = useWaitlistProducts({
    limit: FETCH_LIMIT,
    offset: 0,
  })

  const filteredProducts = useMemo(() => {
    if (!data?.products) return []
    return productId
      ? data.products.filter((p) => p.product_id === productId)
      : data.products
  }, [data, productId])

  const pagedProducts = filteredProducts.slice(offset, offset + LIMIT)

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-ui-border-base">
        <label className="flex items-center gap-2 text-xs text-ui-fg-subtle">
          Товар
          <select
            value={productId}
            onChange={(e) => {
              setProductId(e.target.value)
              setOffset(0)
            }}
            className="txt-compact-small border border-ui-border-base rounded-md px-2 py-1.5 bg-ui-bg-field"
          >
            <option value="">Усі товари</option>
            {data?.products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_title}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Завантаження…
        </Text>
      )}
      {isError && (
        <Text size="small" className="text-ui-fg-error px-6 py-6">
          Не вдалося завантажити список товарів.
        </Text>
      )}
      {!isLoading && !isError && filteredProducts.length === 0 && (
        <Text size="small" className="text-ui-fg-muted px-6 py-6">
          Немає товарів з активними заявками очікування.
        </Text>
      )}

      {!!pagedProducts.length && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ui-fg-subtle border-b border-ui-border-base">
              <th className="px-6 py-2 font-medium">Товар</th>
              <th className="px-6 py-2 font-medium">Варіантів у списку</th>
              <th className="px-6 py-2 font-medium">Заявок</th>
              <th className="px-6 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pagedProducts.map((product) => (
              <tr
                key={product.product_id}
                className="border-b border-ui-border-base hover:bg-ui-bg-subtle-hover cursor-pointer"
                onClick={() =>
                  navigate(`/product-waitlist/products/${product.product_id}`)
                }
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {product.product_thumbnail && (
                      <img
                        src={product.product_thumbnail}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <span className="text-ui-fg-base">{product.product_title}</span>
                  </div>
                </td>
                <td className="px-6 py-3 text-ui-fg-subtle">
                  {product.variants.length || "—"}
                </td>
                <td className="px-6 py-3 text-ui-fg-base font-medium">
                  {product.total_count}
                </td>
                <td className="px-6 py-3 text-right text-ui-fg-interactive">
                  Детальніше →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!!filteredProducts.length && (
        <PaginationBar
          offset={offset}
          limit={LIMIT}
          count={filteredProducts.length}
          onChange={setOffset}
        />
      )}
    </div>
  )
}