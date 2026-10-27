import { handleSearch } from '../server/http.js'

// Vercel function: GET /api/search?q=apple
export function GET(request: Request) {
  return handleSearch(request)
}
