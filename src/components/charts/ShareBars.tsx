// Horizontal percentage bars (revenue by segment / region). Plain HTML and
// CSS is enough here; bar length is the share relative to the largest row.

interface Props {
  title: string
  rows: { label: string; share: number }[]
}

export function ShareBars({ title, rows }: Props) {
  const max = Math.max(...rows.map((r) => r.share))
  return (
    <div className="share-bars">
      <h3 className="chart-title">{title}</h3>
      {rows.map((r) => (
        <div className="share-row" key={r.label}>
          <span className="share-label">{r.label}</span>
          <span className="share-track">
            <span className="share-bar" style={{ width: `${(r.share / max) * 100}%` }} />
            <span className="share-value">{r.share}%</span>
          </span>
        </div>
      ))}
    </div>
  )
}
