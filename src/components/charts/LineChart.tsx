// Line chart with a covenant floor and a shaded "breach" zone below it.
// Used for the FCCR trend.

import { ThresholdLabel } from './ColumnChart'

interface Point {
  label: string
  value: number
}

interface Props {
  data: Point[]
  width: number
  height: number
  yMin: number
  yMax: number
  yTicks: number[]
  formatTick: (v: number) => string
  formatValue: (v: number) => string
  floor: { value: number; label: [string, string]; zoneLabel: string }
}

const PAD = { top: 20, right: 152, bottom: 40, left: 64 }

export function LineChart({ data, width, height, yMin, yMax, yTicks, formatTick, formatValue, floor }: Props) {
  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + 24 + (i / Math.max(1, data.length - 1)) * (plotW - 48)
  const y = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(d.value)}`).join(' ')
  const last = data.length - 1

  return (
    <svg width={width} height={height} className="chart" role="img">
      <rect
        x={PAD.left}
        y={y(floor.value)}
        width={plotW}
        height={y(yMin) - y(floor.value)}
        className="chart-breach-zone"
      />
      {yTicks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
          <text x={PAD.left - 16} y={y(t)} className="chart-tick" textAnchor="end" dominantBaseline="middle">
            {formatTick(t)}
          </text>
        </g>
      ))}

      <line
        x1={PAD.left}
        x2={width - PAD.right}
        y1={y(floor.value)}
        y2={y(floor.value)}
        className="chart-threshold"
      />
      <ThresholdLabel x={width - PAD.right + 14} y={y(floor.value)} lines={floor.label} />
      <text x={width - PAD.right - 8} y={y(floor.value) + 30} className="chart-zone-label" textAnchor="end">
        {floor.zoneLabel}
      </text>

      <path d={path} className="chart-line" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.value)} r={5} className={d.value < floor.value ? 'chart-dot is-fail' : 'chart-dot'} />
          <text x={x(i)} y={height - PAD.bottom + 30} className="chart-label" textAnchor="middle">
            {d.label}
          </text>
        </g>
      ))}

      {/* Label the first and last points so the trend reads at a glance. */}
      {[0, last].map((i) => (
        <text key={i} x={x(i)} y={y(data[i].value) - 16} className="chart-value" textAnchor="middle">
          {formatValue(data[i].value)}
        </text>
      ))}
    </svg>
  )
}
