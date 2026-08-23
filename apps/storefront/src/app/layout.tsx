import { getBaseURL } from "@lib/util/env"
import { ToastProvider } from "@modules/common/components/toast"
import { Metadata } from "next"
import { Cormorant_Garamond, Manrope } from "next/font/google"
import "@styles/globals.css"

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "Zabaganka Boutique",
    template: "%s | Zabaganka Boutique",
  },
  description:
    "Zabaganka Boutique — прикраси та аксесуари для особливих моментів і щоденних образів.",
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="uk"
      data-mode="light"
      className={`${cormorant.variable} ${manrope.variable}`}
    >
      <body className="bg-ivory text-ink font-ui">
        <ToastProvider>
          <main className="relative">{props.children}</main>
        </ToastProvider>
      </body>
    </html>
  )
}
