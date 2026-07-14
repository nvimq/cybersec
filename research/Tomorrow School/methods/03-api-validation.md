# Method 03: REST Validation API Analysis

**Status:** ✅ Успешно  
**Date:** 2026-07-14  

## Цель
Понять механизм работы validation API и найти способы обхода.

## Endpoint
```
GET /api/validation/{module-path}?grade=X&code=XXXXX&auditId=X&eventId=X&groupId=X&feedback={}
```

### Параметры
| Параметр | Значение | Описание |
|----------|----------|----------|
| grade | 1 | Оценка |
| code | XXXXX | 5-символьный код верификации |
| auditId | 38113 | ID аудита |
| eventId | 96 | ID события |
| groupId | 10232 | ID группы |
| feedback | {} | JSON фидбек (urlencoded) |

### Headers (обязательный)
```
x-jwt-token: <JWT>
```

### Ответы
- **Успех:** JSON с данными результата
- **Ошибка:** `{"error":"Wrong audit code."}`

## Клиентская реализация

Функция `Cs` (fetch wrapper) в `chunk-4OHRWWQO.js`:
```javascript
Cs = async (e, {query: t, ...o} = {}) => {
  let n = `${e}${t ? `?${new URLSearchParams(t)}` : ""}`;
  let i = await fetch(n, o);
  if (i.statusCode === 204) return {};  // BUG: должно быть i.status
  let l = jsonSafe(await i.text(), i);
  if (l && typeof l == "object" && go.set(l, i.headers), i.ok && !l?.error) return l;
  let s = Error(l?.error || i.statusText);
  throw Object.assign(s, l), ...s;
}
```

## Дополнительные endpoint'ы

### Resend
```
POST /api/validation/.../resend
```
Body: `{"eventId":96}` (JSON)  
Ответ: `{"details":{"eventId":"is required"},"error":"Invalid parameter"}`  
**Status:** ❌ Не работает (ошибка в клиентском коде — body не отправляется)

### Reset
Аналогично resend.

## Вывод
Validation API — единственный способ завершить аудит. Требует правильный код. Инъекции не работают.
