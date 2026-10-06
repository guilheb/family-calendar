import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { CALENDARS, feedEnvVar, feedPath } from './src/config.js'

// Builds one proxy route per calendar: /feeds/<id> → the URL in CAL_<ID>_URL.
// Vite fetches the feed server-side, so the private URL stays out of the page
// and the feed doesn't need CORS headers. `preview` reuses these routes.
function feedProxies(env) {
  const proxy = {}
  for (const { id } of CALENDARS) {
    const raw = env[feedEnvVar(id)]
    if (!raw) {
      console.warn(`[feeds] ${feedEnvVar(id)} is not set in .env.local — "${id}" will not load.`)
      continue
    }
    const url = new URL(raw.replace(/^webcals?:\/\//i, 'https://'))
    proxy[feedPath(id)] = {
      target: url.origin,
      changeOrigin: true,
      rewrite: () => url.pathname + url.search,
    }
  }
  return proxy
}

export default defineConfig(({ mode }) => {
  // '' prefix loads every variable, not only VITE_*; none of them are exposed to the client.
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    server: { proxy: feedProxies(env) },
  }
})
