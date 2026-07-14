# Method 05: SQL / NoSQL Injection

**Status:** ❌ Не подвержен  
**Date:** 2026-07-14  

## Цель
Проверить validation API на SQL-инъекции.

## Тесты

### SQL Injection payloads
```
code=' OR 1=1--
code=" OR 1=1--
code=' UNION SELECT code FROM audit_private--
code=admin'--
code=1'--

```

### Результат
Все попытки возвращают:
```json
{"error":"Wrong audit code."}
```

## Вывод
Validation API не подвержен SQL-инъекциям. Код, вероятно, проверяется через parameterized query или прямым сравнением.
