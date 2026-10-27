import { describe, expect, it } from 'vitest'
import { quarterly, series, ttm } from './facts'
import { computeFinancials, fiscalQuarter } from './metrics'
import { htmlToText } from './edgar'
import { company, M, testCo } from './testCompany'

describe('XBRL series helpers', () => {
  it('derives quarters from year-to-date cash flow figures', () => {
    const q = quarterly(series(testCo, ['PaymentsToAcquirePropertyPlantAndEquipment']))
    expect(q.get('2024-06-30')).toBe(40 * M)
    expect(q.get('2024-12-31')).toBe(40 * M) // FY minus nine months
    expect(q.get('2025-06-30')).toBe(40 * M)
  })
  it('sums the last four quarters for trailing twelve months', () => {
    const oi = series(testCo, ['OperatingIncomeLoss'])
    expect(ttm(oi, '2025-06-30')).toBe((260 + 250 + 270 + 280) * M)
    expect(ttm(oi, '2024-12-31')).toBe(1000 * M) // a fiscal year end uses the annual figure
    expect(ttm(oi, '2024-06-30')).toBeUndefined() // not enough history
  })
})

describe('computeFinancials', () => {
  const fin = computeFinancials(testCo, 'ttm')

  it('computes leverage per fiscal year plus TTM', () => {
    expect(fin.leverage).toEqual([
      { label: 'FY2023', value: 3 },
      { label: 'FY2024', value: 2 },
      { label: "TTM Q2'25", value: 2 },
    ])
  })

  it('drops the TTM point for the latest fiscal year view', () => {
    expect(computeFinancials(testCo, 'latest-fy').leverage.map((p) => p.label)).toEqual(['FY2023', 'FY2024'])
  })

  it('computes FCCR = (EBITDA - capex - cash taxes) / (interest + current debt)', () => {
    expect(fin.fccr).toEqual([
      { label: "Q4'23", value: 3.41 }, // (1000 - 150 - 100) / (120 + 100)
      { label: "Q4'24", value: 3 }, // (1200 - 160 - 140) / (100 + 200)
      { label: "Q1'25", value: 2.66 }, // (1230 - 160 - 140) / (100 + 250)
      { label: "Q2'25", value: 2.4 }, // (1260 - 160 - 140) / (100 + 300)
    ])
    expect(fin.fccrPrincipalEstimated).toBe(false)
  })

  it('builds the debt slide numbers in billions', () => {
    expect(fin.debt).toMatchObject({
      asOfDate: '2025-06-30',
      totalDebt: 2.52,
      totalDebtYearAgo: 2.6,
      cash: 0.5,
      avgRate: 3.9, // estimated: 100 interest / 2,560 average debt
      avgRateEstimated: true,
    })
    expect(fin.debt.maturities).toEqual([
      { label: '2025', value: 0.2 },
      { label: '2026', value: 0.3 },
      { label: '2027', value: 0.4 },
      { label: '2030+', value: 0.9 },
    ])
  })

  it('measures quarterly revenue swing and the seasonal peak', () => {
    expect(fin.revenue).toEqual({ fiscalYear: 'FY2024', quarterlySwing: 12, seasonalNote: 'fiscal Q4 seasonal peak' })
  })

  it('explains when EBITDA cannot be computed', () => {
    expect(() => computeFinancials(company({}), 'ttm')).toThrow(/operating income/)
  })
})

describe('fiscalQuarter', () => {
  it('handles a September fiscal year end with a 52/53-week calendar', () => {
    expect(fiscalQuarter('2025-12-27', 9)).toEqual({ q: 1, fy: 2026 })
    expect(fiscalQuarter('2025-09-27', 9)).toEqual({ q: 4, fy: 2025 })
    expect(fiscalQuarter('2025-10-04', 9)).toEqual({ q: 4, fy: 2025 })
  })
})

describe('htmlToText', () => {
  it('drops hidden XBRL and markup but keeps table text', () => {
    const html =
      '<html><ix:header><ix:hidden>secret</ix:hidden></ix:header><p>Item&#160;3. Legal&nbsp;Proceedings</p><table><tr><td>Debt</td><td>$1.2</td></tr></table></html>'
    expect(htmlToText(html)).toBe('Item 3. Legal Proceedings\nDebt | $1.2 |')
  })
})
