import type { ReactElement } from 'react'
import type { CompanyReport } from '../types'
import { CoverSlide } from './CoverSlide'
import { DebtSlide } from './DebtSlide'
import { ExposureSlide } from './ExposureSlide'
import { FccrSlide } from './FccrSlide'
import { LeverageSlide } from './LeverageSlide'
import { ReputationSlide } from './ReputationSlide'
import { SummarySlide } from './SummarySlide'

export interface SlideDef {
  id: string
  title: string
  element: ReactElement
}

/** The slide order for a deck. Add, remove, or reorder slides here. */
export function buildDeck(report: CompanyReport): SlideDef[] {
  return [
    { id: 'cover', title: 'Cover', element: <CoverSlide report={report} /> },
    { id: 'summary', title: 'Summary', element: <SummarySlide report={report} /> },
    { id: 'leverage', title: 'Leverage', element: <LeverageSlide report={report} /> },
    { id: 'fccr', title: 'FCCR', element: <FccrSlide report={report} /> },
    { id: 'debt', title: 'Debt', element: <DebtSlide report={report} /> },
    { id: 'exposure', title: 'Exposure', element: <ExposureSlide report={report} /> },
    { id: 'reputation', title: 'Reputation', element: <ReputationSlide report={report} /> },
  ]
}
