/*! ssci v1.3.1 
 *  JavaScript smoothing, seasonal and regression functions 
 *  2019-04-13 
 *  License: MIT 
 *  Copyright (C) 2018 Simon West
 */

/*
 *  big.js v5.2.2
 *  A small, fast, easy-to-use library for arbitrary-precision decimal arithmetic.
 *  Copyright (c) 2018 Michael Mclaughlin <M8ch88l@gmail.com>
 *  https://github.com/MikeMcl/big.js/LICENCE
 */
;(function (GLOBAL) {
  'use strict';
  var Big,


/************************************** EDITABLE DEFAULTS *****************************************/


    // The default values below must be integers within the stated ranges.

    /*
     * The maximum number of decimal places (DP) of the results of operations involving division:
     * div and sqrt, and pow with negative exponents.
     */
    DP = 120,          // 0 to MAX_DP

    /*
     * The rounding mode (RM) used when rounding to the above decimal places.
     *
     *  0  Towards zero (i.e. truncate, no rounding).       (ROUND_DOWN)
     *  1  To nearest neighbour. If equidistant, round up.  (ROUND_HALF_UP)
     *  2  To nearest neighbour. If equidistant, to even.   (ROUND_HALF_EVEN)
     *  3  Away from zero.                                  (ROUND_UP)
     */
    RM = 1,             // 0, 1, 2 or 3

    // The maximum value of DP and Big.DP.
    MAX_DP = 1E6,       // 0 to 1000000

    // The maximum magnitude of the exponent argument to the pow method.
    MAX_POWER = 1E6,    // 1 to 1000000

    /*
     * The negative exponent (NE) at and beneath which toString returns exponential notation.
     * (JavaScript numbers: -7)
     * -1000000 is the minimum recommended exponent value of a Big.
     */
    NE = -7,            // 0 to -1000000

    /*
     * The positive exponent (PE) at and above which toString returns exponential notation.
     * (JavaScript numbers: 21)
     * 1000000 is the maximum recommended exponent value of a Big.
     * (This limit is not enforced or checked.)
     */
    PE = 21,            // 0 to 1000000


/**************************************************************************************************/


    // Error messages.
    NAME = '[big.js] ',
    INVALID = NAME + 'Invalid ',
    INVALID_DP = INVALID + 'decimal places',
    INVALID_RM = INVALID + 'rounding mode',
    DIV_BY_ZERO = NAME + 'Division by zero',

    // The shared prototype object.
    P = {},
    UNDEFINED = void 0,
    NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;


  /*
   * Create and return a Big constructor.
   *
   */
  function _Big_() {

    /*
     * The Big constructor and exported function.
     * Create and return a new instance of a Big number object.
     *
     * n {number|string|Big} A numeric value.
     */
    function Big(n) {
      var x = this;

      // Enable constructor usage without new.
      if (!(x instanceof Big)) return n === UNDEFINED ? _Big_() : new Big(n);

      // Duplicate.
      if (n instanceof Big) {
        x.s = n.s;
        x.e = n.e;
        x.c = n.c.slice();
      } else {
        parse(x, n);
      }

      /*
       * Retain a reference to this Big constructor, and shadow Big.prototype.constructor which
       * points to Object.
       */
      x.constructor = Big;
    }

    Big.prototype = P;
    Big.DP = DP;
    Big.RM = RM;
    Big.NE = NE;
    Big.PE = PE;
    Big.version = '5.2.2';

    return Big;
  }


  /*
   * Parse the number or string value passed to a Big constructor.
   *
   * x {Big} A Big number instance.
   * n {number|string} A numeric value.
   */
  function parse(x, n) {
    var e, i, nl;

    // Minus zero?
    if (n === 0 && 1 / n < 0) n = '-0';
    else if (!NUMERIC.test(n += '')) throw Error(INVALID + 'number');

    // Determine sign.
    x.s = n.charAt(0) == '-' ? (n = n.slice(1), -1) : 1;

    // Decimal point?
    if ((e = n.indexOf('.')) > -1) n = n.replace('.', '');

    // Exponential form?
    if ((i = n.search(/e/i)) > 0) {

      // Determine exponent.
      if (e < 0) e = i;
      e += +n.slice(i + 1);
      n = n.substring(0, i);
    } else if (e < 0) {

      // Integer.
      e = n.length;
    }

    nl = n.length;

    // Determine leading zeros.
    for (i = 0; i < nl && n.charAt(i) == '0';) ++i;

    if (i == nl) {

      // Zero.
      x.c = [x.e = 0];
    } else {

      // Determine trailing zeros.
      for (; nl > 0 && n.charAt(--nl) == '0';);
      x.e = e - i - 1;
      x.c = [];

      // Convert string to array of digits without leading/trailing zeros.
      for (e = 0; i <= nl;) x.c[e++] = +n.charAt(i++);
    }

    return x;
  }


  /*
   * Round Big x to a maximum of dp decimal places using rounding mode rm.
   * Called by stringify, P.div, P.round and P.sqrt.
   *
   * x {Big} The Big to round.
   * dp {number} Integer, 0 to MAX_DP inclusive.
   * rm {number} 0, 1, 2 or 3 (DOWN, HALF_UP, HALF_EVEN, UP)
   * [more] {boolean} Whether the result of division was truncated.
   */
  function round(x, dp, rm, more) {
    var xc = x.c,
      i = x.e + dp + 1;

    if (i < xc.length) {
      if (rm === 1) {

        // xc[i] is the digit after the digit that may be rounded up.
        more = xc[i] >= 5;
      } else if (rm === 2) {
        more = xc[i] > 5 || xc[i] == 5 &&
          (more || i < 0 || xc[i + 1] !== UNDEFINED || xc[i - 1] & 1);
      } else if (rm === 3) {
        more = more || !!xc[0];
      } else {
        more = false;
        if (rm !== 0) throw Error(INVALID_RM);
      }

      if (i < 1) {
        xc.length = 1;

        if (more) {

          // 1, 0.1, 0.01, 0.001, 0.0001 etc.
          x.e = -dp;
          xc[0] = 1;
        } else {

          // Zero.
          xc[0] = x.e = 0;
        }
      } else {

        // Remove any digits after the required decimal places.
        xc.length = i--;

        // Round up?
        if (more) {

          // Rounding up may mean the previous digit has to be rounded up.
          for (; ++xc[i] > 9;) {
            xc[i] = 0;
            if (!i--) {
              ++x.e;
              xc.unshift(1);
            }
          }
        }

        // Remove trailing zeros.
        for (i = xc.length; !xc[--i];) xc.pop();
      }
    } else if (rm < 0 || rm > 3 || rm !== ~~rm) {
      throw Error(INVALID_RM);
    }

    return x;
  }


  /*
   * Return a string representing the value of Big x in normal or exponential notation.
   * Handles P.toExponential, P.toFixed, P.toJSON, P.toPrecision, P.toString and P.valueOf.
   *
   * x {Big}
   * id? {number} Caller id.
   *         1 toExponential
   *         2 toFixed
   *         3 toPrecision
   *         4 valueOf
   * n? {number|undefined} Caller's argument.
   * k? {number|undefined}
   */
  function stringify(x, id, n, k) {
    var e, s,
      Big = x.constructor,
      z = !x.c[0];

    if (n !== UNDEFINED) {
      if (n !== ~~n || n < (id == 3) || n > MAX_DP) {
        throw Error(id == 3 ? INVALID + 'precision' : INVALID_DP);
      }

      x = new Big(x);

      // The index of the digit that may be rounded up.
      n = k - x.e;

      // Round?
      if (x.c.length > ++k) round(x, n, Big.RM);

      // toFixed: recalculate k as x.e may have changed if value rounded up.
      if (id == 2) k = x.e + n + 1;

      // Append zeros?
      for (; x.c.length < k;) x.c.push(0);
    }

    e = x.e;
    s = x.c.join('');
    n = s.length;

    // Exponential notation?
    if (id != 2 && (id == 1 || id == 3 && k <= e || e <= Big.NE || e >= Big.PE)) {
      s = s.charAt(0) + (n > 1 ? '.' + s.slice(1) : '') + (e < 0 ? 'e' : 'e+') + e;

    // Normal notation.
    } else if (e < 0) {
      for (; ++e;) s = '0' + s;
      s = '0.' + s;
    } else if (e > 0) {
      if (++e > n) for (e -= n; e--;) s += '0';
      else if (e < n) s = s.slice(0, e) + '.' + s.slice(e);
    } else if (n > 1) {
      s = s.charAt(0) + '.' + s.slice(1);
    }

    return x.s < 0 && (!z || id == 4) ? '-' + s : s;
  }


  // Prototype/instance methods


  /*
   * Return a new Big whose value is the absolute value of this Big.
   */
  P.abs = function () {
    var x = new this.constructor(this);
    x.s = 1;
    return x;
  };


  /*
   * Return 1 if the value of this Big is greater than the value of Big y,
   *       -1 if the value of this Big is less than the value of Big y, or
   *        0 if they have the same value.
  */
  P.cmp = function (y) {
    var isneg,
      x = this,
      xc = x.c,
      yc = (y = new x.constructor(y)).c,
      i = x.s,
      j = y.s,
      k = x.e,
      l = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) return !xc[0] ? !yc[0] ? 0 : -j : i;

    // Signs differ?
    if (i != j) return i;

    isneg = i < 0;

    // Compare exponents.
    if (k != l) return k > l ^ isneg ? 1 : -1;

    j = (k = xc.length) < (l = yc.length) ? k : l;

    // Compare digit by digit.
    for (i = -1; ++i < j;) {
      if (xc[i] != yc[i]) return xc[i] > yc[i] ^ isneg ? 1 : -1;
    }

    // Compare lengths.
    return k == l ? 0 : k > l ^ isneg ? 1 : -1;
  };


  /*
   * Return a new Big whose value is the value of this Big divided by the value of Big y, rounded,
   * if necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.div = function (y) {
    var x = this,
      Big = x.constructor,
      a = x.c,                  // dividend
      b = (y = new Big(y)).c,   // divisor
      k = x.s == y.s ? 1 : -1,
      dp = Big.DP;

    if (dp !== ~~dp || dp < 0 || dp > MAX_DP) throw Error(INVALID_DP);

    // Divisor is zero?
    if (!b[0]) throw Error(DIV_BY_ZERO);

    // Dividend is 0? Return +-0.
    if (!a[0]) return new Big(k * 0);

    var bl, bt, n, cmp, ri,
      bz = b.slice(),
      ai = bl = b.length,
      al = a.length,
      r = a.slice(0, bl),   // remainder
      rl = r.length,
      q = y,                // quotient
      qc = q.c = [],
      qi = 0,
      d = dp + (q.e = x.e - y.e) + 1;    // number of digits of the result

    q.s = k;
    k = d < 0 ? 0 : d;

    // Create version of divisor with leading zero.
    bz.unshift(0);

    // Add zeros to make remainder as long as divisor.
    for (; rl++ < bl;) r.push(0);

    do {

      // n is how many times the divisor goes into current remainder.
      for (n = 0; n < 10; n++) {

        // Compare divisor and remainder.
        if (bl != (rl = r.length)) {
          cmp = bl > rl ? 1 : -1;
        } else {
          for (ri = -1, cmp = 0; ++ri < bl;) {
            if (b[ri] != r[ri]) {
              cmp = b[ri] > r[ri] ? 1 : -1;
              break;
            }
          }
        }

        // If divisor < remainder, subtract divisor from remainder.
        if (cmp < 0) {

          // Remainder can't be more than 1 digit longer than divisor.
          // Equalise lengths using divisor with extra leading zero?
          for (bt = rl == bl ? b : bz; rl;) {
            if (r[--rl] < bt[rl]) {
              ri = rl;
              for (; ri && !r[--ri];) r[ri] = 9;
              --r[ri];
              r[rl] += 10;
            }
            r[rl] -= bt[rl];
          }

          for (; !r[0];) r.shift();
        } else {
          break;
        }
      }

      // Add the digit n to the result array.
      qc[qi++] = cmp ? n : ++n;

      // Update the remainder.
      if (r[0] && cmp) r[rl] = a[ai] || 0;
      else r = [a[ai]];

    } while ((ai++ < al || r[0] !== UNDEFINED) && k--);

    // Leading zero? Do not remove if result is simply zero (qi == 1).
    if (!qc[0] && qi != 1) {

      // There can't be more than one zero.
      qc.shift();
      q.e--;
    }

    // Round?
    if (qi > d) round(q, dp, Big.RM, r[0] !== UNDEFINED);

    return q;
  };


  /*
   * Return true if the value of this Big is equal to the value of Big y, otherwise return false.
   */
  P.eq = function (y) {
    return !this.cmp(y);
  };


  /*
   * Return true if the value of this Big is greater than the value of Big y, otherwise return
   * false.
   */
  P.gt = function (y) {
    return this.cmp(y) > 0;
  };


  /*
   * Return true if the value of this Big is greater than or equal to the value of Big y, otherwise
   * return false.
   */
  P.gte = function (y) {
    return this.cmp(y) > -1;
  };


  /*
   * Return true if the value of this Big is less than the value of Big y, otherwise return false.
   */
  P.lt = function (y) {
    return this.cmp(y) < 0;
  };


  /*
   * Return true if the value of this Big is less than or equal to the value of Big y, otherwise
   * return false.
   */
  P.lte = function (y) {
    return this.cmp(y) < 1;
  };


  /*
   * Return a new Big whose value is the value of this Big minus the value of Big y.
   */
  P.minus = P.sub = function (y) {
    var i, j, t, xlty,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.plus(y);
    }

    var xc = x.c.slice(),
      xe = x.e,
      yc = y.c,
      ye = y.e;

    // Either zero?
    if (!xc[0] || !yc[0]) {

      // y is non-zero? x is non-zero? Or both are zero.
      return yc[0] ? (y.s = -b, y) : new Big(xc[0] ? x : 0);
    }

    // Determine which is the bigger number. Prepend zeros to equalise exponents.
    if (a = xe - ye) {

      if (xlty = a < 0) {
        a = -a;
        t = xc;
      } else {
        ye = xe;
        t = yc;
      }

      t.reverse();
      for (b = a; b--;) t.push(0);
      t.reverse();
    } else {

      // Exponents equal. Check digit by digit.
      j = ((xlty = xc.length < yc.length) ? xc : yc).length;

      for (a = b = 0; b < j; b++) {
        if (xc[b] != yc[b]) {
          xlty = xc[b] < yc[b];
          break;
        }
      }
    }

    // x < y? Point xc to the array of the bigger number.
    if (xlty) {
      t = xc;
      xc = yc;
      yc = t;
      y.s = -y.s;
    }

    /*
     * Append zeros to xc if shorter. No need to add zeros to yc if shorter as subtraction only
     * needs to start at yc.length.
     */
    if ((b = (j = yc.length) - (i = xc.length)) > 0) for (; b--;) xc[i++] = 0;

    // Subtract yc from xc.
    for (b = i; j > a;) {
      if (xc[--j] < yc[j]) {
        for (i = j; i && !xc[--i];) xc[i] = 9;
        --xc[i];
        xc[j] += 10;
      }

      xc[j] -= yc[j];
    }

    // Remove trailing zeros.
    for (; xc[--b] === 0;) xc.pop();

    // Remove leading zeros and adjust exponent accordingly.
    for (; xc[0] === 0;) {
      xc.shift();
      --ye;
    }

    if (!xc[0]) {

      // n - n = +0
      y.s = 1;

      // Result must be zero.
      xc = [ye = 0];
    }

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a new Big whose value is the value of this Big modulo the value of Big y.
   */
  P.mod = function (y) {
    var ygtx,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    if (!y.c[0]) throw Error(DIV_BY_ZERO);

    x.s = y.s = 1;
    ygtx = y.cmp(x) == 1;
    x.s = a;
    y.s = b;

    if (ygtx) return new Big(x);

    a = Big.DP;
    b = Big.RM;
    Big.DP = Big.RM = 0;
    x = x.div(y);
    Big.DP = a;
    Big.RM = b;

    return this.minus(x.times(y));
  };


  /*
   * Return a new Big whose value is the value of this Big plus the value of Big y.
   */
  P.plus = P.add = function (y) {
    var t,
      x = this,
      Big = x.constructor,
      a = x.s,
      b = (y = new Big(y)).s;

    // Signs differ?
    if (a != b) {
      y.s = -b;
      return x.minus(y);
    }

    var xe = x.e,
      xc = x.c,
      ye = y.e,
      yc = y.c;

    // Either zero? y is non-zero? x is non-zero? Or both are zero.
    if (!xc[0] || !yc[0]) return yc[0] ? y : new Big(xc[0] ? x : a * 0);

    xc = xc.slice();

    // Prepend zeros to equalise exponents.
    // Note: reverse faster than unshifts.
    if (a = xe - ye) {
      if (a > 0) {
        ye = xe;
        t = yc;
      } else {
        a = -a;
        t = xc;
      }

      t.reverse();
      for (; a--;) t.push(0);
      t.reverse();
    }

    // Point xc to the longer array.
    if (xc.length - yc.length < 0) {
      t = yc;
      yc = xc;
      xc = t;
    }

    a = yc.length;

    // Only start adding at yc.length - 1 as the further digits of xc can be left as they are.
    for (b = 0; a; xc[a] %= 10) b = (xc[--a] = xc[a] + yc[a] + b) / 10 | 0;

    // No need to check for zero, as +x + +y != 0 && -x + -y != 0

    if (b) {
      xc.unshift(b);
      ++ye;
    }

    // Remove trailing zeros.
    for (a = xc.length; xc[--a] === 0;) xc.pop();

    y.c = xc;
    y.e = ye;

    return y;
  };


  /*
   * Return a Big whose value is the value of this Big raised to the power n.
   * If n is negative, round to a maximum of Big.DP decimal places using rounding
   * mode Big.RM.
   *
   * n {number} Integer, -MAX_POWER to MAX_POWER inclusive.
   */
  P.pow = function (n) {
    var x = this,
      one = new x.constructor(1),
      y = one,
      isneg = n < 0;

    if (n !== ~~n || n < -MAX_POWER || n > MAX_POWER) throw Error(INVALID + 'exponent');
    if (isneg) n = -n;

    for (;;) {
      if (n & 1) y = y.times(x);
      n >>= 1;
      if (!n) break;
      x = x.times(x);
    }

    return isneg ? one.div(y) : y;
  };


  /*
   * Return a new Big whose value is the value of this Big rounded using rounding mode rm
   * to a maximum of dp decimal places, or, if dp is negative, to an integer which is a
   * multiple of 10**-dp.
   * If dp is not specified, round to 0 decimal places.
   * If rm is not specified, use Big.RM.
   *
   * dp? {number} Integer, -MAX_DP to MAX_DP inclusive.
   * rm? 0, 1, 2 or 3 (ROUND_DOWN, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_UP)
   */
  P.round = function (dp, rm) {
    var Big = this.constructor;
    if (dp === UNDEFINED) dp = 0;
    else if (dp !== ~~dp || dp < -MAX_DP || dp > MAX_DP) throw Error(INVALID_DP);
    return round(new Big(this), dp, rm === UNDEFINED ? Big.RM : rm);
  };


  /*
   * Return a new Big whose value is the square root of the value of this Big, rounded, if
   * necessary, to a maximum of Big.DP decimal places using rounding mode Big.RM.
   */
  P.sqrt = function () {
    var r, c, t,
      x = this,
      Big = x.constructor,
      s = x.s,
      e = x.e,
      half = new Big(0.5);

    // Zero?
    if (!x.c[0]) return new Big(x);

    // Negative?
    if (s < 0) throw Error(NAME + 'No square root');

    // Estimate.
    s = Math.sqrt(x + '');

    // Math.sqrt underflow/overflow?
    // Re-estimate: pass x coefficient to Math.sqrt as integer, then adjust the result exponent.
    if (s === 0 || s === 1 / 0) {
      c = x.c.join('');
      if (!(c.length + e & 1)) c += '0';
      s = Math.sqrt(c);
      e = ((e + 1) / 2 | 0) - (e < 0 || e & 1);
      r = new Big((s == 1 / 0 ? '1e' : (s = s.toExponential()).slice(0, s.indexOf('e') + 1)) + e);
    } else {
      r = new Big(s);
    }

    e = r.e + (Big.DP += 4);

    // Newton-Raphson iteration.
    do {
      t = r;
      r = half.times(t.plus(x.div(t)));
    } while (t.c.slice(0, e).join('') !== r.c.slice(0, e).join(''));

    return round(r, Big.DP -= 4, Big.RM);
  };


  /*
   * Return a new Big whose value is the value of this Big times the value of Big y.
   */
  P.times = P.mul = function (y) {
    var c,
      x = this,
      Big = x.constructor,
      xc = x.c,
      yc = (y = new Big(y)).c,
      a = xc.length,
      b = yc.length,
      i = x.e,
      j = y.e;

    // Determine sign of result.
    y.s = x.s == y.s ? 1 : -1;

    // Return signed 0 if either 0.
    if (!xc[0] || !yc[0]) return new Big(y.s * 0);

    // Initialise exponent of result as x.e + y.e.
    y.e = i + j;

    // If array xc has fewer digits than yc, swap xc and yc, and lengths.
    if (a < b) {
      c = xc;
      xc = yc;
      yc = c;
      j = a;
      a = b;
      b = j;
    }

    // Initialise coefficient array of result with zeros.
    for (c = new Array(j = a + b); j--;) c[j] = 0;

    // Multiply.

    // i is initially xc.length.
    for (i = b; i--;) {
      b = 0;

      // a is yc.length.
      for (j = a + i; j > i;) {

        // Current sum of products at this digit position, plus carry.
        b = c[j] + yc[i] * xc[j - i - 1] + b;
        c[j--] = b % 10;

        // carry
        b = b / 10 | 0;
      }

      c[j] = (c[j] + b) % 10;
    }

    // Increment result exponent if there is a final carry, otherwise remove leading zero.
    if (b) ++y.e;
    else c.shift();

    // Remove trailing zeros.
    for (i = c.length; !c[--i];) c.pop();
    y.c = c;

    return y;
  };


  /*
   * Return a string representing the value of this Big in exponential notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   */
  P.toExponential = function (dp) {
    return stringify(this, 1, dp, dp);
  };


  /*
   * Return a string representing the value of this Big in normal notation to dp fixed decimal
   * places and rounded using Big.RM.
   *
   * dp? {number} Integer, 0 to MAX_DP inclusive.
   *
   * (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
   * (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
   */
  P.toFixed = function (dp) {
    return stringify(this, 2, dp, this.e + dp);
  };


  /*
   * Return a string representing the value of this Big rounded to sd significant digits using
   * Big.RM. Use exponential notation if sd is less than the number of digits necessary to represent
   * the integer part of the value in normal notation.
   *
   * sd {number} Integer, 1 to MAX_DP inclusive.
   */
  P.toPrecision = function (sd) {
    return stringify(this, 3, sd, sd - 1);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Omit the sign for negative zero.
   */
  P.toString = function () {
    return stringify(this);
  };


  /*
   * Return a string representing the value of this Big.
   * Return exponential notation if this Big has a positive exponent equal to or greater than
   * Big.PE, or a negative exponent equal to or less than Big.NE.
   * Include the sign for negative zero.
   */
  P.valueOf = P.toJSON = function () {
    return stringify(this, 4);
  };


  // Export


  Big = _Big_();

  Big['default'] = Big.Big = Big;

  //AMD.
  if (typeof define === 'function' && define.amd) {
    define(function () { return Big; });

  // Node and other CommonJS-like environments that support module.exports.
  } else if (typeof module !== 'undefined' && module.exports) {
    module.exports = Big;

  //Browser.
  } else {
    GLOBAL.Big = Big;
  }
})(this);

