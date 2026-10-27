// Vertical bar chart drawn with plain SVG. Used for the leverage trend and
// the debt maturity schedule.

interface Point {
  label: string
  value: number
}

interface Threshold {
  value: number
  label: [string, string]
}

interface Props {
  data: Point[]
  width: number
  height: number
  yMax: number
  yTicks: number[]
  formatTick: (v: number) => string
  formatValue: (v: number) => string
  threshold?: Threshold
  /** Bar to draw in the warning color (e.g. the largest maturity year). */
  highlightIndex?: number
  /** Bars above this value are drawn in the failure color. */
  failAbove?: number
}

/** Two-line label beside the end of a threshold line, e.g. "Covenant max" / "3.5x". */
export function ThresholdLabel({ x, y, lines, className = 'chart-threshold-label' }: { x: number; y: number; lines: [string, string]; className?: string }) {
  return (
    <text x={x} y={y - 6} className={className}>
      <tspan x={x}>{lines[0]}</tspan>
      <tspan x={x} dy={24}>
        {lines[1]}
      </tspan>
    </text>
  )
}

const PAD = { top: 36, right: 16, bottom: 40, left: 64 }
/** Extra right margin for the threshold label so it never overlaps a bar. */
const GUTTER = 128

export function ColumnChart({
  data,
  width,
  height,
  yMax,
  yTicks,
  formatTick,
  formatValue,
  threshold,
  highlightIndex,
  failAbove,
}: Props) {
  const right = PAD.right + (threshold ? GUTTER : 0)
  const plotW = width - PAD.left - right
  const plotH = height - PAD.top - PAD.bottom
  const y = (v: number) => PAD.top + plotH - (v / yMax) * plotH
  const slot = plotW / data.length
  const barW = Math.min(112, slot * 0.52)

  return (
    <svg width={width} height={height} className="chart" role="img">
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={width - right} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={PAD.left - 16} y={y(t)} className="chart-tick" textAnchor="end" dominantBaseline="middle">
            {formatTick(t)}
          </text>
        </g>
      ))}

      {data.map((d, i) => {
        const cx = PAD.left + slot * i + slot / 2
        const top = y(d.value)
        let cls = 'chart-bar'
        if (failAbove !== undefined && d.value > failAbove) cls += ' is-fail'
        else if (i === highlightIndex) cls += ' is-watch'
        return (
          <g key={d.label}>
            <rect x={cx - barW / 2} y={top} width={barW} height={y(0) - top} rx={4} className={cls} />
            <text x={cx} y={top - 12} className="chart-value" textAnchor="middle">
              {formatValue(d.value)}
            </text>
            <text x={cx} y={height - PAD.bottom + 28} className="chart-label" textAnchor="middle">
              {d.label}
            </text>
          </g>
        )
      })}

      {threshold && (
        <g>
          <line
            x1={PAD.left}
            x2={width - right}
            y1={y(threshold.value)}
            y2={y(threshold.value)}
            className="chart-threshold"
          />
          <ThresholdLabel x={width - right + 14} y={y(threshold.value)} lines={threshold.label} />
        </g>
      )}
    </svg>
  )
}
