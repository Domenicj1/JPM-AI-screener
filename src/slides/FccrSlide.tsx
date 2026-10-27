import { LineChart } from '../components/charts/LineChart'
import { Eyebrow, Headline, SourceNote, StatusPill, Summary } from '../components/SlideParts'
import { fccrStatus } from '../lib/covenants'
import { ratio } from '../lib/format'
import { niceTicks } from '../lib/ticks'
import type { CompanyReport } from '../types'

const PILL_TEXT = { pass: 'Pass', watch: 'Watch', fail: 'Fail' }

/** Round the axis to 0.2x steps with room above and below the data. */
function axis(values: number[], floor: number) {
  const min = Math.min(...values, floor)
  const max = Math.max(...values)
  const pad = (max - min) * 0.15
  return niceTicks(Math.max(0, min - pad), max + pad)
}

export function FccrSlide({ report }: { report: CompanyReport }) {
  const { history, covenantMin, summary, source, principalEstimated } = report.fccr
  const current = history[history.length - 1]
  const status = fccrStatus(current.value, covenantMin)
  const { lo, hi, ticks } = axis(
    history.map((h) => h.value),
    covenantMin,
  )
  const formula = 'FCCR = (EBITDA − CapEx − cash taxes) / (interest + scheduled principal)'

  return (
    <div className="slide-body">
      <Eyebrow>Fixed charge coverage ratio · Trailing 12 months</Eyebrow>
      <Headline
        value={ratio(current.value, 2)}
        context={`vs. ${ratio(covenantMin, 2)} covenant minimum`}
        pill={<StatusPill status={status}>{PILL_TEXT[status]}</StatusPill>}
      />
      <Summary>{summary}</Summary>
      <div className="slide-chart">
        <LineChart
          data={history}
          width={1168}
          height={340}
          yMin={lo}
          yMax={hi}
          yTicks={ticks}
          formatTick={(v) => `${v.toFixed(1)}x`}
          formatValue={(v) => ratio(v, 2)}
          floor={{ value: covenantMin, label: ['Covenant min', ratio(covenantMin, 2)], zoneLabel: 'Below = breach' }}
        />
      </div>
      <SourceNote
        isSample={report.isSample}
        note={principalEstimated ? `${formula} · Scheduled principal estimated` : formula}
        source={source}
      />
    </div>
  )
}
