# Security Audit Report

**Platform:** Tomorrow School (01.tomorrow-school.ai)  
**Date:** 2026-07-14  
**Researcher:** nbolat (userId=9652)  
**Type:** Grey-box assessment  

---

## Scope

- Web Application: SPA (Preact + Hasura GraphQL)
- API: GraphQL (Hasura) + REST
- Feature: Audit validation system (linear-stats module)
- Component: 5-character verification code

---

## Vulnerability Summary

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 High | 1 | Audit code RLS bypass? |
| 🟡 Medium | 3 | Rate limiting, JWT in localStorage, no audit mutations |
| 🟢 Low | 2 | GraphQL introspection enabled, chunked JS readable |
| ⬜ Info | 5 | Architecture findings |

---

## 1. 🔴 Audit Code Protection

**Risk:** RLS policy prevents non-auditor from reading code.  
**Impact:** Student cannot complete audit without auditor's token.  
**Recommendation:** Add code regeneration or manual override mechanism.

## 2. 🟡 Rate Limiting

**Risk:** No rate limiting on validation API.  
**Impact:** Possible brute-force (~70 req/sec).  
**Recommendation:** Implement rate limiting (10 req/sec per user).

## 3. 🟡 JWT in localStorage

**Risk:** Token stored in plaintext in localStorage.  
**Impact:** XSS vulnerability → token theft.  
**Recommendation:** Use httpOnly cookies for production.

## 4. 🟡 No Audit Mutations

**Risk:** Cannot modify audit through GraphQL.  
**Impact:** No bypass possible through direct DB manipulation.  
**Recommendation:** Add admin-level audit management mutations.

## 5. 🟢 GraphQL Introspection

**Risk:** Schema enumeration possible.  
**Impact:** Attackers can discover all tables/relationships.  
**Recommendation:** Disable introspection in production.

---

## Conclusion

The platform implements solid security through:
1. **RLS policies** — row-level security for sensitive data
2. **JWT HS256** — signed tokens
3. **No SQL injection** — parameterized queries
4. **No direct mutations** — audit can only be modified through API

Main weakness: **No rate limiting** makes brute-force theoretically possible.

**Overall Security Score: 7/10**
