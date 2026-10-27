import { useState } from 'react'
import { DeckViewer } from './components/DeckViewer'
import { GenerateProgress } from './components/GenerateProgress'
import { SearchPanel } from './components/SearchPanel'
import { generateReport } from './lib/reportService'
import type { CompanyReport, Period } from './types'

// The app has three screens, matching the user workflow in the proposal:
// 1. search for a company, 2. watch progress while data is pulled,
// 3. read and present the generated deck.
type Screen =
  | { name: 'search' }
  | { name: 'generating'; ticker: string; step: number }
  | { name: 'deck'; report: CompanyReport }

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'search' })
  const [error, setError] = useState<string | null>(null)

  const generate = async (ticker: string, period: Period) => {
    setError(null)
    setScreen({ name: 'generating', ticker, step: 0 })
    try {
      const report = await generateReport(ticker, period, (step) =>
        setScreen({ name: 'generating', ticker, step }),
      )
      setScreen({ name: 'deck', report })
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      setScreen({ name: 'search' })
    }
  }

  if (screen.name === 'generating') return <GenerateProgress ticker={screen.ticker} step={screen.step} />
  if (screen.name === 'deck') return <DeckViewer report={screen.report} onBack={() => setScreen({ name: 'search' })} />
  return (
    <>
      {error && <div className="error">{error}</div>}
      <SearchPanel onGenerate={generate} />
    </>
  )
}