/*! ssci v1.3.1 
 *  JavaScript smoothing, seasonal and regression functions 
 *  2019-04-13 
 *  License: MIT 
 *  Copyright (C) 2018 Simon West
 */



var ssci = (function(){
  'use strict';
  
//This library requires big.js - https://github.com/MikeMcl/big.js/ - used in regPolyBig, determinantBig and smoothQuadraticBig

var ssci = ssci || {};
ssci.smooth = {};
ssci.season = {};
ssci.reg    = {};
ssci.fore   = {};
ssci.ts     = {};

/**
 * Exponential smoothing - smooth a series of points
 * Points passed in via the .data() function
 * Calculates the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.expon = function(){
    var data = [];
    var numPoints = 0;
    var output = [];
    var resids = [];
    var sumsq=0;
    var factor = 0.3;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    function retVar(){
        var i;
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Calculate forecasts
        for(i=1;i<(numPoints+1);i++){
            if(i<2){
                output.push([dataArray[i][0], dataArray[i-1][1]]);
            } else if(i===numPoints){
                //Should I check for a date in the x-axis?
                //x value is one period on from the last period
                output.push([+dataArray[i-1][0]+(+dataArray[i-1][0]-dataArray[i-2][0]), dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
            } else {
                output.push([dataArray[i][0], dataArray[i-1][1]*factor + output[i-2][1]*(1-factor)]);
            }
        }
        
        //Calculate residuals
        for(i=1;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i-1][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i-1][1],2);
        }
    }
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing function
     */
    retVar.data = function(value){
        data = value;
        return retVar;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    retVar.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        
        factor = value;
        
        return retVar;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){
        return output;
    };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){
        return resids;
    };
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    return retVar;
};

