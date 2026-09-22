// Kairosong — le service worker qui se désinscrit (cadrage landing § 3).
//
// Jusqu'à la bascule, l'app vivait sur kairosong.com et y avait installé un service worker
// qui la sert hors ligne. Ce worker relit /sw.js pour se mettre à jour : il trouve celui-ci,
// qui prend la main sans attendre, vide les caches de l'ancienne app, se désinscrit, puis
// recharge chaque onglet ouvert. Au rechargement, le réseau sert la landing.
//
// ⛔ Ne jamais supprimer ce fichier tant que des téléphones peuvent garder l'ancienne app.
// ⛔ Pas de gestionnaire `fetch` : ce worker ne sert rien, il ne fait que partir.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Prendre la main sur tous les onglets, sans quoi `navigate` les refuse.
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map((client) => client.navigate(client.url).catch(() => {})));
    })(),
  );
});
