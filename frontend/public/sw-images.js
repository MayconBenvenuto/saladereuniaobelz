// Service Worker para cache de imagens
const CACHE_NAME = 'belz-images-v2';
const IMAGES_TO_CACHE = [
  '/logo-belz.png',
  '/sala.jpg'
];

// Instalar service worker e fazer cache das imagens
self.addEventListener('install', (event) => {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto, adicionando imagens:', IMAGES_TO_CACHE);
        return cache.addAll(IMAGES_TO_CACHE);
      })
      .then(() => {
        console.log('Imagens adicionadas ao cache com sucesso');
        // Força a ativação imediata do novo service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Erro ao fazer cache das imagens:', error);
      })
  );
});

// Interceptar requisições de imagens
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Só interceptar requisições de imagens locais (png, jpg, jpeg, svg)
  if (request.destination === 'image' || 
      /\.(png|jpg|jpeg|svg|webp)$/i.test(url.pathname)) {
    
    console.log('Service Worker interceptando imagem:', url.pathname);
    
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          // Se encontrou no cache, retorna
          if (cachedResponse) {
            console.log('Imagem encontrada no cache:', url.pathname);
            return cachedResponse;
          }
          
          console.log('Imagem não encontrada no cache, buscando na rede:', url.pathname);
          
          // Se não encontrou, busca na rede e adiciona ao cache
          return fetch(request)
            .then((networkResponse) => {
              // Verifica se a resposta é válida
              if (!networkResponse || networkResponse.status !== 200) {
                console.warn('Resposta inválida da rede para:', url.pathname);
                return networkResponse;
              }
              
              // Clona a resposta para o cache (somente para imagens locais)
              if (url.origin === location.origin) {
                const responseToCache = networkResponse.clone();
                
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    console.log('Adicionando ao cache:', url.pathname);
                    cache.put(request, responseToCache);
                  })
                  .catch((error) => {
                    console.error('Erro ao adicionar ao cache:', error);
                  });
              }
              
              return networkResponse;
            })
            .catch((error) => {
              console.error('Erro ao buscar imagem na rede:', url.pathname, error);
              // Se falhou e é uma das imagens principais, tenta retornar do cache
              if (url.pathname === '/sala.jpg') {
                return caches.match('/logo-belz.png');
              }
              throw error;
            });
        })
    );
  }
});

// Limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('Service Worker ativando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('belz-images-')) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker ativado e assumindo controle');
      // Assumir controle imediatamente
      return self.clients.claim();
    })
  );
});
