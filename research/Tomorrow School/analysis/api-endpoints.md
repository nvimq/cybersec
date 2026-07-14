# API Endpoints

## GraphQL
```
POST https://01.tomorrow-school.ai/api/graphql-engine/v1/graphql
WS   wss://01.tomorrow-school.ai/api/graphql-engine/v1/graphql
```
Auth: `Authorization: Bearer <JWT>` + `x-hasura-role: user`

## REST API

### Validation
```
GET /api/validation/{path}?grade=X&code=X&auditId=X&eventId=X&groupId=X&feedback={}
POST /api/validation/{path}/resend
```

### Auth
```
GET /api/auth/now  — текущий пользователь
```

### Objects
```
GET /api/object/{path}  — данные объекта (модуля, курса)
```

### Logger
```
POST /api/logger  — клиентский логгер
```

### Content
```
GET /api/content/{path}  — контент (README.md и т.д.)
```

## REST Auth
Header: `x-jwt-token: <JWT>`
Optional header: `x-session-id: <session>`

## Response Codes

| Код | Значение |
|-----|----------|
| 200 | Успех |
| 400 | Bad Request |
| 404 | Not Found |
| 500 | Server Error |
