"use client"

import { Popover, PopoverButton, PopoverPanel, Portal, Transition } from "@headlessui/react"
import ArrowRight from "@modules/common/icons/arrow-right"
import Menu from "@modules/common/icons/menu"
import X from "@modules/common/icons/x"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Fragment, useEffect } from "react"

export type NavLink = { name: string; href: string }

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [locked])
}

export default function MobileMenuTrigger({ links }: { links: NavLink[] }) {
  return (
    <Popover className="small:hidden">
      {({ open, close }) => (
        <>
          <PopoverButton
            aria-label="Відкрити меню"
            className="interactive interactive-lift text-ink flex items-center justify-center"
            data-testid="nav-menu-button"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </PopoverButton>
          <BodyScrollLock locked={open} />
          <Transition
            show={open}
            as={Fragment as React.ElementType}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 -translate-x-2"
            enterTo="opacity-100 translate-x-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-x-0"
            leaveTo="opacity-0 -translate-x-2"
          >
            <Portal>
              <PopoverPanel
                static
                className="fixed inset-0 z-[100] bg-ivory flex flex-col"
                data-testid="mobile-menu-panel"
              >
                <div className="flex items-center justify-between px-6 py-6">
                  <h2 className="font-display text-3xl text-ink">Меню</h2>
                  <button
                    onClick={close}
                    aria-label="Закрити меню"
                    className="interactive interactive-lift text-ink"
                    data-testid="close-mobile-menu"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="border-t border-line" />
                <nav className="flex flex-col px-6 flex-1 min-h-0 overflow-y-auto">
                  {links.map((link) => (
                    <LocalizedClientLink
                      key={link.href}
                      href={link.href}
                      onClick={close}
                      className="group flex items-center justify-between py-5 border-b border-line interactive"
                    >
                      <span className="font-display text-2xl text-ink group-hover:text-navy">
                        {link.name}
                      </span>
                      <ArrowRight
                        size={18}
                        className="text-ink group-hover:translate-x-1 interactive"
                      />
                    </LocalizedClientLink>
                  ))}
                </nav>
              </PopoverPanel>
            </Portal>
          </Transition>
        </>
      )}
    </Popover>
  )
}

function BodyScrollLock({ locked }: { locked: boolean }) {
  useBodyScrollLock(locked)
  return null
}