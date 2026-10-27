import type { Period } from '../src/types.js'
import {
  addDays,
  annual,
  instantAt,
  quarterly,
  series,
  ttm,
  ttmSum,
  type CompanyFacts,
} from './facts.js'

// Turns XBRL facts into the numbers on the slides. Everything here is plain
// arithmetic on reported values, so it is unit tested (metrics.test.ts) and
// the AI layer only writes prose about the results.

const B = 1e9

// XBRL concept names, in priority order. Companies differ in which ones they use.
const C = {
  revenue: [
    'Revenues',
    'RevenueFromContractWithCustomerExcludingAssessedTax',
    'RevenueFromContractWithCustomerIncludingAssessedTax',
    'SalesRevenueNet',
  ],
  operatingIncome: ['OperatingIncomeLoss'],
  da: [
    'DepreciationDepletionAndAmortization',
    'DepreciationAndAmortization',
    'DepreciationAmortizationAndAccretionNet',
    'Depreciation',
  ],
  ltDebtTotal: ['LongTermDebt', 'LongTermDebtAndCapitalLeaseObligationsIncludingCurrentMaturities'],
  ltDebtNoncurrent: ['LongTermDebtNoncurrent', 'LongTermDebtAndCapitalLeaseObligations'],
  ltDebtCurrent: ['LongTermDebtCurrent', 'LongTermDebtAndCapitalLeaseObligationsCurrent', 'DebtCurrent'],
  shortTerm: ['ShortTermBorrowings', 'CommercialPaper'],
  cash: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'],
  cashTaxes: ['IncomeTaxesPaidNet', 'IncomeTaxesPaid'],
  taxExpense: ['IncomeTaxExpenseBenefit'],
  interest: ['InterestExpense', 'InterestExpenseNonoperating', 'InterestExpenseDebt', 'InterestPaidNet'],
  repayments: ['RepaymentsOfLongTermDebt'],
  avgRate: ['LongTermDebtWeightedAverageInterestRate', 'DebtWeightedAverageInterestRate'],
  maturities: [
    ['LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths'],
    ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo'],
    ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree'],
    ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFour'],
    ['LongTermDebtMaturitiesRepaymentsOfPrincipalInYearFive'],
    ['LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive'],
  ],
}

export interface Point {
  label: string
  value: number
}

export interface Financials {
  /** Latest fiscal year end and latest quarter end, ISO dates. */
  fyEnd: string
  latestEnd: string
  leverage: Point[]
  fccr: Point[]
  fccrPrincipalEstimated: boolean
  fccrTaxesEstimated: boolean
  debt: {
    asOfDate: string
    totalDebt: number
    totalDebtYearAgo: number
    cash: number
    avgRate: number
    avgRateEstimated: boolean
    maturities: Point[]
  }
  revenue: {
    fiscalYear: string
    quarterlySwing: number
    seasonalNote: string
  }
}

/** The fiscal quarter and year a quarter end falls in, given the fiscal year end month (1-12). */
export function fiscalQuarter(end: string, fyEndMonth: number): { q: number; fy: number } {
  // 52/53-week years can end a few days into the next month; pull those back.
  const d = new Date(addDays(end, -7))
  const month = d.getUTCMonth() + 1
  const monthsAfterFyEnd = (month - fyEndMonth + 12) % 12
  const q = monthsAfterFyEnd === 0 ? 4 : Math.round(monthsAfterFyEnd / 3)
  const fy = month <= fyEndMonth ? d.getUTCFullYear() : d.getUTCFullYear() + 1
  return { q, fy }
}

const fyLabel = (end: string, fyEndMonth: number) => `FY${fiscalQuarter(end, fyEndMonth).fy}`

function quarterLabel(end: string, fyEndMonth: number) {
  const { q, fy } = fiscalQuarter(end, fyEndMonth)
  return `Q${q}'${String(fy).slice(-2)}`
}

