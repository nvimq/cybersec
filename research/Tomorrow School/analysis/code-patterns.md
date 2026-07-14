# Code Patterns Analysis

## Dataset
36 known codes from completed audits.

## Statistics

### Character Frequency (top)
```
z: 10   y: 9    r: 9    7: 8    d: 8    c: 8    8: 8
u: 7    f: 7    h: 7    x: 6    t: 6
```

### Pattern Frequency
```
LLLLL (all letters):    6
DDLLL (2dig+3let):      3
LLDLD (l-d-l-d-l):      3
LLLDL (l-l-l-d-l):      2
DLLDL (d-l-l-d-l):      2
```

### Special Chars Usage
```
?  : 5 раз
$  : 3 раза
_  : 2 раза
-  : 2 раза
```

### Position Analysis
| Position | Most Common |
|----------|-------------|
| 0 | '8', 'x', 'c' |
| 1 | 'k', 'q', 't' |
| 2 | 'h', 'f', 'd' |
| 3 | '7', '8', 'u' |
| 4 | 'r', '9', 'u' |

## Rejected Hypotheses

### ❌ Base64
- Codes contain `?`, `$`, `_`, `-` (не все в base64)
- Lowercase only (base64 использует A-Z, a-z, 0-9, +, /)

### ❌ Hash (md5/sha1/sha256)
- Проверены все комбинации auditId, groupId, eventId, auditorId
- Ни один hash первых 5 символов не совпал

### ❌ Mathematical transform
- Нет correlation между auditId и кодом
- Нет correlation между соседними auditId и кодами
- Base36, base40 не дали совпадений

### ❌ Time-based
- Коды не зависят от времени создания

## Conclusion
Коды генерируются через CSPRNG (Cryptographically Secure Pseudo-Random Number Generator). Шанс угадать: 1/36^5 ≈ 1.65×10⁻⁸ (0.00000165%).
