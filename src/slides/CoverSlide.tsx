import { longDate } from '../lib/format'
import type { CompanyReport } from '../types'

export function CoverSlide({ report }: { report: CompanyReport }) {
  const c = report.company
  return (
    <div className="slide-body cover">
      <div className="eyebrow">Credit first look · {report.period === 'ttm' ? 'Trailing 12 months' : 'Latest fiscal year'}</div>
      <h1 className="cover-title">{c.name}</h1>
      <div className="cover-meta">
        <span className="ticker">{c.ticker}</span>
        <span>{c.industry}</span>
      </div>
      <div className="cover-foot">
        Data from {c.filingLabel}, filed {longDate(c.filingDate)}
        {report.isSample && <span className="cover-sample">Illustrative example, sample data</span>}
      </div>
    </div>
  )
}