/**
 * Holt's Exponential Smoothing
 * @returns {object} Object containing the forecast points, the residuals, the sum of squares of the residuals and the factor
 */
ssci.fore.holt = function(){
    var data = [];
    var dataArray = [];
    var numPoints = 0;
    var output = [];
    var resids = [];
    var sumsq  = 0;
    var factor = 0.3;
    var trend  = 0.3;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var l=[];
    var t=[];
    var funcs_T = {
        '1': t1,
        '2': t2,
        '3': t3,
        '4': t4
    };
    var funcT = '1';    //Function to use to calculate the starting value of 

    /**
     * Initial average difference between first three pairs of points
     */
    function t1(){
        return (1/3)*(dataArray[1][1]-dataArray[0][1])+(dataArray[2][1]-dataArray[1][1])+(dataArray[3][1]-dataArray[2][1]);
    }
    /**
     * Calculate trend for entire series and multiply by average distance between points
     */
    function t2(){
        return ssci.reg.polyBig(dataArray,1).constants[1] * ((dataArray[numPoints-1][0]-dataArray[0][0])/(numPoints-1));
    }
    /**
     * Trend for first to second point
     */
    function t3(){
        return dataArray[1][1]-dataArray[0][1];
    }
    /**
     * Trend between first and last point
     */
    function t4(){
        return (dataArray[numPoints-1][1]-dataArray[0][1])/(numPoints-1);
    }
    
    function retVar(){
        var i;
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Push first value to dataArray
        output.push(dataArray[0]);
        
        //Generate starting value for l - first value of dataArray
        if(l.length===0){
            l.push(dataArray[0][1]);
        }
        
        //Generate starting value for t - initial average difference between first three pairs of points
        if(t.length===0){
            t.push(funcs_T[funcT]);
        }
        
        //Calculate new values for level, trend and forecast
        for(i=1;i<(numPoints);i++){
            l.push(factor*dataArray[i][1]+(1-factor)*(l[i-1]+t[i-1]));
            t.push(trend*(l[i]-l[i-1])+(1-trend)*t[i-1]);
            //Create forecasts - current forecast is based on last periods estimates of l(evel) and t(rend)
            output.push([dataArray[i][0], l[i-1]+t[i-1]]);
        }
        
        //Calculate residuals
        sumsq=0;
        for(i=1;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i][1],2);
        }
        
    }
    
    /**
     * Get or set the initial value for the level
     * @param {number} [value] - The value for the level
     * @returns Either the value for the level or the enclosing object
     */
    retVar.initialLevel = function(value){
        if(!arguments.length){ return l[0]; }
        l = [];
        
        l.push(value);
        
        return retVar;
    };
    
    /**
     * Get or set the initial value for the trend
     * @param {number} [value] - The value for the trend
     * @returns Either the value for the trend or the enclosing object
     */
    retVar.initialTrend = function(value){
        if(!arguments.length){ return t[0]; }
        t = [];
        
        t.push(value);
        
        return retVar;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    retVar.data = function(value){
        data = value;
        return retVar;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    retVar.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return retVar;
        }
        
        factor = value;
        
        return retVar;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){
        return output;
    };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){
        return resids;
    };

    /**
     * Returns the sum of squares of the residuals
     * @returns The sum of squares of the residuals
     */
    retVar.sumSquares = function(){
        return sumsq;
    };
    
    /**
     * Provide or get the trend factor
     * @param {number} [value] - The trend factor
     * @returns If no parameter is passed in then the current trend value. Otherwise it will return the enclosing object.
     */
    retVar.trend = function(value){
        if(!arguments.length){ return trend; }
        
        //Check that trend factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Trend factor appears to not be a number - changed to 0.3');
            trend=0.3;
            return retVar;
        }
        if(value>1 || value<0){
            console.log('Trend >1 or <0 - changed to 0.3');
            trend=0.3;
            return retVar;
        }
    
        trend = value;
    
        return retVar;
    };
    
    /**
     * Provide a forecast of the function
     * @param {number} [d] - The number of time units to forecast ahead. If the data is monthly then 2 is 2 months.
     * @returns The forecast
     */
    retVar.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        //d=1 means one unit of time ahead. If the data is monthly, then d is in months
        var temp = l[l.length-1]+d*t[t.length-1];
        return temp;
    };

    /**
     * Specify the function to calculate the initial trend value
     * @param {'1' | '2' | '3' | '4'} [value='1'] - The function to calculate the initial value for the trend. The default is the average difference between the first 3 points
     * @returns If no parameter is provided then the function type is provided otherwise the enclosing object is returned.
     */
    retVar.initialTrendCalculation = function(value){
        if(!arguments.length){ return funcT; }
        //Check that the function is valid
        if(typeof funcs_T[value] !== 'function'){
            throw new Error('Invalid function');
        }
        
        funcT = value;
        
        return retVar;
    };
    
    return retVar;
};

/**
 * Holt Winters exponential smoothing
 * @return {object} Object containing the forecast points, the residuals, the sum of squares of the residuals etc.
 */
