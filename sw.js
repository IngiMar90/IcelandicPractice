const CACHE_PREFIX='islenska-aefing-pwa-';
const CACHE_NAME=CACHE_PREFIX+'v4-everyday-synonyms-20261125';
const ASSETS=['./','./index.html','./styles.css','./app.js','./exercises.js','./questions.js','./progression.js','./data.json','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(CACHE_PREFIX)&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
  event.respondWith(caches.open(CACHE_NAME).then(async cache=>{
    const cached=await cache.match(event.request);
    if(cached)return cached;
    try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}
    catch(error){if(event.request.mode==='navigate')return (await cache.match('./index.html'))||Response.error();throw error;}
  }));
});
