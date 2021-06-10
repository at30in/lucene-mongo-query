var query = require('..');
var assert = require('assert');
const { read } = require('fs');
const ObjectID = require('bson-objectid');

describe('fields', function () {
  it('should compile', function () {
    var ret = query('level:error');
    assert.deepStrictEqual(ret, { level: 'error' });
  });
});

describe('operators', function () {
  it('should compile', function () {
    var ret = query('level:error OR level:alert');
    assert.deepStrictEqual(ret, {
      $or: [{ level: 'error' }, { level: 'alert' }],
    });

    var ret = query('level: error OR level: alert');
    assert.deepStrictEqual(ret, {
      $or: [{ level: 'error' }, { level: 'alert' }],
    });
  });

  it('should compile when nested', function () {
    var ret = query('(level:error AND type:upload) OR type:alert');
    assert.deepStrictEqual(ret, {
      $or: [{ $and: [{ level: 'error' }, { type: 'upload' }] }, { type: 'alert' }],
    });
  });
});

describe('comparison', function () {
  it('should compile greater than', function () {
    var ret = query('level>5');
    assert.deepStrictEqual(ret, {
      level: { $gt: 5 },
    });

    var ret = query('level > 5');
    assert.deepStrictEqual(ret, {
      level: { $gt: 5 },
    });
  });

  it('should compile greater equal than', function () {
    var ret = query('level>=5');
    assert.deepStrictEqual(ret, {
      level: { $gte: 5 },
    });

    var ret = query('level >= 5');
    assert.deepStrictEqual(ret, {
      level: { $gte: 5 },
    });
  });

  it('should compile less than', function () {
    var ret = query('level<5');
    assert.deepStrictEqual(ret, {
      level: { $lt: 5 },
    });

    var ret = query('level < 5');
    assert.deepStrictEqual(ret, {
      level: { $lt: 5 },
    });
  });

  it('should compile less equal than', function () {
    var ret = query('level<=5');
    assert.deepStrictEqual(ret, {
      level: { $lte: 5 },
    });

    var ret = query('level <= 5');
    assert.deepStrictEqual(ret, {
      level: { $lte: 5 },
    });
  });

  it('should compile not equal', function () {
    let ret = query('level!=5');
    assert.deepStrictEqual(ret, {
      level: { $ne: 5 },
    });

    ret = query('level != 5');
    assert.deepStrictEqual(ret, {
      level: { $ne: 5 },
    });

    ret = query('$$companies.name == name');
    assert.deepStrictEqual(ret, { $eq: ['$$companies.name', 'name'] });

    ret = query('$$companies.name != name');
    assert.deepStrictEqual(ret, { $ne: ['$$companies.name', 'name'] });
  });

  it('should compile nested', function () {
    var ret = query('(age > 20 AND age < 50) OR gender:male');
    assert.deepStrictEqual(ret, {
      $or: [{ $and: [{ age: { $gt: 20 } }, { age: { $lt: 50 } }] }, { gender: 'male' }],
    });
  });
});

describe('regex with option insensitive', function () {
  it('should compile', function () {
    var ret = query('(hostname:/^regex value.*/i)');
    assert.deepStrictEqual(ret, { hostname: /^regex value.*/i });
  });
});

describe('regex mongo aggregation variable (use $$)', function () {
  it('should compile', function () {
    var ret = query('($$companies.name:/^name.*/i AND $$companies.vat:/^vat.*/i)');
    assert.deepStrictEqual(ret, {
      $and: [
        {
          $regexMatch: {
            input: '$$companies.name',
            regex: /^name.*/i,
          },
        },
        {
          $regexMatch: {
            input: '$$companies.vat',
            regex: /^vat.*/i,
          },
        },
      ],
    });
  });
});

describe('mongo aggregation variable (use $$)', function () {
  it('should compile', function () {
    var ret = query('($$companies.name:name AND $$companies.vat:vat)');
    assert.deepStrictEqual(ret, {
      $and: [
        {
          $eq: ['$$companies.name', 'name'],
        },
        {
          $eq: ['$$companies.vat', 'vat'],
        },
      ],
    });
  });
});

describe('id convert ObjectId', function () {
  it('single operator ObjectId', function () {
    const ret = query(`companies.id = {"$oid": "5de937ba34f907002406af7a"}`);

    assert.deepStrictEqual(ret, { 'companies.id': ObjectID('5de937ba34f907002406af7a') });
  });

  it('ObjectId with others operator', function () {
    const ret = query(`companies.vat = '00000' OR (companies.id = {"$oid": "5de937ba34f907002406af7a"} AND companies.name = 'name')`);

    let test = {
      $or: [
        { 'companies.vat': '00000' },
        {
          $and: [
            {
              'companies.id': ObjectID('5de937ba34f907002406af7a'),
            },
            { 'companies.name': 'name' },
          ],
        },
      ],
    };

    assert.deepStrictEqual(ret, test);
  });
});
