import { sampleCompanies } from '../data/sampleCompanies'
import type { CompanyReport, Period } from '../types'

// The one place the UI asks for data. Right now it returns sample reports
// after a short fake delay so the progress screen has something to show.
// When the backend exists, replace the body of generateReport with a fetch
// call; the rest of the app stays the same.

export interface CompanyMatch {
  name: string
  ticker: string
  industry: string
}

export const GENERATION_STEPS = [
  'Finding latest 10-K and 10-Q on SEC EDGAR',
  'Extracting financial statements and debt footnote',
  'Calculating leverage, FCCR, and exposure',
  'Scanning 12 months of news and legal filings',
  'Writing summaries and takeaways',
] as const

export function searchCompanies(query: string): CompanyMatch[] {
  const q = query.trim().toLowerCase()
  return sampleCompanies
    .map((r) => r.company)
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q))
    .map(({ name, ticker, industry }) => ({ name, ticker, industry }))
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateReport(
  ticker: string,
  period: Period,
  onStep: (stepIndex: number) => void,
  stepDelayMs = 450,
): Promise<CompanyReport> {
  const report = sampleCompanies.find((r) => r.company.ticker === ticker)
  if (!report) throw new Error(`No data for ${ticker}`)

  for (let i = 0; i < GENERATION_STEPS.length; i++) {
    onStep(i)
    await wait(stepDelayMs)
  }
  onStep(GENERATION_STEPS.length)
  return { ...report, period }
}
