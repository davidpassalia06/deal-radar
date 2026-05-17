// ─────────────────────────────────────────────────────────────────────────────
// Deal Radar — Service Worker
// Per aggiornare la versione: cambia CACHE_VERSION qui sotto.
// Questo invalida la vecchia cache e forza il download dei file aggiornati.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v1.0.1';
const CACHE_NAME = `dealradar-${CACHE_VERSION}`;

// File locali da precachare all'installazione
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './js/script.js',
  './css/master.css',
];

// CDN assets da cachare al primo accesso (cache-first)
const CDN_ORIGINS = [
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

// ── INSTALL ───────────────────────────────────────────────────────────────────
// Precacha i file locali. skipWaiting() NON è chiamato qui:
// il nuovo SW aspetta che tutte le tab dell'app vengano chiuse
// prima di attivarsi, evitando stati inconsistenti.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => console.log(`[SW] Installato: ${CACHE_NAME}`))
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────────────
// Elimina tutte le cache precedenti (versioni vecchie).
// clients.claim() permette al nuovo SW di controllare subito le tab aperte.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('dealradar-') && key !== CACHE_NAME)
          .map(key => {
            console.log(`[SW] Cache eliminata: ${key}`);
            return caches.delete(key);
          })
      ))
      .then(() => {
        console.log(`[SW] Attivo: ${CACHE_NAME}`);
        return self.clients.claim();
      })
  );
});

// ── FETCH ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora richieste non-GET (es. import/export file)
  if (request.method !== 'GET') return;

  // Ignora estensioni browser e chrome-extension://
  if (!url.protocol.startsWith('http')) return;

  // ── Strategia per asset CDN: Cache First ──────────────────────────────────
  // Font, Bootstrap Icons, Chart.js: cambiano raramente, serviti dalla cache.
  if (CDN_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // ── Strategia per file locali: Network First con fallback cache ───────────
  // Tenta sempre la rete per avere i file aggiornati; se offline usa la cache.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request)
          .then(cached => cached || caches.match('./index.html'))
        )
    );
    return;
  }
});

// ── MESSAGGI DAL CLIENT ───────────────────────────────────────────────────────
// Permette all'app di forzare l'aggiornamento senza aspettare la chiusura delle tab.
// Usato dal banner "Aggiornamento disponibile" nell'app.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