ssci.fore.holtWinter = function(){
    var data = [];
    var dataArray = [];
    var factor = 0.3;
    var trend = 0.3;
    var season = 0.3;
    var period = 12;
    var sumsq=0;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    var numPoints = 0;
    var output = [];
    var resids = [];
    var l=[];
    var t=[];
    var s=[];
    
    function retVar(){
        var i;
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Generate starting value for l - average of first season
        if(l.length===0){
            startL();
        }
        
        //Generate starting value for t - initial average difference between first two seasons
        if(t.length===0){
            startT();
        }
        
        //Generate starting values for s1,s2,s3,sn - not convinced that this is the best method
        if(s.length===0){
            startS();
        }
        
        //Calculate forecasts
        for(i=+period;i<numPoints;i++){
            l.push(factor*dataArray[i][1]/s[i-period]+(1-factor)*(l[i-1]+t[i-1]));
            t.push(trend*(l[i]-l[i-1])+(1-trend)*t[i-1]);
            s.push(season*dataArray[i][1]/l[i]+(1-season)*s[i-period]);
            
            //Create forecasts - current forecast is based on last periods estimates of l(evel) and t(rend)
            output.push([dataArray[i][0], (l[i-1]+t[i-1])*s[i-period]]);
        }
        
        //Calculate residuals
        for(i=+period;i<numPoints;i++){
            resids.push(dataArray[i][1]-output[i-period][1]);
            sumsq += Math.pow(dataArray[i][1]-output[i-period][1],2);
        }
    }
    
    function startL(){
        var i;
        //Generate starting value for l - average of first season
        var l1=0;
        for(i=0;i<period;i++){
            l1+=dataArray[i][1];
        }
        for(i=0;i<period;i++){
            l.push(l1/period);
        } 
    }
    
    function startT(){
        var i;
        //Generate starting value for t - initial average difference between first two seasons
        var t1=0;
        for(i=0;i<period;i++){
            t1+=(dataArray[i+period][1]-dataArray[i][1])/period;
        }
        for(i=0;i<period;i++){
            t.push(t1*(1/period));
        }
    }
    
    function startS(){
        //Generate starting values for s1,s2,s3,sn - not convinced that this is the best method
        var i,j;
        //First compute average for each full season
        var numFullSeasons = Math.floor(numPoints/period);
        var avgPerSeason=[];
        for(i=0;i<numFullSeasons;i++){
            var temp1=0;
            for(j=0;j<period;j++){
                temp1+=dataArray[j+i*period][1];
            }
            temp1=temp1/period;
            avgPerSeason.push(temp1);
        }
        for(j=0;j<period;j++){
            var temp2=0;
            for(i=0;i<numFullSeasons;i++){
                temp2+=dataArray[j+i*period][1]/avgPerSeason[i];
            }
            s.push(temp2/numFullSeasons);
        }
    }
    
    /**
     * Get or set the initial value for the level
     * @param {number} [value] - The value for the level
     * @returns Either the value for the level or the enclosing object
     */
    retVar.initialLevel = function(value){
        if(!arguments.length){ return l[0]; }
        l = [];
        for(var i=0;i<period;i++){
            l.push(value);
        }
        return retVar;
    };
    
    /**
     * Get or set the initial value for the trend
     * @param {number} [value] - The value for the trend
     * @returns Either the value for the trend or the enclosing object
     */
    retVar.initialTrend = function(value){
        if(!arguments.length){ return t[0]; }
        t = [];
        for(var i=0;i<period;i++){
            t.push(value);
        }
        return retVar;
    };
    
    /**
     * Get or set the initial value for the seasonality
     * @param {number} [value] - The value for the seasonality
     * @returns Either the value for the seasonality or the enclosing object
     */
    retVar.initialSeason = function(value){
        if(!arguments.length){ return s.slice(0,period); }
        //Is value an array and of the same length/size as period
        if(!Array.isArray(value)){ return s.slice(0,period); }
        if(value.length!==period){ return NaN; }
        
        s = [];
        s = value;
        
        return retVar;
    };
    
    /**
     * Get or set the periodicity of the data set
     * @param {number} [value] - The periodicity
     * @returns Either the periodicity or the enclosing object
     */
    retVar.period = function(value){
        if(!arguments.length){
            return period;
        } else {
            //Check that factor is in range and of the right type
            if(typeof period !== 'number'){
                console.log('Period appears to not be a number - changed to 12');
                period=12;
            }
            period = value;
            return retVar;
        }
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    retVar.data = function(value){
        data = value;
        numPoints = data.length;
        
        //Is there enough data - i.e. at least one season's worth
        if(period>=(numPoints/2)){
            throw new Error('Not enough data to estimate forecasts - need 2*period of data');
        }
        
        return retVar;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return retVar;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    retVar.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return retVar;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    retVar.output = function(){ return output; };

    /**
     * Returns the smoothed y points
     * @returns The smoothed y points
     */
    retVar.outputY = function(){ return output.map(function(e){ return e[1]; }); };

    /**
     * Returns the residuals
     * @returns The residuals
     */
    retVar.residuals = function(){ return resids; };
    
    /**
     * Returns the sum of squares of the residuals
     * @returns The sum of squares of the residuals
     */
    retVar.sumSquares = function(){ return sumsq; };
    
    /**
     * Provide or get the level factor
     * @param {number} [value] - The level factor
     * @returns If no parameter is passed in then the current level value. Otherwise it will return the enclosing object.
     */
    retVar.level = function(value){
        if(arguments.length===0){
            return factor;
        } else {
            //Check that factor is in range and of the right type
            if(typeof factor !== 'number'){
                console.log('Factor appears to not be a number - changed to 0.3');
                factor=0.3;
            }
            if(factor>1 || factor<0){
                console.log('Factor >1 or <0 - changed to 0.3');
                factor=0.3;
            } else {
                factor = value;
            }
            return retVar;
        }
    };
    
    /**
     * Provide or get the trend factor
     * @param {number} [value] - The trend factor
     * @returns If no parameter is passed in then the current trend value. Otherwise it will return the enclosing object.
     */
    retVar.trend = function(value){
        if(arguments.length===0){
            return trend;
        } else {
            //Check that trend factor is in range and of the right type
            if(typeof trend !== 'number'){
                console.log('Trend factor appears to not be a number - changed to 0.3');
                trend=0.3;
            }
            if(trend>1 || trend<0){
                console.log('Trend >1 or <0 - changed to 0.3');
                trend = 0.3;
            } else {
                trend = value;
            }
            return retVar;
        }
    };
    
    /**
     * Provide or get the seasonal factor
     * @param {number} [value] - The seasonal factor
     * @returns If no parameter is passed in then the current seasonal value. Otherwise it will return the enclosing object.
     */
    retVar.season = function(value){
        if(arguments.length===0){
            return season;
        } else {
            //Check that seasonal factor is in range and of the right type
            if(typeof season !== 'number'){
                console.log('Seasonal factor appears to not be a number - changed to 0.3');
                season=0.3;
            }
            if(season>1 || season<0){
                console.log('Season >1 or <0 - changed to 0.3');
                season=0.3;
            } else {
                season = value;
            }
            return retVar;
        }
    };
    
    /**
     * Provide a forecast of the function
     * @param {number} [d] - The number of time units to forecast ahead. If the data is monthly then 2 is 2 months.
     * @returns The forecast
     */
    retVar.forecast = function(d){
        //d is the number of periods forward to forecast the number
        var tempForecast = [];
        var distance = dataArray[1][0] - dataArray[0][0];
        
        for(var i=0; i<d; i++){
            var m=(i % period)+1;
            tempForecast.push([+dataArray[numPoints-1][0]+distance*(i+1), (l[numPoints-1]+(i+1)*t[numPoints-1])*s[numPoints-1-period+m]]);
        }

        return tempForecast;
    };
    
    return retVar;
};

/**
 * Calculate the determinant of a matrix using Bigs
 * @param {array} p - an array of arrays denoting a matrix
 * @returns {number} the determinant of the matrix
 */
ssci.reg.determinantBig = function(p){
    //Calculate the determinant of an array
    var j, t, u;     //integer
    var upperLim;    //integer
    var temp;        //Big
    var tempp = [];  //array of Bigs
    
    upperLim = p.length;
    j = upperLim - 2;
    temp = new Big(0);
    
    //Initialise temp array - must be a better way
    for(var i=0;i<=j;i++){
        var temp2=[];
        for(var k=0;k<=j;k++){
            temp2.push(new Big(0));
        }
        tempp.push(temp2);
    }
    
    for(i = 0;i<upperLim;i++){
        //Construct array for determinant if j>1
        t = 0;
        u = 0;
        for(var x=0;x<upperLim;x++){
            for(var y=0;y<upperLim;y++){
                if(y !== i && x !== j){
                    //Do i need to worry about references?
                    //tempp[t][u] = p[y][x];
                    tempp[t][u] = new Big(p[y][x].valueOf());
                }
                if(y !== i){
                    t++;
                }
            }
            t = 0;
            if(x !== j){
                u++;
            }
        }
        if (j > 0){
            temp = temp.plus(p[i][j].times(Math.pow((-1),(i + j))).times(ssci.reg.determinantBig(tempp)));
        } else {
            temp = temp.plus(p[i][j].times(Math.pow((-1),(i + j))).times(tempp[0][0]));
        }
        
    }

    return temp;

};

/**
 * Fit a polynomial to the set of points passed to the function i.e. least squares regression but return object and use Big objects
 * @returns {object} object containing an array of points ('x' coordinate in the first element of the point), array of constants for the polynomial and array of residuals
 */
ssci.reg.polyBig = function(){
    
    var output=[];    //Set of points calculated at same x coordinates as dataArray
    var resids=[];
    var ms=[];
    var msdash=[];
    var ns=[];
    var con=[];        //Constants of polynomial
    var con2=[];
    var detms;
    var newDA=[];    //Array of Bigs to hold data from dataArray
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var order = 2;
    
    function rp(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        
        //Change order if it is greater than the number of points
        if(order>(dataArray.length-1)){
            order=dataArray.length-1;
            console.log('Order changed to ' + (dataArray.length-1));
        }
        
        //Initialise newDA
        for(i=0; i<dataArray.length; i++){
            var temp=[];
            temp.push(new Big(+dataArray[i][0]));
            temp.push(new Big(+dataArray[i][1]));
            newDA.push(temp);
        }
        
        //Initialise variables
        for(i=0;i<(order+1);i++){
            var temp2=[];
            var temp3=[];
            for(k=0;k<(order+1);k++){
                temp2.push(new Big(0));
                temp3.push(new Big(0));
            }
            ms.push(temp2);
            msdash.push(temp3);
            ns.push(new Big(0));
        }
        
        //Set up matrices
        for(i = 0;i<(order+1);i++){
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<dataArray.length;k++){
                    ms[i][j] = ms[i][j].plus(newDA[k][0].pow(i+j));
                }
            }
        }
        
        for(j = 0;j<(order+1);j++){
            for(k = 0;k<dataArray.length;k++){
                ns[j] = ns[j].plus(newDA[k][0].pow(j).times(newDA[k][1]));
            }
        }
        
        detms = ssci.reg.determinantBig(ms);
        if(detms.valueOf() === '0'){
            throw new Error('Determinant is zero. Fitted line is not calculable.');
        }
        
        for(i = 0;i<(order+1);i++){
            //'Set up M'
            for(j = 0;j<(order+1);j++){
                for(k = 0;k<(order+1);k++){
                    if(k === i){
                        msdash[j][k] = ns[j];
                    } else {
                        msdash[j][k] = ms[j][k];
                    }
                }
            }
            con.push(ssci.reg.determinantBig(msdash).div(detms));    //Using Big.div - had to change DP in Big object
            con2.push(parseFloat(con[i].valueOf()));
        }
        
        for(k = 0;k<dataArray.length;k++){
            var tempb=new Big(0);
            for(j = 0;j<(order+1);j++){
                tempb = tempb.plus(newDA[k][0].pow(j).times(con[j]));
            }
            output.push([dataArray[k][0], tempb.valueOf()]);
            resids.push(dataArray[k][1]-parseFloat(tempb.toString()));
        }
    }
    
    /**
     * Get or set the order of the polynomial
     * @param {number} [value] - the order of the polynomial i.e. 2 for quadratic, 1 for linear etc.
     * @returns If no parameter is passed in then return the order, otherwise return the enclosing object
     */
    rp.order = function(value){
        if(!arguments.length){ return order; }
        
        //Check that order is a number
        if(typeof value!== 'number'){
            order = 2;
        }
        if(value <= 0){
            order = 2;
        }
        order = value;
        
        return rp;
    };
    
    /**
     * Get an array of the input x values with the fitted y values
     * @returns An array of fitted values
     */
    rp.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points.
     * @param {function} [value] - A function to convert the x data for use in the function.
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    rp.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return rp;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    rp.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return rp;
    };
    
    /**
     * Function to set the data used
     * @param {array} value - an array of points
     * @returns The enclosing object
     */
    rp.data = function(value){
        data = value;
        return rp;
    };
    
    /**
     * Returns the residuals after the fitted polynomial has been created
     * @returns The residuals
     */
    rp.residuals = function(){
        return resids;
    };
    
    /**
     * Returns the constants of the fitted polynomial
     * @returns An array of constants
     */
    rp.constants = function(){
        return con2;
    };
    
    /**
     * Predict a new figure given an x value
     * @param {number} d - The x value to return a y value for
     * @returns The fitted number
     */
    rp.forecast = function(d){
        //Check that d is a number
        if(typeof d !== 'number'){
            throw new Error('Input is not a number');
        }
        
        var temp=new Big(0);
        for(var j = 0;j<(order+1);j++){
            temp = temp.plus(newDA[newDA.length-1][0].plus(d).pow(j).times(con[j]));
        }
        return temp;
    };
    //Also add r squared value?
    
    return rp;
};

/**
 * Deseasonalise data based on the average for the period (specified by label range).
 * @returns {function} - the function to average the data
 */
