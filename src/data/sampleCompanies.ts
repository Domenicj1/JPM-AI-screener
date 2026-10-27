import type { CompanyReport } from '../types'

// Illustrative reports for two fictional companies. Northwind matches the
// memo mockups; Brightwater is a stressed credit so every pass / watch / fail
// state shows up somewhere in the app.

const EDGAR = 'https://www.sec.gov/edgar/search/'

export const northwind: CompanyReport = {
  company: {
    name: 'Northwind Devices Inc.',
    ticker: 'NWDV',
    industry: 'Consumer electronics',
    filingDate: '2026-08-07',
    filingLabel: '10-Q (Q2 FY2026)',
  },
  period: 'ttm',
  isSample: true,
  takeaways: [
    'Leverage has fallen four years in a row to 2.3x, well inside the 3.5x covenant.',
    'FCCR of 1.95x clears the 1.25x minimum with a 0.70x cushion.',
    'The $2.1B 2028 maturity is the largest single-year repayment and will likely need refinancing.',
    'Revenue is concentrated: one customer is 18% of sales and the US is 58%.',
    'Reputation risk is medium: one class action and one FTC inquiry, neither called material.',
  ],
  leverage: {
    covenantMax: 3.5,
    history: [
      { label: 'FY2022', value: 3.1 },
      { label: 'FY2023', value: 2.9 },
      { label: 'FY2024', value: 2.7 },
      { label: 'FY2025', value: 2.5 },
      { label: 'FY2026 TTM', value: 2.3 },
    ],
    summary:
      'Debt has been paid down while EBITDA grew, so leverage fell for four straight years and sits well under the 3.5x limit.',
    source: { label: '10-K balance sheet (debt) and income statement (EBITDA)', url: EDGAR },
  },
  fccr: {
    covenantMin: 1.25,
    history: [
      { label: "Q3'24", value: 1.62 },
      { label: "Q4'24", value: 1.7 },
      { label: "Q1'25", value: 1.74 },
      { label: "Q2'25", value: 1.81 },
      { label: "Q3'25", value: 1.79 },
      { label: "Q4'25", value: 1.86 },
      { label: "Q1'26", value: 1.92 },
      { label: "Q2'26", value: 1.95 },
    ],
    summary:
      'Cash earnings cover interest and scheduled debt payments almost 2 times over, with a cushion of 0.70x above the minimum.',
    source: { label: '10-Q filings', url: EDGAR },
  },
  debt: {
    asOf: 'As of latest 10-Q',
    totalDebt: 8.4,
    totalDebtYearAgo: 9.1,
    cash: 2.3,
    avgRate: 5.1,
    floatingShare: 38,
    maturities: [
      { label: '2026', value: 0.4 },
      { label: '2027', value: 1.2 },
      { label: '2028', value: 2.1 },
      { label: '2029', value: 0.9 },
      { label: '2030', value: 1.5 },
      { label: '2031+', value: 2.3 },
    ],
    summary:
      'Debt is mostly fixed-rate unsecured notes. The 2028 maturity is the biggest one-year repayment and will likely need refinancing.',
    source: { label: '10-K debt footnote (maturities, rates, secured vs. unsecured)', url: EDGAR },
  },
  exposure: {
    period: 'FY2025',
    largestCustomerShare: 18,
    top3CustomerShare: 34,
    quarterlySwing: 7,
    seasonalNote: 'Q4 seasonal peak',
    segments: [
      { label: 'Devices', share: 46 },
      { label: 'Software', share: 31 },
      { label: 'Services', share: 15 },
      { label: 'Other', share: 8 },
    ],
    regions: [
      { label: 'US', share: 58 },
      { label: 'Europe', share: 24 },
      { label: 'Asia', share: 13 },
      { label: 'Other', share: 5 },
    ],
    summary:
      'Revenue leans on one large customer and the US market; the end market (consumer electronics) is cyclical.',
    source: { label: '10-K segment footnote and customer concentration disclosure', url: EDGAR },
  },
  reputation: {
    level: 'Medium',
    summary:
      'One open lawsuit and one regulatory inquiry; neither is described as material in the 10-K. No fraud or sanctions found.',
    events: [
      {
        date: 'Aug 2026',
        tag: 'Litigation',
        headline: 'Class action filed over product warranty claims',
        source: { label: 'Source', url: 'https://example.com/news/warranty-class-action' },
      },
      {
        date: 'May 2026',
        tag: 'Regulatory',
        headline: 'FTC opens inquiry into pricing practices',
        source: { label: 'Source', url: 'https://example.com/news/ftc-inquiry' },
      },
      {
        date: 'Mar 2026',
        tag: 'Leadership',
        headline: 'CFO departs; interim CFO named',
        source: { label: 'Source', url: 'https://example.com/news/cfo-departs' },
      },
      {
        date: 'FY2025 10-K',
        tag: 'Legal',
        headline: 'Item 3: ongoing patent dispute, company states not material',
        source: { label: '10-K', url: EDGAR },
      },
    ],
    footnote: 'Made-up headlines for a fictional company',
  },
}

