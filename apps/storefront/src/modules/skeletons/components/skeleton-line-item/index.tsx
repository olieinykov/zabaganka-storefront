import { Table, clx } from "@modules/common/components/ui"

type SkeletonLineItemProps = {
  type?: "full" | "preview"
}

const SkeletonLineItem = ({ type = "preview" }: SkeletonLineItemProps) => {
  return (
    <Table.Row className="w-full m-4">
      <Table.Cell className="!pl-0 p-4 w-24">
        <div
          className={clx("bg-gray-200 animate-pulse aspect-square rounded-large", {
            "w-16": type === "preview",
            "w-12 small:w-24": type === "full",
          })}
        />
      </Table.Cell>
      <Table.Cell className="text-left max-w-0 w-full">
        <div className="flex flex-col gap-y-2">
          <div className="w-32 h-4 bg-gray-200 animate-pulse" />
          <div className="w-24 h-4 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
      {type === "full" && (
        <Table.Cell>
          <div className="flex gap-2 items-center">
            <div className="w-6 h-8 bg-gray-200 animate-pulse" />
            <div className="w-14 h-10 bg-gray-200 animate-pulse" />
          </div>
        </Table.Cell>
      )}
      {type === "full" && (
        <Table.Cell className="hidden small:table-cell">
          <div className="flex gap-2">
            <div className="w-12 h-6 bg-gray-200 animate-pulse" />
          </div>
        </Table.Cell>
      )}
      <Table.Cell className="!pr-0 whitespace-nowrap">
        <div className="flex gap-2 justify-end">
          <div className="w-12 h-6 bg-gray-200 animate-pulse" />
        </div>
      </Table.Cell>
    </Table.Row>
  )
}

export default SkeletonLineItem