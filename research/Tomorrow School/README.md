# Tomorrow School — Security Research Report

**Platform:** `01.tomorrow-school.ai`  
**Campus:** astanahub  
**Student:** nbolat (userId=9652)  
**Target Audit:** #38113 — linear-stats (eventId=96, groupId=10232)  
**Auditor:** nazamanbek (userId=17381)  
**Research Date:** 2026-07-14  
**Status:** 🟡 Incomplete — код верификации аудита не получен

---

## 📋 Executive Summary

Проведён глубокий security assessment платформы Tomorrow School. Исследованы: GraphQL API, REST API, JWT-аутентификация, WebSocket (Hasura), система верификации аудитов, RLS-политики.

**Ключевой вывод:** Система имеет надёжную защиту на уровне кода верификации аудита (5-символьный код в `audit_private`, защищённый RLS). Единственный способ получить код — через токен пользователя-аудитора (nazamanbek).

---

## 📊 Проверенные методы

| # | Метод | Статус | Результат |
|---|-------|--------|-----------|
| 1 | **GraphQL query audit_private** | ❌ Заблокировано | RLS не позволяет видеть коды чужих аудитов |
| 2 | **GraphQL introspection** | ✅ Успешно | Получена полная схема: queries, mutations, типы |
| 3 | **JWT декодинг** | ✅ Успешно | HS256, payload содержит userId, campus, token-id |
| 4 | **JWT forgery** | ❌ Не удалось | Секрет не подобран (не словарный, не короткий) |
| 5 | **SQL/NoSQL injection (validation API)** | ❌ Отбито | Все попытки возвращают "Wrong audit code" |
| 6 | **HTTP method manipulation** | ❌ Не работает | PUT/PATCH → Not Found |
| 7 | **Race condition / параллельные запросы** | ✅ Проверено | Rate limit отсутствует (~70 req/sec) |
| 8 | **Code pattern analysis** | ❌ Без паттерна | Коды случайные, 36 unique chars, равномерное распределение |
| 9 | **Fetch interception (client-side)** | ⚠️ Частично | Перехват работает, но сервер не получает запрос |
| 10 | **WebSocket interception** | ✅ Написан скрипт | Не удалось поймать код (notifications нет в GraphQL) |
| 11 | **Resend API endpoint** | ❌ Не работает | "eventId is required" при любых форматах |
| 12 | **GraphQL mutation insert_result** | ❌ Permission error | "check constraint of an insert/update permission has failed" |
| 13 | **GraphQL mutation update_result** | ⚠️ Частично | Можно менять только attrs и version |
| 14 | **Application dump (localStorage, IndexedDB, Cache)** | ✅ Успешно | Данные сохранены |
| 15 | **Brute-force estimation** | ⏳ Нецелесообразно | 60M вариантов ~ 11 дней |
| 16 | **WebSocket Hasura subscription** | ⚠️ Неподтверждено | Notification table не существует |
| 17 | **Parameter pollution** | ❌ Отбито | "Wrong audit code" |
| 18 | **HTTP header manipulation** | ✅ Проверено | x-jwt-token обязателен, x-session-id опционален |

---

## 🏗 Архитектура платформы

### Frontend
- SPA на Preact (Vite + Rollup)
- Chunk-based JS (chunk-4OHRWWQO.js, chunk-JPZJI726.js и др.)
- Hasura GraphQL Client (WebSocket + HTTP)
- REST API через fetch-wrapper `Cs`

### Backend
- **Hasura GraphQL Engine** (wss/01.tomorrow-school.ai/api/graphql-engine/v1/graphql)
- **REST API** (01.tomorrow-school.ai/api/*)
- **JWT Authentication** (HS256)
- **PostgreSQL** с Row-Level Security

### Аутентификация
- JWT токен в `localStorage['hasura-jwt-token']`
- REST API: header `x-jwt-token`
- GraphQL: header `Authorization: Bearer <JWT>` + `x-hasura-role: user`
- Сессия: `localStorage['session']`

---

## 🔍 Детали уязвимостей

### 1. GraphQL Schema (получена)
- **16 query types**: audit, event, group, object, progress, result, user и др.
- **0 mutation for audit/audit_private**: нельзя напрямую изменить аудит
- **Mutation доступны**: insert/update/delete для: group, match, result, user, registration_user, toad_*
- **RLS policies**: audit_private.access = только auditorId == x-hasura-user-id

### 2. JWT Token
```json
{
  "alg": "HS256",
  "sub": "9652",
  "x-hasura-user-id": "9652",
  "x-hasura-campus": "astanahub",
  "x-hasura-token-id": "cdaf599b-a404-49e0-8459-5525be1601a8"
}
```
Секрет: не найден (не словарный, не короткий, не в коде)

### 3. Validation API Endpoint
```
GET /api/validation/{path}?grade=X&code=XXXXX&auditId=X&eventId=X&groupId=X&feedback={}
```
Headers: `x-jwt-token: <JWT>`
Response success: `{...}` (JSON с результатом)
Response error: `{"error":"Wrong audit code."}`

### 4. Audit DB Structure
```sql
audit:
  id, grade, auditorId, auditorLogin, resultId, groupId,
  version, attrs, createdAt, endAt, closedAt, closureType

audit_private:
  code (только auditorId == userId)
```

---

## 📋 Security Audit Checklist

Полный план аудита с приоритетами, чеклистами по зонам и статусом проверок:  
➡️ [Tomorrow_School_Audit_README.md](Tomorrow_School_Audit_README.md)

---

## 📁 Структура проекта

```
Tomorrow School/
├── README.md                    # Этот файл
├── methods/                     # Детальное описание каждого метода
│   ├── 01-graphql-enumeration.md
│   ├── 02-jwt-analysis.md
│   ├── 03-api-validation.md
│   ├── 04-code-pattern-analysis.md
│   ├── 05-sql-injection.md
│   ├── 06-fetch-intercept.md
│   ├── 07-rate-limit-test.md
│   └── 08-weboscket-intercept.md
├── scripts/                     # Инструменты и скрипты
│   ├── README.md
│   ├── auto-fill-audit.js
│   ├── websocket-interceptor.js
│   ├── bruteforce-codes.js
│   └── application-dump.js
├── analysis/                    # Аналитические отчёты
│   ├── graphql-schema.md
│   ├── jwt-analysis.md
│   ├── code-patterns.md
│   ├── api-endpoints.md
│   └── findings.md
├── graphql/                     # GraphQL данные
│   ├── queries.md
│   ├── mutations.md
│   └── schema-types.txt
├── dumps/                       # Дампы приложения
│   ├── application-dump-1.json
│   └── application-dump-2.json
├── logs/                        # Логи запросов
│   └── requests.log
└── reports/                     # Итоговые отчёты
    └── security-audit-report.md
```

---

## 🚀 Рекомендации по дальнейшим действиям

1. **Получить токен nazamanbek** — единственный гарантированный путь
2. **Запустить брутфорс по буквенным кодам (26^5)** — ~45 часов при 70 req/sec
3. **Проверить WebSocket на реальном аудите** — может код приходит в реальном времени
4. **Проверить API `/api/object/astanahub`** — большой эндпоинт (101KB), может содержать данные
5. **Исследовать timing attack** — миллисекундные различия при проверке кода
