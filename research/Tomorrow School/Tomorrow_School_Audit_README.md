# Tomorrow School — Security Audit Checklist

## 1. Краткое описание
Цель: систематическая проверка веб-приложения Tomorrow School: API (REST/GraphQL), фронтенд (SPA), аутентификация/авторизация, инфраструктура (контейнеры/CI), и сторонние интеграции.

---

## 2. Scope / Область тестирования
- Домены / IP: (указать)
- Авторизованные цели (mcp/scope.yaml): (указать)
- Исключения: (указать)

---

## 3. Быстрый план (приоритеты)
| Приоритет | Что проверить | Почему | Инструменты / команды |
|---:|---|---|---|
| Critical | Auth / ACL для всех write-эндпоинтов и GraphQL мутаций | IDOR / privilege escalation → полный компромисс | ручные тесты, postman, graphqlmap |
| Critical | Rate limiting и brute-force защиты (login, reset) | Account takeover, enumeration | slow loris, hydra, Burp intruder |
| Critical | JWT проверка (alg, signature, expiration, rotation) | Подделка токенов, replay | jwt-tool, jwt.io, python jwt |
| High | GraphQL introspection/mutation depth/complexity | Sensitive fields/mutations exposed | graphql-cli, GraphQLmap, Burp |
| High | XSS / DOM-XSS (client + templates) | Token theft, session takeover | Burp, DOM XSS scanner, manual |
| High | SQL/NoSQL injection | Data leakage / RCE | sqlmap, manual payloads |
| High | SSRF (fetch/import/preview endpoints) | Internal network access, metadata | Burp, curl, payloads to internal ip |
| Medium | File upload / deserialization | RCE, path traversal | manual + fuzz, ffuf |
| Medium | CORS/Host header / CSRF | CSRF, host header reset, reset link abuse | curl, Burp |
| Medium | TLS + security headers | MiTM / clickjacking / XSS facilitation | testssl.sh, curl -I |
| Low | Dependency / container vulnerability scan | Supply chain compromise | snyk, trivy, pip-audit |
| Low | Secrets in repo and history | Leak of keys/secrets | trufflehog, git-secrets |

---

## 4. Checklists — подробные тесты по зонам

### A. Аутентификация и сессии
- [ ] Проверить логин: пробовать weak passwords, rate-limit, account lockout.
- [ ] Проверить восстановление пароля: предсказуемость токенов, leakage в URL, expiry.
- [ ] Проверить MFA: bypass via OTP enumeration / brute force.
- [ ] Проверить хранение токенов: localStorage vs HttpOnly cookie; при XSS риск утечки.
- [ ] Проверить refresh-токены: rotation, revoke, binding to device/IP.
- Как тестировать: hydra, Burp intruder, curl, jwt-tool.

### B. Авторизация / ACL / IDOR
- [ ] Пройти по всем endpoints, поменять user_id в параметрах/GraphQL args.
- [ ] Проверить role-based access: права обычного юзера vs admin.
- [ ] Проверить RLS/DB policies, если используются (например Hasura).
- PoC: изменить id в URL/JSON и проверить доступность чужих записей.

### C. GraphQL
- [ ] Introspection (prod?) — отключена ли?
- [ ] Depth/complexity лимиты.
- [ ] Проверить приватные мутации и скрытые поля.
- [ ] Mass-assignment / input fields allowed on create/update.
- Инструменты: GraphQLmap, graphql-cli.

### D. API / REST
- [ ] Валидация входа (type/length/regex).
- [ ] JSON и multipart parsers (prototype pollution).
- [ ] Rate limiting per endpoint and per account/IP.
- [ ] Error handling — не выдает stack traces/секреты.
- Тулзы: httpx, nuclei, Burp, sqlmap.

### E. Injections
- [ ] SQL/NoSQL injection: payloads для всех вводов.
- [ ] Command injection: параметры, file paths.
- [ ] Template injection (server & client).
- Тулзы: sqlmap, manual payloads, tpl fuzz.

