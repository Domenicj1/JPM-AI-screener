import { sampleCompanies } from '../data/sampleCompanies'
import type { CompanyReport, Period } from '../types'

// The one place the UI asks for data. Sample tickers (NWDV, BWLX) are served
// from local sample data so the demo works offline; every other ticker goes
// to the server (server/, api/), which pulls SEC EDGAR data and asks Claude
// for the summaries. The browser never sees the API key.

export interface CompanyMatch {
  name: string
  ticker: string
  industry: string
}

export const GENERATION_STEPS = [
  'Finding latest 10-K and 10-Q on SEC EDGAR',
  'Extracting financial statements and debt data',
  'Calculating leverage, FCCR, and exposure',
  'Reading 10-K customers, segments, and legal proceedings',
  'Writing summaries and takeaways',
] as const

function sampleMatches(query: string): CompanyMatch[] {
  const q = query.trim().toLowerCase()
  return sampleCompanies
    .map((r) => r.company)
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.ticker.toLowerCase().includes(q))
    .map(({ name, ticker, industry }) => ({ name, ticker, industry: `${industry} (sample)` }))
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const body = await res.json().catch(() => ({ error: `Server returned ${res.status}` }))
  if (!res.ok) throw new Error(body.error ?? `Server returned ${res.status}`)
  return body as T
}

/** Sample companies plus SEC-listed companies. If the server fails, returns the samples and the error. */
export async function searchCompanies(query: string): Promise<{ matches: CompanyMatch[]; error?: string }> {
  const samples = sampleMatches(query)
  if (!query.trim()) return { matches: samples }
  try {
    const live = await getJson<CompanyMatch[]>(`/api/search?q=${encodeURIComponent(query)}`)
    return { matches: [...samples, ...live.filter((m) => !samples.some((s) => s.ticker === m.ticker))] }
  } catch (e) {
    return { matches: samples, error: e instanceof Error ? e.message : String(e) }
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateReport(
  ticker: string,
  period: Period,
  onStep: (stepIndex: number) => void,
  stepDelayMs = 450,
): Promise<CompanyReport> {
  const sample = sampleCompanies.find((r) => r.company.ticker === ticker)
  if (sample) {
    for (let i = 0; i < GENERATION_STEPS.length; i++) {
      onStep(i)
      await wait(stepDelayMs)
    }
    onStep(GENERATION_STEPS.length)
    return { ...sample, period }
  }

  // The server does all steps in one request, so advance the progress list on
  // a timer and hold on the last step (the Claude call is the slow part).
  let step = 0
  onStep(step)
  const timer = setInterval(() => {
    if (step < GENERATION_STEPS.length - 1) onStep(++step)
  }, 2500)
  try {
    const report = await getJson<CompanyReport>(
      `/api/report?ticker=${encodeURIComponent(ticker)}&period=${encodeURIComponent(period)}`,
    )
    onStep(GENERATION_STEPS.length)
    return report
  } finally {
    clearInterval(timer)
  }
}
