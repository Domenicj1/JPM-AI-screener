// Shared data shapes for a company report.
//
// Everything a slide needs lives in a CompanyReport. Sample reports come from
// src/data/sampleCompanies.ts; real ones are built on the server from SEC
// EDGAR data and Claude (server/report.ts). Both use this same shape.

/** Traffic-light marker shown next to a metric. */
export type Status = 'pass' | 'watch' | 'fail'

/** Where a number or claim came from, so the analyst can verify it. */
export interface Source {
  label: string
  url?: string
}

/** Which period the user asked to analyze. */
export type Period = 'latest-fy' | 'ttm'

export interface CompanyInfo {
  name: string
  ticker: string
  industry: string
  /** Date of the filing the data comes from, e.g. "2026-08-07". */
  filingDate: string
  /** Filing the data comes from, e.g. "10-Q (Q2 FY2026)". */
  filingLabel: string
}

export interface LeverageData {
  /** Covenant maximum for Total Debt / EBITDA, e.g. 3.5. */
  covenantMax: number
  /** One point per fiscal year, oldest first. The last point is the current value. */
  history: { label: string; value: number }[]
  summary: string
  source: Source
}

export interface FccrData {
  /** Covenant minimum, typically 1.25x. */
  covenantMin: number
  /** Trailing-12-month FCCR by quarter, oldest first. The last point is the current value. */
  history: { label: string; value: number }[]
  summary: string
  /** True when scheduled principal was estimated rather than disclosed. */
  principalEstimated?: boolean
  source: Source
}

export interface DebtData {
  asOf: string
  /** Dollar amounts are in billions. */
  totalDebt: number
  totalDebtYearAgo: number
  cash: number
  /** Weighted average interest rate, as a percent (5.1 means 5.1%). */
  avgRate: number
  /** Share of debt at floating rates, as a percent. null when the filing does not say. */
  floatingShare: number | null
  /** Principal due per year, in billions, in date order. */
  maturities: { label: string; value: number }[]
  summary: string
  source: Source
}

export interface ExposureData {
  period: string
  /** Percent of revenue from the largest customer. null when not disclosed. */
  largestCustomerShare: number | null
  /** Percent of revenue from the top three customers. null when not disclosed. */
  top3CustomerShare: number | null
  /** Typical quarterly revenue swing, as +/- percent. */
  quarterlySwing: number
  seasonalNote: string
  segments: { label: string; share: number }[]
  regions: { label: string; share: number }[]
  summary: string
  source: Source
}

export type ReputationTag = 'Litigation' | 'Regulatory' | 'Leadership' | 'Legal' | 'Financial' | 'Other'

export interface ReputationEvent {
  date: string
  tag: ReputationTag
  headline: string
  source: Source
}

export interface ReputationData {
  level: 'Low' | 'Medium' | 'High'
  summary: string
  events: ReputationEvent[]
  footnote: string
}

export interface CompanyReport {
  company: CompanyInfo
  period: Period
  /** True for illustrative data. Shown in each slide footer. */
  isSample: boolean
  takeaways: string[]
  leverage: LeverageData
  fccr: FccrData
  debt: DebtData
  exposure: ExposureData
  reputation: ReputationData
}
