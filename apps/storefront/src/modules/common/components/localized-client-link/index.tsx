import Link from "next/link"
import React from "react"

/**
 * Plain wrapper around Next's <Link />. Kept as its own component (instead
 * of using next/link directly everywhere) purely so existing imports across
 * the app don't need to change — it no longer localizes/prefixes the href
 * with a country code, since the store only serves a single Ukraine region
 * and doesn't route by country anymore.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  return (
    <Link href={href} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink
