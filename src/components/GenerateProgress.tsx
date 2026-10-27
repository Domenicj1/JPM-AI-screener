import { GENERATION_STEPS } from '../lib/reportService'

export function GenerateProgress({ ticker, step }: { ticker: string; step: number }) {
  return (
    <div className="search">
      <div className="search-card">
        <h2>Building deck for {ticker}</h2>
        <ol className="steps">
          {GENERATION_STEPS.map((label, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'todo'
            return (
              <li key={label} className={`step step-${state}`}>
                <span className="step-icon" aria-hidden>
                  {state === 'done' ? '✓' : ''}
                </span>
                {label}
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
