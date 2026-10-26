// public/sw.js — Service worker PWA 2CGC.
//
// Corrections apportées le 2026-10-26 :
//
// 1. L'installation échouait systématiquement. `cache.addAll` est atomique :
//    il rejette en bloc dès qu'un seul élément échoue, et il refuse les
//    réponses de redirection. Or « / » est une redirection (le proxy renvoie
//    vers /fr selon la langue du navigateur). D'où le `Uncaught (in promise)
//    TypeError: Failed to fetch` visible en console à chaque chargement, et un
//    worker jamais installé — donc aucun mode hors-ligne réel.
//
// 2. La branche par défaut pouvait passer `undefined` à `respondWith` quand la
//    requête n'était pas en cache, ce qui fait échouer la requête au lieu de la
//    laisser suivre son cours.
//
// 3. Les pages privées (espaces dirigeant, usine, chauffeur, client) étaient
//    mises en cache. Elles contiennent des données clients et pouvaient être
//    resservies après déconnexion.

const CACHE_NAME = '2cgc-pwa-v3';

// Uniquement des ressources statiques servies directement, sans redirection.
// Les pages publiques sont mises en cache à la volée, à la navigation.
const PRECACHE_ASSETS = [
  '/offline.html',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon-32x32.png',
  '/logo-2cgc.jpg',
];

// Espaces authentifiés : jamais mis en cache.
const CHEMINS_PRIVES = ['/dirigeant', '/usine', '/chauffeur', '/client', '/connexion', '/changer-mot-de-passe'];

function estPrive(pathname) {
  return CHEMINS_PRIVES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Un élément indisponible ne doit pas empêcher l'installation entière :
      // on les ajoute un par un et on ignore les échecs isolés.
      const resultats = await Promise.allSettled(
        PRECACHE_ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
      const echecs = resultats
        .map((r, i) => (r.status === 'rejected' ? PRECACHE_ASSETS[i] : null))
        .filter(Boolean);
      if (echecs.length) {
        console.warn('[sw] ressources non pré-cachées :', echecs.join(', '));
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((noms) =>
        Promise.all(noms.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // On ne touche ni aux requêtes non-GET, ni aux schémas non http(s).
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // API et espaces authentifiés : toujours le réseau, jamais de cache.
  if (url.pathname.startsWith('/api/') || estPrive(url.pathname)) return;

  // Autres origines (analytics, polices…) : on laisse passer.
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord, cache en secours, page hors-ligne en dernier.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((reponse) => {
          // `redirected` est exclu : une réponse redirigée ne peut pas être
          // restituée telle quelle depuis le cache.
          if (reponse && reponse.status === 200 && !reponse.redirected) {
            const copie = reponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copie)).catch(() => {});
          }
          return reponse;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match('/offline.html')) ||
            new Response('Hors-ligne', {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          );
        })
    );
    return;
  }

  // Ressources statiques : cache d'abord, rafraîchi en arrière-plan.
  if (['image', 'font', 'style', 'script'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((enCache) => {
        const depuisReseau = fetch(request)
          .then((reponse) => {
            if (reponse && reponse.status === 200 && !reponse.redirected) {
              const copie = reponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copie)).catch(() => {});
            }
            return reponse;
          })
          .catch(() => null);

        if (enCache) {
          void depuisReseau; // rafraîchissement silencieux
          return enCache;
        }

        return depuisReseau.then(
          (reponse) =>
            reponse ||
            new Response('', { status: 504, statusText: 'Gateway Timeout' })
        );
      })
    );
    return;
  }

  // Reste : réseau, avec le cache en secours. On retourne toujours une
  // Response — passer `undefined` à respondWith ferait échouer la requête.
  event.respondWith(
    fetch(request).catch(async () => {
      return (
        (await caches.match(request)) ||
        new Response('', { status: 504, statusText: 'Gateway Timeout' })
      );
    })
  );
});
