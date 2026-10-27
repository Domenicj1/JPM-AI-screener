import { ColumnChart } from '../components/charts/ColumnChart'
import { Eyebrow, SourceNote, StatTile, StatusPill, Summary } from '../components/SlideParts'
import { largestIndex } from '../lib/covenants'
import { billions, percent } from '../lib/format'
import type { CompanyReport } from '../types'
import { niceTicks } from '../lib/ticks'

export function DebtSlide({ report }: { report: CompanyReport }) {
  const d = report.debt
  // "2031+" is a bucket of everything later, so it is not a single-year wall.
  const singleYears = d.maturities.filter((m) => !m.label.endsWith('+'))
  const wall = singleYears[largestIndex(singleYears.map((m) => m.value))]
  const change = d.totalDebt < d.totalDebtYearAgo ? 'down' : 'up'
  const maxValue = Math.max(...d.maturities.map((m) => m.value))
 const { hi: yMax, ticks } = niceTicks(0, maxValue * 1.15)

  return (
    <div className="slide-body">
      <Eyebrow>Debt · {d.asOf}</Eyebrow>
      <div className="tiles tiles-4">
        <StatTile
          value={billions(d.totalDebt)}
          label={`total debt (${change} from ${billions(d.totalDebtYearAgo)} a year ago)`}
        />
        <StatTile
          value={billions(d.totalDebt - d.cash)}
          label={`net debt (total debt minus ${billions(d.cash)} cash)`}
        />
        <StatTile value={percent(d.avgRate)} label="average interest rate" />
        <StatTile
          value={d.floatingShare === null ? 'n/d' : percent(d.floatingShare)}
          label={d.floatingShare === null ? 'floating rate share not disclosed' : 'floating rate (rises if rates rise)'}
        />
      </div>
      <div>
        <StatusPill status="watch">
          Watch: {billions(wall.value)} due in {wall.label}
        </StatusPill>
      </div>
      <Summary>{d.summary}</Summary>
      <h3 className="chart-title">Debt maturity schedule ($B due per year)</h3>
      <div className="slide-chart">
        <ColumnChart
          data={d.maturities}
          width={1168}
          height={232}
          yMax={yMax}
          yTicks={ticks}
          formatTick={(v) => `$${v}B`}
          formatValue={billions}
          highlightIndex={d.maturities.indexOf(wall)}
        />
      </div>
      <SourceNote isSample={report.isSample} source={d.source} />
    </div>
  )
}
