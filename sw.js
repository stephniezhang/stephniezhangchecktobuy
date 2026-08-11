const CACHE='skincare-v2';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  // 同步接口（POST/GET /api/）一律走网络，不缓存
  if(url.pathname.includes('/api/')){
    if(e.request.method!=='GET') return;          // POST 交给浏览器默认处理
    e.respondWith(fetch(e.request).catch(()=>new Response('[]',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  if(e.request.method!=='GET') return;
  // 资源：网络优先，失败再回退缓存（保证更新即时生效，且离线可用）
  e.respondWith(
    fetch(e.request).then(res=>{
      const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./')))
  );
});
