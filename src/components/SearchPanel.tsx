import { useEffect, useState } from 'react'
import { searchCompanies, type CompanyMatch } from '../lib/reportService'
import type { Period } from '../types'

interface Props {
  onGenerate: (ticker: string, period: Period) => void
}

export function SearchPanel({ onGenerate }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CompanyMatch | null>(null)
  const [period, setPeriod] = useState<Period>('ttm')
  const [results, setResults] = useState<{ query: string; matches: CompanyMatch[]; error?: string }>({
    query: '',
    matches: [],
  })
  const matches = results.matches
  const searching = results.query !== query

  // Search after a short pause in typing, and ignore answers to older queries.
  useEffect(() => {
    let current = true
    const timer = setTimeout(async () => {
      const found = await searchCompanies(query)
      if (current) setResults({ query, ...found })
    }, 250)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [query])

  return (
    <div className="search">
      <div className="search-card">
        <h1>AI Pitch Deck</h1>
        <p className="search-sub">
          Pick a public company and generate a credit first-look deck: leverage, FCCR, debt, exposure, and
          reputation, each checked against covenant thresholds.
        </p>

        <label className="field-label" htmlFor="company-search">
          Company name or ticker
        </label>
        <input
          id="company-search"
          className="search-input"
          placeholder="e.g. Apple, AAPL, or sample NWDV"
          value={query}
          autoFocus
          onChange={(e) => {
            setQuery(e.target.value)
            setSelected(null)
          }}
        />

        <ul className="matches">
          {matches.map((m) => (
            <li key={m.ticker}>
              <button
                className={`match ${selected?.ticker === m.ticker ? 'is-selected' : ''}`}
                onClick={() => setSelected(m)}
              >
                <span className="ticker">{m.ticker}</span>
                <span className="match-name">{m.name}</span>
                <span className="match-industry">{m.industry}</span>
              </button>
            </li>
          ))}
          {matches.length === 0 && !searching && query && <li className="matches-empty">No companies match “{query}”.</li>}
        </ul>
        {results.error && !searching && <p className="search-note">Company search unavailable: {results.error}</p>}

        <fieldset className="period">
          <legend className="field-label">Period</legend>
          <label>
            <input type="radio" checked={period === 'ttm'} onChange={() => setPeriod('ttm')} /> Trailing twelve
            months
          </label>
          <label>
            <input type="radio" checked={period === 'latest-fy'} onChange={() => setPeriod('latest-fy')} /> Latest
            fiscal year
          </label>
        </fieldset>

        <button
          className="btn btn-primary btn-lg"
          disabled={!selected}
          onClick={() => selected && onGenerate(selected.ticker, period)}
        >
          Generate deck
        </button>
        <p className="search-note">
          Real companies use SEC EDGAR data and Claude-written summaries. NWDV and BWLX are fictional samples.
        </p>
      </div>
    </div>
  )
}
