"use client"

import * as AccordionPrimitive from "@radix-ui/react-accordion"

export type FaqItem = {
  id: string
  question: string
  answer: React.ReactNode
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <AccordionPrimitive.Root type="multiple" className="flex flex-col">
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.id}
          value={item.id}
          className="group border-t border-line last:border-b"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="interactive flex w-full items-center justify-between gap-6 py-5 text-left">
              <span className="font-display text-xl small:text-[22px] leading-snug text-navy group-hover:text-gold transition-colors">
                {item.question}
              </span>
              <PlusIcon />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden radix-state-closed:animate-accordion-close radix-state-open:animate-accordion-open">
            <div className="pb-6 pr-10 text-sm leading-relaxed text-graphite flex flex-col gap-2">
              {item.answer}
            </div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  )
}

function PlusIcon() {
  return (
    <span
      aria-hidden
      className="relative h-8 w-8 shrink-0 rounded-circle border border-line group-radix-state-open:border-navy group-radix-state-open:bg-navy transition-colors duration-300"
    >
      <span className="absolute left-1/2 top-1/2 h-px w-3 -translate-x-1/2 -translate-y-1/2 bg-navy group-radix-state-open:bg-white transition-colors duration-300" />
      <span className="absolute left-1/2 top-1/2 h-3 w-px -translate-x-1/2 -translate-y-1/2 bg-navy group-radix-state-open:bg-white group-radix-state-open:rotate-90 transition-transform duration-300" />
    </span>
  )
}