ssci.season.average = function(){

    var numPoints = 0;
    var output = [];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var labels = [];
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check labels - is it an array and is it the right size
        if (typeof labels === 'object' && Array.isArray(labels)){
            //Does the length of the scale array match the number of points fed to the function
            if(labels.length !== dataArray.length){
                console.log(labels);
                throw new Error('Labels array is not the same length as the data array');
            }
        } else {
            //What else can it be?
            console.log(labels);
            throw new Error('Invalid label parameter');
        }
        
        //Deseasonalise data
        //Calculate averages
        var labelSum = {};
        var labelCnt = {};
        var labelAvg = {};
        var totalSum=0;
        var totalCount=0;
        for(i=0;i<labels.length;i++){
            if(labels[i] in labelSum){
                labelSum[labels[i]] = labelSum[labels[i]] + dataArray[i][1];
            } else {
                labelSum[labels[i]] = dataArray[i][1];
            }
            
            if(labels[i] in labelCnt){
                labelCnt[labels[i]] = labelCnt[labels[i]] + 1;
            } else {
                labelCnt[labels[i]] = 1;
            }
            
            if(!(labels[i] in labelAvg)){
                labelAvg[labels[i]] = 0;
            }
            totalSum += dataArray[i][1];
            totalCount++;
        }
        var tempKeys = Object.keys(labelAvg);
        for(var wk=0;wk<tempKeys.length;wk++){
            labelAvg[tempKeys[wk]] = (labelSum[tempKeys[wk]]*totalCount)/(labelCnt[tempKeys[wk]]*totalSum);
        }
        
        for(i=0;i<numPoints;i++){
            output.push([dataArray[i][0], dataArray[i][1]/labelAvg[labels[i]]]);
        }
    }
    
    /**
     * Pass in an array of data labels that define the period
     * @param {array} value - an array holding the labels that specify the period e.g. Jan, Feb, Mar etc.
     */
    sa.labels = function(value){
        labels = value;
        
        return sa;
    };
    
    /**
     * Returns the averaged data
     * @returns The averaged data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * A function to set the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    return sa;
};

/**
 * Deseasonalise the data by differencing the data and adding the moving average
 * @returns {function} - the function to create the points
 */
ssci.season.difference = function(){
    
    var numPoints = 0;
    var output = [];
    var ma=[];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var frequency = 12;
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check that there are enough points in the data series
        if(frequency>numPoints){
            throw new Error('Not enough data for this frequency');
        }
        
        //Calculate moving average
        for(i=frequency;i<numPoints;i++){
            ma[i]=0;
            for(var j=0;j<frequency;j++){
                ma[i]+=dataArray[i-j][1];
            }
            ma[i]/=frequency;
        }
        
        //Difference data
        for(i=frequency;i<numPoints;i++){
            output.push([dataArray[i][0], dataArray[i][1]-dataArray[i-frequency][1]+ma[i]]);
        }
    }
    
    /**
     * Returns the deseasonalised data
     * @returns The deseasonalised data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    /**
     * Define the frequency of the data series
     * @param {number} frequency - the number of points to difference over
     */
    sa.frequency = function(value){
        if(!arguments.length){ return frequency; }
        
        //Check that frequency is in range and of the right type
        if(typeof value !== 'number'){
            console.log('frequency appears to not be a number - changed to 12');
            frequency=12;
        }
        
        frequency = value;
        
        return sa;
    };
    
    return sa;
};

/**
 * Deseasonalise data based on taking the moving average
 * @param {number} frequency - the number of points to average over
 * @returns {function} - the function to create the points
 */
ssci.season.movingAverage = function(){
    
    var numPoints = 0;
    var output = [];
    var ma=0;
    var counter=1;
    var weights = [];
    var i;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var frequency = 12;
    var lastN = true;
    
    function sa(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        //Check that there are enough points in the data series
        if(frequency>numPoints){
            throw new Error('Not enough data for this frequency');
        }
        
        //Create moving averages
        //Calculate weights to adjust for even frequency when used with a central average
        var width = Math.floor(frequency / 2);
        for(i=0;i<frequency;i++){
            weights[i] = 1;
        }
        
        for(i = frequency-1;i<numPoints;i++){
            counter = 0;
            ma=0;
            for(var j = i - (frequency-1);j<=i;j++){
                ma = ma + dataArray[j][1] * weights[counter];
                counter++;
            }
            
            if(lastN){
                output.push([dataArray[i][0], ma / frequency]);
            } else {
                output.push([dataArray[i-width+1][0], ma / frequency]);
            }
            
        }
    }
    
    /**
     * Get or set a boolean value to state whether the average is calculated over the last n points or as a central average.
     * @param {boolean} value - true if calculating an average over the last n points, false for a central average.
     * @returns If no parameter is passed in then the value is returned, otherwise returns the enclosing object
     */
    sa.end = function(value){
        if(!arguments.length){ return lastN; }
        
        //Check that lastN is a boolean
        if(typeof value !== 'boolean'){
            lastN = true;
        }
        
        lastN = value;
        
        return sa;
    };
    
    /**
     * Returns the averaged data
     * @returns The averaged data
     */
    sa.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sa;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sa;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sa.data = function(value){
        data = value;
        return sa;
    };
    
    /**
     * Get or set the frequency of the data series
     * @param {number} [value] - The frequency of the data series i.e. if monthly then frequency is 12.
     * @returns The frequency if no parameter is passed in, otherwise returns the enclosing object.
     */
    sa.frequency = function(value){
        if(!arguments.length){ return frequency; }
        
        //Check that frequency is in range and of the right type
        if(typeof value !== 'number'){
            console.log('frequency appears to not be a number - changed to 12');
            frequency=12;
        }
        
        frequency = value;
        
        return sa;
    };
    
    return sa;
};

/**
 * Calculate asymmetric henderson weights
 * Formula taken from Doherty, M (2001); THE SURROGATE HENDERSON FILTERS IN X-11; Aust. N. Z. J. Stat. 43(4), 2001, 901–999
 * which I found here - http://www.stats.govt.nz/~/media/Statistics/surveys-and-methods/methods/data-analysis/x-12-arima-doherty.pdf
 * @param {array} filter - the filter to be adjusted to be asymmetric - i.e. the Henderson filter 
 * @param {number} term  - the length of the assymetric Henderson filter to be returned - needs to be less than filter.length
 * @param {number} IC    - Quoting from the PDF above - Here, for an additive adjustment, I is the average of absolute month to month change in the estimated irregular, and C is the average of the absolute month to month changes in an estimate of the trend. For a multiplicative adjustment, the I/C ratio is also used. However,the numerator is the average of the absolute monthly percentage changes in an estimated irregular; the denominator is the average of the absolute monthly percentage changes in an estimated trend. It can take a value from 0 to roughly 4.5.
 * @returns - an array containing the filter
 */

ssci.smooth.ahenderson = function(filter, term, IC){
    if(typeof term !== 'number'){
        throw new Error('Term must a number');
    }
    if(term < 0){
        throw new Error('Term must be >0');
    }
    
    //Filter must be array
    if(!(typeof filter === 'object' && Array.isArray(filter))){
        throw new Error('Filter must be an array');
    }
    
    //IC greater than zero
    if(IC < 0){
        throw new Error('I/C must be >0');
    }
    
    var output=[];
    var bs = (4/Math.PI)/Math.pow(IC,2);
    var i,j;
    
    //fill output with zeroes
    for(i=0; i<filter.length; i++){
        output.push(0);
    }
    
    for(i=0; i<term; i++){
        var totW=0;
        for(j = term; j<filter.length; j++){
            totW+=filter[j];
        }
        
        var totW2=0;
        for(j = term; j<filter.length; j++){
            totW2+=((j+1)-(term+1)/2)*filter[j];
        }
        
        output[filter.length-term+i] = filter[i] + (1/term)*totW + (((i+1-(term+1)/2)*bs)/(1+((term*(term-1)*(term+1))/12)*bs)*totW2);
    }
    
    return output;
};

/**
 * Create henderson filters of term 'term'
 * Formula taken from http://www.ons.gov.uk/ons/rel/elmr/economic-trends--discontinued-/no--633--august-2006/fitting-trends-to-time-series-data.pdf
 * @param {number} term - The number of terms in this Henderson filter
 * @returns an array with the terms
 */ 
ssci.smooth.henderson = function(term){
    if(typeof term !== 'number'){
        throw new Error('Term must a number');
    }
    if(term % 2 === 0){
        throw new Error('Term must be odd');
    }
    if(term < 0){
        throw new Error('Term must be >0');
    }
    
    var m = (term-1)/2;
    var j;
    var h = [];
    
    for(j=-m;j<(m+1);j++){
        
        h.push( (315*((m+1)*(m+1)-j*j)*((m+2)*(m+2)-j*j)*((m+3)*(m+3)-j*j)*(3*(m+2)*(m+2)-11*j*j-16))/ (8*(m+2)*((m+2)*(m+2)-1)*(4*(m+2)*(m+2)-1)*(4*(m+2)*(m+2)-9)*(4*(m+2)*(m+2)-25)) );
        
    }
    
    return h;
};



/**
 * Gaussian kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_G(x1 , x2 , b ) {
    return (1/Math.sqrt(2*Math.PI))*Math.exp(-(Math.pow((x1 - x2),2) / (2*Math.pow(b,2))));
}

/**
 * Epanechnikov kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_E(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (3 / 4) * (1 - Math.pow(((x1 - x2) / b), 2));
    }
}

/**
 * Logistic kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_L(x1 , x2 , b ) {
    return 1 / (Math.exp((x1 - x2) / b) + Math.exp(-(x1 - x2) / b));
}

/**
 * Uniform kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_U(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return 1 / 2;
    }
}

/**
 * Triangular kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_T(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (1 - Math.abs((x1 - x2) / b));
    }
}

/**
 * Quartic kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_Q(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (15 / 16) * Math.pow((1 - Math.pow(((x1 - x2) / b), 2)), 2);
    }
}

/**
 * Triweight kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_TW(x1 , x2 , b ) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (35 / 32) * Math.pow((1 - Math.pow(((x1 - x2) / b), 2)), 3);
    }
}

/**
 * Cosine kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_Co(x1 , x2 , b) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (Math.PI / 4) * Math.cos((Math.PI / 2) * ((x1 - x2) / b));
    }
}

/**
 * Tricube kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_TC(x1 , x2 , b) {
    if (Math.abs((x1 - x2) / b) > 1) {
        return 0;
    } else {
        return (70 / 81) * Math.pow((1 - Math.pow(Math.abs((x1 - x2) / b), 3)), 3);
    }
}

/**
 * Silverman kernel - applied within the smoothKernel function
 * @param {number} x1 - point being adjusted
 * @param {number} x2 - point used to make adjustment
 * @param {number} b - scaling parameter
 * @returns {number} result of expression
 */
function k_S(x1, x2, b){
    var u = Math.abs((x2-x1)/b);
    
    return 0.5 * Math.exp(-u/Math.SQRT2) * Math.sin(u/Math.SQRT2 + Math.PI/4);
}

/**
 * Exponentially smooth a data series - data series should be evenly spaced in the x-coordinate
 * This is the exponentially weighted moving average rather than what is more generally known as exponential smoothing.
 * Only good for non-trended, non-seasonal data
 * @returns {function} - the function to create the points
 */
