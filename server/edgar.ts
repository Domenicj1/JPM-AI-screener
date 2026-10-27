import type { CompanyFacts } from './facts.js'

// Thin client for SEC EDGAR. The SEC requires every request to carry a
// User-Agent naming the app and a contact email, and allows at most 10
// requests per second (https://www.sec.gov/os/accessing-edgar-data).

export interface TickerEntry {
  cik: number
  ticker: string
  name: string
}

export interface Filing {
  form: string
  filingDate: string
  reportDate: string
  accessionNumber: string
  primaryDocument: string
  url: string
}

export interface Submissions {
  name: string
  sicDescription: string
  tickers: string[]
  filings: { recent: Record<string, string[]> }
}

function userAgent(): string {
  const ua = process.env.SEC_USER_AGENT
  if (!ua || !ua.includes('@')) {
    throw new Error('Set SEC_USER_AGENT to your app name and contact email, e.g. "JPM AI Screener you@school.edu".')
  }
  return ua
}

async function secFetch(url: string): Promise<Response> {
  const headers = { 'User-Agent': userAgent(), 'Accept-Encoding': 'gzip, deflate' }
  const res = await fetch(url, { headers }).catch((e: Error) => {
    throw new Error(`Could not reach SEC EDGAR (${e.cause instanceof Error ? e.cause.message : e.message})`)
  })
  if (!res.ok) throw new Error(`SEC EDGAR returned ${res.status} for ${url}`)
  return res
}

const pad = (cik: number) => String(cik).padStart(10, '0')

let tickerCache: Promise<TickerEntry[]> | undefined

/** Every company with a ticker, from the SEC's daily list. Cached per server instance. */
export function allTickers(): Promise<TickerEntry[]> {
  tickerCache ??= secFetch('https://www.sec.gov/files/company_tickers.json')
    .then((r) => r.json() as Promise<Record<string, { cik_str: number; ticker: string; title: string }>>)
    .then((data) => Object.values(data).map((d) => ({ cik: d.cik_str, ticker: d.ticker, name: d.title })))
    .catch((e) => {
      tickerCache = undefined
      throw e
    })
  return tickerCache
}

export async function findTicker(ticker: string): Promise<TickerEntry | undefined> {
  const t = ticker.trim().toUpperCase()
  return (await allTickers()).find((e) => e.ticker === t)
}

export async function searchTickers(query: string, limit = 8): Promise<TickerEntry[]> {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const all = await allTickers()
  const exact = all.filter((e) => e.ticker.toLowerCase() === q)
  const starts = all.filter((e) => e.ticker.toLowerCase() !== q && e.ticker.toLowerCase().startsWith(q))
  const named = all.filter((e) => !e.ticker.toLowerCase().startsWith(q) && e.name.toLowerCase().includes(q))
  return [...exact, ...starts, ...named].slice(0, limit)
}

export async function getSubmissions(cik: number): Promise<Submissions> {
  return (await secFetch(`https://data.sec.gov/submissions/CIK${pad(cik)}.json`)).json() as Promise<Submissions>
}

export async function getCompanyFacts(cik: number): Promise<CompanyFacts> {
  return (await secFetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${pad(cik)}.json`)).json() as Promise<CompanyFacts>
}

/** Most recent filing of one of the given forms (amendments are skipped). */
export function latestFiling(sub: Submissions, cik: number, forms: string[]): Filing | undefined {
  const r = sub.filings.recent
  for (let i = 0; i < r.form.length; i++) {
    if (!forms.includes(r.form[i])) continue
    const accession = r.accessionNumber[i]
    return {
      form: r.form[i],
      filingDate: r.filingDate[i],
      reportDate: r.reportDate[i],
      accessionNumber: accession,
      primaryDocument: r.primaryDocument[i],
      url: `https://www.sec.gov/Archives/edgar/data/${cik}/${accession.replace(/-/g, '')}/${r.primaryDocument[i]}`,
    }
  }
  return undefined
}

/** Download a filing's main document and reduce the HTML to readable text. */
export async function filingText(filing: Filing): Promise<string> {
  return htmlToText(await (await secFetch(filing.url)).text())
}

const ENTITIES: Record<string, string> = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

export function htmlToText(html: string): string {
  return html
    .replace(/<ix:header>[\s\S]*?<\/ix:header>/gi, ' ') // hidden inline-XBRL metadata
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<\/(p|div|tr|li|h\d|table)>|<br\s*\/?>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' | ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ?\n[ \n|]*/g, '\n')
    .trim()
}
