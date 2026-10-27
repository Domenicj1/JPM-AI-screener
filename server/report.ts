import { fccrStatus, FCCR_COVENANT_MIN, leverageStatus, LEVERAGE_COVENANT_MAX } from '../src/lib/covenants.js'
import { longDate } from '../src/lib/format.js'
import type { CompanyReport, Period } from '../src/types.js'
import { writeNarrative } from './ai.js'
import { filingText, findTicker, getCompanyFacts, getSubmissions, latestFiling } from './edgar.js'
import { computeFinancials } from './metrics.js'

// Builds a CompanyReport for a real company: SEC EDGAR numbers, computed
// metrics, then Claude for the prose and the text-only facts.

export async function buildReport(ticker: string, period: Period): Promise<CompanyReport> {
  const entry = await findTicker(ticker)
  if (!entry) throw new Error(`${ticker} is not in the SEC ticker list.`)

  const [sub, facts] = await Promise.all([getSubmissions(entry.cik), getCompanyFacts(entry.cik)])
  const tenK = latestFiling(sub, entry.cik, ['10-K'])
  if (!tenK) throw new Error(`${entry.name} has no 10-K on EDGAR (foreign filers file 20-F, which is not supported yet).`)
  const latest = latestFiling(sub, entry.cik, ['10-K', '10-Q']) ?? tenK

  const fin = computeFinancials(facts, period)
  const currentLeverage = fin.leverage[fin.leverage.length - 1]
  const currentFccr = fin.fccr[fin.fccr.length - 1]

  const ai = await writeNarrative({
    company: `${entry.name} (${entry.ticker})`,
    tenK: await filingText(tenK),
    metrics: {
      units: 'Dollar amounts in billions USD. Ratios in turns (x).',
      latestFiling: `${latest.form} for period ending ${latest.reportDate}`,
      leverage: {
        definition: 'Total debt / EBITDA (operating income + D&A)',
        covenantMax: LEVERAGE_COVENANT_MAX,
        history: fin.leverage,
        status: leverageStatus(currentLeverage.value, LEVERAGE_COVENANT_MAX),
      },
      fccr: {
        definition: '(EBITDA - capex - cash taxes) / (interest + scheduled principal), trailing 12 months',
        covenantMin: FCCR_COVENANT_MIN,
        history: fin.fccr,
        status: fccrStatus(currentFccr.value, FCCR_COVENANT_MIN),
        principalEstimated: fin.fccrPrincipalEstimated,
        taxesFromIncomeStatement: fin.fccrTaxesEstimated,
      },
      debt: fin.debt,
      revenue: fin.revenue,
    },
  })

  const filingsUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${entry.cik}&type=10-&dateb=&owner=include&count=40`
  const quarterNote = latest.form === '10-Q' ? `${latest.form} (period ending ${longDate(latest.reportDate)})` : `${latest.form} (FY ending ${longDate(latest.reportDate)})`

  return {
    company: {
      name: sub.name || entry.name,
      ticker: entry.ticker,
      industry: sub.sicDescription || 'n/a',
      filingDate: latest.filingDate,
      filingLabel: quarterNote,
    },
    period,
    isSample: false,
    takeaways: ai.takeaways.slice(0, 5),
    leverage: {
      covenantMax: LEVERAGE_COVENANT_MAX,
      history: fin.leverage,
      summary: ai.leverageSummary,
      source: { label: 'SEC XBRL: total debt (balance sheet), operating income + D&A', url: filingsUrl },
    },
    fccr: {
      covenantMin: FCCR_COVENANT_MIN,
      history: fin.fccr,
      summary: ai.fccrSummary,
      principalEstimated: fin.fccrPrincipalEstimated,
      source: {
        label: `SEC XBRL 10-K and 10-Q data, fiscal quarters${fin.fccrTaxesEstimated ? ', tax expense used for cash taxes' : ''}`,
        url: filingsUrl,
      },
    },
    debt: {
      asOf: `As of ${longDate(fin.debt.asOfDate)}`,
      totalDebt: fin.debt.totalDebt,
      totalDebtYearAgo: fin.debt.totalDebtYearAgo,
      cash: fin.debt.cash,
      avgRate: fin.debt.avgRate,
      floatingShare: ai.floatingRateSharePercent,
      maturities: fin.debt.maturities,
      summary: ai.debtSummary,
      source: {
        label: `SEC XBRL debt and maturity data${fin.debt.avgRateEstimated ? ' (rate = interest / average debt)' : ''}; floating share from 10-K text`,
        url: tenK.url,
      },
    },
    exposure: {
      period: fin.revenue.fiscalYear,
      largestCustomerShare: ai.largestCustomerSharePercent,
      top3CustomerShare: ai.top3CustomerSharePercent,
      quarterlySwing: fin.revenue.quarterlySwing,
      seasonalNote: fin.revenue.seasonalNote,
      segments: ai.segments.slice(0, 5).map((r) => ({ label: r.label, share: Math.round(r.percent) })),
      regions: ai.regions.slice(0, 5).map((r) => ({ label: r.label, share: Math.round(r.percent) })),
      summary: ai.exposureSummary,
      source: { label: '10-K segment and customer disclosures (read by Claude); quarterly revenue from SEC XBRL', url: tenK.url },
    },
    reputation: {
      level: ai.reputation.level,
      summary: ai.reputation.summary,
      events: ai.reputation.events.slice(0, 4).map((e) => ({ ...e, source: { label: '10-K', url: tenK.url } })),
      footnote: '10-K legal proceedings only; news scan not built yet',
    },
  }
}
