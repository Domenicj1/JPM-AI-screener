import { describe, expect, it } from 'vitest'
import {
  customerConcentrationStatus,
  fccrStatus,
  largestIndex,
  leverageStatus,
  reputationStatus,
} from './covenants'

describe('leverageStatus', () => {
  it('passes well under the maximum', () => {
    expect(leverageStatus(2.3, 3.5)).toBe('pass')
  })
  it('watches when close to the maximum', () => {
    expect(leverageStatus(3.3, 3.5)).toBe('watch')
    expect(leverageStatus(3.5, 3.5)).toBe('watch')
  })
  it('fails above the maximum', () => {
    expect(leverageStatus(3.7, 3.5)).toBe('fail')
  })
})

describe('fccrStatus', () => {
  it('passes with a healthy cushion', () => {
    expect(fccrStatus(1.95, 1.25)).toBe('pass')
  })
  it('watches just above the minimum', () => {
    expect(fccrStatus(1.31, 1.25)).toBe('watch')
    expect(fccrStatus(1.25, 1.25)).toBe('watch')
  })
  it('fails below the minimum', () => {
    expect(fccrStatus(1.1, 1.25)).toBe('fail')
  })
})

describe('other flags', () => {
  it('flags a customer above 10% of revenue', () => {
    expect(customerConcentrationStatus(18)).toBe('watch')
    expect(customerConcentrationStatus(9)).toBe('pass')
  })
  it('maps reputation levels', () => {
    expect(reputationStatus('Low')).toBe('pass')
    expect(reputationStatus('Medium')).toBe('watch')
    expect(reputationStatus('High')).toBe('fail')
  })
  it('finds the largest maturity year', () => {
    expect(largestIndex([0.4, 1.2, 2.1, 0.9, 1.5, 2.3])).toBe(5)
    expect(largestIndex([0.2, 1.6, 0.7])).toBe(1)
  })
})
