import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import Logo from "@modules/layout/components/logo"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-ivory relative small:min-h-screen">
      <div className="h-16 small:h-20 bg-ivory border-b border-line">
        <nav className="grid grid-cols-[1fr_auto_1fr] h-full items-center content-container">
          <LocalizedClientLink
            href="/cart"
            className="interactive text-sm text-graphite hover:text-navy inline-flex items-center gap-x-1.5 w-fit py-2 px-1 rounded-md"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="hidden small:block">До кошика</span>
            <span className="hidden min-[640px]:block small:hidden">Назад</span>
          </LocalizedClientLink>
          <Logo className="justify-self-center" />
          <div />
        </nav>
      </div>
      <div className="relative py-8 small:py-12" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}