# JWT Analysis

## Token Structure

```
Header:     HS256
Payload:    userId=9652, campus=astanahub, claims
Signature:  HMAC-SHA256(base64(header) + "." + base64(payload), secret)
```

## Decoded Payload

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

## Claims Analysis

| Claim | Значение | Назначение |
|-------|----------|------------|
| `x-hasura-user-id` | 9652 | Идентификатор пользователя для RLS |
| `x-hasura-allowed-roles` | ["user"] | Разрешённые роли |
| `x-hasura-default-role` | user | Роль по умолчанию |
| `x-hasura-campuses` | "{}" | Кампусы (пустой объект) |
| `x-hasura-token-id` | UUID | ID токена (соль?) |

## Верификация
- Алгоритм: HS256 (HMAC-SHA256)
- Секрет: ❌ **Не найден**
- Проверено: словари, короткие строки (1-4 символа), пустые значения
- В коде frontend секрет не обнаружен

## Безопасность
- JWT хранится в localStorage (xss-уязвимость)
- Срок действия: ~24 часа (exp - iat)
- Включает IP пользователя (возможно используется для валидации)