ssci.smooth.EWMA = function(){
    
    var numPoints = 0;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var factor = 0.3;
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        for(var i=0;i<numPoints;i++){
            if(i===0){
                output.push(dataArray[i]);
            } else {
                output.push([dataArray[i][0], dataArray[i][1]*factor + output[i-1][1]*(1-factor)]);
            }
        }
    }
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sm.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sm;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sm;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sm.data = function(value){
        data = value;
        return sm;
    };
    
    /**
     * Define or get the factor to smooth the data by
     * @param {number} [value=0.3] - A number between 0 and 1 to smooth the data by
     * @returns Either the factor or the enclosing object
     */
    sm.factor = function(value){
        if(!arguments.length){ return factor; }
        
        //Check that factor is in range and of the right type
        if(typeof value !== 'number'){
            console.log('Factor appears to not be a number - changed to 0.3');
            factor=0.3;
            return sm;
        }
        if(value>1 || value<0){
            console.log('Factor >1 or <0 - changed to 0.3');
            factor=0.3;
            return sm;
        }
        
        factor = value;
        
        return sm;
    };
    
    return sm;
};

/** 
 * Take an array of points and returns a set of smoothed points by applying a filter to the data
 * @returns {function} - the function to create the points
 */
ssci.smooth.filter = function(){
    
    var numPoints  = 0;
    var output     = [];
    var b          = 0;
    var i,j;        //Iterators
    var x_conv     = function(d){ return d[0]; };
    var y_conv     = function(d){ return d[1]; };
    var data       = [];
    var filter     = [1/3, 1/3, 1/3];
    var removeEnds = true;
    var m1         = -1;
    var m2         = 1;
    var limitSet   = false;
    var l_filt     = function(d, term){ return ssci.smooth.ahenderson(d, term, 3.5).reverse(); };
    var r_filt     = function(d, term){ return ssci.smooth.ahenderson(d, term, 3.5); };
    
    function sm(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(!limitSet){
            if(filter.length % 2 === 0){
                m1 = -(Math.floor(filter.length/2))+1;
                m2 = Math.floor(filter.length/2);
            } else {
                m1 = -(Math.floor(filter.length/2));
                m2 = Math.floor(filter.length/2);
            }
        } else {
            //Check that the limits cover the filter length
            if(-m1+m2+1!==filter.length){
                throw new Error("Filter length is different to length specified by limits");
            }
        }
        
        //Filter the data
        for(i=0;i<numPoints;i++){
            b=0;
            
            //Calculate adjusted filter
            var afilter = [];
            if(!removeEnds && m1+i<0){
                afilter = l_filt(filter, filter.length+i+m1);
            } else if(!removeEnds && i+m2>(numPoints-1)){
                afilter = r_filt(filter, numPoints-i+m2);
            } else {
                afilter = filter.slice();
            }
            
            //Why am I not using afilter.length in the for statement below?
            for(j=0;j<filter.length;j++){
                //Check that i+j+m1>-1 && i+j+m1<numPoints 
                if(removeEnds){
                    if(i+j+m1>-1 && i+j+m1<numPoints){
                        b+=dataArray[i+j+m1][1]*afilter[j];
                    } else {
                        //Do nothing
                    }
                } else {
                    if(i+j+m1>-1 && i+j+m1<numPoints){
                        if(m1+i<0){
                            b+=dataArray[i+j+m1][1]*afilter[j+i+m1];
                            //console.log("l",i,j,dataArray[i+j+m1][1],afilter[j+i+m1],m1,m2);
                        } else if(i+m2>(numPoints-1)){
                            b+=dataArray[i+j+m1][1]*afilter[j+i-numPoints+1-m1];
                            //console.log("r",i,j,dataArray[i+j+m1][1],afilter[j+i-numPoints+1-m1],m1,m2);
                        } else {
                            b+=dataArray[i+j+m1][1]*afilter[j];
                            //console.log("c",i,j,dataArray[i+j+m1][1],afilter[j],m1,m2);
                        }
                    } else {
                        //Do nothing
                    }
                }
            }
            
            if(removeEnds && i+m1>-1 && i+m2<numPoints){
                output.push([dataArray[i][0], b]);
            }
            if(!removeEnds){
                output.push([dataArray[i][0], b]);
            }
        }
        
    }
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sm.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sm;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sm.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sm;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sm.data = function(value){
        data = value;
        return sm;
    };
    
    /**
     * Set or get the filter to apply to the data
     * @param {array} [value] - An array containing the numbers to apply as a filter
     * @returns Either the filter or the enclosing object
     */
    sm.filter = function(value){
        //Set the filter
        if(!arguments.length){ return filter; }
        
        //Check that the filter is an array
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Filter must be an array');
        }
        
        filter = value;
        
        return sm;
    };
    
    /**
     * Set where to apply the filter
     * @param {array} [value] - An array containing the two x-values between which the fillter will be applied.
     * @returns Either the limits array or the enclosing object
     */
    sm.limits = function(value){
        //Set limits of filter i.e. where to apply it
        if(!arguments.length){ return [m1,m2]; }
        
        //Check that the 'limits' is an array
        if(!(typeof value === 'object' && Array.isArray(value))){
            throw new Error('Limits must be an array');
        }
        //Check input array length
        if(value.length !== 2){ throw new Error("Limits must be an array of length 2"); }
        //Check that the inputs are numbers
        if(typeof value[0]!=='number' && typeof value[1]!=='number'){ throw new Error('Input must be a number'); }
        
        m1 = value[0];
        m2 = value[1];
        limitSet = true;
        
        return sm;
    };
    
    /**
     * Set whether values are calculated for the end of a series - false to calculate them
     * @param {boolean} [value] - Should the ends be removed?
     * @returns Either the value or the enclosing object
     */
    sm.end = function(value){
        if(!arguments.length){ return removeEnds; }
        
        //Check removeEnds
        if(typeof removeEnds !== 'boolean'){
            removeEnds = true;
        } else {
            removeEnds = value;
        }
        
        return sm;
    };
    
    /**
     * Calculate gain
     * @param {number} d The period to calculate the gain for
     * @returns The gain
     */
    sm.gain = function(d){
        if(typeof d !== 'number'){ throw new Error('Input must be a number'); }
        
        var temp = 0;
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i+m1) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i+m1) * 2 * Math.PI / d);
        }
        
        temp = Math.sqrt(g1*g1 + g2*g2);
        
        return temp;
    };
    
    /**
     * Calculate the phase shift caused by the filter
     * @param {number} d The period to calculate the phase shift for
     * @returns The phase shift
     */
    sm.phaseShift = function(d){
        if(typeof d !== 'number'){ throw new Error('Input must be a number'); }
        
        var g1 = 0;
        var g2 = 0;
            
        for(i=0;i<filter.length;i++){
            g1 = g1 + filter[i] * Math.cos((i+m1) * 2 * Math.PI / d);
            g2 = g2 + filter[i] * Math.sin((i+m1) * 2 * Math.PI / d);
        }
        
        return pf(g1, g2)/(2 * Math.PI / d);
    };

    function pf(c, s){
        
        if( c > 0 ){
            return Math.atan(s / c);
        } else if (c < 0 && s >= 0){
            return Math.atan(s / c) + Math.PI;
        } else if (c < 0 && s < 0){
            return Math.atan(s / c) - Math.PI;
        } else if (c === 0 && s > 0) {
            return Math.PI / 2;
        } else if (c === 0 && s < 0) {
            return -Math.PI / 2;
        } else if (c === 0 && s === 0) {
            return 0;
        } else {
            return Number.NaN;
        }
        
    }

    /**
     * Set or get the function to calculate the weights for the start of the data series if 'end' is false
     * @param {function} value - The function to use to calculate the weights to use - default is an asymmetric Henderson filter
     * @returns Either the value or the enclosing object
     */
    sm.left = function(value){
        if(!arguments.length){ return l_filt; }
        l_filt = value;
        return sm;
    };
    
    /**
     * Set or get the function to calculate the weights for the end of the data series if 'end' is false
     * @param {function} value - The function to use to calculate the weights to use - default is an asymmetric Henderson filter
     * @returns Either the value or the enclosing object
     */
    sm.right = function(value){
        if(!arguments.length){ return r_filt; }
        r_filt = value;
        return sm;
    };

    return sm;
    
};

/** 
 * Take an array of points and returns a set of smoothed points by applying a filter (specified by the kernel function) to the data
 * @returns {function} - the function to create the points
 */
