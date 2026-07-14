# Key Findings

## 🔴 Критические

### 1. Audit Code RLS
- Код аудита хранится в `audit_private.code`
- RLS: `auditorId == x-hasura-user-id`
- Студент НЕ может получить код аудитора
- **Единственный способ:** токен auditor (userId=17381)

### 2. No audit mutations
- Нет GraphQL mutation для audit/audit_private
- Нельзя изменить audit через прямой запрос

## 🟡 Средние

### 3. JWT в localStorage
- Токен доступен через XSS
- Срок действия ~24 часа

### 4. Rate limiting отсутствует
- ~70 req/sec без блокировки
- Возможен брутфорс (но ~11 дней)

### 5. Client-side token in fetch
- `x-jwt-token` передаётся в каждом REST запросе
- Утечка через network tab

## 🟢 Информационные

### 6. GraphQL introspection включена
- Можно получить полную схему

### 7. Chunked JS с readable code
- Логика приложения частично восстанавливается

### 8. Session ID в localStorage
- `localStorage['session']` = "4v598v742cp"
- Используется как `x-session-id`

## ⬜ Не проверено

### 9. Timing attack
- Возможны микросекундные различия при проверке кода

### 10. WebSocket notification system
- Не найдена таблица notifications
- Возможно SSE или другой механизм

---

## Security Score: 7/10
- Аутентификация: ✅ JWT, HS256
- Авторизация: ✅ RLS policies
- API security: ✅ Parameterized queries, no SQLi
- Rate limiting: ❌ Отсутствует
- Token storage: ⚠️ localStorage
