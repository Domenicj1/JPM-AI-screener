import { useState } from 'react'
import { searchCompanies, type CompanyMatch } from '../lib/reportService'
import type { Period } from '../types'

interface Props {
  onGenerate: (ticker: string, period: Period) => void
}

export function SearchPanel({ onGenerate }: Props) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<CompanyMatch | null>(null)
  const [period, setPeriod] = useState<Period>('ttm')
  const matches = searchCompanies(query)

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
          placeholder="e.g. Northwind or NWDV"
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
          {matches.length === 0 && <li className="matches-empty">No sample companies match “{query}”.</li>}
        </ul>

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
        <p className="search-note">Prototype: uses illustrative sample data for two fictional companies.</p>
      </div>
    </div>
  )
}