### F. XSS / CSP / Content Security
- [ ] Проверить отражённый, сохранённый, DOM-XSS.
- [ ] CSP есть? script-src, object-src, upgrade-insecure-requests.
- [ ] Cookie flags: Secure, HttpOnly, SameSite.
- Тулзы: Burp, DOM XSS scanner.

### G. SSRF / URL fetchers
- [ ] Найти все поля, принимающие URL.
- [ ] Попытки на internal IPs, 169.254.169.254, metadata endpoints.
- [ ] Host header abuse / open redirect chaining.

### H. File upload & parsing
- [ ] Проверить расширения, MIME sniffing, content-type validation.
- [ ] Проверить image processing libs (ImageMagick).
- [ ] Storage permissions (S3) — public buckets.
- Тулзы: ffuf, manual upload payloads.

### I. Infrastructure, CI/CD, Secrets
- [ ] Проверить Dockerfiles на креды, rootless, capability.
- [ ] Проверить .env files, config files, git history на ключи.
- [ ] Проверить CI logs / artifacts на секреты.
- Тулзы: truffleHog, git-secrets, trivy, trufflehog.

### J. Misc / Operational security
- [ ] Audit logging: integrity, retention, tamperability.
- [ ] Backup storage exposure.
- [ ] Rate limiting on WebSocket endpoints, push notifications.

---

## 5. Автоматизация и команды (примеры)
- Инвентарь API: `httpx -silent -g -l api-endpoints.txt -o endpoints.txt`
- Nuclei (шаблоны): `nuclei -l endpoints.txt -t user-templates/ -o nuclei-results.txt`
- SQLi quick: `sqlmap -u "https://target/api/users?id=1" --batch --dbs`
- GraphQL introspect: `graphql get-schema --endpoint https://target/graphql > schema.json`
- JWT quick: `curl -s -D- -H "Authorization: Bearer <token>" https://target/api/me`
- Secrets scan: `trufflehog filesystem --directory . --json`

---

## 6. Reporting / шаблон записи находки
- ID:
- Title:
- Endpoint / GraphQL mutation:
- PoC (curl/burp request):
- Impact:
- Steps to reproduce:
- Remediation:
- Risk:
- Attachments / логи:

---

## 7. Рекомендованные next-steps (порядок действий)
1. Выполнить критические тесты (Auth, JWT, rate-limit) вручную + автомат.
2. Провести GraphQL-fuzzing и мутации + отключить introspection в prod.
3. Провести dependency + container scan; исправить выявленные CVE.
4. Просканировать репозиторий и CI на секреты; при утечке — rotate keys.
5. Добавить в CI автоматизированные SCA и secret scanning; добавить регрессионные тесты безопасности.
6. Запустить red-team сценарии: XSS→impersonation, SSRF→internal access, GraphQL mutation abuse.

---

## 8. Примечания по правам и этике
- Тестирование выполнять только по авторизованной цели и с письменным согласием.
- Log all actions, keep audit trail, limit blast-radius.

---

## Состояние проверок (status)

| Раздел | Статус | Примечания |
|--------|--------|------------|
| A. Аутентификация и сессии | ⏳ | JWT token в localStorage, refresh не найден |
| B. Авторизация / ACL / IDOR | 🔴 Тестируется | RLS работает, но IDOR на мутациях не проверили |
| C. GraphQL | 🟡 Частично | Schema получена, мутации перечислены, fuzzing не сделан |
| D. API / REST | 🟡 Частично | Endpoints документированы, rate-limit проверен |
| E. Injections | 🟡 Частично | SQLi проверен — отбито, остальные не проверены |
| F. XSS / CSP | ⚪ Не проверено | DOM-XSS, CSP headers не анализировались |
| G. SSRF / URL fetchers | ⚪ Не проверено | fetch endpoints не тестировались |
| H. File upload & parsing | ⚪ Не проверено | upload endpoints не найдены |
| I. Infrastructure, CI/CD | ⚪ Не проверено | контейнеры, secrets, CI не анализировались |
| J. Misc / Operational | ⚪ Не проверено | логи, бэкапы, WebSocket rate-limit |
