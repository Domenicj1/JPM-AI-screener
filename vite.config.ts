import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'

// Serves the backend (server/http.ts) at /api/* during `npm run dev`, so one
// command runs both halves locally. In production the same handlers run as
// Vercel functions from api/.
function apiPlugin(): Plugin {
  const handle = async (server: ViteDevServer, req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/')) return next()
    const { route } = await server.ssrLoadModule('/server/http.ts')
    const response: Response | undefined = await route(new Request(new URL(req.url, 'http://localhost')))
    if (!response) return next()
    res.statusCode = response.status
    response.headers.forEach((value, key) => res.setHeader(key, value))
    res.end(await response.text())
  }
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => void handle(server, req, res, next).catch(next))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Make .env.local values (ANTHROPIC_API_KEY, SEC_USER_AGENT) visible to the
  // server code. Only VITE_-prefixed values ever reach the browser bundle.
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[key] ??= value
  return { plugins: [react(), apiPlugin()] }
})
