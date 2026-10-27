import { describe, expect, it, vi } from 'vitest'
import type { AiOutput } from './ai'
import { testCo } from './testCompany'

// End-to-end shape check for buildReport with SEC EDGAR and Claude stubbed out.

vi.mock('./edgar', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./edgar')>()),
  findTicker: async () => ({ cik: 1, ticker: 'TEST', name: 'Test Co' }),
  getSubmissions: async () => ({
    name: 'Test Co',
    sicDescription: 'Widgets',
    tickers: ['TEST'],
    filings: {
      recent: {
        form: ['10-Q', '10-K'],
        filingDate: ['2025-08-01', '2025-02-15'],
        reportDate: ['2025-06-30', '2024-12-31'],
        accessionNumber: ['0000000001-25-000002', '0000000001-25-000001'],
        primaryDocument: ['q2.htm', 'k.htm'],
      },
    },
  }),
  getCompanyFacts: async () => testCo,
  filingText: async () => '10-K text',
}))

const ai: AiOutput = {
  takeaways: ['a', 'b', 'c', 'd', 'e', 'f'],
  leverageSummary: 'lev',
  fccrSummary: 'fccr',
  debtSummary: 'debt',
  exposureSummary: 'exp',
  floatingRateSharePercent: null,
  largestCustomerSharePercent: 12,
  top3CustomerSharePercent: null,
  segments: [{ label: 'Widgets', percent: 70.4 }, { label: 'Gadgets', percent: 29.6 }],
  regions: [],
  reputation: { level: 'Low', summary: 'quiet', events: [{ date: 'FY2024 10-K', tag: 'Legal', headline: 'None material' }] },
}
const writeNarrative = vi.fn(async () => ai)
vi.mock('./ai', () => ({ writeNarrative: (...args: unknown[]) => writeNarrative(...(args as [])) }))

describe('buildReport', () => {
  it('combines EDGAR metrics and Claude output into a CompanyReport', async () => {
    const { buildReport } = await import('./report')
    const report = await buildReport('test', 'ttm')
    expect(report.isSample).toBe(false)
    expect(report.company).toMatchObject({ ticker: 'TEST', industry: 'Widgets', filingDate: '2025-08-01' })
    expect(report.company.filingLabel).toMatch(/^10-Q/)
    expect(report.takeaways).toHaveLength(5)
    expect(report.leverage.history.at(-1)).toEqual({ label: "TTM Q2'25", value: 2 })
    expect(report.debt.floatingShare).toBeNull()
    expect(report.exposure.segments).toEqual([
      { label: 'Widgets', share: 70 },
      { label: 'Gadgets', share: 30 },
    ])
    expect(report.reputation.events[0].source.url).toContain('/k.htm')
    expect(writeNarrative).toHaveBeenCalledOnce()
  })
})
