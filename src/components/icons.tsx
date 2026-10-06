// Иконки — инлайн SVG, цвет берут из currentColor.

interface IconProps {
  size?: number
  className?: string
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 16 16',
  fill: 'none',
  'aria-hidden': true as const,
  focusable: 'false' as const,
})

export function PlayIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4.5 2.8v10.4a.6.6 0 0 0 .9.5l8.2-5.2a.6.6 0 0 0 0-1L5.4 2.3a.6.6 0 0 0-.9.5Z" fill="currentColor" />
    </svg>
  )
}

export function PauseIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="3.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="1" fill="currentColor" />
    </svg>
  )
}

export function StepIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 3.2v9.6a.6.6 0 0 0 .9.5l6.6-4.8a.6.6 0 0 0 0-1L3.9 2.7a.6.6 0 0 0-.9.5Z" fill="currentColor" />
      <rect x="11" y="2.5" width="2.2" height="11" rx="1" fill="currentColor" />
    </svg>
  )
}

export function ResetIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 8a5 5 0 1 0 1.6-3.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M3.2 2.2v2.6h2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function WarnIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 1.8 15 14H1L8 1.8Z" fill="currentColor" />
      <path d="M8 6.2v3.6" stroke="var(--ground)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="11.9" r=".95" fill="var(--ground)" />
    </svg>
  )
}

export function CloseIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="m3.2 8.4 3 3 6.6-6.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SlidersIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M2.5 4.5h11M2.5 11.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="5.5" cy="4.5" r="1.9" fill="var(--icon-bg, var(--ground))" stroke="currentColor" strokeWidth="1.4" />
      <circle
        cx="10.5"
        cy="11.5"
        r="1.9"
        fill="var(--icon-bg, var(--ground))"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}

export function BookIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M8 4.2C6.6 3 4.6 2.6 2.2 2.8v9.6c2.4-.2 4.4.2 5.8 1.4 1.4-1.2 3.4-1.6 5.8-1.4V2.8C11.4 2.6 9.4 3 8 4.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 4.2v9.6" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function BoxesIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect
        x="2.2"
        y="2.2"
        width="11.6"
        height="11.6"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray="2.4 1.8"
      />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" />
    </svg>
  )
}

export function ShareIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M8 10V2.5M5 5.2 8 2.2l3 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5v4a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 13 12.5v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function EyeIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path
        d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

/** Значок вкладки: форма различается, а не только цвет — для тех, кто не различает красный и зелёный. */
export function BadgeIcon({ kind }: { kind: 'empty' | 'code' | 'done' | 'error' }) {
  const p = { width: 12, height: 12, viewBox: '0 0 12 12', 'aria-hidden': true as const, focusable: 'false' as const }
  if (kind === 'empty')
    return (
      <svg {...p}>
        <circle cx="6" cy="6" r="3.6" fill="none" stroke="var(--faint-text)" strokeWidth="1.4" />
      </svg>
    )
  if (kind === 'code')
    return (
      <svg {...p}>
        <circle cx="6" cy="6" r="3.6" fill="var(--ok)" />
      </svg>
    )
  if (kind === 'done')
    return (
      <svg {...p}>
        <path
          d="m2.2 6.4 2.4 2.4 5.2-5.4"
          fill="none"
          stroke="var(--ok)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  return (
    <svg {...p}>
      <path d="M6 1.2 11.2 10.6H.8L6 1.2Z" fill="var(--danger)" />
    </svg>
  )
}

/** Яблоко для ветки прогресса в шапке. */
export function AppleIcon({ ripe, className }: { ripe: boolean; className?: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M12 7.6c-1.6-1.2-4.6-1.4-6.3.6-1.9 2.2-1.6 6.3.4 9.2 1.3 1.9 2.7 3.2 4.2 2.9.7-.1 1.1-.5 1.7-.5s1 .4 1.7.5c1.5.3 2.9-1 4.2-2.9 2-2.9 2.3-7 .4-9.2-1.7-2-4.7-1.8-6.3-.6Z"
        fill={ripe ? 'var(--ok)' : 'none'}
        stroke={ripe ? 'var(--ok)' : 'var(--faint-text)'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 7.6c0-1.7.5-3 1.5-4"
        fill="none"
        stroke={ripe ? 'var(--ok)' : 'var(--faint-text)'}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.3 5.3c1.1-1.5 2.8-2 4.4-1.6-.4 1.6-1.9 2.7-4.4 1.6Z"
        fill={ripe ? 'var(--ok)' : 'none'}
        stroke={ripe ? 'var(--ok)' : 'var(--faint-text)'}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {ripe && (
        <path
          d="m8.6 13.4 2.3 2.3 4.4-4.6"
          fill="none"
          stroke="var(--ground)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
