import type { Period } from '../src/types.js'
import { searchTickers } from './edgar.js'
import { buildReport } from './report.js'

// Request handlers using the web-standard Request / Response, so the same code
// runs as Vercel functions (api/*.ts) and inside the Vite dev server
// (vite.config.ts).

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : String(e))

export async function handleSearch(request: Request): Promise<Response> {
  const q = new URL(request.url).searchParams.get('q') ?? ''
  try {
    const matches = await searchTickers(q)
    return json(matches.map((m) => ({ name: m.name, ticker: m.ticker, industry: 'SEC filer' })))
  } catch (e) {
    console.error(e)
    return json({ error: errorMessage(e) }, 502)
  }
}

export async function handleReport(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams
  const ticker = params.get('ticker')
  const period: Period = params.get('period') === 'latest-fy' ? 'latest-fy' : 'ttm'
  if (!ticker) return json({ error: 'Missing ticker' }, 400)
  try {
    return json(await buildReport(ticker, period))
  } catch (e) {
    console.error(e)
    return json({ error: errorMessage(e) }, 500)
  }
}

/** Dispatch for the dev server. */
export function route(request: Request): Promise<Response> | undefined {
  const { pathname } = new URL(request.url)
  if (pathname === '/api/search') return handleSearch(request)
  if (pathname === '/api/report') return handleReport(request)
  return undefined
}
