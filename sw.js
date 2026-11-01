const CACHE = "picker-v4";
const FILES = ["./", "./index.html", "./manifest.json", "./icon.svg", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 有網路就抓最新的並更新快取；沒網路才用快取（離線也能開）。
// 只處理自己網站的檔案：同步用的 GitHub API 一律直接走網路，不快取（不然會拿到舊資料）。
self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  const plain = url.search === "";              // 帶 ?add= 之類參數的（書籤、分享）不存快取
  e.respondWith(
    fetch(req)
      .then(r => {
        if (r.ok && plain) {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return r;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
