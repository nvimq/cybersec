# Method 08: WebSocket Interception

**Status:** ⚠️ Скрипт написан, код не обнаружен  
**Date:** 2026-07-14  

## Цель
Перехватить Hasura WebSocket сообщения для обнаружения кода аудита в real-time уведомлениях.

## WebSocket Endpoint
```
wss://01.tomorrow-school.ai/api/graphql-engine/v1/graphql
```

## Протокол
Hasura использует `graphql-ws` subprotocol:
1. `connection_init` — аутентификация (токен)
2. `subscribe` — подписка на query
3. `next` — данные по подписке
4. `complete` — завершение подписки

## Проблема
Таблица `notification` **не существует** в GraphQL схеме. Уведомления, вероятно, доставляются через:
- REST API polling
- Другой WebSocket (не Hasura)
- Серверные события (SSE)
- Push-уведомления браузера

## Скрипт перехвата
Создан `scripts/websocket-interceptor.js` — перехватывает WebSocket сообщения и логирует их.

## Вывод
Код аудита не обнаружен в WebSocket трафике. Возможно, уведомления доставляются через другой канал.
