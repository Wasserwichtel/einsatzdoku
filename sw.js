/* Einsatzdoku Wasserwacht – Offline-Speicher für die App-Dateien.
   Nur Programmdateien werden zwischengespeichert, nie Einsatzdaten:
   die liegen ausschließlich im Speicher der App auf dem Handy. */
const CACHE = 'einsatzdoku-v1';
const KERN = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(KERN)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(namen => Promise.all(namen.filter(n => n !== CACHE).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Erst aus dem Speicher antworten (schnell, offline), im Hintergrund aktualisieren
self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  ev.respondWith(caches.open(CACHE).then(async c => {
    const treffer = await c.match(req, {ignoreSearch: true});
    const netz = fetch(req).then(antwort => {
      if (antwort && (antwort.ok || antwort.type === 'opaque')) c.put(req, antwort.clone());
      return antwort;
    }).catch(() => treffer);
    return treffer || netz;
  }));
});
