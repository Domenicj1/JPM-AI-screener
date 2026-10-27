import { ColumnChart } from '../components/charts/ColumnChart'
import { Eyebrow, Headline, SourceNote, StatusPill, Summary } from '../components/SlideParts'
import { leverageStatus } from '../lib/covenants'
import { ratio } from '../lib/format'
import type { CompanyReport } from '../types'
import { niceTicks } from '../lib/ticks'

const PILL_TEXT = { pass: 'Within covenant', watch: 'Near covenant', fail: 'Above covenant' }

export function LeverageSlide({ report }: { report: CompanyReport }) {
  const { history, covenantMax, summary, source } = report.leverage
  const current = history[history.length - 1]
  const first = history[0]
  const status = leverageStatus(current.value, covenantMax)
  const direction = current.value < first.value ? 'down' : current.value > first.value ? 'up' : 'flat'
  const { hi: yMax, ticks } = niceTicks(0, Math.max(...history.map((h) => h.value), covenantMax) + 0.3)

  return (
    <div className="slide-body">
      <Eyebrow>Leverage ratio · Total debt / EBITDA</Eyebrow>
      <Headline
        value={ratio(current.value)}
        context={`${direction} from ${ratio(first.value)} in ${first.label}`}
        pill={
          <StatusPill status={status}>
            {PILL_TEXT[status]} (max {ratio(covenantMax)})
          </StatusPill>
        }
      />
      <Summary>{summary}</Summary>
      <div className="slide-chart">
        <ColumnChart
          data={history}
          width={1168}
          height={360}
          yMax={yMax}
          yTicks={ticks}
          formatTick={(v) => `${v}x`}
          formatValue={(v) => ratio(v)}
          threshold={{ value: covenantMax, label: ['Covenant max', ratio(covenantMax)] }}
          failAbove={covenantMax}
        />
      </div>
      <SourceNote isSample={report.isSample} source={source} />
    </div>
  )
}
