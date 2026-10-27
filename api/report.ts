import { handleReport } from '../server/http.js'

// Vercel function: GET /api/report?ticker=AAPL&period=ttm
export function GET(request: Request) {
  return handleReport(request)
}
