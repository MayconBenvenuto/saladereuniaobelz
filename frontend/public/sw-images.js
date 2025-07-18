// Service Worker para cache de imagens
const CACHE_NAME = 'belz-images-v1';
const IMAGES_TO_CACHE = [
  '/logo-belz.png',
  '/sala.jpg'
];

// Instalar service worker e fazer cache das imagens
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(IMAGES_TO_CACHE);
      })
      .catch((error) => {
        console.error('Erro ao fazer cache das imagens:', error);
      })
  );
});

// Interceptar requisições de imagens
self.addEventListener('fetch', (event) => {
  // Só interceptar requisições de imagens
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Se encontrou no cache, retorna
          if (response) {
            return response;
          }
          
          // Se não encontrou, busca na rede e adiciona ao cache
          return fetch(event.request)
            .then((response) => {
              // Verifica se a resposta é válida
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clona a resposta para o cache
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
              
              return response;
            })
            .catch(() => {
              // Se falhou, tenta retornar uma imagem padrão do cache
              return caches.match('/logo-belz.png');
            });
        })
    );
  }
});

// Limpar caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
