import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { buildDeck } from '../slides/deck'
import type { CompanyReport } from '../types'
import { SlideFrame } from './SlideFrame'

interface Props {
  report: CompanyReport
  onBack: () => void
}

export function DeckViewer({ report, onBack }: Props) {
  const slides = useMemo(() => buildDeck(report), [report])
  const [index, setIndex] = useState(0)
  const [presenting, setPresenting] = useState(false)
  const stage = useRef<HTMLDivElement>(null)

  const go = useCallback(
    (next: number) => setIndex(Math.max(0, Math.min(slides.length - 1, next))),
    [slides.length],
  )

  // Arrow keys, Page Up/Down, Home/End and space move between slides.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        go(index + 1)
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        go(index - 1)
      } else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(slides.length - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, index, slides.length])

  useEffect(() => {
    const onChange = () => setPresenting(document.fullscreenElement === stage.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const present = () => stage.current?.requestFullscreen?.()

  return (
    <div className="deck">
      <header className="toolbar">
        <button className="btn btn-ghost" onClick={onBack}>
          ← New company
        </button>
        <div className="toolbar-title">
          <strong>{report.company.name}</strong>
          <span className="ticker">{report.company.ticker}</span>
        </div>
        <div className="toolbar-actions">
          <button className="btn" onClick={present}>
            Present
          </button>
          <button className="btn btn-primary" onClick={() => window.print()}>
            Export PDF
          </button>
        </div>
      </header>

      <div className="deck-main">
        <nav className="thumbs" aria-label="Slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              className={`thumb ${i === index ? 'is-active' : ''}`}
              onClick={() => go(i)}
              aria-current={i === index}
            >
              <span className="thumb-num">{i + 1}</span>
              <SlideFrame className="thumb-frame">{s.element}</SlideFrame>
              <span className="thumb-title">{s.title}</span>
            </button>
          ))}
        </nav>

        <section className="stage-wrap">
          <div ref={stage} className={`stage ${presenting ? 'is-presenting' : ''}`} onClick={() => presenting && go(index + 1)}>
            <SlideFrame>{slides[index].element}</SlideFrame>
          </div>
          <div className="stage-nav">
            <button className="btn btn-ghost" onClick={() => go(index - 1)} disabled={index === 0}>
              ‹ Prev
            </button>
            <span className="stage-count">
              {index + 1} / {slides.length}
            </span>
            <button className="btn btn-ghost" onClick={() => go(index + 1)} disabled={index === slides.length - 1}>
              Next ›
            </button>
          </div>
        </section>
      </div>

      {/* Unscaled copy of every slide, only visible when printing to PDF. */}
      <div className="print-deck" aria-hidden>
        {slides.map((s) => (
          <div className="slide print-slide" key={s.id}>
            {s.element}
          </div>
        ))}
      </div>
    </div>
  )
}
