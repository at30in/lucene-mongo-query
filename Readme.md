# Lucene Mongo Query

Lucene-inspired string-based mongodb query language for humans (and ferrets).

## Installation

```
$ npm install lucene-mongo-query
```

## Why?

1. Nicer UX for the odd search / log filtering
2. Writing JSON queries is a PITA

## Example

```js
var compile = require('monquery');
var str = 'level:error OR type:upload';
var query = compile(str);
```

## Querying

### Fields

Specify field names with optional values:

```js
level: error;
```

yields

```js
{
  level: 'error';
}
```

### Booleans

Omit value to imply **true**:

```js
failed;
```

yields

```js
{
  failed: true;
}
```

Or specify a boolean-ish value (true, false, yes, no):

```js
failed: no;
```

yields

```js
{
  failed: false;
}
```

### Datetime

Specify field with datetime (ISO-8601) value:

```
lastmodified < '2020-10-06T18:43:26.000Z'
```

### ObjectId

Specify field with $oid json notation value:

```
companies.id = {"$oid": "60b8f7f90f1aac77ed9db8c1"}
```

### Operators

Currently supports **AND** / **OR**, which may be nested:

```js
(level:error AND type:"upload failed") OR user.name.first:Tobi
```

yields

```js
{ '$or':
   [ { '$and': [ { level: 'error' }, { type: 'upload failed' } ] },
     { 'user.name.first': 'Tobi' } ] }
```

### Regular Expressions

Regexps may be used with the `//` syntax:

```js
level:info AND name:/^To/
```

yields

```js
{ '$and': [ { level: 'info' }, { name: /^To/ } ] }
```

case insensitive

```js
level:info AND name:/^To/i
```

```js
{ '$and': [ { level: 'info' }, { name: /^To/i } ] }
```

### Patterns

Wildcards may be used to generate regular expressions:

```js
level:error AND hostname:api-*
```

yields

```js
{ '$and': [ { level: 'error' }, { hostname: /^api-.*$/ } ] }
```

# License

MIT
