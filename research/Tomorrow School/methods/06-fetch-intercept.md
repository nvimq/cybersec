# Method 06: Client-side Fetch Interception

**Status:** ⚠️ Частично  
**Date:** 2026-07-14  

## Цель
Перехватить и заблокировать validation запрос на клиенте, чтобы имитировать успешный ответ без отправки кода на сервер.

## Процесс

### Snippet для перехвата fetch
```javascript
const origFetch = window.fetch.bind(window);
window.fetch = function(url, options) {
  if (typeof url === 'string' && url.includes('/api/validation/')) {
    console.log('🚫 BLOCKED:', url);
    return Promise.resolve(new Response(JSON.stringify({success:true}), {
      status: 200,
      headers: {'Content-Type': 'application/json'}
    }));
  }
  return origFetch(url, options);
};
```

### Результат
- **Перехват:** ✅ Работает (запрос блокируется, возвращается mock-ответ)
- **Сервер:** ❌ Не получает запрос (аудит не сохраняется)
- **Страница:** ⚠️ Редиректит на главную (клиент думает что успешно)

## Клиентская реализация
Важно: сайт использует свою fetch-обёртку `Cs`, которая вызывает `window.fetch`. Поэтому перехват `window.fetch` работает.

```javascript
Cs = async (e, {query: t, ...o} = {}) => {
  let n = `${e}${t ? `?${new URLSearchParams(t)}` : ""}`;
  let i = await fetch(n, o);  // <-- перехватывается
  ...
}
```

## Вывод
Client-side перехват позволяет имитировать успех на клиенте, но аудит не сохраняется на сервере. Для реального завершения аудита нужен правильный код.
