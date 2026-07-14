# GraphQL Schema Analysis

## Queries (90+)

### Core tables
| Query | Description | RLS |
|-------|-------------|-----|
| `audit` | Аудиты | Доступны свои + где auditor = current user |
| `audit_private` | Коды аудитов | **Только auditorId == userId** |
| `event` | События (курсы/модули) | Публичные |
| `group` | Группы | Свои группы |
| `group_user` | Участники групп | Свои |
| `object` | Объекты (задания) | Публичные |
| `progress` | Прогресс по модулям | Свой |
| `result` | Результаты | Свои |
| `user` | Пользователи | Ограниченные поля |

### Важные relationships
- `audit.private → audit_private` (code)
- `audit.result → result`
- `audit.auditor → user_public_view`
- `result.audits → audit[]`
- `progress.results → result[]`

## Mutations (44)

### Доступные
- `insert_group_one`, `update_group_by_pk`, `delete_group`
- `insert_result_one`, `update_result_by_pk`
- `update_user_by_pk`
- `insert_match_one`, `update_match_by_pk`
- `insert_group_user_one`, `update_group_user_by_pk`

### НЕ доступны (отсутствуют)
- ❌ `insert_audit`, `update_audit`, `delete_audit`
- ❌ `insert_audit_private`, `update_audit_private`
- ❌ `insert_progress`, `update_progress`
- ❌ `insert_event`, `update_event`

## result_insert_input
```
attrs: jsonb
eventId: Int
group: group_obj_rel_insert_input
objectId: Int
path: String
version: String
```
**Нет полей:** grade, userId, auditId

## result_set_input (что можно изменить)
```
attrs: jsonb
version: String
```
**Только attrs и version**

## user_set_input (что можно изменить)
```
attrs: jsonb
avatarUrl: String
email: String
firstName: String
lastName: String
profile: jsonb
```
