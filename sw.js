// DA 40 NG W&B – offline support. Always tries the network first (so updates arrive),
// falls back to the stored copy when offline. Only files of this site are handled.
const CACHE="da40ng-wb-v1";
const FILES=["./","./index.html","./manifest.webmanifest","./icon-180.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET"||new URL(req.url).origin!==self.location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const res=await Promise.race([fetch(req),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),5000))]);
      if(res&&res.ok)cache.put(req,res.clone());
      return res;
    }catch(err){
      return (await cache.match(req,{ignoreSearch:true}))||(req.mode==="navigate"?await cache.match("./index.html"):undefined)||Response.error();
    }
  })());
});
