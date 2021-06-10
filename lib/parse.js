/**
 * Module dependencies.
 */

let escape = require('escape-regexp');
let assert = require('assert');
const ObjectID = require('bson-objectid');

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Parse `str` to produce an AST.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

function parse(str) {
  str = '(' + str.trim() + ')';

  /**
   * expr
   */

  return expr();

  /**
   * Assert `expr`.
   */

  function error(expr, msg) {
    if (expr) return;
    let ctx = str.slice(0, 10);
    assert(0, msg + ' near `' + ctx + '`');
  }

  /**
   * '(' binop ')'
   */

  function expr() {
    error('(' == str[0], "missing opening '('");
    str = str.slice(1);

    let node = binop();

    error(')' == str[0], "missing closing ')'");
    str = str.slice(1);

    return node;
  }

  /**
   * field | expr
   */

  function primary() {
    return field() || expr();
  }

  /**
   * primary (OR|AND) binop
   */

  function binop() {
    let left = primary();

    let m = str.match(/^ *(OR|AND) */i);
    if (!m) return left;

    str = str.slice(m[0].length);

    let right = binop();

    return {
      type: 'op',
      op: m[1].toLowerCase(),
      left: left,
      right: right,
    };
  }

  /**
   * FIELD[:VALUE]
   */

  function field() {
    let val = true;
    let m = str.match(/^([-.\w]+)/);
    let aggregateVariable = str.match(/^\${2}([-.\w]+)/);

    m = m || aggregateVariable;

    if (!m && !aggregateVariable) return;

    let name = m[0];
    str = str.slice(name.length);

    m = str.match(/ *([:><!=]*) *([-*\w.]+|".*?"|'.*?'|\/(.*?)\/)(i?) */);

    // For mongo ObjectId
    let objId = str.match(/^ *([:><!=]*) ({[\n\r\s]*"\$oid": *"[0-9a-fA-F]{24}"[\n\r\s]*}) */);

    if (objId) {
      m = objId;
    }

    let cmp = null;
    if (m) {
      str = str.slice(m[0].length);
      val = m[2];

      cmp = comparison(m[1]);

      if (numeric(val)) val = parseFloat(val);
    }

    options = m && m[4] ? m[4] : null;

    if (objId) {
      objId = JSON.parse(val);
      val = ObjectID(objId.$oid);
    }

    if (aggregateVariable) {
      val = coerce(val, options);
      let aggregationFieldName = '$regexMatch';
      let input = name;
      let aggregationFieldValue = {
        input: input,
        regex: coerce(val, options),
      };
      if (typeof val == 'string') {
        aggregationFieldName = cmp ? `$${cmp}` : '$eq';
        aggregationFieldValue = [input, val];
        cmp = null;
      }

      name = aggregationFieldName;
      val = aggregationFieldValue;
    }

    let ret = {
      type: 'field',
      name: name,
      value: coerce(val, options),
    };

    if (cmp) ret.cmp = cmp;

    return ret;
  }
}

/**
 * Coerce `val`:
 *
 * - boolean strings to bools
 * - regexp notation to regexps
 * - quote-stripped strings
 */

function coerce(val, options) {
  if ('string' != typeof val) return val;

  // regexp
  if ('/' == val[0]) {
    val = val.slice(1, -1);
    if (options) {
      return new RegExp(val, options);
    }
    return new RegExp(val);
  }

  // boolean
  switch (val) {
    case 'true':
    case 'yes':
      return true;
    case 'false':
    case 'no':
      return false;
  }

  // quoted
  if (quoted(val)) {
    val = strip(val);
    let date = isDate(val);

    if (date) {
      return date;
    }
    return val;
  }

  // pattern
  if (~val.indexOf('*')) return pattern(val);

  // term
  return val;
}

/**
 * Convert pattern `str` to a regexp.
 */

function pattern(str) {
  str = escape(str).replace(/\\\*/g, '.*');
  return new RegExp('^' + str + '$');
}

/**
 * Check if `str` is quoted.
 */

function quoted(str) {
  return "'" == str[0] || '"' == str[0];
}

/**
 * Strip quotes from `str`.
 */

function strip(str) {
  return str.replace(/^['"]|['"]$/g, '');
}

/**
 * Check if `str` is numeric.
 */

function numeric(str) {
  return !isNaN(parseFloat(str));
}

/**
 * Check if `str` is a string.
 */
function isDate(str) {
  let m = str.match(/^(-?(?:[1-9][0-9]*)?[0-9]{4})-(1[0-2]|0[1-9])-(3[01]|0[1-9]|[12][0-9])T(2[0-3]|[01][0-9]):([0-5][0-9]):([0-5][0-9])(.[0-9]+)?(Z)?$/g);
  return !m ? false : new Date(m[0]);
}

/**
 * Return mongodb comparison operator.
 */

function comparison(str) {
  switch (str) {
    case '>':
      return 'gt';
    case '<':
      return 'lt';
    case '<=':
      return 'lte';
    case '>=':
      return 'gte';
    case '!=':
      return 'ne';
    default:
      return null;
  }
}
