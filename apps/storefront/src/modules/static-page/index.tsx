import { ReactNode } from "react"

export default function StaticPage({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="content-container py-16 small:py-24">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <h1 className="font-display text-3xl text-navy">{title}</h1>
        <div className="flex flex-col gap-4 text-ink text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  )
}
