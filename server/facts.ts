// Helpers for reading SEC XBRL "companyfacts" JSON
// (https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json).
//
// Every fact is a value for a period: balance sheet items are "instants"
// (one `end` date), income and cash flow items are "durations" (`start` and
// `end`). 10-Qs report cash flow items year-to-date, so quarterly values are
// derived here by subtracting the prior year-to-date figure.

export interface XbrlFact {
  start?: string
  end: string
  val: number
  accn: string
  fy: number | null
  fp: string | null
  form: string
  filed: string
  frame?: string
}

export interface CompanyFacts {
  cik: number
  entityName: string
  facts: Record<string, Record<string, { label: string | null; units: Record<string, XbrlFact[]> }>>
}

const DAY = 24 * 60 * 60 * 1000

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / DAY)
}

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY).toISOString().slice(0, 10)
}

const isQuarter = (days: number) => days >= 80 && days <= 100
const isAnnual = (days: number) => days >= 350 && days <= 380

/** A value series keyed by period. For durations the key is "start|end", for instants it is "end". */
export type Series = Map<string, number>

/**
 * Collect facts for the first concepts that have them, in priority order.
 * Companies switch tags over the years, so a later concept fills periods an
 * earlier one is missing. Restated values win (latest filing date).
 */
export function series(cf: CompanyFacts, concepts: string[], unit = 'USD', taxonomy = 'us-gaap'): Series {
  const out: Series = new Map()
  for (const concept of concepts) {
    const facts = cf.facts[taxonomy]?.[concept]?.units[unit]
    if (!facts) continue
    const latest = new Map<string, XbrlFact>()
    for (const f of facts) {
      if (!/^10-[KQ]/.test(f.form)) continue
      const key = f.start ? `${f.start}|${f.end}` : f.end
      const prev = latest.get(key)
      if (!prev || f.filed > prev.filed) latest.set(key, f)
    }
    for (const [key, f] of latest) if (!out.has(key)) out.set(key, f.val)
  }
  return out
}

/** Value of an instant series on a date, allowing a few days of slack for 52/53-week years. */
export function instantAt(s: Series, date: string, slackDays = 7): number | undefined {
  if (s.has(date)) return s.get(date)
  let best: { gap: number; val: number } | undefined
  for (const [end, val] of s) {
    if (end.includes('|')) continue
    const gap = Math.abs(daysBetween(end, date))
    if (gap <= slackDays && (!best || gap < best.gap)) best = { gap, val }
  }
  return best?.val
}

/** Discrete three-month values keyed by quarter end, derived from 3-month and year-to-date facts. */
export function quarterly(s: Series): Map<string, number> {
  const byStart = new Map<string, { end: string; val: number }[]>()
  const out = new Map<string, number>()
  for (const [key, val] of s) {
    const [start, end] = key.split('|')
    if (!end) continue
    if (isQuarter(daysBetween(start, end))) out.set(end, val)
    const list = byStart.get(start) ?? []
    list.push({ end, val })
    byStart.set(start, list)
  }
  // Year-to-date: Q4 = FY - 9 months, Q3 = 9 months - 6 months, and so on.
  for (const [start, list] of byStart) {
    for (const ytd of list) {
      if (out.has(ytd.end)) continue
      const days = daysBetween(start, ytd.end)
      if (days <= 100 || days > 380) continue
      const prior = list.find((p) => isQuarter(daysBetween(p.end, ytd.end)))
      if (prior) out.set(ytd.end, ytd.val - prior.val)
    }
  }
  return out
}

/** Annual values keyed by fiscal year end. */
export function annual(s: Series): Map<string, number> {
  const out = new Map<string, number>()
  for (const [key, val] of s) {
    const [start, end] = key.split('|')
    if (end && isAnnual(daysBetween(start, end))) out.set(end, val)
  }
  return out
}

/**
 * Trailing-twelve-month total ending on `end`: the annual figure when the
 * date is a fiscal year end, otherwise the sum of the last four quarters.
 */
export function ttm(s: Series, end: string): number | undefined {
  const fy = [...annual(s)].find(([e]) => Math.abs(daysBetween(e, end)) <= 7)
  if (fy) return fy[1]
  const q = [...quarterly(s)].filter(([e]) => e <= end && daysBetween(e, end) < 300).sort(([a], [b]) => (a < b ? 1 : -1))
  if (q.length < 4 || Math.abs(daysBetween(q[0][0], end)) > 7) return undefined
  const four = q.slice(0, 4)
  if (Math.abs(daysBetween(four[3][0], four[0][0]) - 273) > 20) return undefined
  return four.reduce((sum, [, v]) => sum + v, 0)
}

/** Sum several TTM series; undefined if a required one is missing. Optional ones count as 0. */
export function ttmSum(end: string, required: Series[], optional: Series[] = []): number | undefined {
  let total = 0
  for (const s of required) {
    const v = ttm(s, end)
    if (v === undefined) return undefined
    total += v
  }
  for (const s of optional) total += ttm(s, end) ?? 0
  return total
}
