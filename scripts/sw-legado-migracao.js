/* Worker same-origin para migrar PWAs instalados no host legado. */
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Não remove Cache Storage, localStorage, IndexedDB, sessão ou dado algum.
    await self.clients.claim();
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const janela of janelas) janela.postMessage({ tipo: 'aue-legado-sw-migrado' });
    await self.registration.unregister();
  })());
});

// Sem fallback e sem resposta sintética: a navegação alcança o 301 da rede.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
