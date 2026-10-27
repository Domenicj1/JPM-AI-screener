import type { ReactNode } from 'react'
import type { Source, Status } from '../types'

// Small building blocks shared by every slide, matching the memo mockups:
// an eyebrow line, a headline number, a status pill, stat tiles, and a
// footer that says where the data came from.

const STATUS_ICON: Record<Status, string> = { pass: '✓', watch: '!', fail: '✕' }

export function StatusPill({ status, children, size = 'md' }: { status: Status; children: ReactNode; size?: 'sm' | 'md' }) {
  return (
    <span className={`pill pill-${status} pill-${size}`}>
      <span className="pill-icon" aria-hidden>
        {STATUS_ICON[status]}
      </span>
      {children}
    </span>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow">{children}</div>
}

export function Headline({ value, context, pill }: { value: ReactNode; context?: ReactNode; pill?: ReactNode }) {
  return (
    <div className="headline">
      <span className="headline-value">{value}</span>
      {context && <span className="headline-context">{context}</span>}
      {pill}
    </div>
  )
}

export function Summary({ children }: { children: ReactNode }) {
  return <p className="summary">{children}</p>
}

export function StatTile({ value, label, children }: { value: ReactNode; label: ReactNode; children?: ReactNode }) {
  return (
    <div className="stat-tile">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {children}
    </div>
  )
}

export function SourceNote({ isSample, note, source }: { isSample: boolean; note?: string; source?: Source }) {
  const parts = [isSample ? 'Illustrative example, sample data' : null, note].filter(Boolean)
  return (
    <footer className="source-note">
      {parts.join(' · ')}
      {source && (
        <>
          {parts.length > 0 && ' · '}
          Source:{' '}
          {source.url ? (
            <a href={source.url} target="_blank" rel="noreferrer">
              {source.label} ↗
            </a>
          ) : (
            source.label
          )}
        </>
      )}
    </footer>
  )
}
