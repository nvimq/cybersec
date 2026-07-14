# GraphQL Mutations

## Insert Result
```graphql
mutation {
  insert_result_one(object: {
    eventId: 96
    objectId: 102427
    path: "/astanahub/module/linear-stats"
    version: "test"
  }) { id }
}
```
**Result:** ❌ Permission error (check constraint)

## Update Result
```graphql
mutation {
  update_result_by_pk(
    pk_columns: {id: 526333}
    _set: {attrs: "{}", version: "new-version"}
  ) { id }
}
```
**Result:** ⚠️ Только attrs и version

## Update User
```graphql
mutation {
  update_user_by_pk(
    pk_columns: {id: 9652}
    _set: {firstName: "Test"}
  ) { id login }
}
```
**Result:** ✅ Работает (свои данные)

## Insert Group User
```graphql
mutation {
  insert_group_user_one(object: {
    groupId: 10232
    userId: 9652
  }) { id }
}
```
