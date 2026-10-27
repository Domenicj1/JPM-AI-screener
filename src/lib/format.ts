/** 2.3 -> "2.3x", 1.95 -> "1.95x" (keeps the precision the data has). */
export function ratio(value: number, digits?: number): string {
  if (digits !== undefined) return `${value.toFixed(digits)}x`
  return `${Number(value.toFixed(2))}x`
}

/** Billions: 8.4 -> "$8.4B". */
export function billions(value: number): string {
  return `$${value.toFixed(1)}B`
}

export function percent(value: number): string {
  return `${Number(value.toFixed(1))}%`
}

/** "2026-08-07" -> "Aug 7, 2026" without timezone surprises. */
export function longDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}
