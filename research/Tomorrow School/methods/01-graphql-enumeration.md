# Method 01: GraphQL Enumeration

**Status:** ✅ Успешно  
**Date:** 2026-07-14  

## Цель
Получить полную схему GraphQL API для поиска уязвимостей.

## Процесс
Использован introspection query через точку входа Hasura.

### Endpoint
```
POST https://01.tomorrow-school.ai/api/graphql-engine/v1/graphql
```
Headers:
- `Authorization: Bearer <JWT>`
- `x-hasura-role: user`

### Query
```graphql
{__schema{queryType{fields{name}}}}
{__schema{mutationType{fields{name}}}}
{__schema{subscriptionType{fields{name}}}}
{__type(name:"<TypeName>"){fields{name type{name}}}}
```

## Результаты

### Queries (полный список — 90+)
- `audit`, `audit_private`, `audit_aggregate`
- `event`, `event_user`, `event_user_view`
- `group`, `group_user`
- `object`, `object_child`, `object_availability`
- `progress`, `progress_by_path_view`
- `result`
- `user`, `user_public_view`, `user_role`
- `match`, `registration`, `registration_user`
- `path`, `path_archive`
- `toad_sessions`, `toad_games`, `toad_campaigns`

### Mutations (полный список — 44)
- **Нет mutation для:** `audit`, `audit_private`, `event`, `progress`, `path`
- **Есть mutation для:** `group`, `group_user`, `match`, `result`, `user`, `registration_user`, `toad_*`
- `insert_result_one`, `update_result_by_pk`, `delete_result_by_pk`
- `update_user_by_pk`

### Subscriptions: пусто

## Ключевые находки
1. `audit_private` имеет RLS: доступ только для auditorId == userId
2. Нет способа изменить audit через GraphQL
3. `result_set_input` позволяет только `attrs` и `version`
4. `group_insert_input` не имеет поля `id` — нельзя линковать существующую группу при insert_result
