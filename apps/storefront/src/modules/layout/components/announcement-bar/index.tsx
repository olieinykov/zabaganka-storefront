export default function AnnouncementBar({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-navy text-white text-center text-[11px] tracking-wide uppercase py-2 px-4">
      {children}
    </div>
  )
}
