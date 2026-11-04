// Guarda la app en el teléfono para que abra rápido y SIN internet.
// tool/preparar_web.py llena VERSION y ARCHIVOS al publicar.
//
// - La primera vez guarda lo básico, y lo demás (el motor que use este
//   teléfono) apenas se descarga.
// - En cada versión nueva vuelve a bajar lo mismo que este teléfono ya usaba,
//   y la versión nueva entra la próxima vez que se abra la app.
// - Lo que no es de la app (el servidor de Supabase, WhatsApp) no se toca.
const VERSION = '5a7203a81b31';
const CACHE = 'drc-salon-' + VERSION;
const BASICOS = ["./", ".last_build_id", "assets/AssetManifest.bin", "assets/AssetManifest.bin.json", "assets/FontManifest.json", "assets/assets/fuentes/DMSans-400.ttf", "assets/assets/fuentes/DMSans-500.ttf", "assets/assets/fuentes/DMSans-600.ttf", "assets/assets/fuentes/DMSans-700.ttf", "assets/assets/fuentes/PlayfairDisplay-700.ttf", "assets/assets/marca/drc_system.png", "assets/fonts/MaterialIcons-Regular.otf", "assets/packages/cupertino_icons/assets/CupertinoIcons.ttf", "assets/packages/flutter_local_notifications_web/web/notifications_service_worker.js", "assets/shaders/ink_sparkle.frag", "assets/shaders/stretch_effect.frag", "bloqueo.js", "drift_worker.js", "favicon.png", "flutter.js", "flutter_bootstrap.js", "icons/Icon-192.png", "icons/Icon-512.png", "icons/Icon-maskable-192.png", "icons/Icon-maskable-512.png", "icons/apple-touch-icon.png", "index.html", "manifest.json", "sqlite3.wasm", "version.json"];
const ARCHIVOS = new Set(["./", ".last_build_id", "assets/AssetManifest.bin", "assets/AssetManifest.bin.json", "assets/FontManifest.json", "assets/NOTICES", "assets/assets/fuentes/DMSans-400.ttf", "assets/assets/fuentes/DMSans-500.ttf", "assets/assets/fuentes/DMSans-600.ttf", "assets/assets/fuentes/DMSans-700.ttf", "assets/assets/fuentes/PlayfairDisplay-700.ttf", "assets/assets/marca/drc_system.png", "assets/fonts/MaterialIcons-Regular.otf", "assets/fonts/fallback/Roboto-Regular.ttf", "assets/packages/cupertino_icons/assets/CupertinoIcons.ttf", "assets/packages/flutter_local_notifications_web/web/notifications_service_worker.js", "assets/shaders/ink_sparkle.frag", "assets/shaders/stretch_effect.frag", "bloqueo.js", "canvaskit/canvaskit.js", "canvaskit/canvaskit.wasm", "canvaskit/chromium/canvaskit.js", "canvaskit/chromium/canvaskit.wasm", "canvaskit/skwasm.js", "canvaskit/skwasm.wasm", "canvaskit/skwasm_heavy.js", "canvaskit/skwasm_heavy.wasm", "canvaskit/webparagraph/canvaskit.js", "canvaskit/webparagraph/canvaskit.wasm", "canvaskit/wimp.js", "canvaskit/wimp.wasm", "drift_worker.js", "favicon.png", "flutter.js", "flutter_bootstrap.js", "icons/Icon-192.png", "icons/Icon-512.png", "icons/Icon-maskable-192.png", "icons/Icon-maskable-512.png", "icons/apple-touch-icon.png", "index.html", "main.dart.js", "main.dart.mjs", "main.dart.wasm", "manifest.json", "sqlite3.wasm", "version.json"].map((f) => new URL(f, self.registration.scope).href));

self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(BASICOS);
    // Lo que este teléfono ya tenía de la versión anterior, actualizado.
    const usados = new Set();
    for (const nombre of await caches.keys()) {
      if (nombre === CACHE || !nombre.startsWith('drc-salon-')) continue;
      for (const pedido of await (await caches.open(nombre)).keys()) {
        if (ARCHIVOS.has(pedido.url)) usados.add(pedido.url);
      }
    }
    await Promise.all([...usados].map((url) => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    for (const nombre of await caches.keys()) {
      if (nombre !== CACHE && nombre.startsWith('drc-salon-')) await caches.delete(nombre);
    }
    await self.clients.claim();
  })());
});

// La página avisa qué archivos ya usó (ver flutter_bootstrap.js).
self.addEventListener('message', (evento) => {
  const urls = (evento.data && evento.data.guardar) || [];
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const u of urls) {
      const url = new URL(u);
      const clave = url.origin + url.pathname;
      if (!ARCHIVOS.has(clave) || await cache.match(clave)) continue;
      try {
        const r = await fetch(clave);
        if (r.ok) await cache.put(clave, r);
      } catch (e) {}
    }
  })());
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET') return;
  const url = new URL(pedido.url);
  if (url.origin !== self.location.origin) return; // Supabase, WhatsApp, etc.
  // La página principal se guarda como "./" (sin ?parámetros).
  const clave = pedido.mode === 'navigate'
    ? new URL('./', self.registration.scope).href
    : url.origin + url.pathname;
  evento.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const guardado = await cache.match(clave);
    if (guardado) return guardado;
    try {
      const respuesta = await fetch(pedido);
      if (respuesta.ok && (ARCHIVOS.has(clave) || pedido.mode === 'navigate')) {
        cache.put(clave, respuesta.clone());
      }
      return respuesta;
    } catch (e) {
      const otro = await caches.match(clave);
      if (otro) return otro;
      throw e;
    }
  })());
});
