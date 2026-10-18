// ─────────────────────────────────────────────────────────
//  Student OS — Cloudflare Pages Production Service Worker
//  Cache architecture: 4 isolated caches
//  Auto-versioned via SW_VERSION (increment on deploy)
//  Compatible with static export (output: 'export')
// ─────────────────────────────────────────────────────────

// ─── Version ───
// INCREMENT ON EVERY DEPLOY to force cache invalidation.
// Must match or exceed the value in the deploy script.
const SW_VERSION = 8
const CACHE_PREFIX = `os-v${SW_VERSION}-`

const CACHES = {
  STATIC: `${CACHE_PREFIX}static`,
  ASSETS: `${CACHE_PREFIX}assets`,
  SHELL:  `${CACHE_PREFIX}shell`,
  FONTS:  `${CACHE_PREFIX}fonts`,
}

// In static export mode, the main entry is /index.html.
// Precache both / and /index.html for broad compatibility.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-512.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-dark-32x32.png',
  '/icon-light-32x32.png',
  '/apple-icon.png',
]

const SKIP_SCHEMES = ['chrome-extension', 'moz-extension', 'safari-extension', 'ws', 'wss']

function matchesAny(url, patterns) {
  return patterns.some((p) => url.pathname.startsWith(p) || url.pathname === p)
}

// ─── Install: pre-cache critical shell + assets ───
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHES.SHELL)
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {})
        )
      )
    })()
  )
  self.skipWaiting()
})

// ─── Activate: prune ALL stale caches from prior versions ───
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const existing = await caches.keys()
      const ourPrefix = CACHE_PREFIX
      await Promise.allSettled(
        existing
          .filter((key) => !key.startsWith(ourPrefix))
          .map((key) => caches.delete(key))
      )
    })()
  )
  self.clients.claim()
})

// ─── Message handler ───
self.addEventListener('message', (event) => {
  if (event.data?.type === 'clear-caches') {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys()
        await Promise.all(keys.map((key) => caches.delete(key)))
      })()
    )
  }
  if (event.data?.type === 'skip-waiting') {
    self.skipWaiting()
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = '/?view=planner&source=notification'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) {
            return client.navigate(url)
          }
          return Promise.resolve()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
      return Promise.resolve()
    })
  )
})

// ─── Fetch: route by destination + URL pattern ───
self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Skip non-standard schemes (extensions, WebSocket, etc.)
  if (SKIP_SCHEMES.includes(url.protocol.replace(':', ''))) return

  // Skip external analytics / telemetry hosts
  if (/firestore|firebase|sentry|vercel/.test(url.hostname)) return

  // ── 1. _next/static/* — content-hashed, immutable per build ──
  // Strategy: cache-first (immutable content-hashed files)
  // These never change between builds with the same hash.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request, CACHES.STATIC))
    return
  }

  const dest = request.destination

  // ── 2. Fonts ──
  if (dest === 'font') {
    event.respondWith(cacheFirst(request, CACHES.FONTS))
    return
  }

  // ── 3. Images ──
  if (dest === 'image') {
    event.respondWith(cacheFirst(request, CACHES.ASSETS))
    return
  }

  // ── 4. Manifest ──
  if (dest === 'manifest' || url.pathname === '/manifest.json') {
    event.respondWith(cacheFirst(request, CACHES.ASSETS))
    return
  }

  // ── 5. Scripts / styles outside _next/static ──
  if (dest === 'script' || dest === 'style') {
    event.respondWith(cacheFirst(request, CACHES.STATIC))
    return
  }

  // ── 6. HTML / Navigation — NETWORK FIRST ──
  // CRITICAL: Always try network first when online.
  // This ensures the user gets the latest index.html
  // with the correct chunk paths. Cache is only
  // used as an offline fallback.
  if (dest === 'document' || url.pathname === '/index.html' || url.pathname === '/') {
    event.respondWith(networkFirst(request, CACHES.SHELL))
    return
  }

  // ── 7. Default: network-first with cache fallback ──
  event.respondWith(networkFirst(request, CACHES.ASSETS))
})

// ─── Cache Strategies ───

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached

  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(cacheName)
      const cloned = response.clone()
      await cache.put(request, cloned)
    }
    return response
  } catch {
    if (request.destination === 'document') return offlineFallback()
    return new Response('Offline', { status: 503 })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(cacheName)
      const cloned = response.clone()
      await cache.put(request, cloned)
    }
    return response
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    if (request.destination === 'document') return offlineFallback()
    return new Response('Offline', { status: 503 })
  }
}

// ─── Stale-While-Revalidate (for content-hashed static assets) ───
// Returns cached version immediately, then updates cache in background.
// On cache miss: fetches from network. On network failure: retries with
// a cache-busting query param (handles stale cache after SW update).
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const fetchPromise = (async () => {
    try {
      const response = await fetch(request)
      if (response.ok && response.type === 'basic') {
        await cache.put(request, response.clone())
      }
      return response
    } catch (err) {
      // If fetch fails and we have a cache hit, return it
      if (cached) return cached
      // Last resort: try with cache-busting param
      const bustUrl = new URL(request.url)
      bustUrl.searchParams.set('_sw_bust', Date.now().toString())
      try {
        const retry = await fetch(bustUrl.toString())
        if (retry.ok && retry.type === 'basic') {
          await cache.put(request, retry.clone())
        }
        return retry
      } catch {
        throw err
      }
    }
  })()

  // Return cached immediately if available, otherwise wait for network
  if (cached) {
    // Fire-and-forget the network update
    fetchPromise.catch(() => {})
    return cached
  }

  return fetchPromise
}

// ─── Offline fallback ───

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Student OS — Offline</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;
  display:flex;align-items:center;justify-content:center;
  min-height:100dvh;background:#0a0a14;color:#e4e4e7;padding:1rem;text-align:center}
.wrap{max-width:26rem}
svg{margin-bottom:1.5rem;display:block;margin-left:auto;margin-right:auto}
h1{font-size:1.25rem;font-weight:600;margin-bottom:.5rem;color:#fafafa;letter-spacing:-.01em}
p{font-size:.875rem;color:#a1a1aa;line-height:1.6;margin-bottom:1.5rem}
.btn{display:inline-flex;align-items:center;gap:.5rem;
  padding:.625rem 1.25rem;border-radius:.5rem;
  border:1px solid rgba(255,255,255,.1);
  background:rgba(255,255,255,.05);color:#e4e4e7;
  font-size:.875rem;font-family:inherit;cursor:pointer;
  transition:background .15s,transform .1s;
  -webkit-tap-highlight-color:transparent}
.btn:hover{background:rgba(255,255,255,.1)}
.btn:active{transform:scale(.97)}
.footer{font-size:.75rem;color:#52525b;margin-top:2rem}
</style>
</head>
<body>
<div class="wrap">
<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
<line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
</svg>
<h1>You're offline</h1>
<p>Student OS was designed to work without an internet connection. If you're seeing this, try reloading — your data is always saved locally.</p>
<button class="btn" onclick="location.reload()">Try again</button>
<p class="footer">Student OS &mdash; built by Jainam Karnawat</p>
</div>
</body>
</html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}
