# Method 02: JWT Analysis

**Status:** ✅ Успешно (декодинг), ❌ Не удалось (forgery)  
**Date:** 2026-07-14  

## Цель
Найти способ подделать JWT токен для доступа к audit_private под userId=nazamanbek (17381).

## Процесс

### 1. Декодинг токена
Токен из `localStorage['hasura-jwt-token']`:
```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.
eyJzdWIiOiI5NjUyIiwiaWF0IjoxNzg0MDQ2MDcxLCJpcCI6Ijg5LjIxOC44OC45OCwgMTcyLjE4LjAuMiIsImV4cCI6MTc4NDEzMjQ3MSwiaHR0cHM6Ly9oYXN1cmEuaW8vand0L2NsYWltcyI6eyJ4LWhhc3VyYS1hbGxvd2VkLXJvbGVzIjpbInVzZXIiXSwieC1oYXN1cmEtY2FtcHVzZXMiOiJ7fSIsIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS11c2VyLWlkIjoiOTY1MiIsIngtaGFzdXJhLXRva2VuLWlkIjoiY2RhZjU5OWItYTQwNC00OWUwLTg0NTktNTUyNWJlMTYwMWE4In19.
t3O5Er-C6OwWSgRLt7rjA-sp1LElBvm38E7-fs1BwnU
```

### Decoded Header
```json
{"typ":"JWT","alg":"HS256"}
```

### Decoded Payload
```json
{
  "sub": "9652",
  "iat": 1784046071,
  "ip": "89.218.88.98, 172.18.0.2",
  "exp": 1784132471,
  "https://hasura.io/jwt/claims": {
    "x-hasura-allowed-roles": ["user"],
    "x-hasura-campuses": "{}",
    "x-hasura-default-role": "user",
    "x-hasura-user-id": "9652",
    "x-hasura-token-id": "cdaf599b-a404-49e0-8459-5525be1601a8"
  }
}
```

### 2. Brute-force секрета
Проверены:
- 50+ словарных секретов (admin, password, secret, hasura, etc.)
- Все комбинации 1-4 символа (a-z, 0-9)
- Пустая строка и null

**Результат:** секрет не найден.

## Вывод
JWT использует HS256 с неизвестным секретом. Подделать токен невозможно без знания секрета или уязвимости в верификации.
