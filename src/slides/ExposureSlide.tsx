import { ShareBars } from '../components/charts/ShareBars'
import { Eyebrow, SourceNote, StatTile, StatusPill, Summary } from '../components/SlideParts'
import { CUSTOMER_CONCENTRATION_LIMIT, customerConcentrationStatus } from '../lib/covenants'
import type { CompanyReport } from '../types'

export function ExposureSlide({ report }: { report: CompanyReport }) {
  const e = report.exposure
  const concentration = customerConcentrationStatus(e.largestCustomerShare)

  return (
    <div className="slide-body">
      <Eyebrow>Company exposure (stability) · {e.period}</Eyebrow>
      <div className="tiles tiles-3">
        <StatTile value={`${e.largestCustomerShare}%`} label="of revenue from largest customer">
          {concentration !== 'pass' && (
            <StatusPill status={concentration} size="sm">
              Above {CUSTOMER_CONCENTRATION_LIMIT}%
            </StatusPill>
          )}
        </StatTile>
        <StatTile value={`${e.top3CustomerShare}%`} label="of revenue from top 3 customers" />
        <StatTile value={`±${e.quarterlySwing}%`} label={`quarterly revenue swing (${e.seasonalNote})`} />
      </div>
      <Summary>{e.summary}</Summary>
      <div className="two-col">
        <ShareBars title="Revenue by segment" rows={e.segments} />
        <ShareBars title="Revenue by region" rows={e.regions} />
      </div>
      <SourceNote isSample={report.isSample} source={e.source} />
    </div>
  )
}
