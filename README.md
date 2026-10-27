# AI Pitch Deck (JPM AI Screener)

An interactive React app that turns a public company's financial filings into a
presentation-ready credit deck. A JP Morgan analyst picks a company, clicks
**Generate**, and gets 16:9 slides for leverage, fixed charge coverage (FCCR),
debt, company exposure, and reputation, each checked against covenant
thresholds with pass / watch / fail markers.

> **Status:** prototype. Any US public company that files 10-Ks can be pulled
> live from SEC EDGAR, with summaries written by Claude. Two fictional sample
> companies (NWDV, BWLX) still work offline with no setup.

## Run it

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install      # download dependencies (once)
cp .env.example .env.local   # then fill in the two values (see below)
npm run dev      # start the app and the API at http://localhost:5173
```

`.env.local` holds the two server secrets. It is git-ignored and never sent to
the browser:

| Variable | What it is |
| --- | --- |
| `ANTHROPIC_API_KEY` | A Claude API key from [platform.claude.com](https://platform.claude.com/settings/keys) (Settings → API keys). Billed per use. |
| `SEC_USER_AGENT` | Your app name and contact email, e.g. `JPM AI Screener you@school.edu`. The SEC requires it; no signup needed. |

Without them the sample companies still work; real companies show an error
saying which value is missing.

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the unit tests (covenant rules, metric math, report assembly) |
| `npm run lint` | Checks the code for common mistakes |
| `npm run build` | Type-checks and builds the production site into `dist/` |

## Using the app

1. Search for a company by name or ticker (e.g. `AAPL`, or the samples `NWDV` / `BWLX`) and pick a period.
2. Click **Generate deck** and watch the progress steps.
3. Move between slides with the thumbnails, the arrow keys, or Prev / Next.
4. **Present** goes full screen (click or press → to advance, Esc to leave).
5. **Export PDF** opens the print dialog with one slide per page. Choose
   "Save as PDF".

Northwind Devices matches the memo mockups and mostly passes. Brightwater
Logistics is a stressed credit, so it shows the watch and fail states.

## How real data is built

`GET /api/report?ticker=AAPL&period=ttm` runs on the server (`server/report.ts`):

1. **SEC EDGAR**: looks up the ticker's CIK, then downloads the company's
   filing list and its XBRL "companyfacts" (every number from every 10-K and 10-Q).
2. **Metrics** (`server/metrics.ts`, plain arithmetic, unit tested):
   - Leverage = total debt / EBITDA (operating income + D&A), per fiscal year plus TTM.
   - FCCR = (EBITDA − capex − cash taxes) / (interest + current portion of
     long-term debt), trailing 12 months, last 8 quarters. If the current
     portion is not tagged, last year's repayments stand in and the slide
     says "Scheduled principal estimated".
   - Debt: total, year-ago, cash, maturity ladder from the 10-K, average rate
     (tagged, or interest / average debt).
   - Revenue swing and seasonal peak from quarterly revenue.
3. **Claude** (`server/ai.ts`, model `claude-opus-5-5`): reads the latest 10-K
   text plus the computed metrics and returns, as validated JSON, the slide
   summaries, five takeaways, customer concentration, segment and region mix,
   floating-rate share, and legal proceedings for the reputation slide. It is
   told never to change the computed numbers, and to return "not disclosed"
   (shown as n/d) rather than guess.

Limits today: banks and insurers (no operating income) and foreign filers
(20-F) are not supported, and reputation uses the 10-K only (no news search).
Each report sends one 10-K to Claude, roughly $0.30 to $0.80 per deck.

## Deploying

The app is set up for [Vercel](https://vercel.com) (free Hobby plan works):
import the GitHub repo, add `ANTHROPIC_API_KEY` and `SEC_USER_AGENT` under
Project → Settings → Environment Variables, and deploy. Vercel builds the Vite
site and runs `api/search.ts` and `api/report.ts` as serverless functions
(`vercel.json` gives the report up to 5 minutes).

## How the code is organized

```
api/                       Vercel functions (thin wrappers around server/http.ts)
server/
  http.ts                  /api/search and /api/report handlers (also used by `npm run dev`)
  edgar.ts                 SEC EDGAR client (ticker list, filings, companyfacts, 10-K text)
  facts.ts                 XBRL helpers: quarterly values from year-to-date, TTM sums
  metrics.ts               Leverage, FCCR, debt, revenue stability (+ metrics.test.ts)
  ai.ts                    Claude call that writes the summaries and reads the 10-K
  report.ts                Puts it together into a CompanyReport
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

Data flows one way: `reportService` returns a `CompanyReport` (from sample
data, or from `/api/report` for real companies), `buildDeck` turns it into a
list of slides, and `DeckViewer` shows them.

Slides are always laid out at 1280 x 720 and scaled to fit the screen, so a
slide looks the same as a thumbnail, in the editor, full screen, and in the PDF.

## Covenant rules

| Metric | Fail | Watch | Pass |
| --- | --- | --- | --- |
| Leverage (Debt / EBITDA) | above max (3.5x) | within 0.25x of max | otherwise |
| FCCR | below min (1.25x) | within 0.15x of min | otherwise |
| Largest customer | | above 10% of revenue | otherwise |
| Reputation | High | Medium | Low |

The thresholds live in `src/lib/covenants.ts` (`LEVERAGE_COVENANT_MAX`,
`FCCR_COVENANT_MIN` and the watch buffers) and should be confirmed with the
JPM analysts. Real companies all use these defaults, not their actual credit
agreement terms.

## Next steps

- News scan for the reputation slide (the 10-K part is done)
- Support for banks / insurers and 20-F filers
- Remaining metric slides: growth, revenue YoY, EBITDA, margins, liquidity
- Click any number to see its source; follow-up Q&A
