# Useful GraphQL Queries

## Audit Info
```graphql
query {
  audit(where: {id: {_eq: 38113}}) {
    id grade auditorId auditorLogin groupId 
    private { code }  # null если не auditor
    result { id grade }
  }
}
```

## My Progress
```graphql
query {
  progress(where: {eventId: {_eq: 96}}) {
    id path grade isDone version
  }
}
```

## All Audit Codes (my own)
```graphql
query {
  audit_private {
    code
    audit { id auditorId groupId grade }
  }
}
```

## Group Info
```graphql
query {
  group(where: {id: {_eq: 10232}}) {
    id
    users { userId }
    audits { id auditorId grade }
  }
}
```

## Event Users
```graphql
query {
  event_user(where: {eventId: {_eq: 96}}) {
    userId userLogin level
    user { id login }
  }
}
```

## Schema Introspection
```graphql
query {
  __schema {
    queryType { fields { name description } }
    mutationType { fields { name description } }
    subscriptionType { fields { name description } }
  }
}
```
