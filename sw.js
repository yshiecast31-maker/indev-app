/*
 * INDEV Security Platform
 * Copyright (c) 2026 Nathanlel / yshiecast31-maker
 * Licensed under the MIT License (see LICENSE).
 */
const CACHE='indev-static-v1.6.0-full';
const ASSETS=['./','./index.html','./styles.css','./app.js','./catalogues.js','./url-inspector.js','./assets/indev-intro.mp4','./manifest.webmanifest'];
const CACHEABLE=new Set(['index.html','styles.css','app.js','catalogues.js','url-inspector.js','manifest.webmanifest']);
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);await cache.addAll(ASSETS);await self.skipWaiting()})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy))}return response}).catch(()=>caches.match('./index.html')));
  return;
 }
 if(!CACHEABLE.has(url.pathname.split('/').pop()))return;
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{if(response.ok&&response.type==='basic'){const copy=response.clone();caches.open(CACHE).then(c=>c.put(req,copy))}return response})));
});
