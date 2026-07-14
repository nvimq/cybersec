/**
 * Full Application Data Dump
 * 
 * Запускать в Sources → Snippets на любой странице 01.tomorrow-school.ai
 * Скачивает JSON-файл со всеми данными:
 * - localStorage, sessionStorage, cookies
 * - Performance resources (Frames data)
 * - Service Workers
 * - IndexedDB
 * - Cache Storage
 */

(function() {
  const data = {
    url: location.href,
    timestamp: new Date().toISOString(),
    localStorage: {},
    sessionStorage: {},
    cookies: {},
    resources: [],
    serviceWorker: null,
    indexedDB: {},
    cacheStorage: {}
  };

  // Cookies
  try {
    document.cookie.split('; ').forEach(function(c) {
      const p = c.indexOf('=');
      if (p > 0) data.cookies[c.slice(0, p)] = c.slice(p + 1);
    });
  } catch(e) {}

  // localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      data.localStorage[k] = localStorage.getItem(k);
    }
  } catch(e) {}

  // sessionStorage
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      data.sessionStorage[k] = sessionStorage.getItem(k);
    }
  } catch(e) {}

  // Resources via Performance API
  try {
    performance.getEntriesByType('resource').forEach(function(r) {
      data.resources.push({
        url: r.name,
        type: r.initiatorType,
        size: r.transferSize,
        duration: r.duration
      });
    });
  } catch(e) {}

  function finish() {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'application-dump-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    console.log('✅ File saved. Size: ' + json.length + ' chars');
  }

  async function dumpCacheAndDB() {
    // Cache Storage
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        data.cacheStorage.keys = keys;
        for (const key of keys) {
          const cache = await caches.open(key);
          const requests = await cache.keys();
          data.cacheStorage[key] = requests.map(function(r) {
            return {url: r.url, method: r.method, mode: r.mode};
          });
        }
      }
    } catch(e) {
      data.cacheStorage.error = e.message;
    }

    // IndexedDB
    try {
      if (indexedDB.databases) {
        const dbs = await indexedDB.databases();
        for (const info of dbs) {
          const db = await new Promise(function(res, rej) {
            const req = indexedDB.open(info.name, info.version);
            req.onsuccess = function() { res(req.result); };
            req.onerror = function() { rej(req.error); };
          });
          data.indexedDB[info.name] = {};
          for (let j = 0; j < db.objectStoreNames.length; j++) {
            const storeName = db.objectStoreNames[j];
            data.indexedDB[info.name][storeName] = [];
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            await new Promise(function(res, rej) {
              const req = store.getAll();
              req.onsuccess = function() {
                data.indexedDB[info.name][storeName] = req.result;
                res();
              };
              req.onerror = rej;
            });
          }
          db.close();
        }
      }
    } catch(e) {
      data.indexedDB.error = e.message;
    }

    // Service Worker
    try {
      if (navigator.serviceWorker) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          data.serviceWorker = {
            scope: reg.scope,
            active: reg.active ? reg.active.scriptURL : null
          };
        }
      }
    } catch(e) {}

    finish();
  }

  dumpCacheAndDB();
})();
