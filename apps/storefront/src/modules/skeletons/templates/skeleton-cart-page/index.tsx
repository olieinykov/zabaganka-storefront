import { Table } from "@modules/common/components/ui"

import repeat from "@lib/util/repeat"
import SkeletonCartItem from "@modules/skeletons/components/skeleton-cart-item"
import SkeletonOrderSummary from "@modules/skeletons/components/skeleton-order-summary"

const SkeletonCartPage = () => {
  return (
    <div className="py-12">
      <div className="content-container">
        <div className="grid grid-cols-1 small:grid-cols-[1fr_360px] gap-x-40">
          <div className="flex flex-col bg-ivory py-6 gap-y-6">
            <div className="pb-3 flex items-center">
              <div className="w-24 h-10 bg-gray-200 animate-pulse" />
            </div>

            <div className="w-full overflow-x-auto">
              <Table className="min-w-[600px]">
                <Table.Header className="border-t-0">
                  <Table.Row className="text-ui-fg-subtle txt-medium-plus">
                    <Table.HeaderCell className="!pl-0">
                      <div className="w-10 h-6 bg-gray-200 animate-pulse" />
                    </Table.HeaderCell>
                    <Table.HeaderCell></Table.HeaderCell>
                    <Table.HeaderCell>
                      <div className="w-16 h-6 bg-gray-200 animate-pulse" />
                    </Table.HeaderCell>
                    <Table.HeaderCell className="hidden small:table-cell">
                      <div className="w-12 h-6 bg-gray-200 animate-pulse" />
                    </Table.HeaderCell>
                    <Table.HeaderCell className="!pr-0 text-right">
                      <div className="flex justify-end">
                        <div className="w-12 h-6 bg-gray-200 animate-pulse" />
                      </div>
                    </Table.HeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {repeat(4).map((index) => (
                    <SkeletonCartItem key={index} />
                  ))}
                </Table.Body>
              </Table>
            </div>
          </div>
          <div className="relative">
            <div className="flex flex-col gap-y-8 small:sticky small:top-12">
              <div className="bg-ivory py-6">
                <SkeletonOrderSummary />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCartPage