import type { CompanyFacts, XbrlFact } from './facts'

// A small made-up company in the companyfacts format, in $ millions:
// calendar fiscal year, FY2023 and FY2024 10-Ks, then two 10-Q quarters of 2025.
export const M = 1e6
const fact = (end: string, val: number, start?: string): XbrlFact => ({
  start,
  end,
  val: val * M,
  accn: 'x',
  fy: null,
  fp: null,
  form: '10-K',
  filed: '2025-08-01',
})
const dur = (start: string, end: string, val: number) => fact(end, val, start)

/** FY totals plus three-month income statement values. */
const income = (fy23: number, fy24: number, q24: number[], ytd9m24: number, q25: number[]) => [
  dur('2023-01-01', '2023-12-31', fy23),
  dur('2024-01-01', '2024-12-31', fy24),
  dur('2024-01-01', '2024-03-31', q24[0]),
  dur('2024-04-01', '2024-06-30', q24[1]),
  dur('2024-07-01', '2024-09-30', q24[2]),
  dur('2024-01-01', '2024-09-30', ytd9m24),
  dur('2025-01-01', '2025-03-31', q25[0]),
  dur('2025-04-01', '2025-06-30', q25[1]),
]

/** Cash flow items are reported year to date. */
const cashFlow = (fy23: number, fy24: number, ytd24: number[], ytd25: number[]) => [
  dur('2023-01-01', '2023-12-31', fy23),
  dur('2024-01-01', '2024-12-31', fy24),
  dur('2024-01-01', '2024-03-31', ytd24[0]),
  dur('2024-01-01', '2024-06-30', ytd24[1]),
  dur('2024-01-01', '2024-09-30', ytd24[2]),
  dur('2025-01-01', '2025-03-31', ytd25[0]),
  dur('2025-01-01', '2025-06-30', ytd25[1]),
]

const instants = (values: Record<string, number>) => Object.entries(values).map(([end, v]) => fact(end, v))

export function company(concepts: Record<string, XbrlFact[]>): CompanyFacts {
  return {
    cik: 1,
    entityName: 'Test Co',
    facts: {
      'us-gaap': Object.fromEntries(Object.entries(concepts).map(([k, facts]) => [k, { label: k, units: { USD: facts } }])),
    },
  }
}

export const testCo = company({
  OperatingIncomeLoss: income(800, 1000, [240, 250, 260], 750, [270, 280]),
  DepreciationDepletionAndAmortization: cashFlow(200, 200, [50, 100, 150], [50, 100]),
  Revenues: income(3800, 4200, [900, 1000, 1100], 3000, [950, 1050]),
  InterestExpense: income(120, 100, [25, 25, 25], 75, [25, 25]),
  PaymentsToAcquirePropertyPlantAndEquipment: cashFlow(150, 160, [40, 80, 120], [40, 80]),
  IncomeTaxesPaidNet: cashFlow(100, 140, [35, 70, 105], [35, 70]),
  LongTermDebt: instants({ '2023-12-31': 3000, '2024-06-30': 2600, '2024-12-31': 2400, '2025-06-30': 2520 }),
  LongTermDebtCurrent: instants({
    '2023-12-31': 100,
    '2024-06-30': 100,
    '2024-12-31': 200,
    '2025-03-31': 250,
    '2025-06-30': 300,
  }),
  CashAndCashEquivalentsAtCarryingValue: instants({ '2025-06-30': 500 }),
  LongTermDebtMaturitiesRepaymentsOfPrincipalInNextTwelveMonths: instants({ '2024-12-31': 200 }),
  LongTermDebtMaturitiesRepaymentsOfPrincipalInYearTwo: instants({ '2024-12-31': 300 }),
  LongTermDebtMaturitiesRepaymentsOfPrincipalInYearThree: instants({ '2024-12-31': 400 }),
  LongTermDebtMaturitiesRepaymentsOfPrincipalAfterYearFive: instants({ '2024-12-31': 900 }),
})
