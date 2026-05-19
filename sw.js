/* Cognition — Service Worker v7
   Estrategias:
   - HTML  → network-first (HTML siempre fresco; fallback al cache si offline)
   - CSS/JS/img/font → cache-first con revalidación silenciosa
*/
const CACHE = 'cognition-v12';
const CORE = [
  './',
  './index.html',
  './suite.html',
  './servicios.html',
  './casos.html',
  './industrias.html',
  './nosotros.html',
  './contacto.html',
  './faq.html',
  './404.html',
  './privacy.html',
  './terms.html',
  './css/style.css',
  './js/script.js',
  './favicon.svg',
  './favicon.ico',
  './logo.svg',
  './og-image.png',
  './icon-192.png',
  './icon-512.png',
  './manifest.json',
  './assets/logos/provincia--gob.png',
  './assets/logos/nucleo-bank.png',
  './assets/logos/helios-pharma.png',
  './assets/logos/andeslogistics.png',
  './assets/logos/saludplus.png',
  './assets/logos/rotar-finance.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

function isFreshRequired(req) {
  // HTML, CSS y JS siempre frescos — son el "código" del sitio
  const dest = req.destination;
  if (dest === 'document' || dest === 'style' || dest === 'script') return true;
  if (req.mode === 'navigate') return true;
  const url = req.url;
  if (/\.(html|css|js)(\?|$)/.test(url)) return true;
  return false;
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (isFreshRequired(req)) {
    // Network-first para HTML/CSS/JS — siempre la última versión
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => caches.match(req).then(c => c || caches.match('./404.html')))
    );
    return;
  }

  // Cache-first para imágenes/fonts/icons — assets estables
  e.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
