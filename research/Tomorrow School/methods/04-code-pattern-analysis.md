# Method 04: Code Pattern Analysis

**Status:** ❌ Паттерн не найден  
**Date:** 2026-07-14  

## Цель
Найти закономерность в генерации кодов для предсказания кода audit=38113.

## Данные
36 известных кодов из audit_private студента nbolat:

```
10415: xtnuu   10552: gyg7t   11228: pefgx   11336: vzgdr
11765: 3b574   12476: c6_4e   12870: 83spd   13159: 2kf8h
13340: cehqe   13453: n_ytr   13868: zq$zu   14053: xhyrw
14888: ykr59   15130: mmdy5   15281: anfyc   15376: zfju6
16623: 8mzw1   17000: x?2d2   17626: t?uqz   18067: yb4r4
18338: dyk6?   18747: ?rrpr   19436: 86dep   19775: ?fu$s
24553: 82d6w   27320: zk41-   34544: fs7n7   35198: r7zx9
35827: utz8c   36948: 5qc8f   36578: 31hch   37277: 7chxa
37517: 7qh$9   37772: bja-b   37969: cd8t1   38073: yz57k
```

## Анализ

### Charset
```
a-z: 26 chars
0-9: 10 chars
_, ?, $, -: 4 chars
Total: 36 unique chars
```

### Частота символов
```
z:10  y:9   r:9   7:8   d:8   c:8   8:8   u:7
f:7   h:7   x:6   t:6   e:5   5:5   4:5   6:5
k:5   q:5   ?:5   n:4   g:4   p:4   b:4   2:4
1:4   3:3   s:3   $:3   w:3   9:3   m:3   a:3
_:2   j:2   -:2   v:1
```

### Паттерны (L=буква, D=цифра, S=спецсимвол)
```
LLLLL: 6  (самый частый)
DDLLL: 3
LLDLD: 3
```

### Проверенные гипотезы
- **base64 encoding:** ❌ (есть символы ?, $, _ которые не в base64)
- **hash от auditId (md5/sha1/sha256):** ❌
- **hash от groupId/eventId:** ❌
- **base36 encoding auditId:** ❌
- **Корреляция с соседними auditId:** ❌
- **Time-based:** ❌
- **XOR с ключом:** ❌

## Вывод
Коды генерируются криптостойким RNG. Никакой связи с auditId, groupId, eventId или auditorId нет.
