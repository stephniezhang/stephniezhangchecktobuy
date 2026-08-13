const CACHE='skincare-v4';
const ASSETS=['./','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];

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
  // 同步接口（/api/ 或 Supabase 的 /rest/）一律走网络，不缓存
  if(url.pathname.includes('/api/') || url.hostname.includes('supabase.co')){
    if(e.request.method!=='GET') return;
    e.respondWith(fetch(e.request).catch(()=>new Response('[]',{headers:{'Content-Type':'application/json'}})));
    return;
  }
  if(e.request.method!=='GET') return;
  // 页面（index.html / 根路径）永远走网络，确保上传新版本后刷新即生效
  if(e.request.mode==='navigate' || url.pathname.endsWith('/index.html')){
    e.respondWith(fetch(e.request).catch(()=>caches.match('./')));
    return;
  }
  // 静态资源（OCR 引擎、语言包、图标等）：网络优先 + 回退缓存（离线可用）
  e.respondWith(
    fetch(e.request).then(res=>{
      const cp=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});
      return res;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('./')))
  );
});