const round = (v: number, digits: number) => Number(v.toFixed(digits))

export function computeFinancials(cf: CompanyFacts, period: Period): Financials {
  const get = (names: string[], unit = 'USD') => series(cf, names, unit)
  const s = {
    revenue: get(C.revenue),
    operatingIncome: get(C.operatingIncome),
    da: get(C.da),
    ltDebtTotal: get(C.ltDebtTotal),
    ltDebtNoncurrent: get(C.ltDebtNoncurrent),
    ltDebtCurrent: get(C.ltDebtCurrent),
    shortTerm: get(C.shortTerm),
    cash: get(C.cash),
    capex: get(C.capex),
    cashTaxes: get(C.cashTaxes),
    taxExpense: get(C.taxExpense),
    interest: get(C.interest),
    repayments: get(C.repayments),
    avgRate: get(C.avgRate, 'pure'),
  }

  const ebitda = (end: string) => ttmSum(end, [s.operatingIncome], [s.da])
  const totalDebt = (date: string): number | undefined => {
    const short = instantAt(s.shortTerm, date) ?? 0
    const total = instantAt(s.ltDebtTotal, date)
    if (total !== undefined) return total + short
    const noncurrent = instantAt(s.ltDebtNoncurrent, date)
    const current = instantAt(s.ltDebtCurrent, date)
    if (noncurrent === undefined && current === undefined) return undefined
    return (noncurrent ?? 0) + (current ?? 0) + short
  }

  // Fiscal years and quarter ends come from operating income, which every
  // operating company reports and which EBITDA is built on.
  const fyEnds = [...annual(s.operatingIncome).keys()].sort()
  if (fyEnds.length === 0) {
    throw new Error('No annual operating income in SEC XBRL data, so EBITDA cannot be computed (common for banks and insurers).')
  }
  const fyEnd = fyEnds[fyEnds.length - 1]
  const fyEndMonth = new Date(addDays(fyEnd, -7)).getUTCMonth() + 1
  const quarterEnds = [...new Set([...quarterly(s.operatingIncome).keys(), ...fyEnds])].sort()
  const latestEnd = quarterEnds[quarterEnds.length - 1]

  // Leverage: total debt at each fiscal year end / that year's EBITDA.
  const leverage: Point[] = []
  for (const end of fyEnds.slice(-5)) {
    const debt = totalDebt(end)
    const e = ebitda(end)
    if (debt !== undefined && e) leverage.push({ label: fyLabel(end, fyEndMonth), value: round(debt / e, 2) })
  }
  if (period === 'ttm' && latestEnd > fyEnd) {
    const debt = totalDebt(latestEnd)
    const e = ebitda(latestEnd)
    if (debt !== undefined && e) {
      leverage.push({ label: `TTM ${quarterLabel(latestEnd, fyEndMonth)}`, value: round(debt / e, 2) })
    }
  }
  if (leverage.length === 0) throw new Error('Could not find both total debt and EBITDA for any fiscal year.')

  // FCCR = (EBITDA - capex - cash taxes) / (interest + scheduled principal), trailing 12 months.
  const fccr: Point[] = []
  let principalEstimated = false
  let taxesEstimated = false
  for (const end of quarterEnds.slice(-8)) {
    const e = ebitda(end)
    const capex = ttm(s.capex, end) ?? 0
    let taxes = ttm(s.cashTaxes, end)
    if (taxes === undefined) {
      taxes = ttm(s.taxExpense, end) ?? 0
      taxesEstimated = true
    }
    const interest = ttm(s.interest, end)
    // Scheduled principal: debt due within 12 months as reported on the balance
    // sheet; if not tagged, last year's actual repayments stand in for it.
    let principal = instantAt(s.ltDebtCurrent, end)
    if (principal === undefined) {
      principal = ttm(s.repayments, end)
      if (principal !== undefined) principalEstimated = true
    }
    const charges = (interest ?? 0) + (principal ?? 0)
    if (e === undefined || interest === undefined || charges <= 0) continue
    fccr.push({ label: quarterLabel(end, fyEndMonth), value: round((e - capex - taxes) / charges, 2) })
  }
  if (fccr.length === 0) throw new Error('Could not find interest expense to compute FCCR.')

  // Debt slide.
  const asOfDate = [...quarterEnds].reverse().find((d) => totalDebt(d) !== undefined) ?? fyEnd
  const debtNow = totalDebt(asOfDate) ?? 0
  const debtYearAgo = totalDebt(addDays(asOfDate, -364)) ?? totalDebt(addDays(asOfDate, -365)) ?? debtNow
  const cash = instantAt(s.cash, asOfDate) ?? 0
  let avgRate = instantAt(s.avgRate, asOfDate, 120) ?? instantAt(s.avgRate, fyEnd)
  let avgRateEstimated = false
  if (avgRate !== undefined) {
    avgRate *= 100
  } else {
    const interest = ttm(s.interest, asOfDate) ?? 0
    const avgDebt = (debtNow + debtYearAgo) / 2
    avgRate = avgDebt > 0 ? (interest / avgDebt) * 100 : 0
    avgRateEstimated = true
  }

  const fyYear = fiscalQuarter(fyEnd, fyEndMonth).fy
  const matSeries = C.maturities.map((names) => get(names))
  let maturities: Point[] = matSeries
    .map((ms, i) => ({
      label: i === 5 ? `${fyYear + 6}+` : String(fyYear + 1 + i),
      value: instantAt(ms, fyEnd),
    }))
    .filter((m): m is { label: string; value: number } => m.value !== undefined)
    .map((m) => ({ label: m.label, value: round(m.value / B, 2) }))
  if (maturities.length === 0) {
    // No maturity schedule tagged: split into due within a year and later.
    const current = instantAt(s.ltDebtCurrent, asOfDate) ?? 0
    maturities = [
      { label: 'Next 12 mo', value: round(current / B, 2) },
      { label: 'Later+', value: round(Math.max(debtNow - current, 0) / B, 2) },
    ]
  }

  // Revenue stability: average quarter-over-quarter change and the peak quarter.
  const revQ = [...quarterly(s.revenue)].sort(([a], [b]) => (a < b ? -1 : 1)).slice(-9)
  const changes = revQ.slice(1).map(([, v], i) => Math.abs(v / revQ[i][1] - 1) * 100)
  const quarterlySwing = changes.length ? Math.round(changes.reduce((a, b) => a + b, 0) / changes.length) : 0
  const byQuarter = new Map<number, number[]>()
  for (const [end, v] of revQ.slice(1)) {
    const { q } = fiscalQuarter(end, fyEndMonth)
    byQuarter.set(q, [...(byQuarter.get(q) ?? []), v])
  }
  const avgs = [...byQuarter].map(([q, vs]) => ({ q, avg: vs.reduce((a, b) => a + b, 0) / vs.length }))
  let seasonalNote = 'no clear seasonal peak'
  if (avgs.length === 4) {
    const max = avgs.reduce((a, b) => (b.avg > a.avg ? b : a))
    const min = Math.min(...avgs.map((a) => a.avg))
    if (max.avg / min > 1.05) seasonalNote = `fiscal Q${max.q} seasonal peak`
  }

  return {
    fyEnd,
    latestEnd,
    leverage,
    fccr,
    fccrPrincipalEstimated: principalEstimated,
    fccrTaxesEstimated: taxesEstimated,
    debt: {
      asOfDate,
      totalDebt: round(debtNow / B, 2),
      totalDebtYearAgo: round(debtYearAgo / B, 2),
      cash: round(cash / B, 2),
      avgRate: round(avgRate, 1),
      avgRateEstimated,
      maturities,
    },
    revenue: { fiscalYear: `FY${fyYear}`, quarterlySwing, seasonalNote },
  }
}
