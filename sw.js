// IR Guide Service Worker v5
const CACHE = 'ir-guide-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Установка — кэшируем всё
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Активация — удаляем старые кэши
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Только GET запросы
  if (e.request.method !== 'GET') return;
  // Не кэшируем Supabase запросы
  if (e.request.url.includes('supabase.co')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Обновляем кэш при успешном запросе
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Сообщение от клиента — проверка обновления
self.addEventListener('message', e => {
  if (e.data === 'CHECK_UPDATE') {
    self.skipWaiting();
  }
});
