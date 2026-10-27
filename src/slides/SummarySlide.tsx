import { Eyebrow, SourceNote, StatusPill } from '../components/SlideParts'
import { useFitText } from '../components/useFitText'
import { customerConcentrationStatus, fccrStatus, leverageStatus, reputationStatus } from '../lib/covenants'
import { billions, ratio } from '../lib/format'
import type { CompanyReport, Status } from '../types'

const STATUS_WORD: Record<Status, string> = { pass: 'Pass', watch: 'Watch', fail: 'Fail' }

/** Key metrics panel plus the plain-language takeaways. */
export function SummarySlide({ report }: { report: CompanyReport }) {
  // Long takeaways shrink from 22px down to 18px before they would run off the slide.
  const takeawaysRef = useFitText<HTMLUListElement>(22, 18, report.takeaways)
  const lev = report.leverage.history.at(-1)!.value
  const fccr = report.fccr.history.at(-1)!.value
  const d = report.debt

  const rows: { metric: string; value: string; detail: string; status: Status }[] = [
    {
      metric: 'Leverage',
      value: ratio(lev),
      detail: `Covenant max ${ratio(report.leverage.covenantMax)}`,
      status: leverageStatus(lev, report.leverage.covenantMax),
    },
    {
      metric: 'FCCR',
      value: ratio(fccr, 2),
      detail: `Covenant min ${ratio(report.fccr.covenantMin, 2)}`,
      status: fccrStatus(fccr, report.fccr.covenantMin),
    },
    {
      metric: 'Net debt',
      value: billions(d.totalDebt - d.cash),
      detail: d.floatingShare === null ? 'floating share n/d' : `${d.floatingShare}% floating`,
      status: d.floatingShare !== null && d.floatingShare > 50 ? 'watch' : 'pass',
    },
    {
      metric: 'Largest customer',
      value: report.exposure.largestCustomerShare === null ? 'n/d' : `${report.exposure.largestCustomerShare}%`,
      detail: 'of revenue',
      status: customerConcentrationStatus(report.exposure.largestCustomerShare),
    },
    {
      metric: 'Reputation',
      value: report.reputation.level,
      detail: `${report.reputation.events.length} flagged events`,
      status: reputationStatus(report.reputation.level),
    },
  ]

  return (
    <div className="slide-body">
      <Eyebrow>Summary · {report.company.name}</Eyebrow>
      <div className="summary-grid">
        <section>
          <h3 className="chart-title">Key metrics</h3>
          <table className="scorecard">
            <tbody>
              {rows.map((r) => (
                <tr key={r.metric}>
                  <td className="scorecard-metric">{r.metric}</td>
                  <td className="scorecard-value">{r.value}</td>
                  <td className="scorecard-detail">{r.detail}</td>
                  <td>
                    <StatusPill status={r.status} size="sm">
                      {STATUS_WORD[r.status]}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h3 className="chart-title">Key takeaways</h3>
          <ul ref={takeawaysRef} className="takeaways">
            {report.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>
      <SourceNote isSample={report.isSample} note="Pass / watch / fail are checked against covenant thresholds" />
    </div>
  )
}
