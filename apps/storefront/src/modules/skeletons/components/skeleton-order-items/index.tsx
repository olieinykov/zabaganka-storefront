import repeat from "@lib/util/repeat"

const SkeletonOrderItemRow = () => (
  <div className="grid grid-cols-[122px_1fr] max-[470px]:grid-cols-1 gap-x-4 gap-y-3">
    <div className="w-full max-[470px]:w-16 aspect-[29/34] max-[470px]:aspect-square bg-gray-100" />
    <div className="flex items-start justify-between max-[470px]:flex-col max-[470px]:gap-y-3">
      <div className="flex flex-col gap-y-2 max-[470px]:w-full">
        <div className="w-48 max-w-full h-6 bg-gray-100" />
        <div className="w-24 h-4 bg-gray-100" />
        <div className="w-32 h-4 bg-gray-100" />
      </div>
      <div className="w-32 h-6 bg-gray-100 max-[470px]:self-end" />
    </div>
  </div>
)

const SkeletonOrderItems = () => {
  return (
    <div className="flex flex-col gap-y-4 py-10 border-y border-gray-200">
      {repeat(3).map((index) => (
        <SkeletonOrderItemRow key={index} />
      ))}
    </div>
  )
}

export default SkeletonOrderItems