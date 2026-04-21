import type { ReactNode } from 'react'
import clsx from 'clsx'

type SectionCardProps = {
  title: string
  rightSlot?: ReactNode
  className?: string
  children: ReactNode
}

export function SectionCard({ title, rightSlot, className, children }: SectionCardProps) {
  return (
    <section
      className={clsx(
        'rounded-2xl border border-white/10 bg-slate-900/55 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm',
        className,
      )}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-safe text-sm font-semibold uppercase tracking-[0.16em] text-white/75">
          {title}
        </h2>
        {rightSlot}
      </header>
      {children}
    </section>
  )
}
