import { Eyebrow, Headline, SourceNote, StatusPill, Summary } from '../components/SlideParts'
import { reputationStatus } from '../lib/covenants'
import type { CompanyReport } from '../types'

const PILL_TEXT = { pass: 'Clear', watch: 'Watch', fail: 'Flag' }

export function ReputationSlide({ report }: { report: CompanyReport }) {
  const r = report.reputation
  const status = reputationStatus(r.level)

  return (
    <div className="slide-body">
      <Eyebrow>Reputation · Last 12 months of news + 10-K legal proceedings</Eyebrow>
      <Headline value={`${r.level} risk`} pill={<StatusPill status={status}>{PILL_TEXT[status]}</StatusPill>} />
      <Summary>{r.summary}</Summary>
      <table className="events">
        <tbody>
          {r.events.map((ev) => (
            <tr key={ev.date + ev.headline}>
              <td className="events-date">{ev.date}</td>
              <td>
                <span className="tag">{ev.tag}</span>
              </td>
              <td className="events-headline">{ev.headline}</td>
              <td className="events-link">
                {ev.source.url ? (
                  <a href={ev.source.url} target="_blank" rel="noreferrer">
                    {ev.source.label} ↗
                  </a>
                ) : (
                  ev.source.label
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SourceNote isSample={report.isSample} note={`${r.footnote} · Flag levels: Low / Medium / High`} />
    </div>
  )
}
