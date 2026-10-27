# AI Pitch Deck (JPM AI Screener)

An interactive React app that turns a public company's financial filings into a
presentation-ready credit deck. A JP Morgan analyst picks a company, clicks
**Generate**, and gets 16:9 slides for leverage, fixed charge coverage (FCCR),
debt, company exposure, and reputation, each checked against covenant
thresholds with pass / watch / fail markers.

> **Status:** prototype. The app runs on illustrative sample data for two
> fictional companies. The data pipeline (SEC EDGAR, FMP, news) is not built yet.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install      # download dependencies (once)
npm run dev      # start the app at http://localhost:5173
```

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the unit tests (covenant pass / watch / fail rules) |
| `npm run lint` | Checks the code for common mistakes |
| `npm run build` | Type-checks and builds the production site into `dist/` |

## Using the app

1. Search for a company by name or ticker (`NWDV` or `BWLX`) and pick a period.
2. Click **Generate deck** and watch the progress steps.
3. Move between slides with the thumbnails, the arrow keys, or Prev / Next.
4. **Present** goes full screen (click or press → to advance, Esc to leave).
5. **Export PDF** opens the print dialog with one slide per page. Choose
   "Save as PDF".

Northwind Devices matches the memo mockups and mostly passes. Brightwater
Logistics is a stressed credit, so it shows the watch and fail states.

## How the code is organized

```
src/
  types.ts                 The CompanyReport shape every slide reads from
  data/sampleCompanies.ts  Sample reports (replace with real data later)
  lib/reportService.ts     The one place the UI asks for data
  lib/covenants.ts         Pass / watch / fail rules (+ covenants.test.ts)
  lib/format.ts            Number formatting (2.3x, $8.4B, 5.1%)
  slides/                  One component per slide, and deck.tsx for the order
  components/              Deck viewer, search screen, charts, shared slide parts
  styles/                  app.css (app chrome) and slides.css (slide design)
docs/mockups/              The memo mockups the slides are based on
```

Data flows one way: `reportService` returns a `CompanyReport`, `buildDeck`
turns it into a list of slides, and `DeckViewer` shows them. To plug in real
data, change `generateReport` in `src/lib/reportService.ts` to call the backend
and return the same `CompanyReport` shape. The slides do not need to change.

Slides are always laid out at 1280 x 720 and scaled to fit the screen, so a
slide looks the same as a thumbnail, in the editor, full screen, and in the PDF.

## Covenant rules

| Metric | Fail | Watch | Pass |
| --- | --- | --- | --- |
| Leverage (Debt / EBITDA) | above max (3.5x) | within 0.25x of max | otherwise |
| FCCR | below min (1.25x) | within 0.15x of min | otherwise |
| Largest customer | | above 10% of revenue | otherwise |
| Reputation | High | Medium | Low |

The thresholds live in `src/lib/covenants.ts` and should be confirmed with the
JPM analysts.

## Next steps

- Backend that pulls 10-K / 10-Q data from SEC EDGAR and computes the metrics
- News and legal-proceedings scan for the reputation slide
- LLM layer that writes the slide summaries and takeaways from the computed facts
- Remaining metric slides: growth, revenue YoY, EBITDA, margins, liquidity
- Click any number to see its source; follow-up Q&A
