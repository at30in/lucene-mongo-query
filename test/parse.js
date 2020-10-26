var query = require('..');
var assert = require('assert');

describe('fields', function () {
  it('should support dots', function () {
    var ret = query.parse('user.name:Tobi');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'user.name',
      value: 'Tobi',
    });
  });

  it('should default to bool', function () {
    var ret = query.parse('failed');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'failed',
      value: true,
    });
  });

  it('should support values', function () {
    var ret = query.parse('level:error');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'level',
      value: 'error',
    });
  });

  it('should support booleans', function () {
    var ret = query.parse('removed:true');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'removed',
      value: true,
    });

    var ret = query.parse('removed:false');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'removed',
      value: false,
    });
  });

  it('should support yes/no booleans', function () {
    var ret = query.parse('removed:yes');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'removed',
      value: true,
    });

    var ret = query.parse('removed:no');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'removed',
      value: false,
    });
  });

  it('should support ints', function () {
    var ret = query.parse('count:5');
    assert(5 === ret.value);
  });

  it('should support floats', function () {
    var ret = query.parse('count:5.2');
    assert(5.2 === ret.value);
  });

  it('should support case insensitive', function () {
    var ret = query.parse('(hostname:/^regex value.*/i)');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'hostname',
      value: /^regex value.*/i,
    });
  });

  it('should support wildcards', function () {
    var ret = query.parse('hostname:api-*');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'hostname',
      value: /^api-.*$/,
    });
  });

  it('should support double-quoted values', function () {
    var ret = query.parse('type:"uploading item"');

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'type',
      value: 'uploading item',
    });
  });

  it('should support single-quoted values', function () {
    var ret = query.parse("type:'uploading item'");

    assert.deepStrictEqual(ret, {
      type: 'field',
      name: 'type',
      value: 'uploading item',
    });
  });
});

describe('AND', function () {
  it('should work', function () {
    var ret = query.parse('level:error AND type:upload');

    assert.deepStrictEqual(ret, {
      type: 'op',
      op: 'and',
      left: { type: 'field', name: 'level', value: 'error' },
      right: { type: 'field', name: 'type', value: 'upload' },
    });
  });
});

describe('OR', function () {
  it('should work', function () {
    var ret = query.parse('level:error OR type:upload');

    assert.deepStrictEqual(ret, {
      type: 'op',
      op: 'or',
      left: { type: 'field', name: 'level', value: 'error' },
      right: { type: 'field', name: 'type', value: 'upload' },
    });
  });
});

describe('ops', function () {
  it('should work when nested', function () {
    var ret = query.parse('(level:error AND type:upload) OR level:critical');

    assert.deepStrictEqual(ret, {
      type: 'op',
      op: 'or',
      left: { type: 'op', op: 'and', left: { type: 'field', name: 'level', value: 'error' }, right: { type: 'field', name: 'type', value: 'upload' } },
      right: { type: 'field', name: 'level', value: 'critical' },
    });
  });
});
