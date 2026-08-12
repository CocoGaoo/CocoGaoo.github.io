const CACHE='malbit-v11';
const ASSETS=['./','./index.html','./app.css','./auth.css','./mobile-study.css','./learning-upgrade.css','./course.css','./course-extra.css','./classroom.css','./real-class.css','./textbook.css?v=10','./course-system.css?v=11','./app.js?v=5','./course.js?v=9','./course-v10.js?v=10','./course-system.js?v=11','./sync.js?v=11','./manifest.webmanifest','./favicon.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request)))})
