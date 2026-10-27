import type { Status } from '../types'

// Pass / watch / fail rules for each metric. These are plain functions so
// they are easy to unit test (see covenants.test.ts) and easy to tune once
// the JPM analysts tell us the thresholds they actually use.

/** How close to the limit (in turns, "x") still counts as "watch". */
export const LEVERAGE_WATCH_BUFFER = 0.25
export const FCCR_WATCH_BUFFER = 0.15
/** A single customer above this share of revenue is flagged. */
export const CUSTOMER_CONCENTRATION_LIMIT = 10

/** Leverage (Debt / EBITDA): lower is better, the covenant is a maximum. */
export function leverageStatus(value: number, covenantMax: number): Status {
  if (value > covenantMax) return 'fail'
  if (value >= covenantMax - LEVERAGE_WATCH_BUFFER) return 'watch'
  return 'pass'
}

/** FCCR: higher is better, the covenant is a minimum. */
export function fccrStatus(value: number, covenantMin: number): Status {
  if (value < covenantMin) return 'fail'
  if (value < covenantMin + FCCR_WATCH_BUFFER) return 'watch'
  return 'pass'
}

export function customerConcentrationStatus(largestCustomerShare: number): Status {
  return largestCustomerShare > CUSTOMER_CONCENTRATION_LIMIT ? 'watch' : 'pass'
}

export function reputationStatus(level: 'Low' | 'Medium' | 'High'): Status {
  if (level === 'High') return 'fail'
  if (level === 'Medium') return 'watch'
  return 'pass'
}

/** Index of the largest value, used to flag the biggest debt maturity year. */
export function largestIndex(values: number[]): number {
  let best = 0
  values.forEach((v, i) => {
    if (v > values[best]) best = i
  })
  return best
}
