import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

export default function Logo({
  variant = "dark",
  className,
}: {
  variant?: "dark" | "light"
  className?: string
}) {
  return (
    <LocalizedClientLink
      href="/"
      className={clx(
        "flex flex-col items-center leading-none interactive hover:opacity-80",
        className
      )}
      data-testid="nav-store-link"
    >
      <span
        className={clx(
          "font-display text-xl small:text-2xl tracking-[0.12em]",
          variant === "dark" ? "text-navy" : "text-white"
        )}
      >
        ZABAGANKA
      </span>
      {/*<span
        className={clx(
          "text-[9px] small:text-[10px] tracking-[0.4em] mt-1",
          variant === "dark" ? "text-graphite" : "text-white/70"
        )}
      >
        BOUTIQUE
      </span>*/}
    </LocalizedClientLink>
  )
}
