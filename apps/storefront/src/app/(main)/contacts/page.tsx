import { Metadata } from "next"

import { getPageContent } from "@lib/data/page-content"
import ArrowRight from "@modules/common/icons/arrow-right"
import PageHero from "@modules/info/components/page-hero"

export const metadata: Metadata = {
  title: "Контакти | Zabaganka Boutique",
  description:
    "Зв'яжіться з Zabaganka Boutique: служба підтримки, графік роботи, Instagram і Telegram.",
}

const isExternal = (url: string) => /^https?:\/\//i.test(url)

function keepTogether(text: string): string {
  return text
    .replace(/Zabaganka\s+Boutique/g, "Zabaganka Boutique")
    .replace(/\s+♡/g, " ♡")
}

export default async function ContactsPage() {
  const { hero, support, social, closing } = await getPageContent("contacts")

  const email = support.email.trim()
  const schedule = support.schedule.filter((row) => row.hours.trim())
  const links = social.links.filter((link) => link.label && link.url)
  const hasSupport = Boolean(email) || schedule.length > 0
  const hasSocial =
    Boolean(social.heading || social.description) || links.length > 0

  return (
    <>
      <PageHero
        eyebrow={hero.eyebrow}
        title={keepTogether(hero.heading)}
        description={keepTogether(hero.description)}
      />

      {(hasSupport || hasSocial) && (
        <section className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-2 gap-6 small:gap-8">
          {hasSupport && (
            <div className="bg-milk rounded-md p-8 small:p-10 flex flex-col gap-8 small:only:col-span-2">
              {support.heading && (
                <h2 className="font-display text-3xl small:text-4xl text-navy leading-tight">
                  {support.heading}
                </h2>
              )}

              {email && (
                <div className="flex flex-col gap-2">
                  {support.email_label && (
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
                      {support.email_label}
                    </span>
                  )}
                  <a
                    href={`mailto:${email}`}
                    className="interactive w-fit max-w-full font-display text-2xl small:text-3xl text-navy hover:text-gold underline decoration-line underline-offset-[6px] [overflow-wrap:anywhere]"
                  >
                    {email}
                  </a>
                </div>
              )}

              {schedule.length > 0 && (
                <div className="flex flex-col gap-3">
                  {support.schedule_heading && (
                    <span className="text-xs uppercase tracking-[0.2em] text-gold font-semibold">
                      {support.schedule_heading}
                    </span>
                  )}
                  <dl className="flex flex-col">
                    {schedule.map((row) => (
                      <div
                        key={row.id}
                        className="flex items-baseline justify-between gap-4 py-3 border-t border-line last:border-b"
                      >
                        <dt className="text-sm text-graphite">{row.days}</dt>
                        <dd className="text-sm font-medium text-navy text-right">
                          {row.hours}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          )}

          {hasSocial && (
            <div className="bg-navy text-white rounded-md p-8 small:p-10 flex flex-col gap-6 small:only:col-span-2">
              {social.heading && (
                <h2 className="font-display text-3xl small:text-4xl leading-tight">
                  {social.heading}
                </h2>
              )}
              {social.description && (
                <p className="text-white/70 text-sm leading-relaxed max-w-md">
                  {social.description}
                </p>
              )}
              {links.length > 0 && (
                <ul className="flex flex-col mt-auto">
                  {links.map((link) => (
                    <li
                      key={link.id}
                      className="border-t border-white/20 last:border-b"
                    >
                      <a
                        href={link.url}
                        {...(isExternal(link.url)
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="group interactive flex items-center justify-between gap-4 py-4"
                      >
                        <span className="flex flex-col gap-0.5 min-w-0">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                            {link.label}
                          </span>
                          {link.handle && (
                            <span className="font-display text-xl text-white group-hover:text-gold interactive [overflow-wrap:anywhere]">
                              {link.handle}
                            </span>
                          )}
                        </span>
                        <ArrowRight
                          size={16}
                          className="shrink-0 text-white/60 group-hover:text-gold group-hover:translate-x-0.5 interactive"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}

      {closing.text && (
        <section className="border-t border-line">
          <div className="content-container py-16 small:py-20 text-center">
            <p className="font-display text-2xl small:text-3xl text-navy max-w-3xl mx-auto leading-snug whitespace-pre-line [text-wrap:balance]">
              {keepTogether(closing.text)}
            </p>
          </div>
        </section>
      )}
    </>
  )
}