export const brightwater: CompanyReport = {
  company: {
    name: 'Brightwater Logistics Corp.',
    ticker: 'BWLX',
    industry: 'Freight and logistics',
    filingDate: '2026-07-30',
    filingLabel: '10-Q (Q2 FY2026)',
  },
  period: 'ttm',
  isSample: true,
  takeaways: [
    'Leverage has risen to 3.7x and is above the 3.5x covenant maximum.',
    'FCCR of 1.31x is only 0.06x above the 1.25x minimum and has fallen for six quarters.',
    '$1.6B comes due in 2027, more than a third of total debt.',
    'Over half of debt is floating rate, so higher rates hit coverage directly.',
    'Reputation risk is high: a DOT safety investigation and a missed earnings guide.',
  ],
  leverage: {
    covenantMax: 3.5,
    history: [
      { label: 'FY2022', value: 2.4 },
      { label: 'FY2023', value: 2.8 },
      { label: 'FY2024', value: 3.1 },
      { label: 'FY2025', value: 3.4 },
      { label: 'FY2026 TTM', value: 3.7 },
    ],
    summary:
      'EBITDA fell as freight volumes softened while debt stayed flat, pushing leverage above the 3.5x limit for the first time.',
    source: { label: '10-K balance sheet (debt) and income statement (EBITDA)', url: EDGAR },
  },
  fccr: {
    covenantMin: 1.25,
    history: [
      { label: "Q3'24", value: 1.68 },
      { label: "Q4'24", value: 1.71 },
      { label: "Q1'25", value: 1.6 },
      { label: "Q2'25", value: 1.52 },
      { label: "Q3'25", value: 1.47 },
      { label: "Q4'25", value: 1.41 },
      { label: "Q1'26", value: 1.36 },
      { label: "Q2'26", value: 1.31 },
    ],
    summary:
      'Coverage has slipped for six straight quarters and now sits just above the minimum; one more weak quarter could breach it.',
    principalEstimated: true,
    source: { label: '10-Q filings', url: EDGAR },
  },
  debt: {
    asOf: 'As of latest 10-Q',
    totalDebt: 4.2,
    totalDebtYearAgo: 4.0,
    cash: 0.3,
    avgRate: 7.4,
    floatingShare: 55,
    maturities: [
      { label: '2026', value: 0.2 },
      { label: '2027', value: 1.6 },
      { label: '2028', value: 0.7 },
      { label: '2029', value: 0.9 },
      { label: '2030', value: 0.5 },
      { label: '2031+', value: 0.3 },
    ],
    summary:
      'Debt is mostly a floating-rate term loan. The 2027 maturity is large relative to cash on hand and will need refinancing soon.',
    source: { label: '10-K debt footnote (maturities, rates, secured vs. unsecured)', url: EDGAR },
  },
  exposure: {
    period: 'FY2025',
    largestCustomerShare: 9,
    top3CustomerShare: 22,
    quarterlySwing: 12,
    seasonalNote: 'Q4 holiday peak',
    segments: [
      { label: 'Trucking', share: 52 },
      { label: 'Intermodal', share: 27 },
      { label: 'Warehousing', share: 14 },
      { label: 'Other', share: 7 },
    ],
    regions: [
      { label: 'US', share: 81 },
      { label: 'Canada', share: 11 },
      { label: 'Mexico', share: 6 },
      { label: 'Other', share: 2 },
    ],
    summary:
      'No single customer dominates, but revenue is almost all North American and swings with freight cycles.',
    source: { label: '10-K segment footnote and customer concentration disclosure', url: EDGAR },
  },
  reputation: {
    level: 'High',
    summary:
      'An open federal safety investigation and a guidance miss that drew a shareholder suit. No fraud or sanctions found.',
    events: [
      {
        date: 'Sep 2026',
        tag: 'Regulatory',
        headline: 'DOT opens safety investigation after fleet audit',
        source: { label: 'Source', url: 'https://example.com/news/dot-investigation' },
      },
      {
        date: 'Jul 2026',
        tag: 'Financial',
        headline: 'Company cuts full-year guidance; shares fall 22%',
        source: { label: 'Source', url: 'https://example.com/news/guidance-cut' },
      },
      {
        date: 'Jul 2026',
        tag: 'Litigation',
        headline: 'Shareholder suit filed over guidance disclosures',
        source: { label: 'Source', url: 'https://example.com/news/shareholder-suit' },
      },
    ],
    footnote: 'Made-up headlines for a fictional company',
  },
}

export const sampleCompanies: CompanyReport[] = [northwind, brightwater]