ssci.smooth.kernel = function(){

    var output=[];
    var kernels = {
        'Uniform': k_U,
        'Triangle': k_T,
        'Epanechnikov': k_E,
        'Quartic': k_Q,
        'Triweight': k_TW,
        'Logistic': k_L,
        'Cosine': k_Co,
        'Gaussian': k_G,
        'Tricube': k_TC,
        'Silverman': k_S
    };
    var i;      //Iterator
    var kernel="Gaussian";
    var data = [];
    var scale = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    function sk() {
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        
        //Deal with scale
        var scales = [];
        
        if(typeof scale === 'number'){
            //Create an array of length dataArray and populate with scale parameter
            for(i=0;i<dataArray.length;i++){
                scales.push(scale);
            }
        } else if (typeof scale === 'object' && Array.isArray(scale)){
            //Does the length of the scale array match the number of points fed to the function
            if(scale.length === dataArray.length){
                scales = scale.slice();
            } else {
                //Put in for completeness but will almost never be what is intended
                var counter=0;
                for(i=0;i<dataArray.length;i++){
                    scales.push(scale[counter]);
                    if(i<scale.length){
                        counter++;
                    } else {
                        counter=0;
                    }
                }
            }
        } else {
            //What else can it be?
            console.log(scale);
            throw new Error('Invalid scale parameter');
        }
        
        //Calculate smoothed values
        for(i=0;i<dataArray.length;i++){
            var tot_ker1 = 0;
            var tot_ker2 = 0;
            
            for(var j=0;j<dataArray.length;j++){
                var temp_ker=0;
                
                temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
                
                tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
                tot_ker2 = tot_ker2 + temp_ker;
            }
            
            output.push([dataArray[i][0],(tot_ker1 / tot_ker2)]);
        }
    }
    
    /**
     * Define the scale for the kernel. This can take a number or an array of numbers. Generally the array will have the same number of values as the data array.
     * @param {number|array} [value] - an array or number containing the scaling parameters of the kernel.
     * @returns If no parameter is passed in then the scale is returned, otherwise returns the enclosing object.
     */
    sk.scale = function(value){
        if(!arguments.length){ return scale; }
        scale = value;
        
        return sk;
    };
    
    /**
     * Define the kernel function to use in the smoothing function. The default is 'Gaussian'
     * @param {'Uniform' | 'Triangle' | 'Epanechnikov' | 'Quartic' | Triweight | 'Logistic' | 'Cosine' | 'Gaussian' | 'Tricube' | 'Silverman'} [value='Gaussian'] - the smoothing kernel to use
     * @returns The kernel if no parameter is passed in
     */
    sk.kernel = function(value){
        if(!arguments.length){ return kernel; }
        //Check that the kernel is valid
        if(typeof kernels[value] !== 'function'){
            throw new Error('Invalid kernel');
        }
        
        kernel = value;
        
        return sk;
    };
    
    /**
     * Define a function to convert the x data passed in to the kernel function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sk.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sk;
    };
    
    /**
     * Define a function to convert the y data passed in to the kernel function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    sk.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sk;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sk.output = function(){
        return output;
    };

    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    sk.data = function(value){
		data = value;
		
		return sk;
	};
    
    return sk;
};

/** 
 * Take an array of points and returns a set of smoothed points by applying a filter (specified by the kernel function) to the data
 * This function cuts off the kernel calculations after the kernel decreases beyond a certain level
 * @returns {function} - the function to create the points
 */
ssci.smooth.kernel2 = function(){

    var output=[];
    var kernels = {
        'Uniform': k_U,
        'Triangle': k_T,
        'Epanechnikov': k_E,
        'Quartic': k_Q,
        'Triweight': k_TW,
        'Logistic': k_L,
        'Cosine': k_Co,
        'Gaussian': k_G,
        'Tricube': k_TC,
        'Silverman': k_S
    };
    var max_diff = 0.001;   //Maximum difference to calculate kernel - equivalent to 0.1%
    var scale = [];
    var data = [];
    var kernel = "Gaussian";
    var i, j;               //Iterators
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    
    function sk() {
        var dataArray = [];
		
		//Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        
        //Deal with scale
        var scales = [];
        
        if(typeof scale === 'number'){
            //Create an array of length dataArray and populate with scale parameter
            for(i=0;i<dataArray.length;i++){
                scales.push(scale);
            }
        } else if (typeof scale === 'object' && Array.isArray(scale)){
            //Does the length of the scale array match the number of points fed to the function
            if(scale.length === dataArray.length){
                scales = scale.slice();
            } else {
                //Put in for completeness but will almost never be what is intended
                var counter=0;
                for(i=0;i<dataArray.length;i++){
                    scales.push(scale[counter]);
                    if(i<scale.length){
                        counter++;
                    } else {
                        counter=0;
                    }
                }
            }
        } else {
            //What else can it be?
            console.log(scale);
            throw new Error('Invalid scale parameter');
        }
        
        //Calculate smoothed values
        for(i=0;i<dataArray.length;i++){
            var tot_ker1 = 0;
            var tot_ker2 = 0;
            var temp_ker = 0;
            
            //Kernel for point=i
            var self_ker = kernels[kernel](dataArray[i][0], dataArray[i][0], scales[i]);
            tot_ker1 = tot_ker1 + self_ker * dataArray[i][1];
            tot_ker2 = tot_ker2 + self_ker;
            
            //Kernel for lower points
            for(j=i-1; j>-1; j--){
                temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
                if(temp_ker/self_ker<max_diff){
                    break;
                }
                tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
                tot_ker2 = tot_ker2 + temp_ker;
            }
            
            //Kernel for higher points
            for(j=i+1; j<dataArray.length; j++){
                temp_ker = kernels[kernel](dataArray[i][0], dataArray[j][0], scales[i]);
                if(temp_ker/self_ker<max_diff){
                    break;
                }
                tot_ker1 = tot_ker1 + temp_ker * dataArray[j][1];
                tot_ker2 = tot_ker2 + temp_ker;
            }
            
            output.push([dataArray[i][0],(tot_ker1 / tot_ker2)]);
        }
    }
    
    /**
     * Define the scale for the kernel. This can take a number or an array of numbers. Generally the array will have the same number of values as the data array.
     * @param {number|array} [value] - an array or number containing the scaling parameters of the kernel
     * @returns If no parameter is passed in then the scale is returned
     */
    sk.scale = function(value){
        if(!arguments.length){ return scale; }
        scale = value;
        
        return sk;
    };
    
    /**
     * Define the kernel function to use in the smoothing function. The default is 'Gaussian'
     * @param {'Uniform' | 'Triangle' | 'Epanechnikov' | 'Quartic' | Triweight | 'Logistic' | 'Cosine' | 'Gaussian' | 'Tricube' | 'Silverman'} [value='Gaussian'] - the smoothing kernel to use
     * @returns The kernel if no parameter is passed in
     */
    sk.kernel = function(value){
        if(!arguments.length){ return kernel; }
        //Check that the kernel is valid
        if(typeof kernels[value] !== 'function'){
            throw new Error('Invalid kernel');
        }
        
        kernel = value;
        
        return sk;
    };
    
    /**
     * Define a function to convert the x data passed in to the kernel function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    sk.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return sk;
    };
    
    /**
     * Define a function to convert the y data passed in to the kernel function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in
     */
    sk.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return sk;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    sk.output = function(){
        return output;
    };
    
    /**
     * Define or return the stopping parameter. The calculation will stop once the proportional value calculated is less than this value.
     * @param {number} [value=0.001] - The number to stop the calculation at. The dafault number stops the calculation once the adjusted points add less then 0.1% to the total adjusted figure.
     * @returns Either the value or the enclosing object
     */
    sk.diff = function(value){
        if(!arguments.length){ return max_diff; }
        max_diff = value;
        
        return sk;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param {array} dataArray - an array of points
     * @returns The enclosing function
     */
    sk.data = function(value){
		data = value;
		
		return sk;
	};
    
    return sk;
};

/** 
 * Take an array of points and returns a set of smoothed points by fitting a quadratic to the data around the central point using Big objects
 * @returns {function} - the function to create the points
 */
ssci.smooth.quadraticBig = function(){
    
    var width = 5;
    var l_width = 2;
    var numPoints = 0;
    var output = [];
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    
    function qb() {
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        for(var m=0;m<numPoints;m++){
            var tempArray=[];
            for(var i=m-l_width;i<=m+l_width;i++){
                if(i<0){
                    tempArray.push(dataArray[0]);
                } else if(i>numPoints-1){
                    tempArray.push(dataArray[numPoints-1]);
                } else {
                    tempArray.push(dataArray[i]);
                }
            }
            
            var temp_func = ssci.reg.polyBig()
                                    .data(tempArray)
                                    .order(2);
            temp_func();
            var temp = temp_func.constants();
            output.push([dataArray[m][0], (temp[0]) + dataArray[m][0] * (temp[1]) + dataArray[m][0] * dataArray[m][0] * (temp[2])]);
        }
    }
    
    /**
     * Get or set the width of the polynomial to fit to the data
     * @param {number} value - the width of the quadratic to fit in points
     * @returns Either the width if no parameter is passed in or the enclosing object
     */
    qb.width = function(value){
        if(!arguments.length){ return width; }
        
        if(typeof value!== 'number'){
            console.log('width appears to not be a number - changed to 5');
            return qb;
        }
        if(value % 2 === 0){
            value--;
        }
        if(value < 3){
            value = 5;
        }
        
        width = value;
        l_width = Math.floor(value/2);
        
        return qb;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    qb.data = function(value){
        data = value;
		
		return qb;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    qb.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return qb;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    qb.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return qb;
    };
    
    /**
     * Returns the smoothed data
     * @returns The smoothed data
     */
    qb.output = function(){
        return output;
    };
    
    return qb;
};
/**
 * Calculates the auto-correlation
 * @returns {function} - the function to create the points
 */
ssci.ts.acf = function(){

    var output=[];
    var numPoints=0;
    var lags=[];
    var x=[];
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var maxlag = 20;
    var diffed = 0;
    
    function run(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(maxlag>(dataArray.length-diffed)){
            maxlag = dataArray.length-diffed;
            console.log('Not enough points for the number of lags requested. Max lag changed to ' + maxlag);
        }
        
        //Create lags array
        for(i=0;i<(maxlag+1);i++){
            lags.push(i);
        }
        
        //Create data array - i.e. differenced if necessary
        if(diffed>0){
            for(i=0;i<(numPoints-1);i++){
                x.push(dataArray[i][1]-dataArray[i+1][1]);
            }
        } else {
            for(i=0;i<numPoints;i++){
                x.push(dataArray[i][1]);
            }
        }
        
        if(diffed>1){
            for(j=0;j<(diffed-1);j++){
                for(i=0;i<(numPoints-1-j);i++){
                    x[i]=x[i]-x[i+1];
                }
                x.pop();
            }
        }
        
        //Calculate acf - assuming stationarity i.e. mean and variance constant (sort of)
        for(i=0;i<=maxlag;i++){
            var sx = 0;
            var s1 = 0;
            var s2 = 0;
            
            //Calculate mean
            for(k = 0;k<(numPoints-diffed);k++){
                sx = x[k] + sx;
            }
            sx = sx / (numPoints-diffed);
            
            //Calculate correlation
            for(k = 0;k<(numPoints - diffed);k++){
                if(k<(numPoints - lags[i] - diffed)){
                    s1 = s1 + (x[k] - sx) * (x[k + lags[i]] - sx);
                }
                s2 = s2 + Math.pow(x[k] - sx,2);
            }

            output.push([i, s1 / s2]);
        }
    }
    
    /**
     * Returns the correlation array
     * @returns The correlation array
     */
    run.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return run;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return run;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    run.data = function(value){
        data = value;
        return run;
    };
    
    /**
     * Get or set the maximum value of the lag to calculate the acf for
     * @param {number} [value] - The maximum lag
     * @returns The maximmum lag or the enclosing object
     */
    run.maxlag = function(value){
        if(!arguments.length){ return maxlag; }
        
        if(typeof maxlag !== 'number'){
            throw new Error('maxlag is not a number');
        }
        
        maxlag = value;
        
        return run;
    };
    
    /**
     * Get or set the number of times to difference the data
     * @param {number} [value] - The number of times to difference the data
     * @returns The number of times to difference the data or the enclosing object.
     */
    run.diff = function(value){
        if(!arguments.length){ return diffed; }
        
        if(typeof diffed !== 'number'){
            throw new Error('diffed is not a number');
        }
        
        diffed = value;
        
        return run;
    };
    
    return run;
};
/**
 * Difference the y values of a data series
 * @param {array} dataArray - an array of points
 * @returns {array} an array of points with [x, diff(y)]
 */
ssci.ts.diff = function(dataArray){
    var output=[];
    
    for (var index = 0; index < (dataArray.length-1); index++) {
        output.push([dataArray[index][0], dataArray[index+1][1]-dataArray[index][1]]);
    }
    
    return output;
};
/**
 * Calculates the partial auto-correlation
 * Formula taken from https://www.empiwifo.uni-freiburg.de/lehre-teaching-1/winter-term/dateien-financial-data-analysis/handout-pacf.pdf
 * @returns {function} - the function to create the points
 */
ssci.ts.pacf = function(){
    
    var output=[];
    var numPoints=0;
    var lags=[];
    var x=[];
    var p=[];
    var t=[];
    var i,j,k;
    var x_conv = function(d){ return d[0]; };
    var y_conv = function(d){ return d[1]; };
    var data = [];
    var maxlag = 20;
    var diffed = 0;
    
    function run(){
        var dataArray = [];
        
        //Clear output array - needed to stop output growing when function called repeatedly
		output = [];
        
        //Create array of data using accessors
        dataArray = data.map( function(d){
            return [x_conv(d), y_conv(d)];
        });
        numPoints = dataArray.length;
        
        if(maxlag>(dataArray.length-diffed)){
            maxlag = dataArray.length-diffed;
            console.log('Not enough points for the number of lags requested. Max lag changed to ' + maxlag);
        }
        
        //Create lags array
        for(i=0;i<(maxlag+1);i++){
            lags.push(i);
        }
        
        //Create data array - i.e. differenced if necessary
        if(diffed>0){
            for(i=0;i<(numPoints-1);i++){
                x.push(dataArray[i][1]-dataArray[i+1][1]);
            }
        } else {
            for(i=0;i<numPoints;i++){
                x.push(dataArray[i][1]);
            }
        }
        
        if(diffed>1){
            for(j=0;j<(diffed-1);j++){
                for(i=0;i<(numPoints-1-j);i++){
                    x[i]=x[i]-x[i+1];
                }
                x.pop();
            }
        }
        
        //Calculate acf - assuming stationarity i.e. mean and variance constant
        for(i=0;i<=maxlag;i++){
            var sx = 0;
            var s1 = 0;
            var s2 = 0;
            
            //Calculate mean
            for(k = 0;k<(numPoints-diffed);k++){
                sx = x[k] + sx;
            }
            sx = sx / (numPoints-diffed);
            
            //Calculate correlation
            for(k = 0;k<(numPoints - diffed);k++){
                if(k<(numPoints - lags[i] - diffed)){
                    s1 = s1 + (x[k] - sx) * (x[k + lags[i]] - sx);
                }
                s2 = s2 + Math.pow(x[k] - sx,2);
            }

            p.push(s1 / s2);
        }
        
        //Calculate pacf
        //Set all t[] to NaN
        for(k=0;k<=maxlag;k++){
            var temp2=[];
            for(j=0;j<=maxlag;j++){
                temp2.push(NaN);
            }
            t.push(temp2);
        }

        t[0][0] = 1;
        t[1][1] = p[1];
        for(k = 2;k<=maxlag;k++){
            //Calculate factors to take away from p[i]
            var totalt = 0;
            for(j = 1;j<k;j++){
                if (k-1 !== j && k-2 > 0){
                    t[k - 1][j] = t[k - 2][j] - t[k - 1][k - 1] * t[k - 2][k - 1 - j];
                }
                totalt += t[k - 1][j] * p[k - j];
            }
            t[k][k] = (p[k] - totalt) / (1 - totalt);
        }
        
        for(k=0;k<=maxlag;k++){
            output.push([lags[k], t[lags[k]][lags[k]]]);
        }
    }
    
    /**
     * Returns the correlation array
     * @returns The correlation array
     */
    run.output = function(){
        return output;
    };
    
    /**
     * Define a function to convert the x data passed in to the function. The default function just takes the first number in the arrays of array of data points
     * @param {function} [value] - A function to convert the x data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.x = function(value){
        if(!arguments.length){ return x_conv; }
        x_conv = value;
        return run;
    };
    
    /**
     * Define a function to convert the y data passed in to the function. The default function just takes the second number in the arrays of array of data points
     * @param {function} [value] - A function to convert the y data for use in the function
     * @returns The conversion function if no parameter is passed in, otherwise returns the enclosing object.
     */
    run.y = function(value){
        if(!arguments.length){ return y_conv; }
        y_conv = value;
        return run;
    };
    
    /**
     * Input the data. The default format is as an array of arrays of x and y values i.e. [['x1','y1']['x2','y2']]
     * @param value - the data
     * @returns The enclosing object
     */
    run.data = function(value){
        data = value;
        return run;
    };
    
    /**
     * Get or set the maximum value of the lag to calculate the partial acf for
     * @param {number} [value] - The maximum lag
     * @returns The maximmum lag or the enclosing object
     */
    run.maxlag = function(value){
        if(!arguments.length){ return maxlag; }
        
        if(typeof maxlag !== 'number'){
            throw new Error('maxlag is not a number');
        }
        
        maxlag = value;
        
        return run;
    };
    
    /**
     * Get or set the number of times to difference the data
     * @param {number} [value] - The number of times to difference the data
     * @returns The number of times to difference the data or the enclosing object.
     */
    run.diff = function(value){
        if(!arguments.length){ return diffed; }
        
        if(typeof diffed !== 'number'){
            throw new Error('diffed is not a number');
        }
        
        diffed = value;
        
        return run;
    };
    
    return run;
};
/**
 * Creates a string for the d attribute of the SVG <path> element given a type of path to create and a set of points
 * @param {string} interpolation - the type of path to create - linear or cubic
 * @param {array} points - a set of points
 * @returns {string} A string for use in the d attribute of the SVG <path> element
 */
ssci.interpString = function(interpolation, points){
    var outputString = "";
    if(interpolation==='linear'){
        outputString = points.join("L");
    } else if(interpolation==='cubic') {
        var sParam = splineInterpolation(points);
        
        outputString += points[0][0] + "," + points[0][1];
        for(var i=1;i<points.length;i++){
            var controlPoints = splineToBezier(points[i-1],points[i],sParam[i-1]);
            
            outputString += "C" + controlPoints[0][0] + "," + controlPoints[0][1] + "," + controlPoints[1][0] + "," + controlPoints[1][1] + "," + points[i][0] + "," + points[i][1];
        }
    } else {
        throw new Error('Interpolation not defined = ' + interpolation);
    }
    
    return outputString;
};

/**
 * Convert an object to an array of points (i.e. x and y coordinates)
 * @param {object} data - object holding the data - generally an array of objects in the D3 style
 * @param {string} x - the name of the attribute holding the x coordinate
 * @param {string} y - the name of the attribute holding the y coordinate
 * @returns {array} an array of points, 'x' coordinate in the first element of the point
 */
ssci.objectToPoints = function(data, x, y){
	return data.map(function(e){
		var temp = [];
		temp.push(e[x]);
		temp.push(e[y]);
		return temp;
	});
};

/**
 * Convert an array of points (i.e. x and y coordinates) to an array of objects with 'x' and 'y' attributes
 * @param {object} data - array holding the data - 'x' data is assumed to be in the first element of the point array, 'y' data in the second 
 * @returns {array} an array of objects in the D3 style
 */
ssci.pointsToObject = function(data){
    return data.map(function(e){
        var temp = {};
        temp.x = e[0];
        temp.y = e[1];
        return temp;
    });
};
/** 
 * Take an array of n points and returns the parameters of n-1 cubic splines
 * i.e. spline interpolation - algorithm from Numerical Analysis 7th Edition, Burden & Faires
 * @param {array} dataArray - an array of n points
 * @returns {array} - an array with the n-1 parameter objects
 */
function splineInterpolation(dataArray){
    var h = [];
    var alpha = [];
    var l = [];
    var mu = [];
    var z = [];
    var c = [];
    var d = [];
    var b = [];
    var a = [];
    var output = [];
    var i;
    
    //Natural spline interpolation only
    //Create x differences array
    for(i=0;i<(dataArray.length-1);i++){
        h[i] = dataArray[i+1][0] - dataArray[i][0];
    }

    for(i=1;i<(dataArray.length-1);i++){
        alpha[i] = (3 / h[i]) * (dataArray[i+1][1] - dataArray[i][1]) - (3 / h[i-1]) * (dataArray[i][1] - dataArray[i-1][1]);
    }

    l[0] = 1;
    mu[0] = 0;
    z[0] = 0;
    
    for(i=1;i<(dataArray.length-1);i++){
        l[i] = 2*(dataArray[i+1][0]-dataArray[i-1][0])-h[i-1]*mu[i-1];
        mu[i] = h[i]/l[i];
        z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
    }

    l[dataArray.length-1] = 1;
    z[dataArray.length-1] = 0;
    c[dataArray.length-1] = 0;
    
    //Create parameters of cubic spline
    for(var j=(dataArray.length-2);j>=0;j--){
        c[j] = z[j] - mu[j] * c[j + 1];
        b[j] = (dataArray[j+1][1] - dataArray[j][1]) / h[j] - h[j] * (c[j + 1] + 2 * c[j]) / 3;
        d[j] = (c[j + 1] - c[j]) / (3 * h[j]);
        a[j] = dataArray[j][1];
        //Equation = a + bx + cx^2 + dx^3
        output[j] = [a[j], b[j], c[j], d[j]];
    }
    
    return output;
}
/**
 * Creates the array of control points for a bezier curve given the ends points of a cubic spline
 * @param {array} p0 - first point of the bezier and spline curves i.e. [x1, y1]
 * @param {array} p2 - end point of the bezier and spline curves i.e. [x2, y2]
 * @param {array} splineParam - the four parameters of the cubic polynomial spline
 * @returns {array} - an array of the 2 middle control points for the cubic bezier curve
 */
function splineToBezier(p0, p2, splineParam){
    var t = [1/3, 2/3];
    var x = [(p2[0]-p0[0])*t[0]+p0[0],(p2[0]-p0[0])*t[1]+p0[0]];
    var s = [splineParam[0] + splineParam[1]*(x[0]-p0[0]) + splineParam[2]*Math.pow((x[0]-p0[0]),2) + splineParam[3]*Math.pow((x[0]-p0[0]),3), splineParam[0] + splineParam[1]*(x[1]-p0[0]) + splineParam[2]*Math.pow((x[1]-p0[0]),2) + splineParam[3]*Math.pow((x[1]-p0[0]),3)];
    var b = [(s[0]-Math.pow((1-t[0]),3)*p0[1]-Math.pow(t[0],3)*p2[1])/(3*(1-t[0])*t[0]), (s[1]-Math.pow((1-t[1]),3)*p0[1]-Math.pow(t[1],3)*p2[1])/(3*(1-t[1])*t[1])];
    
    var p = [];
    p[0] = (b[1]-(t[1]*b[0]/t[0]))*(1/(1-(t[1]/t[0])));
    p[1] = (b[0] - (1-t[0])*p[0])/t[0];
    
    return [[x[0], p[0]], [x[1], p[1]]];
}
/**
 * Convert an array of objects into an array of arrays ready to be transformed to layers
 * @param {object} data - object holding the data - generally an array of objects in the d3.csv load style
 * @param {string} x1 - a string holding an object's name within 'data' to use as the x-coordinate
 * @param {string} y1 - a string holding an object's name within 'data' to use as the y-coordinate
 * @returns {array} - array of objects with 'x' and 'y' keys
 */
ssci.stackMap = function(data, x1, y1){
    return data.map(function(e){
        var temp = {};
        temp.x = e[x1];
        temp.y = e[y1];
        return temp;
    });
};
/**
 * Convert an array of objects into an array of arrays ready to be transformed to layers
 * @param {object} data - object holding the data - generally an array of objects in the d3.csv load style
 * @param {string} x1 - a string holding an object's name within 'data' to use as the x-coordinate
 * @param {array} y1 - an array of strings holding an object's name within 'data' to use as the y-coordinates
 * @returns {array} - array of objects with 'x' and 'y' keys
 */
ssci.stackMaps = function(data, x1, y1){
    
    var temp_layer = [];
    
    for(var i=0;i<y1.length;i++){
        temp_layer.push(this.stackMap(data, x1, y1[i]));
    }
    
    return temp_layer;
    
};
/**
 * Creates a string representation of an array of points
 * @param {array} e - array of points
 * @returns {string} String with commas between x and y coordinates and newlines between each set of points 
 */
ssci.toStringArray = function(e){
    var f = e.map(function(d){
        return d[0] + ", " + d[1];
    });
    return f.join("\n");
};

return ssci;

}( this ));