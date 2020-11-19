// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
window.process = { env: { NODE_ENV: "production" } };
var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, basedir, module) {
	return module = {
		path: basedir,
		exports: {},
		require: function (path, base) {
			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
		}
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var typeDetect = createCommonjsModule(function (module, exports) {
(function (global, factory) {
	 module.exports = factory() ;
}(commonjsGlobal, (function () {
/* !
 * type-detect
 * Copyright(c) 2013 jake luer <jake@alogicalparadox.com>
 * MIT Licensed
 */
var promiseExists = typeof Promise === 'function';

/* eslint-disable no-undef */
var globalObject = typeof self === 'object' ? self : commonjsGlobal; // eslint-disable-line id-blacklist

var symbolExists = typeof Symbol !== 'undefined';
var mapExists = typeof Map !== 'undefined';
var setExists = typeof Set !== 'undefined';
var weakMapExists = typeof WeakMap !== 'undefined';
var weakSetExists = typeof WeakSet !== 'undefined';
var dataViewExists = typeof DataView !== 'undefined';
var symbolIteratorExists = symbolExists && typeof Symbol.iterator !== 'undefined';
var symbolToStringTagExists = symbolExists && typeof Symbol.toStringTag !== 'undefined';
var setEntriesExists = setExists && typeof Set.prototype.entries === 'function';
var mapEntriesExists = mapExists && typeof Map.prototype.entries === 'function';
var setIteratorPrototype = setEntriesExists && Object.getPrototypeOf(new Set().entries());
var mapIteratorPrototype = mapEntriesExists && Object.getPrototypeOf(new Map().entries());
var arrayIteratorExists = symbolIteratorExists && typeof Array.prototype[Symbol.iterator] === 'function';
var arrayIteratorPrototype = arrayIteratorExists && Object.getPrototypeOf([][Symbol.iterator]());
var stringIteratorExists = symbolIteratorExists && typeof String.prototype[Symbol.iterator] === 'function';
var stringIteratorPrototype = stringIteratorExists && Object.getPrototypeOf(''[Symbol.iterator]());
var toStringLeftSliceLength = 8;
var toStringRightSliceLength = -1;
/**
 * ### typeOf (obj)
 *
 * Uses `Object.prototype.toString` to determine the type of an object,
 * normalising behaviour across engine versions & well optimised.
 *
 * @param {Mixed} object
 * @return {String} object type
 * @api public
 */
function typeDetect(obj) {
  /* ! Speed optimisation
   * Pre:
   *   string literal     x 3,039,035 ops/sec ±1.62% (78 runs sampled)
   *   boolean literal    x 1,424,138 ops/sec ±4.54% (75 runs sampled)
   *   number literal     x 1,653,153 ops/sec ±1.91% (82 runs sampled)
   *   undefined          x 9,978,660 ops/sec ±1.92% (75 runs sampled)
   *   function           x 2,556,769 ops/sec ±1.73% (77 runs sampled)
   * Post:
   *   string literal     x 38,564,796 ops/sec ±1.15% (79 runs sampled)
   *   boolean literal    x 31,148,940 ops/sec ±1.10% (79 runs sampled)
   *   number literal     x 32,679,330 ops/sec ±1.90% (78 runs sampled)
   *   undefined          x 32,363,368 ops/sec ±1.07% (82 runs sampled)
   *   function           x 31,296,870 ops/sec ±0.96% (83 runs sampled)
   */
  var typeofObj = typeof obj;
  if (typeofObj !== 'object') {
    return typeofObj;
  }

  /* ! Speed optimisation
   * Pre:
   *   null               x 28,645,765 ops/sec ±1.17% (82 runs sampled)
   * Post:
   *   null               x 36,428,962 ops/sec ±1.37% (84 runs sampled)
   */
  if (obj === null) {
    return 'null';
  }

  /* ! Spec Conformance
   * Test: `Object.prototype.toString.call(window)``
   *  - Node === "[object global]"
   *  - Chrome === "[object global]"
   *  - Firefox === "[object Window]"
   *  - PhantomJS === "[object Window]"
   *  - Safari === "[object Window]"
   *  - IE 11 === "[object Window]"
   *  - IE Edge === "[object Window]"
   * Test: `Object.prototype.toString.call(this)``
   *  - Chrome Worker === "[object global]"
   *  - Firefox Worker === "[object DedicatedWorkerGlobalScope]"
   *  - Safari Worker === "[object DedicatedWorkerGlobalScope]"
   *  - IE 11 Worker === "[object WorkerGlobalScope]"
   *  - IE Edge Worker === "[object WorkerGlobalScope]"
   */
  if (obj === globalObject) {
    return 'global';
  }

  /* ! Speed optimisation
   * Pre:
   *   array literal      x 2,888,352 ops/sec ±0.67% (82 runs sampled)
   * Post:
   *   array literal      x 22,479,650 ops/sec ±0.96% (81 runs sampled)
   */
  if (
    Array.isArray(obj) &&
    (symbolToStringTagExists === false || !(Symbol.toStringTag in obj))
  ) {
    return 'Array';
  }

  // Not caching existence of `window` and related properties due to potential
  // for `window` to be unset before tests in quasi-browser environments.
  if (typeof window === 'object' && window !== null) {
    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/multipage/browsers.html#location)
     * WhatWG HTML$7.7.3 - The `Location` interface
     * Test: `Object.prototype.toString.call(window.location)``
     *  - IE <=11 === "[object Object]"
     *  - IE Edge <=13 === "[object Object]"
     */
    if (typeof window.location === 'object' && obj === window.location) {
      return 'Location';
    }

    /* ! Spec Conformance
     * (https://html.spec.whatwg.org/#document)
     * WhatWG HTML$3.1.1 - The `Document` object
     * Note: Most browsers currently adher to the W3C DOM Level 2 spec
     *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-26809268)
     *       which suggests that browsers should use HTMLTableCellElement for
     *       both TD and TH elements. WhatWG separates these.
     *       WhatWG HTML states:
     *         > For historical reasons, Window objects must also have a
     *         > writable, configurable, non-enumerable property named
     *         > HTMLDocument whose value is the Document interface object.
     * Test: `Object.prototype.toString.call(document)``
     *  - Chrome === "[object HTMLDocument]"
     *  - Firefox === "[object HTMLDocument]"
     *  - Safari === "[object HTMLDocument]"
     *  - IE <=10 === "[object Document]"
     *  - IE 11 === "[object HTMLDocument]"
     *  - IE Edge <=13 === "[object HTMLDocument]"
     */
    if (typeof window.document === 'object' && obj === window.document) {
      return 'Document';
    }

    if (typeof window.navigator === 'object') {
      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#mimetypearray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface MimeTypeArray
       * Test: `Object.prototype.toString.call(navigator.mimeTypes)``
       *  - IE <=10 === "[object MSMimeTypesCollection]"
       */
      if (typeof window.navigator.mimeTypes === 'object' &&
          obj === window.navigator.mimeTypes) {
        return 'MimeTypeArray';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
       * WhatWG HTML$8.6.1.5 - Plugins - Interface PluginArray
       * Test: `Object.prototype.toString.call(navigator.plugins)``
       *  - IE <=10 === "[object MSPluginsCollection]"
       */
      if (typeof window.navigator.plugins === 'object' &&
          obj === window.navigator.plugins) {
        return 'PluginArray';
      }
    }

    if ((typeof window.HTMLElement === 'function' ||
        typeof window.HTMLElement === 'object') &&
        obj instanceof window.HTMLElement) {
      /* ! Spec Conformance
      * (https://html.spec.whatwg.org/multipage/webappapis.html#pluginarray)
      * WhatWG HTML$4.4.4 - The `blockquote` element - Interface `HTMLQuoteElement`
      * Test: `Object.prototype.toString.call(document.createElement('blockquote'))``
      *  - IE <=10 === "[object HTMLBlockElement]"
      */
      if (obj.tagName === 'BLOCKQUOTE') {
        return 'HTMLQuoteElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltabledatacellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableDataCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('td'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TD') {
        return 'HTMLTableDataCellElement';
      }

      /* ! Spec Conformance
       * (https://html.spec.whatwg.org/#htmltableheadercellelement)
       * WhatWG HTML$4.9.9 - The `td` element - Interface `HTMLTableHeaderCellElement`
       * Note: Most browsers currently adher to the W3C DOM Level 2 spec
       *       (https://www.w3.org/TR/DOM-Level-2-HTML/html.html#ID-82915075)
       *       which suggests that browsers should use HTMLTableCellElement for
       *       both TD and TH elements. WhatWG separates these.
       * Test: Object.prototype.toString.call(document.createElement('th'))
       *  - Chrome === "[object HTMLTableCellElement]"
       *  - Firefox === "[object HTMLTableCellElement]"
       *  - Safari === "[object HTMLTableCellElement]"
       */
      if (obj.tagName === 'TH') {
        return 'HTMLTableHeaderCellElement';
      }
    }
  }

  /* ! Speed optimisation
  * Pre:
  *   Float64Array       x 625,644 ops/sec ±1.58% (80 runs sampled)
  *   Float32Array       x 1,279,852 ops/sec ±2.91% (77 runs sampled)
  *   Uint32Array        x 1,178,185 ops/sec ±1.95% (83 runs sampled)
  *   Uint16Array        x 1,008,380 ops/sec ±2.25% (80 runs sampled)
  *   Uint8Array         x 1,128,040 ops/sec ±2.11% (81 runs sampled)
  *   Int32Array         x 1,170,119 ops/sec ±2.88% (80 runs sampled)
  *   Int16Array         x 1,176,348 ops/sec ±5.79% (86 runs sampled)
  *   Int8Array          x 1,058,707 ops/sec ±4.94% (77 runs sampled)
  *   Uint8ClampedArray  x 1,110,633 ops/sec ±4.20% (80 runs sampled)
  * Post:
  *   Float64Array       x 7,105,671 ops/sec ±13.47% (64 runs sampled)
  *   Float32Array       x 5,887,912 ops/sec ±1.46% (82 runs sampled)
  *   Uint32Array        x 6,491,661 ops/sec ±1.76% (79 runs sampled)
  *   Uint16Array        x 6,559,795 ops/sec ±1.67% (82 runs sampled)
  *   Uint8Array         x 6,463,966 ops/sec ±1.43% (85 runs sampled)
  *   Int32Array         x 5,641,841 ops/sec ±3.49% (81 runs sampled)
  *   Int16Array         x 6,583,511 ops/sec ±1.98% (80 runs sampled)
  *   Int8Array          x 6,606,078 ops/sec ±1.74% (81 runs sampled)
  *   Uint8ClampedArray  x 6,602,224 ops/sec ±1.77% (83 runs sampled)
  */
  var stringTag = (symbolToStringTagExists && obj[Symbol.toStringTag]);
  if (typeof stringTag === 'string') {
    return stringTag;
  }

  var objPrototype = Object.getPrototypeOf(obj);
  /* ! Speed optimisation
  * Pre:
  *   regex literal      x 1,772,385 ops/sec ±1.85% (77 runs sampled)
  *   regex constructor  x 2,143,634 ops/sec ±2.46% (78 runs sampled)
  * Post:
  *   regex literal      x 3,928,009 ops/sec ±0.65% (78 runs sampled)
  *   regex constructor  x 3,931,108 ops/sec ±0.58% (84 runs sampled)
  */
  if (objPrototype === RegExp.prototype) {
    return 'RegExp';
  }

  /* ! Speed optimisation
  * Pre:
  *   date               x 2,130,074 ops/sec ±4.42% (68 runs sampled)
  * Post:
  *   date               x 3,953,779 ops/sec ±1.35% (77 runs sampled)
  */
  if (objPrototype === Date.prototype) {
    return 'Date';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-promise.prototype-@@tostringtag)
   * ES6$25.4.5.4 - Promise.prototype[@@toStringTag] should be "Promise":
   * Test: `Object.prototype.toString.call(Promise.resolve())``
   *  - Chrome <=47 === "[object Object]"
   *  - Edge <=20 === "[object Object]"
   *  - Firefox 29-Latest === "[object Promise]"
   *  - Safari 7.1-Latest === "[object Promise]"
   */
  if (promiseExists && objPrototype === Promise.prototype) {
    return 'Promise';
  }

  /* ! Speed optimisation
  * Pre:
  *   set                x 2,222,186 ops/sec ±1.31% (82 runs sampled)
  * Post:
  *   set                x 4,545,879 ops/sec ±1.13% (83 runs sampled)
  */
  if (setExists && objPrototype === Set.prototype) {
    return 'Set';
  }

  /* ! Speed optimisation
  * Pre:
  *   map                x 2,396,842 ops/sec ±1.59% (81 runs sampled)
  * Post:
  *   map                x 4,183,945 ops/sec ±6.59% (82 runs sampled)
  */
  if (mapExists && objPrototype === Map.prototype) {
    return 'Map';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakset            x 1,323,220 ops/sec ±2.17% (76 runs sampled)
  * Post:
  *   weakset            x 4,237,510 ops/sec ±2.01% (77 runs sampled)
  */
  if (weakSetExists && objPrototype === WeakSet.prototype) {
    return 'WeakSet';
  }

  /* ! Speed optimisation
  * Pre:
  *   weakmap            x 1,500,260 ops/sec ±2.02% (78 runs sampled)
  * Post:
  *   weakmap            x 3,881,384 ops/sec ±1.45% (82 runs sampled)
  */
  if (weakMapExists && objPrototype === WeakMap.prototype) {
    return 'WeakMap';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-dataview.prototype-@@tostringtag)
   * ES6$24.2.4.21 - DataView.prototype[@@toStringTag] should be "DataView":
   * Test: `Object.prototype.toString.call(new DataView(new ArrayBuffer(1)))``
   *  - Edge <=13 === "[object Object]"
   */
  if (dataViewExists && objPrototype === DataView.prototype) {
    return 'DataView';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%mapiteratorprototype%-@@tostringtag)
   * ES6$23.1.5.2.2 - %MapIteratorPrototype%[@@toStringTag] should be "Map Iterator":
   * Test: `Object.prototype.toString.call(new Map().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (mapExists && objPrototype === mapIteratorPrototype) {
    return 'Map Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%setiteratorprototype%-@@tostringtag)
   * ES6$23.2.5.2.2 - %SetIteratorPrototype%[@@toStringTag] should be "Set Iterator":
   * Test: `Object.prototype.toString.call(new Set().entries())``
   *  - Edge <=13 === "[object Object]"
   */
  if (setExists && objPrototype === setIteratorPrototype) {
    return 'Set Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%arrayiteratorprototype%-@@tostringtag)
   * ES6$22.1.5.2.2 - %ArrayIteratorPrototype%[@@toStringTag] should be "Array Iterator":
   * Test: `Object.prototype.toString.call([][Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (arrayIteratorExists && objPrototype === arrayIteratorPrototype) {
    return 'Array Iterator';
  }

  /* ! Spec Conformance
   * (http://www.ecma-international.org/ecma-262/6.0/index.html#sec-%stringiteratorprototype%-@@tostringtag)
   * ES6$21.1.5.2.2 - %StringIteratorPrototype%[@@toStringTag] should be "String Iterator":
   * Test: `Object.prototype.toString.call(''[Symbol.iterator]())``
   *  - Edge <=13 === "[object Object]"
   */
  if (stringIteratorExists && objPrototype === stringIteratorPrototype) {
    return 'String Iterator';
  }

  /* ! Speed optimisation
  * Pre:
  *   object from null   x 2,424,320 ops/sec ±1.67% (76 runs sampled)
  * Post:
  *   object from null   x 5,838,000 ops/sec ±0.99% (84 runs sampled)
  */
  if (objPrototype === null) {
    return 'Object';
  }

  return Object
    .prototype
    .toString
    .call(obj)
    .slice(toStringLeftSliceLength, toStringRightSliceLength);
}

return typeDetect;

})));
});

/* globals Symbol: false, Uint8Array: false, WeakMap: false */
/*!
 * deep-eql
 * Copyright(c) 2013 Jake Luer <jake@alogicalparadox.com>
 * MIT Licensed
 */


function FakeMap() {
  this._key = 'chai/deep-eql__' + Math.random() + Date.now();
}

FakeMap.prototype = {
  get: function getMap(key) {
    return key[this._key];
  },
  set: function setMap(key, value) {
    if (Object.isExtensible(key)) {
      Object.defineProperty(key, this._key, {
        value: value,
        configurable: true,
      });
    }
  },
};

var MemoizeMap = typeof WeakMap === 'function' ? WeakMap : FakeMap;
/*!
 * Check to see if the MemoizeMap has recorded a result of the two operands
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @returns {Boolean|null} result
*/
function memoizeCompare(leftHandOperand, rightHandOperand, memoizeMap) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return null;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    var result = leftHandMap.get(rightHandOperand);
    if (typeof result === 'boolean') {
      return result;
    }
  }
  return null;
}

/*!
 * Set the result of the equality into the MemoizeMap
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {MemoizeMap} memoizeMap
 * @param {Boolean} result
*/
function memoizeSet(leftHandOperand, rightHandOperand, memoizeMap, result) {
  // Technically, WeakMap keys can *only* be objects, not primitives.
  if (!memoizeMap || isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    return;
  }
  var leftHandMap = memoizeMap.get(leftHandOperand);
  if (leftHandMap) {
    leftHandMap.set(rightHandOperand, result);
  } else {
    leftHandMap = new MemoizeMap();
    leftHandMap.set(rightHandOperand, result);
    memoizeMap.set(leftHandOperand, leftHandMap);
  }
}

/*!
 * Primary Export
 */

var deepEql = deepEqual;
var MemoizeMap_1 = MemoizeMap;

/**
 * Assert deeply nested sameValue equality between two objects of any type.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
 */
function deepEqual(leftHandOperand, rightHandOperand, options) {
  // If we have a comparator, we can't assume anything; so bail to its check first.
  if (options && options.comparator) {
    return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
  }

  var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
  if (simpleResult !== null) {
    return simpleResult;
  }

  // Deeper comparisons are pushed through to a larger function
  return extensiveDeepEqual(leftHandOperand, rightHandOperand, options);
}

/**
 * Many comparisons can be canceled out early via simple equality or primitive checks.
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @return {Boolean|null} equal match
 */
function simpleEqual(leftHandOperand, rightHandOperand) {
  // Equal references (except for Numbers) can be returned early
  if (leftHandOperand === rightHandOperand) {
    // Handle +-0 cases
    return leftHandOperand !== 0 || 1 / leftHandOperand === 1 / rightHandOperand;
  }

  // handle NaN cases
  if (
    leftHandOperand !== leftHandOperand && // eslint-disable-line no-self-compare
    rightHandOperand !== rightHandOperand // eslint-disable-line no-self-compare
  ) {
    return true;
  }

  // Anything that is not an 'object', i.e. symbols, functions, booleans, numbers,
  // strings, and undefined, can be compared by reference.
  if (isPrimitive(leftHandOperand) || isPrimitive(rightHandOperand)) {
    // Easy out b/c it would have passed the first equality check
    return false;
  }
  return null;
}

/*!
 * The main logic of the `deepEqual` function.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (optional) Additional options
 * @param {Array} [options.comparator] (optional) Override default algorithm, determining custom equality.
 * @param {Array} [options.memoize] (optional) Provide a custom memoization object which will cache the results of
    complex objects for a speed boost. By passing `false` you can disable memoization, but this will cause circular
    references to blow the stack.
 * @return {Boolean} equal match
*/
function extensiveDeepEqual(leftHandOperand, rightHandOperand, options) {
  options = options || {};
  options.memoize = options.memoize === false ? false : options.memoize || new MemoizeMap();
  var comparator = options && options.comparator;

  // Check if a memoized result exists.
  var memoizeResultLeft = memoizeCompare(leftHandOperand, rightHandOperand, options.memoize);
  if (memoizeResultLeft !== null) {
    return memoizeResultLeft;
  }
  var memoizeResultRight = memoizeCompare(rightHandOperand, leftHandOperand, options.memoize);
  if (memoizeResultRight !== null) {
    return memoizeResultRight;
  }

  // If a comparator is present, use it.
  if (comparator) {
    var comparatorResult = comparator(leftHandOperand, rightHandOperand);
    // Comparators may return null, in which case we want to go back to default behavior.
    if (comparatorResult === false || comparatorResult === true) {
      memoizeSet(leftHandOperand, rightHandOperand, options.memoize, comparatorResult);
      return comparatorResult;
    }
    // To allow comparators to override *any* behavior, we ran them first. Since it didn't decide
    // what to do, we need to make sure to return the basic tests first before we move on.
    var simpleResult = simpleEqual(leftHandOperand, rightHandOperand);
    if (simpleResult !== null) {
      // Don't memoize this, it takes longer to set/retrieve than to just compare.
      return simpleResult;
    }
  }

  var leftHandType = typeDetect(leftHandOperand);
  if (leftHandType !== typeDetect(rightHandOperand)) {
    memoizeSet(leftHandOperand, rightHandOperand, options.memoize, false);
    return false;
  }

  // Temporarily set the operands in the memoize object to prevent blowing the stack
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, true);

  var result = extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options);
  memoizeSet(leftHandOperand, rightHandOperand, options.memoize, result);
  return result;
}

function extensiveDeepEqualByType(leftHandOperand, rightHandOperand, leftHandType, options) {
  switch (leftHandType) {
    case 'String':
    case 'Number':
    case 'Boolean':
    case 'Date':
      // If these types are their instance types (e.g. `new Number`) then re-deepEqual against their values
      return deepEqual(leftHandOperand.valueOf(), rightHandOperand.valueOf());
    case 'Promise':
    case 'Symbol':
    case 'function':
    case 'WeakMap':
    case 'WeakSet':
      return leftHandOperand === rightHandOperand;
    case 'Error':
      return keysEqual(leftHandOperand, rightHandOperand, [ 'name', 'message', 'code' ], options);
    case 'Arguments':
    case 'Int8Array':
    case 'Uint8Array':
    case 'Uint8ClampedArray':
    case 'Int16Array':
    case 'Uint16Array':
    case 'Int32Array':
    case 'Uint32Array':
    case 'Float32Array':
    case 'Float64Array':
    case 'Array':
      return iterableEqual(leftHandOperand, rightHandOperand, options);
    case 'RegExp':
      return regexpEqual(leftHandOperand, rightHandOperand);
    case 'Generator':
      return generatorEqual(leftHandOperand, rightHandOperand, options);
    case 'DataView':
      return iterableEqual(new Uint8Array(leftHandOperand.buffer), new Uint8Array(rightHandOperand.buffer), options);
    case 'ArrayBuffer':
      return iterableEqual(new Uint8Array(leftHandOperand), new Uint8Array(rightHandOperand), options);
    case 'Set':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    case 'Map':
      return entriesEqual(leftHandOperand, rightHandOperand, options);
    default:
      return objectEqual(leftHandOperand, rightHandOperand, options);
  }
}

/*!
 * Compare two Regular Expressions for equality.
 *
 * @param {RegExp} leftHandOperand
 * @param {RegExp} rightHandOperand
 * @return {Boolean} result
 */

function regexpEqual(leftHandOperand, rightHandOperand) {
  return leftHandOperand.toString() === rightHandOperand.toString();
}

/*!
 * Compare two Sets/Maps for equality. Faster than other equality functions.
 *
 * @param {Set} leftHandOperand
 * @param {Set} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function entriesEqual(leftHandOperand, rightHandOperand, options) {
  // IE11 doesn't support Set#entries or Set#@@iterator, so we need manually populate using Set#forEach
  if (leftHandOperand.size !== rightHandOperand.size) {
    return false;
  }
  if (leftHandOperand.size === 0) {
    return true;
  }
  var leftHandItems = [];
  var rightHandItems = [];
  leftHandOperand.forEach(function gatherEntries(key, value) {
    leftHandItems.push([ key, value ]);
  });
  rightHandOperand.forEach(function gatherEntries(key, value) {
    rightHandItems.push([ key, value ]);
  });
  return iterableEqual(leftHandItems.sort(), rightHandItems.sort(), options);
}

/*!
 * Simple equality for flat iterable objects such as Arrays, TypedArrays or Node.js buffers.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function iterableEqual(leftHandOperand, rightHandOperand, options) {
  var length = leftHandOperand.length;
  if (length !== rightHandOperand.length) {
    return false;
  }
  if (length === 0) {
    return true;
  }
  var index = -1;
  while (++index < length) {
    if (deepEqual(leftHandOperand[index], rightHandOperand[index], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Simple equality for generator objects such as those returned by generator functions.
 *
 * @param {Iterable} leftHandOperand
 * @param {Iterable} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */

function generatorEqual(leftHandOperand, rightHandOperand, options) {
  return iterableEqual(getGeneratorEntries(leftHandOperand), getGeneratorEntries(rightHandOperand), options);
}

/*!
 * Determine if the given object has an @@iterator function.
 *
 * @param {Object} target
 * @return {Boolean} `true` if the object has an @@iterator function.
 */
function hasIteratorFunction(target) {
  return typeof Symbol !== 'undefined' &&
    typeof target === 'object' &&
    typeof Symbol.iterator !== 'undefined' &&
    typeof target[Symbol.iterator] === 'function';
}

/*!
 * Gets all iterator entries from the given Object. If the Object has no @@iterator function, returns an empty array.
 * This will consume the iterator - which could have side effects depending on the @@iterator implementation.
 *
 * @param {Object} target
 * @returns {Array} an array of entries from the @@iterator function
 */
function getIteratorEntries(target) {
  if (hasIteratorFunction(target)) {
    try {
      return getGeneratorEntries(target[Symbol.iterator]());
    } catch (iteratorError) {
      return [];
    }
  }
  return [];
}

/*!
 * Gets all entries from a Generator. This will consume the generator - which could have side effects.
 *
 * @param {Generator} target
 * @returns {Array} an array of entries from the Generator.
 */
function getGeneratorEntries(generator) {
  var generatorResult = generator.next();
  var accumulator = [ generatorResult.value ];
  while (generatorResult.done === false) {
    generatorResult = generator.next();
    accumulator.push(generatorResult.value);
  }
  return accumulator;
}

/*!
 * Gets all own and inherited enumerable keys from a target.
 *
 * @param {Object} target
 * @returns {Array} an array of own and inherited enumerable keys from the target.
 */
function getEnumerableKeys(target) {
  var keys = [];
  for (var key in target) {
    keys.push(key);
  }
  return keys;
}

/*!
 * Determines if two objects have matching values, given a set of keys. Defers to deepEqual for the equality check of
 * each key. If any value of the given key is not equal, the function will return false (early).
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Array} keys An array of keys to compare the values of leftHandOperand and rightHandOperand against
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */
function keysEqual(leftHandOperand, rightHandOperand, keys, options) {
  var length = keys.length;
  if (length === 0) {
    return true;
  }
  for (var i = 0; i < length; i += 1) {
    if (deepEqual(leftHandOperand[keys[i]], rightHandOperand[keys[i]], options) === false) {
      return false;
    }
  }
  return true;
}

/*!
 * Recursively check the equality of two Objects. Once basic sameness has been established it will defer to `deepEqual`
 * for each enumerable key in the object.
 *
 * @param {Mixed} leftHandOperand
 * @param {Mixed} rightHandOperand
 * @param {Object} [options] (Optional)
 * @return {Boolean} result
 */
function objectEqual(leftHandOperand, rightHandOperand, options) {
  var leftHandKeys = getEnumerableKeys(leftHandOperand);
  var rightHandKeys = getEnumerableKeys(rightHandOperand);
  if (leftHandKeys.length && leftHandKeys.length === rightHandKeys.length) {
    leftHandKeys.sort();
    rightHandKeys.sort();
    if (iterableEqual(leftHandKeys, rightHandKeys) === false) {
      return false;
    }
    return keysEqual(leftHandOperand, rightHandOperand, leftHandKeys, options);
  }

  var leftHandEntries = getIteratorEntries(leftHandOperand);
  var rightHandEntries = getIteratorEntries(rightHandOperand);
  if (leftHandEntries.length && leftHandEntries.length === rightHandEntries.length) {
    leftHandEntries.sort();
    rightHandEntries.sort();
    return iterableEqual(leftHandEntries, rightHandEntries, options);
  }

  if (leftHandKeys.length === 0 &&
      leftHandEntries.length === 0 &&
      rightHandKeys.length === 0 &&
      rightHandEntries.length === 0) {
    return true;
  }

  return false;
}

/*!
 * Returns true if the argument is a primitive.
 *
 * This intentionally returns true for all objects that can be compared by reference,
 * including functions and symbols.
 *
 * @param {Mixed} value
 * @return {Boolean} result
 */
function isPrimitive(value) {
  return value === null || typeof value !== 'object';
}
deepEql.MemoizeMap = MemoizeMap_1;

/**
 * Get file size in KB, MB, GB, or TB (whatever is closest), from bytes.
 * From: https://gist.github.com/lanqy/5193417#gistcomment-3240729
 * @param {*} bytes
 * @param {*} separator 
 * @param {*} postFix 
 */
function prettySize(bytes, separator = ' ', postFix = '') {
  if (bytes) {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.min(parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString(), 10), sizes.length - 1);
      return `${(bytes / (1024 ** i)).toFixed(i ? 1 : 0)}${separator}${sizes[i]}${postFix}`;
  }
  return 'n/a';
}

function stringify(value) {
  return JSON.stringify(value, null, '\t')
}

function extractKeysFromString(keyAsString) {
	// Convert propAddress string to array of keys
  // Before: "projects[5].window"
  // After: ["projects", 5, "window"]
  const regex = /[^\.\[\]]+?(?=\.|\[|\]|$)/g;
  const keys = keyAsString.match(regex);
  if (keys && keys.length) {
    keys.forEach((p, index, thisArray) => {
      // Find strings that are just integers, and convert to integers
      if (/\d/.test(p)) {
        thisArray[index] = parseInt(p, 10);
      }
    });
  }
  return keys
}




const getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce((obj, key) =>
		(obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
};

function hasChanged(keysAsString = undefined, objA, objB) {
  if (keysAsString && keysAsString !== '*') {
    const keys = extractKeysFromString(keysAsString);
    const objAVal = getNestedObject(objA, keys);
    const objBVal = getNestedObject(objB, keys);
    if (objAVal == undefined || objBVal == undefined) {
      // If either is undefined, return undefined
      return undefined
    } else if (typeof objAVal == 'object' && typeof objBVal == 'object') {
      // If both are objects, do a deep object comparison
      return !deepEql(objAVal, objBVal)
    } else {
      // Else, compare values
      return objAVal !== objBVal
    }
  } else {
    return !deepEql(objA, objB)
  }
}

function hasChangedTo(keysAsString, value, objTo, objFrom) {
  if (!keysAsString || !value ) {
    // If either required arguments are missing or empty, return undefined
    return undefined
  } else {
    const keys = extractKeysFromString(keysAsString);
    const objToVal = getNestedObject(objTo, keys);
    const objFromVal = getNestedObject(objFrom, keys);
    if (typeof objToVal == 'object' || typeof objFromVal == 'object') {
      // If either value is an object, return undefined.
      // For now, we don't allow checking against objects.
      return undefined
    } else if (objToVal === objFromVal) {
      // If no change, return false
      return false
    } else {
      // Else, check if objTo equals value
      return objToVal === value
    }
  }
}

function noop() { }
const identity = x => x;
function assign(tar, src) {
    // @ts-ignore
    for (const k in src)
        tar[k] = src[k];
    return tar;
}
function run(fn) {
    return fn();
}
function blank_object() {
    return Object.create(null);
}
function run_all(fns) {
    fns.forEach(run);
}
function is_function(thing) {
    return typeof thing === 'function';
}
function safe_not_equal(a, b) {
    return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}
function not_equal(a, b) {
    return a != a ? b == b : a !== b;
}
function is_empty(obj) {
    return Object.keys(obj).length === 0;
}
function subscribe(store, ...callbacks) {
    if (store == null) {
        return noop;
    }
    const unsub = store.subscribe(...callbacks);
    return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function component_subscribe(component, store, callback) {
    component.$$.on_destroy.push(subscribe(store, callback));
}
function create_slot(definition, ctx, $$scope, fn) {
    if (definition) {
        const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
        return definition[0](slot_ctx);
    }
}
function get_slot_context(definition, ctx, $$scope, fn) {
    return definition[1] && fn
        ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
        : $$scope.ctx;
}
function get_slot_changes(definition, $$scope, dirty, fn) {
    if (definition[2] && fn) {
        const lets = definition[2](fn(dirty));
        if ($$scope.dirty === undefined) {
            return lets;
        }
        if (typeof lets === 'object') {
            const merged = [];
            const len = Math.max($$scope.dirty.length, lets.length);
            for (let i = 0; i < len; i += 1) {
                merged[i] = $$scope.dirty[i] | lets[i];
            }
            return merged;
        }
        return $$scope.dirty | lets;
    }
    return $$scope.dirty;
}
function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
    const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
    if (slot_changes) {
        const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
        slot.p(slot_context, slot_changes);
    }
}
function null_to_empty(value) {
    return value == null ? '' : value;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
}

const is_client = typeof window !== 'undefined';
let now = is_client
    ? () => window.performance.now()
    : () => Date.now();
let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

const tasks = new Set();
function run_tasks(now) {
    tasks.forEach(task => {
        if (!task.c(now)) {
            tasks.delete(task);
            task.f();
        }
    });
    if (tasks.size !== 0)
        raf(run_tasks);
}
/**
 * Creates a new task that runs on each raf frame
 * until it returns a falsy value or is aborted
 */
function loop(callback) {
    let task;
    if (tasks.size === 0)
        raf(run_tasks);
    return {
        promise: new Promise(fulfill => {
            tasks.add(task = { c: callback, f: fulfill });
        }),
        abort() {
            tasks.delete(task);
        }
    };
}

function append(target, node) {
    target.appendChild(node);
}
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);
}
function detach(node) {
    node.parentNode.removeChild(node);
}
function destroy_each(iterations, detaching) {
    for (let i = 0; i < iterations.length; i += 1) {
        if (iterations[i])
            iterations[i].d(detaching);
    }
}
function element(name) {
    return document.createElement(name);
}
function text(data) {
    return document.createTextNode(data);
}
function space() {
    return text(' ');
}
function empty() {
    return text('');
}
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
}
function prevent_default(fn) {
    return function (event) {
        event.preventDefault();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function stop_propagation(fn) {
    return function (event) {
        event.stopPropagation();
        // @ts-ignore
        return fn.call(this, event);
    };
}
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);
}
function children(element) {
    return Array.from(element.childNodes);
}
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;
}
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
}
function custom_event(type, detail) {
    const e = document.createEvent('CustomEvent');
    e.initCustomEvent(type, false, false, detail);
    return e;
}

const active_docs = new Set();
let active = 0;
// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
    let hash = 5381;
    let i = str.length;
    while (i--)
        hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
    return hash >>> 0;
}
function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
    const step = 16.666 / duration;
    let keyframes = '{\n';
    for (let p = 0; p <= 1; p += step) {
        const t = a + (b - a) * ease(p);
        keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
    }
    const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
    const name = `__svelte_${hash(rule)}_${uid}`;
    const doc = node.ownerDocument;
    active_docs.add(doc);
    const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
    const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
    if (!current_rules[name]) {
        current_rules[name] = true;
        stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
    }
    const animation = node.style.animation || '';
    node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
    active += 1;
    return name;
}
function delete_rule(node, name) {
    const previous = (node.style.animation || '').split(', ');
    const next = previous.filter(name
        ? anim => anim.indexOf(name) < 0 // remove specific animation
        : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
    );
    const deleted = previous.length - next.length;
    if (deleted) {
        node.style.animation = next.join(', ');
        active -= deleted;
        if (!active)
            clear_rules();
    }
}
function clear_rules() {
    raf(() => {
        if (active)
            return;
        active_docs.forEach(doc => {
            const stylesheet = doc.__svelte_stylesheet;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            doc.__svelte_rules = {};
        });
        active_docs.clear();
    });
}

function create_animation(node, from, fn, params) {
    if (!from)
        return noop;
    const to = node.getBoundingClientRect();
    if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
        return noop;
    const { delay = 0, duration = 300, easing = identity, 
    // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
    start: start_time = now() + delay, 
    // @ts-ignore todo:
    end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
    let running = true;
    let started = false;
    let name;
    function start() {
        if (css) {
            name = create_rule(node, 0, 1, duration, delay, easing, css);
        }
        if (!delay) {
            started = true;
        }
    }
    function stop() {
        if (css)
            delete_rule(node, name);
        running = false;
    }
    loop(now => {
        if (!started && now >= start_time) {
            started = true;
        }
        if (started && now >= end) {
            tick(1, 0);
            stop();
        }
        if (!running) {
            return false;
        }
        if (started) {
            const p = now - start_time;
            const t = 0 + 1 * easing(p / duration);
            tick(t, 1 - t);
        }
        return true;
    });
    start();
    tick(0, 1);
    return stop;
}
function fix_position(node) {
    const style = getComputedStyle(node);
    if (style.position !== 'absolute' && style.position !== 'fixed') {
        const { width, height } = style;
        const a = node.getBoundingClientRect();
        node.style.position = 'absolute';
        node.style.width = width;
        node.style.height = height;
        add_transform(node, a);
    }
}
function add_transform(node, a) {
    const b = node.getBoundingClientRect();
    if (a.left !== b.left || a.top !== b.top) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
    }
}

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error('Function called outside component initialization');
    return current_component;
}
function createEventDispatcher() {
    const component = get_current_component();
    return (type, detail) => {
        const callbacks = component.$$.callbacks[type];
        if (callbacks) {
            // TODO are there situations where events could be dispatched
            // in a server (non-DOM) environment?
            const event = custom_event(type, detail);
            callbacks.slice().forEach(fn => {
                fn.call(component, event);
            });
        }
    };
}
// TODO figure out if we still want to support
// shorthand events, or if we want to implement
// a real bubbling mechanism
function bubble(component, event) {
    const callbacks = component.$$.callbacks[event.type];
    if (callbacks) {
        callbacks.slice().forEach(fn => fn(event));
    }
}

const dirty_components = [];
const binding_callbacks = [];
const render_callbacks = [];
const flush_callbacks = [];
const resolved_promise = Promise.resolve();
let update_scheduled = false;
function schedule_update() {
    if (!update_scheduled) {
        update_scheduled = true;
        resolved_promise.then(flush);
    }
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
}
function add_flush_callback(fn) {
    flush_callbacks.push(fn);
}
let flushing = false;
const seen_callbacks = new Set();
function flush() {
    if (flushing)
        return;
    flushing = true;
    do {
        // first, call beforeUpdate functions
        // and update components
        for (let i = 0; i < dirty_components.length; i += 1) {
            const component = dirty_components[i];
            set_current_component(component);
            update(component.$$);
        }
        set_current_component(null);
        dirty_components.length = 0;
        while (binding_callbacks.length)
            binding_callbacks.pop()();
        // then, once components are updated, call
        // afterUpdate functions. This may cause
        // subsequent updates...
        for (let i = 0; i < render_callbacks.length; i += 1) {
            const callback = render_callbacks[i];
            if (!seen_callbacks.has(callback)) {
                // ...so guard against infinite loops
                seen_callbacks.add(callback);
                callback();
            }
        }
        render_callbacks.length = 0;
    } while (dirty_components.length);
    while (flush_callbacks.length) {
        flush_callbacks.pop()();
    }
    update_scheduled = false;
    flushing = false;
    seen_callbacks.clear();
}
function update($$) {
    if ($$.fragment !== null) {
        $$.update();
        run_all($$.before_update);
        const dirty = $$.dirty;
        $$.dirty = [-1];
        $$.fragment && $$.fragment.p($$.ctx, dirty);
        $$.after_update.forEach(add_render_callback);
    }
}

let promise;
function wait() {
    if (!promise) {
        promise = Promise.resolve();
        promise.then(() => {
            promise = null;
        });
    }
    return promise;
}
function dispatch(node, direction, kind) {
    node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
}
const outroing = new Set();
let outros;
function group_outros() {
    outros = {
        r: 0,
        c: [],
        p: outros // parent group
    };
}
function check_outros() {
    if (!outros.r) {
        run_all(outros.c);
    }
    outros = outros.p;
}
function transition_in(block, local) {
    if (block && block.i) {
        outroing.delete(block);
        block.i(local);
    }
}
function transition_out(block, local, detach, callback) {
    if (block && block.o) {
        if (outroing.has(block))
            return;
        outroing.add(block);
        outros.c.push(() => {
            outroing.delete(block);
            if (callback) {
                if (detach)
                    block.d(1);
                callback();
            }
        });
        block.o(local);
    }
}
const null_transition = { duration: 0 };
function create_bidirectional_transition(node, fn, params, intro) {
    let config = fn(node, params);
    let t = intro ? 0 : 1;
    let running_program = null;
    let pending_program = null;
    let animation_name = null;
    function clear_animation() {
        if (animation_name)
            delete_rule(node, animation_name);
    }
    function init(program, duration) {
        const d = program.b - t;
        duration *= Math.abs(d);
        return {
            a: t,
            b: program.b,
            d,
            duration,
            start: program.start,
            end: program.start + duration,
            group: program.group
        };
    }
    function go(b) {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        const program = {
            start: now() + delay,
            b
        };
        if (!b) {
            // @ts-ignore todo: improve typings
            program.group = outros;
            outros.r += 1;
        }
        if (running_program || pending_program) {
            pending_program = program;
        }
        else {
            // if this is an intro, and there's a delay, we need to do
            // an initial tick and/or apply CSS animation immediately
            if (css) {
                clear_animation();
                animation_name = create_rule(node, t, b, duration, delay, easing, css);
            }
            if (b)
                tick(0, 1);
            running_program = init(program, duration);
            add_render_callback(() => dispatch(node, b, 'start'));
            loop(now => {
                if (pending_program && now > pending_program.start) {
                    running_program = init(pending_program, duration);
                    pending_program = null;
                    dispatch(node, running_program.b, 'start');
                    if (css) {
                        clear_animation();
                        animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                    }
                }
                if (running_program) {
                    if (now >= running_program.end) {
                        tick(t = running_program.b, 1 - t);
                        dispatch(node, running_program.b, 'end');
                        if (!pending_program) {
                            // we're done
                            if (running_program.b) {
                                // intro — we can tidy up immediately
                                clear_animation();
                            }
                            else {
                                // outro — needs to be coordinated
                                if (!--running_program.group.r)
                                    run_all(running_program.group.c);
                            }
                        }
                        running_program = null;
                    }
                    else if (now >= running_program.start) {
                        const p = now - running_program.start;
                        t = running_program.a + running_program.d * easing(p / running_program.duration);
                        tick(t, 1 - t);
                    }
                }
                return !!(running_program || pending_program);
            });
        }
    }
    return {
        run(b) {
            if (is_function(config)) {
                wait().then(() => {
                    // @ts-ignore
                    config = config();
                    go(b);
                });
            }
            else {
                go(b);
            }
        },
        end() {
            clear_animation();
            running_program = pending_program = null;
        }
    };
}

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
}
function fix_and_outro_and_destroy_block(block, lookup) {
    block.f();
    outro_and_destroy_block(block, lookup);
}
function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
    let o = old_blocks.length;
    let n = list.length;
    let i = o;
    const old_indexes = {};
    while (i--)
        old_indexes[old_blocks[i].key] = i;
    const new_blocks = [];
    const new_lookup = new Map();
    const deltas = new Map();
    i = n;
    while (i--) {
        const child_ctx = get_context(ctx, list, i);
        const key = get_key(child_ctx);
        let block = lookup.get(key);
        if (!block) {
            block = create_each_block(key, child_ctx);
            block.c();
        }
        else if (dynamic) {
            block.p(child_ctx, dirty);
        }
        new_lookup.set(key, new_blocks[i] = block);
        if (key in old_indexes)
            deltas.set(key, Math.abs(i - old_indexes[key]));
    }
    const will_move = new Set();
    const did_move = new Set();
    function insert(block) {
        transition_in(block, 1);
        block.m(node, next);
        lookup.set(block.key, block);
        next = block.first;
        n--;
    }
    while (o && n) {
        const new_block = new_blocks[n - 1];
        const old_block = old_blocks[o - 1];
        const new_key = new_block.key;
        const old_key = old_block.key;
        if (new_block === old_block) {
            // do nothing
            next = new_block.first;
            o--;
            n--;
        }
        else if (!new_lookup.has(old_key)) {
            // remove old block
            destroy(old_block, lookup);
            o--;
        }
        else if (!lookup.has(new_key) || will_move.has(new_key)) {
            insert(new_block);
        }
        else if (did_move.has(old_key)) {
            o--;
        }
        else if (deltas.get(new_key) > deltas.get(old_key)) {
            did_move.add(new_key);
            insert(new_block);
        }
        else {
            will_move.add(old_key);
            o--;
        }
    }
    while (o--) {
        const old_block = old_blocks[o];
        if (!new_lookup.has(old_block.key))
            destroy(old_block, lookup);
    }
    while (n)
        insert(new_blocks[n - 1]);
    return new_blocks;
}

function bind(component, name, callback) {
    const index = component.$$.props[name];
    if (index !== undefined) {
        component.$$.bound[index] = callback;
        callback(component.$$.ctx[index]);
    }
}
function create_component(block) {
    block && block.c();
}
function mount_component(component, target, anchor) {
    const { fragment, on_mount, on_destroy, after_update } = component.$$;
    fragment && fragment.m(target, anchor);
    // onMount happens before the initial afterUpdate
    add_render_callback(() => {
        const new_on_destroy = on_mount.map(run).filter(is_function);
        if (on_destroy) {
            on_destroy.push(...new_on_destroy);
        }
        else {
            // Edge case - component was destroyed immediately,
            // most likely as a result of a binding initialising
            run_all(new_on_destroy);
        }
        component.$$.on_mount = [];
    });
    after_update.forEach(add_render_callback);
}
function destroy_component(component, detaching) {
    const $$ = component.$$;
    if ($$.fragment !== null) {
        run_all($$.on_destroy);
        $$.fragment && $$.fragment.d(detaching);
        // TODO null out other refs, including component.$$ (but need to
        // preserve final state?)
        $$.on_destroy = $$.fragment = null;
        $$.ctx = [];
    }
}
function make_dirty(component, i) {
    if (component.$$.dirty[0] === -1) {
        dirty_components.push(component);
        schedule_update();
        component.$$.dirty.fill(0);
    }
    component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
}
function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
    const parent_component = current_component;
    set_current_component(component);
    const prop_values = options.props || {};
    const $$ = component.$$ = {
        fragment: null,
        ctx: null,
        // state
        props,
        update: noop,
        not_equal,
        bound: blank_object(),
        // lifecycle
        on_mount: [],
        on_destroy: [],
        before_update: [],
        after_update: [],
        context: new Map(parent_component ? parent_component.$$.context : []),
        // everything else
        callbacks: blank_object(),
        dirty,
        skip_bound: false
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if (!$$.skip_bound && $$.bound[i])
                    $$.bound[i](value);
                if (ready)
                    make_dirty(component, i);
            }
            return ret;
        })
        : [];
    $$.update();
    ready = true;
    run_all($$.before_update);
    // `false` as a special case of no DOM component
    $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
    if (options.target) {
        if (options.hydrate) {
            const nodes = children(options.target);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.l(nodes);
            nodes.forEach(detach);
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            $$.fragment && $$.fragment.c();
        }
        if (options.intro)
            transition_in(component.$$.fragment);
        mount_component(component, options.target, options.anchor);
        flush();
    }
    set_current_component(parent_component);
}
class SvelteComponent {
    $destroy() {
        destroy_component(this, 1);
        this.$destroy = noop;
    }
    $on(type, callback) {
        const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
        callbacks.push(callback);
        return () => {
            const index = callbacks.indexOf(callback);
            if (index !== -1)
                callbacks.splice(index, 1);
        };
    }
    $set($$props) {
        if (this.$$set && !is_empty($$props)) {
            this.$$.skip_bound = true;
            this.$$set($$props);
            this.$$.skip_bound = false;
        }
    }
}

const subscriber_queue = [];
/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param {*=}value initial value
 * @param {StartStopNotifier=}start start and stop notifications for subscriptions
 */
function writable(value, start = noop) {
    let stop;
    const subscribers = [];
    function set(new_value) {
        if (safe_not_equal(value, new_value)) {
            value = new_value;
            if (stop) { // store is ready
                const run_queue = !subscriber_queue.length;
                for (let i = 0; i < subscribers.length; i += 1) {
                    const s = subscribers[i];
                    s[1]();
                    subscriber_queue.push(s, value);
                }
                if (run_queue) {
                    for (let i = 0; i < subscriber_queue.length; i += 2) {
                        subscriber_queue[i][0](subscriber_queue[i + 1]);
                    }
                    subscriber_queue.length = 0;
                }
            }
        }
    }
    function update(fn) {
        set(fn(value));
    }
    function subscribe(run, invalidate = noop) {
        const subscriber = [run, invalidate];
        subscribers.push(subscriber);
        if (subscribers.length === 1) {
            stop = start(set) || noop;
        }
        run(value);
        return () => {
            const index = subscribers.indexOf(subscriber);
            if (index !== -1) {
                subscribers.splice(index, 1);
            }
            if (subscribers.length === 0) {
                stop();
                stop = null;
            }
        };
    }
    return { set, update, subscribe };
}

function n(n){for(var t=arguments.length,r=Array(t>1?t-1:0),e=1;e<t;e++)r[e-1]=arguments[e];if("production"!==process.env.NODE_ENV){var i=Y[n],o=i?"function"==typeof i?i.apply(null,r):i:"unknown error nr: "+n;throw Error("[Immer] "+o)}throw Error("[Immer] minified error nr: "+n+(r.length?" "+r.map((function(n){return "'"+n+"'"})).join(","):"")+". Find the full error at: https://bit.ly/3cXEKWf")}function t(n){return !!n&&!!n[Q]}function r(n){return !!n&&(function(n){if(!n||"object"!=typeof n)return !1;var t=Object.getPrototypeOf(n);return !t||t===Object.prototype}(n)||Array.isArray(n)||!!n[L]||!!n.constructor[L]||s(n)||v(n))}function i(n,t,r){void 0===r&&(r=!1),0===o(n)?(r?Object.keys:Z)(n).forEach((function(e){r&&"symbol"==typeof e||t(e,n[e],n);})):n.forEach((function(r,e){return t(e,r,n)}));}function o(n){var t=n[Q];return t?t.i>3?t.i-4:t.i:Array.isArray(n)?1:s(n)?2:v(n)?3:0}function u(n,t){return 2===o(n)?n.has(t):Object.prototype.hasOwnProperty.call(n,t)}function a(n,t){return 2===o(n)?n.get(t):n[t]}function f(n,t,r){var e=o(n);2===e?n.set(t,r):3===e?(n.delete(t),n.add(r)):n[t]=r;}function c(n,t){return n===t?0!==n||1/n==1/t:n!=n&&t!=t}function s(n){return X&&n instanceof Map}function v(n){return q&&n instanceof Set}function p(n){return n.o||n.t}function l(n){if(Array.isArray(n))return Array.prototype.slice.call(n);var t=nn(n);delete t[Q];for(var r=Z(t),e=0;e<r.length;e++){var i=r[e],o=t[i];!1===o.writable&&(o.writable=!0,o.configurable=!0),(o.get||o.set)&&(t[i]={configurable:!0,writable:!0,enumerable:o.enumerable,value:n[i]});}return Object.create(Object.getPrototypeOf(n),t)}function d(n,e){return void 0===e&&(e=!1),y(n)||t(n)||!r(n)?n:(o(n)>1&&(n.set=n.add=n.clear=n.delete=h),Object.freeze(n),e&&i(n,(function(n,t){return d(t,!0)}),!0),n)}function h(){n(2);}function y(n){return null==n||"object"!=typeof n||Object.isFrozen(n)}function b(t){var r=tn[t];return r||n(18,t),r}function m(n,t){tn[n]||(tn[n]=t);}function _(){return "production"===process.env.NODE_ENV||U||n(0),U}function j(n,t){t&&(b("Patches"),n.u=[],n.s=[],n.v=t);}function g(n){O(n),n.p.forEach(S),n.p=null;}function O(n){n===U&&(U=n.l);}function w(n){return U={p:[],l:U,h:n,m:!0,_:0}}function S(n){var t=n[Q];0===t.i||1===t.i?t.j():t.g=!0;}function P(t,e){e._=e.p.length;var i=e.p[0],o=void 0!==t&&t!==i;return e.h.O||b("ES5").S(e,t,o),o?(i[Q].P&&(g(e),n(4)),r(t)&&(t=M(e,t),e.l||x(e,t)),e.u&&b("Patches").M(i[Q],t,e.u,e.s)):t=M(e,i,[]),g(e),e.u&&e.v(e.u,e.s),t!==H?t:void 0}function M(n,t,r){if(y(t))return t;var e=t[Q];if(!e)return i(t,(function(i,o){return A(n,e,t,i,o,r)}),!0),t;if(e.A!==n)return t;if(!e.P)return x(n,e.t,!0),e.t;if(!e.I){e.I=!0,e.A._--;var o=4===e.i||5===e.i?e.o=l(e.k):e.o;i(3===e.i?new Set(o):o,(function(t,i){return A(n,e,o,t,i,r)})),x(n,o,!1),r&&n.u&&b("Patches").R(e,r,n.u,n.s);}return e.o}function A(e,i,o,a,c,s){if("production"!==process.env.NODE_ENV&&c===o&&n(5),t(c)){var v=M(e,c,s&&i&&3!==i.i&&!u(i.D,a)?s.concat(a):void 0);if(f(o,a,v),!t(v))return;e.m=!1;}if(r(c)&&!y(c)){if(!e.h.N&&e._<1)return;M(e,c),i&&i.A.l||x(e,c);}}function x(n,t,r){void 0===r&&(r=!1),n.h.N&&n.m&&d(t,r);}function z(n,t){var r=n[Q];return (r?p(r):n)[t]}function I(n,t){if(t in n)for(var r=Object.getPrototypeOf(n);r;){var e=Object.getOwnPropertyDescriptor(r,t);if(e)return e;r=Object.getPrototypeOf(r);}}function E(n){n.P||(n.P=!0,n.l&&E(n.l));}function k(n){n.o||(n.o=l(n.t));}function R(n,t,r){var e=s(t)?b("MapSet").T(t,r):v(t)?b("MapSet").F(t,r):n.O?function(n,t){var r=Array.isArray(n),e={i:r?1:0,A:t?t.A:_(),P:!1,I:!1,D:{},l:t,t:n,k:null,o:null,j:null,C:!1},i=e,o=rn;r&&(i=[e],o=en);var u=Proxy.revocable(i,o),a=u.revoke,f=u.proxy;return e.k=f,e.j=a,f}(t,r):b("ES5").J(t,r);return (r?r.A:_()).p.push(e),e}function D(e){return t(e)||n(22,e),function n(t){if(!r(t))return t;var e,u=t[Q],c=o(t);if(u){if(!u.P&&(u.i<4||!b("ES5").K(u)))return u.t;u.I=!0,e=N(t,c),u.I=!1;}else e=N(t,c);return i(e,(function(t,r){u&&a(u.t,t)===r||f(e,t,n(r));})),3===c?new Set(e):e}(e)}function N(n,t){switch(t){case 2:return new Map(n);case 3:return Array.from(n)}return l(n)}function F(){function e(n){if(!r(n))return n;if(Array.isArray(n))return n.map(e);if(s(n))return new Map(Array.from(n.entries()).map((function(n){return [n[0],e(n[1])]})));if(v(n))return new Set(Array.from(n).map(e));var t=Object.create(Object.getPrototypeOf(n));for(var i in n)t[i]=e(n[i]);return t}function f(n){return t(n)?e(n):n}var c="add";m("Patches",{$:function(t,r){return r.forEach((function(r){for(var i=r.path,u=r.op,f=t,s=0;s<i.length-1;s++)"object"!=typeof(f=a(f,i[s]))&&n(15,i.join("/"));var v=o(f),p=e(r.value),l=i[i.length-1];switch(u){case"replace":switch(v){case 2:return f.set(l,p);case 3:n(16);default:return f[l]=p}case c:switch(v){case 1:return f.splice(l,0,p);case 2:return f.set(l,p);case 3:return f.add(p);default:return f[l]=p}case"remove":switch(v){case 1:return f.splice(l,1);case 2:return f.delete(l);case 3:return f.delete(r.value);default:return delete f[l]}default:n(17,u);}})),t},R:function(n,t,r,e){switch(n.i){case 0:case 4:case 2:return function(n,t,r,e){var o=n.t,s=n.o;i(n.D,(function(n,i){var v=a(o,n),p=a(s,n),l=i?u(o,n)?"replace":c:"remove";if(v!==p||"replace"!==l){var d=t.concat(n);r.push("remove"===l?{op:l,path:d}:{op:l,path:d,value:p}),e.push(l===c?{op:"remove",path:d}:"remove"===l?{op:c,path:d,value:f(v)}:{op:"replace",path:d,value:f(v)});}}));}(n,t,r,e);case 5:case 1:return function(n,t,r,e){var i=n.t,o=n.D,u=n.o;if(u.length<i.length){var a=[u,i];i=a[0],u=a[1];var s=[e,r];r=s[0],e=s[1];}for(var v=0;v<i.length;v++)if(o[v]&&u[v]!==i[v]){var p=t.concat([v]);r.push({op:"replace",path:p,value:f(u[v])}),e.push({op:"replace",path:p,value:f(i[v])});}for(var l=i.length;l<u.length;l++){var d=t.concat([l]);r.push({op:c,path:d,value:f(u[l])});}i.length<u.length&&e.push({op:"replace",path:t.concat(["length"]),value:i.length});}(n,t,r,e);case 3:return function(n,t,r,e){var i=n.t,o=n.o,u=0;i.forEach((function(n){if(!o.has(n)){var i=t.concat([u]);r.push({op:"remove",path:i,value:n}),e.unshift({op:c,path:i,value:n});}u++;})),u=0,o.forEach((function(n){if(!i.has(n)){var o=t.concat([u]);r.push({op:c,path:o,value:n}),e.unshift({op:"remove",path:o,value:n});}u++;}));}(n,t,r,e)}},M:function(n,t,r,e){r.push({op:"replace",path:[],value:t}),e.push({op:"replace",path:[],value:n.t});}});}var G,U,W="undefined"!=typeof Symbol&&"symbol"==typeof Symbol("x"),X="undefined"!=typeof Map,q="undefined"!=typeof Set,B="undefined"!=typeof Proxy&&void 0!==Proxy.revocable&&"undefined"!=typeof Reflect,H=W?Symbol.for("immer-nothing"):((G={})["immer-nothing"]=!0,G),L=W?Symbol.for("immer-draftable"):"__$immer_draftable",Q=W?Symbol.for("immer-state"):"__$immer_state",Y={0:"Illegal state",1:"Immer drafts cannot have computed properties",2:"This object has been frozen and should not be mutated",3:function(n){return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? "+n},4:"An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",5:"Immer forbids circular references",6:"The first or second argument to `produce` must be a function",7:"The third argument to `produce` must be a function or undefined",8:"First argument to `createDraft` must be a plain object, an array, or an immerable object",9:"First argument to `finishDraft` must be a draft returned by `createDraft`",10:"The given draft is already finalized",11:"Object.defineProperty() cannot be used on an Immer draft",12:"Object.setPrototypeOf() cannot be used on an Immer draft",13:"Immer only supports deleting array indices",14:"Immer only supports setting array indices and the 'length' property",15:function(n){return "Cannot apply patch, path doesn't resolve: "+n},16:'Sets cannot have "replace" patches.',17:function(n){return "Unsupported patch operation: "+n},18:function(n){return "The plugin for '"+n+"' has not been loaded into Immer. To enable the plugin, import and call `enable"+n+"()` when initializing your application."},20:"Cannot use proxies if Proxy, Proxy.revocable or Reflect are not available",21:function(n){return "produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '"+n+"'"},22:function(n){return "'current' expects a draft, got: "+n},23:function(n){return "'original' expects a draft, got: "+n}},Z="undefined"!=typeof Reflect&&Reflect.ownKeys?Reflect.ownKeys:void 0!==Object.getOwnPropertySymbols?function(n){return Object.getOwnPropertyNames(n).concat(Object.getOwnPropertySymbols(n))}:Object.getOwnPropertyNames,nn=Object.getOwnPropertyDescriptors||function(n){var t={};return Z(n).forEach((function(r){t[r]=Object.getOwnPropertyDescriptor(n,r);})),t},tn={},rn={get:function(n,t){if(t===Q)return n;var e=p(n);if(!u(e,t))return function(n,t,r){var e,i=I(t,r);return i?"value"in i?i.value:null===(e=i.get)||void 0===e?void 0:e.call(n.k):void 0}(n,e,t);var i=e[t];return n.I||!r(i)?i:i===z(n.t,t)?(k(n),n.o[t]=R(n.A.h,i,n)):i},has:function(n,t){return t in p(n)},ownKeys:function(n){return Reflect.ownKeys(p(n))},set:function(n,t,r){var e=I(p(n),t);if(null==e?void 0:e.set)return e.set.call(n.k,r),!0;if(!n.P){var i=z(p(n),t),o=null==i?void 0:i[Q];if(o&&o.t===r)return n.o[t]=r,n.D[t]=!1,!0;if(c(r,i)&&(void 0!==r||u(n.t,t)))return !0;k(n),E(n);}return n.o[t]=r,n.D[t]=!0,!0},deleteProperty:function(n,t){return void 0!==z(n.t,t)||t in n.t?(n.D[t]=!1,k(n),E(n)):delete n.D[t],n.o&&delete n.o[t],!0},getOwnPropertyDescriptor:function(n,t){var r=p(n),e=Reflect.getOwnPropertyDescriptor(r,t);return e?{writable:!0,configurable:1!==n.i||"length"!==t,enumerable:e.enumerable,value:r[t]}:e},defineProperty:function(){n(11);},getPrototypeOf:function(n){return Object.getPrototypeOf(n.t)},setPrototypeOf:function(){n(12);}},en={};i(rn,(function(n,t){en[n]=function(){return arguments[0]=arguments[0][0],t.apply(this,arguments)};})),en.deleteProperty=function(t,r){return "production"!==process.env.NODE_ENV&&isNaN(parseInt(r))&&n(13),rn.deleteProperty.call(this,t[0],r)},en.set=function(t,r,e){return "production"!==process.env.NODE_ENV&&"length"!==r&&isNaN(parseInt(r))&&n(14),rn.set.call(this,t[0],r,e,t[0])};var on=function(){function e(n){this.O=B,this.N=!0,"boolean"==typeof(null==n?void 0:n.useProxies)&&this.setUseProxies(n.useProxies),"boolean"==typeof(null==n?void 0:n.autoFreeze)&&this.setAutoFreeze(n.autoFreeze),this.produce=this.produce.bind(this),this.produceWithPatches=this.produceWithPatches.bind(this);}var i=e.prototype;return i.produce=function(t,e,i){if("function"==typeof t&&"function"!=typeof e){var o=e;e=t;var u=this;return function(n){var t=this;void 0===n&&(n=o);for(var r=arguments.length,i=Array(r>1?r-1:0),a=1;a<r;a++)i[a-1]=arguments[a];return u.produce(n,(function(n){var r;return (r=e).call.apply(r,[t,n].concat(i))}))}}var a;if("function"!=typeof e&&n(6),void 0!==i&&"function"!=typeof i&&n(7),r(t)){var f=w(this),c=R(this,t,void 0),s=!0;try{a=e(c),s=!1;}finally{s?g(f):O(f);}return "undefined"!=typeof Promise&&a instanceof Promise?a.then((function(n){return j(f,i),P(n,f)}),(function(n){throw g(f),n})):(j(f,i),P(a,f))}if(!t||"object"!=typeof t){if((a=e(t))===H)return;return void 0===a&&(a=t),this.N&&d(a,!0),a}n(21,t);},i.produceWithPatches=function(n,t){var r,e,i=this;return "function"==typeof n?function(t){for(var r=arguments.length,e=Array(r>1?r-1:0),o=1;o<r;o++)e[o-1]=arguments[o];return i.produceWithPatches(t,(function(t){return n.apply(void 0,[t].concat(e))}))}:[this.produce(n,t,(function(n,t){r=n,e=t;})),r,e]},i.createDraft=function(e){r(e)||n(8),t(e)&&(e=D(e));var i=w(this),o=R(this,e,void 0);return o[Q].C=!0,O(i),o},i.finishDraft=function(t,r){var e=t&&t[Q];"production"!==process.env.NODE_ENV&&(e&&e.C||n(9),e.I&&n(10));var i=e.A;return j(i,r),P(void 0,i)},i.setAutoFreeze=function(n){this.N=n;},i.setUseProxies=function(t){t&&!B&&n(20),this.O=t;},i.applyPatches=function(n,r){var e;for(e=r.length-1;e>=0;e--){var i=r[e];if(0===i.path.length&&"replace"===i.op){n=i.value;break}}var o=b("Patches").$;return t(n)?o(n,r):this.produce(n,(function(n){return o(n,r.slice(e+1))}))},e}(),un=new on,an=un.produce,fn=un.produceWithPatches.bind(un),cn=un.setAutoFreeze.bind(un),sn=un.setUseProxies.bind(un),vn=un.applyPatches.bind(un),pn=un.createDraft.bind(un),ln=un.finishDraft.bind(un);

F(); // Required by immer

// -------- STORES -------- //

let state = writable({});
let project = writable({});
let sidebar = writable({});
let files = writable({});

// This (seemingly redundant) `stateAsObject` variable is for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
let stateAsObject = {};
let filesAsObject = {};

// -------- SETUP AND UPDATE -------- //

class StateManager {
  constructor(initialState, initialFiles) {

    console.log('StateManager: constructor');

    // Set `window.id`
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    window.id = urlParams.get('id');

    // Set initial files. 
    // When we start the app, we try to fetch `files` from main. In case files aren't ready yet (e.g. on project first run the directory is initially undefined), we also create a listener for main process to send the initial files. 
    // During full app reload (main and render process), 
    if (initialFiles) {
      filesAsObject = initialFiles;
      updateFilesStore();
    }

    // Main sends initial `files` when the project's Watcher instance has does its first `mapProject`.
    window.api.receive('initialFilesFromMain', (files) => {
      filesAsObject = files;
      updateFilesStore();
    });  

    // Update files when patches arrive from main...
    window.api.receive("filesPatchesFromMain", (patches) => {
      console.log('StateManager: filesPatchesFromMain: ', patches);
      filesAsObject = vn(filesAsObject, patches);
      updateFilesStore();
    });

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      stateAsObject = vn(stateAsObject, patches);
      updateStateStores();
    });

    // Set initial state value
    stateAsObject = initialState;
    updateStateStores();
  }
}

function updateStateStores() {
  state.set(stateAsObject);
  const proj = stateAsObject.projects.find((p) => p.window.id == window.id);
  project.set(proj);
  sidebar.set(proj.sidebar);
}

function updateFilesStore() {
  files.set(filesAsObject);
}

class ThemeManager {
  constructor(initialState) {

    this.root = document.documentElement;

    window.api.receive("stateChanged", (state, oldState) => {

      // Update appearance
      if (hasChanged('appearance', state, oldState)) {
        this.setTheme(state.appearance.theme);
        this.setSystemColors();
      }
    });

    // Set initial theme on initial load
    this.setTheme(initialState.appearance.theme);

    // Set system colors
    this.setSystemColors();
  }


  /**
   * Point stylesheet href in index.html to new theme's stylesheet.
   * If stylesheet name = gambier-light
   * ...stylesheet href = ./styles/themes/gambier-light/gambier-light.css
   * @param {*} themeName - E.g. 'gambier-light'.
   */
  setTheme(themeName) {  
    const stylesheet = document.getElementById('theme-stylesheet');
    const href = `./styles/themes/${themeName}/${themeName}.css`;
    stylesheet.setAttribute('href', href);
  }

  /**
   * Get system colors from main, and write them to html element.
   * NOTE: This is turned off for now because of problems with Electron: returned values do not match what we expect from macOS, based on developer documentation and tests with Xcode apps. In part (although not entirely) because Electron returns values without alphas.
   */
  async setSystemColors() {

    return
  }

  hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
}

/* src/js/renderer/component/FirstRun.svelte generated by Svelte v3.29.7 */

function add_css() {
	var style = element("style");
	style.id = "svelte-jj8gkw-style";
	style.textContent = "#firstrun.svelte-jj8gkw{padding:4rem;background-color:var(--windowBackgroundColor);overflow:scroll}h1.svelte-jj8gkw{font-family:\"SF Pro Display\";font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px;color:var(--labelColor)}";
	append(document.head, style);
}

function create_fragment(ctx) {
	let div;
	let h1;
	let t1;
	let button;
	let mounted;
	let dispose;

	return {
		c() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "Gambier";
			t1 = space();
			button = element("button");
			button.textContent = "Choose Project Folder...";
			attr(h1, "class", "svelte-jj8gkw");
			attr(div, "id", "firstrun");
			attr(div, "class", "svelte-jj8gkw");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h1);
			append(div, t1);
			append(div, button);

			if (!mounted) {
				dispose = listen(button, "click", /*click_handler*/ ctx[0]);
				mounted = true;
			}
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			mounted = false;
			dispose();
		}
	};
}

function instance($$self) {
	const click_handler = () => {
		window.api.send("dispatch", { type: "SELECT_PROJECT_DIRECTORY" });
	};

	return [click_handler];
}

class FirstRun extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-jj8gkw-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

/* src/js/renderer/component/UI/Separator.svelte generated by Svelte v3.29.7 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-16lq540-style";
	style.textContent = "hr.svelte-16lq540{min-height:1px;border:0;background-color:var(--separatorColor)}";
	append(document.head, style);
}

function create_fragment$1(ctx) {
	let hr;

	return {
		c() {
			hr = element("hr");
			set_style(hr, "margin", "0 " + /*marginSides*/ ctx[0] + "px");
			attr(hr, "class", "svelte-16lq540");
		},
		m(target, anchor) {
			insert(target, hr, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*marginSides*/ 1) {
				set_style(hr, "margin", "0 " + /*marginSides*/ ctx[0] + "px");
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(hr);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { marginSides = "0" } = $$props;

	$$self.$$set = $$props => {
		if ("marginSides" in $$props) $$invalidate(0, marginSides = $$props.marginSides);
	};

	return [marginSides];
}

class Separator extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-16lq540-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { marginSides: 0 });
	}
}

/* src/js/renderer/component/SideBar/Header.svelte generated by Svelte v3.29.7 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-cfox94-style";
	style.textContent = "header.svelte-cfox94.svelte-cfox94{padding:0 10px;display:flex;position:relative;flex-direction:row;align-items:center;min-height:30px}header.svelte-cfox94 h1.svelte-cfox94{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);color:var(--labelColor);user-select:none;font-weight:bold;font-size:13px;flex-grow:1;margin:0;padding:0}";
	append(document.head, style);
}

function create_fragment$2(ctx) {
	let header;
	let h1;
	let t0;
	let t1;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			header = element("header");
			h1 = element("h1");
			t0 = text(/*title*/ ctx[0]);
			t1 = space();
			if (default_slot) default_slot.c();
			attr(h1, "class", "svelte-cfox94");
			attr(header, "class", "svelte-cfox94");
		},
		m(target, anchor) {
			insert(target, header, anchor);
			append(header, h1);
			append(h1, t0);
			append(header, t1);

			if (default_slot) {
				default_slot.m(header, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*title*/ 1) set_data(t0, /*title*/ ctx[0]);

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(header);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { title = "Title" } = $$props;

	$$self.$$set = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [title, $$scope, slots];
}

class Header extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-cfox94-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0 });
	}
}

/**
 * Pass dynamic values to CSS through CSS variables.
 * From: https://www.kirillvasiltsov.com/writing/unlocking-the-power-of-svelte-actions/
 * @param {*} node 
 * @param {*} properties - Name of CSS variable we want to set
 */
function css(node, properties) {
  function setProperties() {
    for (const prop of Object.keys(properties)) {
      node.style.setProperty(`--${prop}`, properties[prop]);
    }
  }

  setProperties();

  return {
    update(newProperties) {
      properties = newProperties;
      setProperties();
    },
  };
}

/* src/js/renderer/component/UI/DisclosureButton.svelte generated by Svelte v3.29.7 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-ja018r-style";
	style.textContent = ".disclosure.svelte-ja018r{--width:0;--height:0;--padding:0;--left:0;--rotation:0;position:absolute;top:50%;transform:translate(0, -50%);position:absolute;width:calc(var(--width) * 1px);height:calc(var(--height) * 1px);left:calc(var(--left) * 1px)}.icon.svelte-ja018r{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:calc(100% - calc(var(--padding) * 1px));height:calc(100% - calc(var(--padding) * 1px));position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) rotateZ(calc(var(--rotation) * 1deg))}";
	append(document.head, style);
}

// (54:2) {#if label}
function create_if_block_1(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*label*/ ctx[7]);
			attr(div, "class", "label");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 128) set_data(t, /*label*/ ctx[7]);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (57:2) {#if tooltip}
function create_if_block(ctx) {
	return { c: noop, m: noop, d: noop };
}

function create_fragment$3(ctx) {
	let div1;
	let div0;
	let div0_style_value;
	let t0;
	let t1;
	let css_action;
	let mounted;
	let dispose;
	let if_block0 = /*label*/ ctx[7] && create_if_block_1(ctx);
	let if_block1 = /*tooltip*/ ctx[8] && create_if_block();

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "icon svelte-ja018r");
			attr(div0, "style", div0_style_value = `background-color: var(--${/*iconColor*/ ctx[6]}); -webkit-mask-image: var(--${/*iconImage*/ ctx[5]});`);
			attr(div1, "class", "disclosure svelte-ja018r");
			attr(div1, "role", "button");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);

			if (!mounted) {
				dispose = [
					action_destroyer(css_action = css.call(null, div1, {
						width: /*width*/ ctx[0],
						height: /*height*/ ctx[1],
						left: /*left*/ ctx[3],
						padding: /*padding*/ ctx[2],
						rotation: /*rotation*/ ctx[4]
					})),
					listen(div1, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[10]))
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*iconColor, iconImage*/ 96 && div0_style_value !== (div0_style_value = `background-color: var(--${/*iconColor*/ ctx[6]}); -webkit-mask-image: var(--${/*iconImage*/ ctx[5]});`)) {
				attr(div0, "style", div0_style_value);
			}

			if (/*label*/ ctx[7]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					if_block0.m(div1, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*tooltip*/ ctx[8]) {
				if (if_block1) ; else {
					if_block1 = create_if_block();
					if_block1.c();
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (css_action && is_function(css_action.update) && dirty & /*width, height, left, padding, rotation*/ 31) css_action.update.call(null, {
				width: /*width*/ ctx[0],
				height: /*height*/ ctx[1],
				left: /*left*/ ctx[3],
				padding: /*padding*/ ctx[2],
				rotation: /*rotation*/ ctx[4]
			});
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { width = 34 } = $$props;
	let { height = 28 } = $$props;
	let { padding = 4 } = $$props;
	let { left = 4 } = $$props;
	let { rotation = 0 } = $$props;
	let { iconImage = "img-chevron-right" } = $$props;
	let { iconColor = "controlTextColor" } = $$props;
	let { label = null } = $$props;
	let { tooltip = null } = $$props;
	const mousedown_handler = () => dispatch("toggle");

	$$self.$$set = $$props => {
		if ("width" in $$props) $$invalidate(0, width = $$props.width);
		if ("height" in $$props) $$invalidate(1, height = $$props.height);
		if ("padding" in $$props) $$invalidate(2, padding = $$props.padding);
		if ("left" in $$props) $$invalidate(3, left = $$props.left);
		if ("rotation" in $$props) $$invalidate(4, rotation = $$props.rotation);
		if ("iconImage" in $$props) $$invalidate(5, iconImage = $$props.iconImage);
		if ("iconColor" in $$props) $$invalidate(6, iconColor = $$props.iconColor);
		if ("label" in $$props) $$invalidate(7, label = $$props.label);
		if ("tooltip" in $$props) $$invalidate(8, tooltip = $$props.tooltip);
	};

	return [
		width,
		height,
		padding,
		left,
		rotation,
		iconImage,
		iconColor,
		label,
		tooltip,
		dispatch,
		mousedown_handler
	];
}

class DisclosureButton extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-ja018r-style")) add_css$3();

		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
			width: 0,
			height: 1,
			padding: 2,
			left: 3,
			rotation: 4,
			iconImage: 5,
			iconColor: 6,
			label: 7,
			tooltip: 8
		});
	}
}

/* src/js/renderer/component/UI/Label.svelte generated by Svelte v3.29.7 */

function add_css$4() {
	var style = element("style");
	style.id = "svelte-1ehp745-style";
	style.textContent = "div.svelte-1ehp745{flex-grow:1}.primary.svelte-1ehp745{color:var(--labelColor)}.secondary.svelte-1ehp745{color:var(--secondaryLabelColor)}.tertiary.svelte-1ehp745{color:var(--tertiaryLabelColor)}.quaternary.svelte-1ehp745{color:var(--quaternaryLabelColor)}.label-normal.svelte-1ehp745{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor)}.label-normal-small.svelte-1ehp745{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px}.label-normal-small-bold.svelte-1ehp745{font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px}.label-large-bold.svelte-1ehp745{font-family:\"SF Pro Display\";font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px}.column.svelte-1ehp745{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px}";
	append(document.head, style);
}

function create_fragment$4(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "label " + /*color*/ ctx[0] + " " + /*typography*/ ctx[1] + " svelte-1ehp745");
		},
		m(target, anchor) {
			insert(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 4) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
				}
			}

			if (!current || dirty & /*color, typography*/ 3 && div_class_value !== (div_class_value = "label " + /*color*/ ctx[0] + " " + /*typography*/ ctx[1] + " svelte-1ehp745")) {
				attr(div, "class", div_class_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (default_slot) default_slot.d(detaching);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	let { color = "primary" } = $$props;
	let { typography = "label-normal" } = $$props;

	$$self.$$set = $$props => {
		if ("color" in $$props) $$invalidate(0, color = $$props.color);
		if ("typography" in $$props) $$invalidate(1, typography = $$props.typography);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [color, typography, $$scope, slots];
}

class Label extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1ehp745-style")) add_css$4();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { color: 0, typography: 1 });
	}
}

/* src/js/renderer/component/UI/Thumbnail.svelte generated by Svelte v3.29.7 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-y5m3v1-style";
	style.textContent = ".thumbnail.svelte-y5m3v1{overflow:hidden;width:100%;height:100%}img.svelte-y5m3v1{width:100%;height:100%;object-fit:contain;object-position:center}";
	append(document.head, style);
}

// (23:2) {:else}
function create_else_block(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (img.src !== (img_src_value = "placeholder")) attr(img, "src", img_src_value);
			attr(img, "class", "svelte-y5m3v1");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

// (21:2) {#if src}
function create_if_block$1(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr(img, "src", img_src_value);
			attr(img, "class", "svelte-y5m3v1");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
				attr(img, "src", img_src_value);
			}
		},
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function create_fragment$5(ctx) {
	let div;

	function select_block_type(ctx, dirty) {
		if (/*src*/ ctx[0]) return create_if_block$1;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "thumbnail svelte-y5m3v1");
			set_style(div, "margin", /*margin*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);
		},
		p(ctx, [dirty]) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(div, null);
				}
			}

			if (dirty & /*margin*/ 2) {
				set_style(div, "margin", /*margin*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			if_block.d();
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { src } = $$props;
	let { margin = "0 0 0 0" } = $$props;

	$$self.$$set = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("margin" in $$props) $$invalidate(1, margin = $$props.margin);
	};

	return [src, margin];
}

class Thumbnail extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-y5m3v1-style")) add_css$5();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { src: 0, margin: 1 });
	}
}

/* src/js/renderer/component/SideBar/Preview2.svelte generated by Svelte v3.29.7 */

function add_css$6() {
	var style = element("style");
	style.id = "svelte-j2cjn3-style";
	style.textContent = "#preview.svelte-j2cjn3{display:flex;flex-shrink:0;flex-direction:column;transition:flex 250ms ease-out;max-height:250px;overflow:hidden}#preview.svelte-j2cjn3:not(.isOpen){flex-basis:30px}#preview.isOpen.svelte-j2cjn3{flex-basis:250px}.content.svelte-j2cjn3{height:205px;margin:5px 10px 10px;display:flex;flex-direction:column}.thumb.svelte-j2cjn3{margin-bottom:10px;flex-grow:1;flex-basis:0;flex-shrink:0;overflow:hidden}.metadata.svelte-j2cjn3{flex-grow:0}";
	append(document.head, style);
}

// (62:2) <Header title={'Preview'}>
function create_default_slot_3(ctx) {
	let disclosurebutton;
	let current;

	disclosurebutton = new DisclosureButton({
			props: {
				width: 14,
				height: 14,
				padding: 6,
				left: /*$sidebar*/ ctx[2].width - 20,
				rotation: /*$sidebar*/ ctx[2].isPreviewOpen ? -90 : 90,
				tooltip: "Toggle Expanded"
			}
		});

	disclosurebutton.$on("toggle", /*toggle_handler*/ ctx[3]);

	return {
		c() {
			create_component(disclosurebutton.$$.fragment);
		},
		m(target, anchor) {
			mount_component(disclosurebutton, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const disclosurebutton_changes = {};
			if (dirty & /*$sidebar*/ 4) disclosurebutton_changes.left = /*$sidebar*/ ctx[2].width - 20;
			if (dirty & /*$sidebar*/ 4) disclosurebutton_changes.rotation = /*$sidebar*/ ctx[2].isPreviewOpen ? -90 : 90;
			disclosurebutton.$set(disclosurebutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(disclosurebutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(disclosurebutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(disclosurebutton, detaching);
		}
	};
}

// (97:32) 
function create_if_block_2(ctx) {
	let t;

	return {
		c() {
			t = text("AV");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (77:33) 
function create_if_block_1$1(ctx) {
	let div0;
	let thumbnail;
	let t0;
	let t1;
	let div1;
	let label0;
	let t2;
	let label1;
	let t3;
	let label2;
	let current;

	thumbnail = new Thumbnail({
			props: {
				src: /*file*/ ctx[0].path,
				margin: "0 0 0 0"
			}
		});

	label0 = new Label({
			props: {
				color: "primary",
				typography: "label-normal-small-bold",
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			}
		});

	label1 = new Label({
			props: {
				color: "secondary",
				typography: "label-normal-small",
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	label2 = new Label({
			props: {
				color: "secondary",
				typography: "label-normal-small",
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div0 = element("div");
			create_component(thumbnail.$$.fragment);
			t0 = text("\n        flex-basis: 0;");
			t1 = space();
			div1 = element("div");
			create_component(label0.$$.fragment);
			t2 = space();
			create_component(label1.$$.fragment);
			t3 = space();
			create_component(label2.$$.fragment);
			attr(div0, "class", "thumb svelte-j2cjn3");
			attr(div1, "class", "metadata svelte-j2cjn3");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			mount_component(thumbnail, div0, null);
			append(div0, t0);
			insert(target, t1, anchor);
			insert(target, div1, anchor);
			mount_component(label0, div1, null);
			append(div1, t2);
			mount_component(label1, div1, null);
			append(div1, t3);
			mount_component(label2, div1, null);
			current = true;
		},
		p(ctx, dirty) {
			const thumbnail_changes = {};
			if (dirty & /*file*/ 1) thumbnail_changes.src = /*file*/ ctx[0].path;
			thumbnail.$set(thumbnail_changes);
			const label0_changes = {};

			if (dirty & /*$$scope, file*/ 65) {
				label0_changes.$$scope = { dirty, ctx };
			}

			label0.$set(label0_changes);
			const label1_changes = {};

			if (dirty & /*$$scope, file*/ 65) {
				label1_changes.$$scope = { dirty, ctx };
			}

			label1.$set(label1_changes);
			const label2_changes = {};

			if (dirty & /*$$scope, file*/ 65) {
				label2_changes.$$scope = { dirty, ctx };
			}

			label2.$set(label2_changes);
		},
		i(local) {
			if (current) return;
			transition_in(thumbnail.$$.fragment, local);
			transition_in(label0.$$.fragment, local);
			transition_in(label1.$$.fragment, local);
			transition_in(label2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(thumbnail.$$.fragment, local);
			transition_out(label0.$$.fragment, local);
			transition_out(label1.$$.fragment, local);
			transition_out(label2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div0);
			destroy_component(thumbnail);
			if (detaching) detach(t1);
			if (detaching) detach(div1);
			destroy_component(label0);
			destroy_component(label1);
			destroy_component(label2);
		}
	};
}

// (75:4) {#if file.type == 'doc'}
function create_if_block$2(ctx) {
	let t;

	return {
		c() {
			t = text(/*file*/ ctx[0]);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*file*/ 1) set_data(t, /*file*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (83:8) <Label color={'primary'} typography={'label-normal-small-bold'}>
function create_default_slot_2(ctx) {
	let t_value = /*file*/ ctx[0].name + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*file*/ 1 && t_value !== (t_value = /*file*/ ctx[0].name + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (86:8) <Label color={'secondary'} typography={'label-normal-small'}>
function create_default_slot_1(ctx) {
	let t0_value = /*file*/ ctx[0].format.toUpperCase() + "";
	let t0;
	let t1;
	let t2_value = prettySize(/*file*/ ctx[0].sizeInBytes, " ") + "";
	let t2;

	return {
		c() {
			t0 = text(t0_value);
			t1 = text("\n          image -\n          ");
			t2 = text(t2_value);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
			insert(target, t2, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*file*/ 1 && t0_value !== (t0_value = /*file*/ ctx[0].format.toUpperCase() + "")) set_data(t0, t0_value);
			if (dirty & /*file*/ 1 && t2_value !== (t2_value = prettySize(/*file*/ ctx[0].sizeInBytes, " ") + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
			if (detaching) detach(t2);
		}
	};
}

// (91:8) <Label color={'secondary'} typography={'label-normal-small'}>
function create_default_slot(ctx) {
	let t0_value = /*file*/ ctx[0].dimensions.width + "";
	let t0;
	let t1;
	let t2_value = /*file*/ ctx[0].dimensions.height + "";
	let t2;

	return {
		c() {
			t0 = text(t0_value);
			t1 = text("\n          x\n          ");
			t2 = text(t2_value);
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
			insert(target, t2, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*file*/ 1 && t0_value !== (t0_value = /*file*/ ctx[0].dimensions.width + "")) set_data(t0, t0_value);
			if (dirty & /*file*/ 1 && t2_value !== (t2_value = /*file*/ ctx[0].dimensions.height + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
			if (detaching) detach(t2);
		}
	};
}

function create_fragment$6(ctx) {
	let div1;
	let separator;
	let t0;
	let header;
	let t1;
	let div0;
	let current_block_type_index;
	let if_block;
	let current;
	separator = new Separator({});

	header = new Header({
			props: {
				title: "Preview",
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			}
		});

	const if_block_creators = [create_if_block$2, create_if_block_1$1, create_if_block_2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*file*/ ctx[0].type == "doc") return 0;
		if (/*file*/ ctx[0].type == "img") return 1;
		if (/*file*/ ctx[0].type == "av") return 2;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c() {
			div1 = element("div");
			create_component(separator.$$.fragment);
			t0 = space();
			create_component(header.$$.fragment);
			t1 = space();
			div0 = element("div");
			if (if_block) if_block.c();
			attr(div0, "class", "content svelte-j2cjn3");
			attr(div1, "id", "preview");
			attr(div1, "class", "svelte-j2cjn3");
			toggle_class(div1, "isOpen", /*isOpen*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(separator, div1, null);
			append(div1, t0);
			mount_component(header, div1, null);
			append(div1, t1);
			append(div1, div0);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div0, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			const header_changes = {};

			if (dirty & /*$$scope, $sidebar*/ 68) {
				header_changes.$$scope = { dirty, ctx };
			}

			header.$set(header_changes);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block) {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
				}

				if (~current_block_type_index) {
					if_block = if_blocks[current_block_type_index];

					if (!if_block) {
						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block.c();
					} else {
						if_block.p(ctx, dirty);
					}

					transition_in(if_block, 1);
					if_block.m(div0, null);
				} else {
					if_block = null;
				}
			}

			if (dirty & /*isOpen*/ 2) {
				toggle_class(div1, "isOpen", /*isOpen*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(separator.$$.fragment, local);
			transition_in(header.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(separator.$$.fragment, local);
			transition_out(header.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(separator);
			destroy_component(header);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	component_subscribe($$self, sidebar, $$value => $$invalidate(2, $sidebar = $$value));
	component_subscribe($$self, files, $$value => $$invalidate(5, $files = $$value));
	let file = {};

	const toggle_handler = () => {
		window.api.send("dispatch", { type: "TOGGLE_SIDEBAR_PREVIEW" });
	};

	let isOpen;
	let activeTab;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 4) {
			 $$invalidate(1, isOpen = $sidebar.isPreviewOpen);
		}

		if ($$self.$$.dirty & /*$sidebar*/ 4) {
			 $$invalidate(4, activeTab = $sidebar.tabsById[$sidebar.activeTabId]);
		}

		if ($$self.$$.dirty & /*activeTab, $files*/ 48) {
			 {
				if (activeTab.selected.length) {
					const fileId = activeTab.selected[activeTab.selected.length - 1];
					$$invalidate(0, file = $files.byId[fileId]);
				}
			}
		}
	};

	return [file, isOpen, $sidebar, toggle_handler];
}

class Preview2 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-j2cjn3-style")) add_css$6();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});
	}
}

/* src/js/renderer/component/UI/SearchField.svelte generated by Svelte v3.29.7 */

function add_css$7() {
	var style = element("style");
	style.id = "svelte-148kz4e-style";
	style.textContent = ".searchfield.svelte-148kz4e{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:10px 10px 0;position:relative;background-color:rgba(0, 0, 0, 0.04);border-radius:4px;min-height:20px;display:flex;flex-direction:row;align-items:center}.searchfield.svelte-148kz4e:focus-within{animation-fill-mode:forwards;animation-name:svelte-148kz4e-selectField;animation-duration:0.3s}@keyframes svelte-148kz4e-selectField{from{box-shadow:0 0 0 10px transparent}to{box-shadow:0 0 0 3.5px rgba(59, 153, 252, 0.5)}}.magnifying-glass.svelte-148kz4e{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlTextColor);-webkit-mask-image:var(--img-magnifyingglass);position:absolute;width:13px;height:13px;left:5px;opacity:0.5}.placeholder.svelte-148kz4e{position:absolute;top:50%;transform:translate(0, -50%);color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-148kz4e{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}";
	append(document.head, style);
}

// (93:2) {#if !query}
function create_if_block$3(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr(span, "class", "placeholder svelte-148kz4e");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*placeholder*/ 2) set_data(t, /*placeholder*/ ctx[1]);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

function create_fragment$7(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let mounted;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block$3(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr(div0, "class", "magnifying-glass svelte-148kz4e");
			attr(input_1, "type", "text");
			attr(input_1, "class", "svelte-148kz4e");
			attr(div1, "class", "searchfield svelte-148kz4e");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			if (if_block) if_block.m(div1, null);
			append(div1, t1);
			append(div1, input_1);
			/*input_1_binding*/ ctx[6](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);

			if (!mounted) {
				dispose = [
					listen(window, "keydown", /*handleKeydown*/ ctx[3]),
					listen(div0, "mousedown", prevent_default(/*mousedown_handler*/ ctx[5])),
					listen(input_1, "input", /*input_1_input_handler*/ ctx[7])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(div1, t1);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*query*/ 1 && input_1.value !== /*query*/ ctx[0]) {
				set_input_value(input_1, /*query*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block) if_block.d();
			/*input_1_binding*/ ctx[6](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { placeholder = "Search" } = $$props;
	let { query = "" } = $$props;
	let { focused = false } = $$props;
	let input = null;

	function handleKeydown(evt) {
		if (!focused) return;

		if (evt.key == "f" && evt.metaKey) {
			input.select();
		}
	}

	const mousedown_handler = () => input.select();

	function input_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			input = $$value;
			$$invalidate(2, input);
		});
	}

	function input_1_input_handler() {
		query = this.value;
		$$invalidate(0, query);
	}

	$$self.$$set = $$props => {
		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("focused" in $$props) $$invalidate(4, focused = $$props.focused);
	};

	return [
		query,
		placeholder,
		input,
		handleKeydown,
		focused,
		mousedown_handler,
		input_1_binding,
		input_1_input_handler
	];
}

class SearchField extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-148kz4e-style")) add_css$7();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { placeholder: 1, query: 0, focused: 4 });
	}
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
}

/**
 * https://github.com/gre/bezier-easing
 * BezierEasing - use bezier curve for transition easing function
 * by Gaëtan Renaudeau 2014 - 2015 – MIT License
 */

// These values are established by empiricism with tests (tradeoff: performance VS precision)
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.001;
var SUBDIVISION_PRECISION = 0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;

var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A$1 (aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B$1 (aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C (aA1)      { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier (aT, aA1, aA2) { return ((A$1(aA1, aA2) * aT + B$1(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope (aT, aA1, aA2) { return 3.0 * A$1(aA1, aA2) * aT * aT + 2.0 * B$1(aA1, aA2) * aT + C(aA1); }

function binarySubdivide (aX, aA, aB, mX1, mX2) {
  var currentX, currentT, i = 0;
  do {
    currentT = aA + (aB - aA) / 2.0;
    currentX = calcBezier(currentT, mX1, mX2) - aX;
    if (currentX > 0.0) {
      aB = currentT;
    } else {
      aA = currentT;
    }
  } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
  return currentT;
}

function newtonRaphsonIterate (aX, aGuessT, mX1, mX2) {
 for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
   var currentSlope = getSlope(aGuessT, mX1, mX2);
   if (currentSlope === 0.0) {
     return aGuessT;
   }
   var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
   aGuessT -= currentX / currentSlope;
 }
 return aGuessT;
}

function LinearEasing (x) {
  return x;
}

var src = function bezier (mX1, mY1, mX2, mY2) {
  if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) {
    throw new Error('bezier x values must be in [0, 1] range');
  }

  if (mX1 === mY1 && mX2 === mY2) {
    return LinearEasing;
  }

  // Precompute samples table
  var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
  for (var i = 0; i < kSplineTableSize; ++i) {
    sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
  }

  function getTForX (aX) {
    var intervalStart = 0.0;
    var currentSample = 1;
    var lastSample = kSplineTableSize - 1;

    for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
      intervalStart += kSampleStepSize;
    }
    --currentSample;

    // Interpolate to provide an initial guess for t
    var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
    var guessForT = intervalStart + dist * kSampleStepSize;

    var initialSlope = getSlope(guessForT, mX1, mX2);
    if (initialSlope >= NEWTON_MIN_SLOPE) {
      return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
    } else if (initialSlope === 0.0) {
      return guessForT;
    } else {
      return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
    }
  }

  return function BezierEasing (x) {
    // Because JavaScript number are imprecise, we should guarantee the extremes are right.
    if (x === 0) {
      return 0;
    }
    if (x === 1) {
      return 1;
    }
    return calcBezier(getTForX(x), mY1, mY2);
  };
};

// We use 'bezier-easing' package to convert CSS cubic bezier easing curves to easing functions (which Svelte transitions require).

const standard = src(0.4, 0, 0.2, 1);
const decelerate = src(0, 0, 0.2, 1);

function standardEase(t) {
  return standard(t)
}

/* src/js/renderer/component/SideBar/treelist/File.svelte generated by Svelte v3.29.7 */

function add_css$8() {
	var style = element("style");
	style.id = "svelte-la4kid-style";
	style.textContent = ".file.svelte-la4kid.svelte-la4kid{--leftOffset:0;contain:strict;border-radius:4px;user-select:none;margin-bottom:1px;width:100%;height:28px}.file.svelte-la4kid .icon.svelte-la4kid{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlAccentColor);left:calc(calc(var(--leftOffset) * 1px) + 20px);width:14px;height:14px}.file.svelte-la4kid .label.svelte-la4kid{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);position:absolute;top:50%;transform:translate(0, -50%);color:var(--labelColor);left:calc(calc(var(--leftOffset) * 1px) + 42px);white-space:nowrap}.file.svelte-la4kid .counter.svelte-la4kid{position:absolute;top:50%;transform:translate(0, -50%);font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);color:var(--tertiaryLabelColor);position:absolute;right:7px}.file.folder.svelte-la4kid .icon.svelte-la4kid{-webkit-mask-image:var(--img-folder)}.file.doc.svelte-la4kid .icon.svelte-la4kid{-webkit-mask-image:var(--img-doc-text)}.file.img.svelte-la4kid .icon.svelte-la4kid{-webkit-mask-image:var(--img-photo)}.file.av.svelte-la4kid .icon.svelte-la4kid{-webkit-mask-image:var(--img-play-rectangle)}.file.isSelected.isSidebarFocused.svelte-la4kid.svelte-la4kid{background-color:var(--selectedContentBackgroundColor)}.file.isSelected.isSidebarFocused.svelte-la4kid .icon.svelte-la4kid{background-color:var(--controlColor)}.file.isSelected.isSidebarFocused.svelte-la4kid .label.svelte-la4kid{color:var(--selectedMenuItemTextColor)}.file.isSelected.isSidebarFocused.svelte-la4kid .counter.svelte-la4kid{color:var(--controlColor);opacity:0.4}.file.isSelected.svelte-la4kid.svelte-la4kid:not(.isSidebarFocused){background-color:var(--disabledControlTextColor)}";
	append(document.head, style);
}

// (126:2) {#if isExpandable}
function create_if_block_1$2(ctx) {
	let disclosurebutton;
	let current;

	disclosurebutton = new DisclosureButton({
			props: {
				width: 14,
				height: 14,
				padding: 6,
				left: /*leftOffset*/ ctx[5] + 3,
				rotation: /*isExpanded*/ ctx[4] ? 90 : 0,
				tooltip: "Toggle Expanded",
				iconColor: /*isSelected*/ ctx[1]
				? "controlColor"
				: "controlTextColor"
			}
		});

	disclosurebutton.$on("toggle", /*toggle_handler*/ ctx[9]);

	return {
		c() {
			create_component(disclosurebutton.$$.fragment);
		},
		m(target, anchor) {
			mount_component(disclosurebutton, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const disclosurebutton_changes = {};
			if (dirty & /*leftOffset*/ 32) disclosurebutton_changes.left = /*leftOffset*/ ctx[5] + 3;
			if (dirty & /*isExpanded*/ 16) disclosurebutton_changes.rotation = /*isExpanded*/ ctx[4] ? 90 : 0;

			if (dirty & /*isSelected*/ 2) disclosurebutton_changes.iconColor = /*isSelected*/ ctx[1]
			? "controlColor"
			: "controlTextColor";

			disclosurebutton.$set(disclosurebutton_changes);
		},
		i(local) {
			if (current) return;
			transition_in(disclosurebutton.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(disclosurebutton.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(disclosurebutton, detaching);
		}
	};
}

// (152:2) {#if isExpandable}
function create_if_block$4(ctx) {
	let div;
	let t_value = /*file*/ ctx[3].numDescendants + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "counter svelte-la4kid");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*file*/ 8 && t_value !== (t_value = /*file*/ ctx[3].numDescendants + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function create_fragment$8(ctx) {
	let div2;
	let t0;
	let div0;
	let t1;
	let div1;
	let t2_value = /*file*/ ctx[3].name + "";
	let t2;
	let t3;
	let div2_class_value;
	let css_action;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*isExpandable*/ ctx[0] && create_if_block_1$2(ctx);
	let if_block1 = /*isExpandable*/ ctx[0] && create_if_block$4(ctx);

	return {
		c() {
			div2 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			div0 = element("div");
			t1 = space();
			div1 = element("div");
			t2 = text(t2_value);
			t3 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "icon svelte-la4kid");
			attr(div1, "class", "label svelte-la4kid");
			attr(div2, "class", div2_class_value = "file " + /*file*/ ctx[3].type + " svelte-la4kid");
			toggle_class(div2, "isSidebarFocused", /*isSidebarFocused*/ ctx[2]);
			toggle_class(div2, "isSelected", /*isSelected*/ ctx[1]);
			toggle_class(div2, "isExpanded", /*isExpanded*/ ctx[4]);
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			if (if_block0) if_block0.m(div2, null);
			append(div2, t0);
			append(div2, div0);
			append(div2, t1);
			append(div2, div1);
			append(div1, t2);
			append(div2, t3);
			if (if_block1) if_block1.m(div2, null);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(css_action = css.call(null, div2, { leftOffset: /*leftOffset*/ ctx[5] })),
					listen(div2, "mousedown", /*mousedown_handler*/ ctx[10])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (/*isExpandable*/ ctx[0]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*isExpandable*/ 1) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1$2(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div2, t0);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if ((!current || dirty & /*file*/ 8) && t2_value !== (t2_value = /*file*/ ctx[3].name + "")) set_data(t2, t2_value);

			if (/*isExpandable*/ ctx[0]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block$4(ctx);
					if_block1.c();
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!current || dirty & /*file*/ 8 && div2_class_value !== (div2_class_value = "file " + /*file*/ ctx[3].type + " svelte-la4kid")) {
				attr(div2, "class", div2_class_value);
			}

			if (css_action && is_function(css_action.update) && dirty & /*leftOffset*/ 32) css_action.update.call(null, { leftOffset: /*leftOffset*/ ctx[5] });

			if (dirty & /*file, isSidebarFocused*/ 12) {
				toggle_class(div2, "isSidebarFocused", /*isSidebarFocused*/ ctx[2]);
			}

			if (dirty & /*file, isSelected*/ 10) {
				toggle_class(div2, "isSelected", /*isSelected*/ ctx[1]);
			}

			if (dirty & /*file, isExpanded*/ 24) {
				toggle_class(div2, "isExpanded", /*isExpanded*/ ctx[4]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div2);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let $files;
	let $sidebar;
	let $project;
	component_subscribe($$self, files, $$value => $$invalidate(11, $files = $$value));
	component_subscribe($$self, sidebar, $$value => $$invalidate(12, $sidebar = $$value));
	component_subscribe($$self, project, $$value => $$invalidate(13, $project = $$value));
	const dispatch = createEventDispatcher();
	let { id } = $$props;
	let { item = {} } = $$props;
	let { isExpandable = false } = $$props;
	let { isSelected = false } = $$props;
	let { isSidebarFocused = false } = $$props;
	const toggle_handler = () => dispatch("toggleExpanded", { file, isExpanded });
	const mousedown_handler = domEvent => dispatch("selectFile", { file, isSelected, domEvent });

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(7, id = $$props.id);
		if ("item" in $$props) $$invalidate(8, item = $$props.item);
		if ("isExpandable" in $$props) $$invalidate(0, isExpandable = $$props.isExpandable);
		if ("isSelected" in $$props) $$invalidate(1, isSelected = $$props.isSelected);
		if ("isSidebarFocused" in $$props) $$invalidate(2, isSidebarFocused = $$props.isSidebarFocused);
	};

	let file;
	let isExpanded;
	let leftOffset;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$files, id*/ 2176) {
			 $$invalidate(3, file = $files.byId[id]);
		}

		if ($$self.$$.dirty & /*file*/ 8) {
			 $$invalidate(0, isExpandable = file.type == "folder" && file.numChildren);
		}

		if ($$self.$$.dirty & /*$sidebar, file*/ 4104) {
			 $$invalidate(4, isExpanded = $sidebar.tabsById.project.expanded.some(id => id == file.id));
		}

		if ($$self.$$.dirty & /*$sidebar, file*/ 4104) {
			 $$invalidate(1, isSelected = $sidebar.tabsById.project.selected.some(id => id == file.id));
		}

		if ($$self.$$.dirty & /*file*/ 8) {
			 $$invalidate(5, leftOffset = (file.nestDepth - 1) * 15);
		}

		if ($$self.$$.dirty & /*$project*/ 8192) {
			 $$invalidate(2, isSidebarFocused = $project.focusedLayoutSection == "sidebar");
		}
	};

	return [
		isExpandable,
		isSelected,
		isSidebarFocused,
		file,
		isExpanded,
		leftOffset,
		dispatch,
		id,
		item,
		toggle_handler,
		mousedown_handler
	];
}

class File extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-la4kid-style")) add_css$8();

		init(this, options, instance$8, create_fragment$8, not_equal, {
			id: 7,
			item: 8,
			isExpandable: 0,
			isSelected: 1,
			isSidebarFocused: 2
		});
	}
}

function flip(node, animation, params) {
    const style = getComputedStyle(node);
    const transform = style.transform === 'none' ? '' : style.transform;
    const scaleX = animation.from.width / node.clientWidth;
    const scaleY = animation.from.height / node.clientHeight;
    const dx = (animation.from.left - animation.to.left) / scaleX;
    const dy = (animation.from.top - animation.to.top) / scaleY;
    const d = Math.sqrt(dx * dx + dy * dy);
    const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
    return {
        delay,
        duration: is_function(duration) ? duration(d) : duration,
        easing,
        css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
    };
}

/**
 * Set parent to overflow:hidden to make it look like the sliding element is being masked.
 * @param {*} node 
 * @param {*} param1 
 */
function slideUp(node, { duration = 100, easing = standardEase }) {
  return {
    duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * -100}%)`,
  }
}

/* src/js/renderer/component/SideBar/treelist/Folder.svelte generated by Svelte v3.29.7 */

function add_css$9() {
	var style = element("style");
	style.id = "svelte-2t6zz2-style";
	style.textContent = ".folder.svelte-2t6zz2{--folderHeight:0;--folderEasing:0;--duration:0;position:absolute;width:100%;overflow:hidden;height:calc(var(--folderHeight) * 1px);transition:height calc(var(--duration) * 1ms) var(--folderEasing)}.folder.isRoot.svelte-2t6zz2{position:relative}.folder.svelte-2t6zz2,ul.svelte-2t6zz2{transform-origin:left top;will-change:transform}ul.svelte-2t6zz2,li.svelte-2t6zz2{margin:0;padding:0;text-indent:0;list-style-type:none}li.svelte-2t6zz2{position:relative;display:block}li.empty.svelte-2t6zz2{height:28px;pointer-events:none;visibility:hidden;margin-bottom:1px}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	return child_ctx;
}

// (94:4) {#if !row.id.includes('empty')}
function create_if_block$5(ctx) {
	let file;
	let t;
	let show_if = /*isExpandedFolder*/ ctx[5](/*row*/ ctx[14].id);
	let if_block_anchor;
	let current;
	file = new File({ props: { id: /*row*/ ctx[14].id } });
	file.$on("selectFile", /*selectFile_handler*/ ctx[6]);
	file.$on("toggleExpanded", /*toggleExpanded_handler*/ ctx[7]);
	let if_block = show_if && create_if_block_1$3(ctx);

	return {
		c() {
			create_component(file.$$.fragment);
			t = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			mount_component(file, target, anchor);
			insert(target, t, anchor);
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const file_changes = {};
			if (dirty & /*tree*/ 1) file_changes.id = /*row*/ ctx[14].id;
			file.$set(file_changes);
			if (dirty & /*tree*/ 1) show_if = /*isExpandedFolder*/ ctx[5](/*row*/ ctx[14].id);

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*tree*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1$3(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(file.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(file.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			destroy_component(file, detaching);
			if (detaching) detach(t);
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

// (96:5) {#if isExpandedFolder(row.id)}
function create_if_block_1$3(ctx) {
	let folder;
	let current;
	folder = new Folder({ props: { tree: /*row*/ ctx[14] } });
	folder.$on("selectFile", /*selectFile_handler_1*/ ctx[8]);
	folder.$on("toggleExpanded", /*toggleExpanded_handler_1*/ ctx[9]);

	return {
		c() {
			create_component(folder.$$.fragment);
		},
		m(target, anchor) {
			mount_component(folder, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const folder_changes = {};
			if (dirty & /*tree*/ 1) folder_changes.tree = /*row*/ ctx[14];
			folder.$set(folder_changes);
		},
		i(local) {
			if (current) return;
			transition_in(folder.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(folder.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(folder, detaching);
		}
	};
}

// (92:2) {#each tree.children as row (row.id)}
function create_each_block(key_1, ctx) {
	let li;
	let show_if = !/*row*/ ctx[14].id.includes("empty");
	let t;
	let rect;
	let stop_animation = noop;
	let current;
	let if_block = show_if && create_if_block$5(ctx);

	return {
		key: key_1,
		first: null,
		c() {
			li = element("li");
			if (if_block) if_block.c();
			t = space();
			attr(li, "class", "svelte-2t6zz2");
			toggle_class(li, "empty", /*row*/ ctx[14].id.includes("empty"));
			this.first = li;
		},
		m(target, anchor) {
			insert(target, li, anchor);
			if (if_block) if_block.m(li, null);
			append(li, t);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*tree*/ 1) show_if = !/*row*/ ctx[14].id.includes("empty");

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*tree*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$5(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(li, t);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty & /*tree*/ 1) {
				toggle_class(li, "empty", /*row*/ ctx[14].id.includes("empty"));
			}
		},
		r() {
			rect = li.getBoundingClientRect();
		},
		f() {
			fix_position(li);
			stop_animation();
		},
		a() {
			stop_animation();

			stop_animation = create_animation(li, rect, flip, {
				duration: /*duration*/ ctx[4],
				easing: standardEase
			});
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			if (if_block) if_block.d();
		}
	};
}

function create_fragment$9(ctx) {
	let div;
	let ul;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let ul_transition;
	let css_action;
	let current;
	let mounted;
	let dispose;
	let each_value = /*tree*/ ctx[0].children;
	const get_key = ctx => /*row*/ ctx[14].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	return {
		c() {
			div = element("div");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ul, "class", "rows svelte-2t6zz2");
			attr(div, "class", "folder svelte-2t6zz2");
			toggle_class(div, "isRoot", /*isRoot*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, div, {
					folderHeight: /*folderHeight*/ ctx[2],
					folderEasing: /*folderEasing*/ ctx[3],
					duration: /*duration*/ ctx[4]
				}));

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (dirty & /*tree, isExpandedFolder*/ 33) {
				const each_value = /*tree*/ ctx[0].children;
				group_outros();
				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
				check_outros();
			}

			if (css_action && is_function(css_action.update) && dirty & /*folderHeight, folderEasing, duration*/ 28) css_action.update.call(null, {
				folderHeight: /*folderHeight*/ ctx[2],
				folderEasing: /*folderEasing*/ ctx[3],
				duration: /*duration*/ ctx[4]
			});

			if (dirty & /*isRoot*/ 2) {
				toggle_class(div, "isRoot", /*isRoot*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			if (local) {
				add_render_callback(() => {
					if (!ul_transition) ul_transition = create_bidirectional_transition(ul, slideUp, { duration: /*duration*/ ctx[4] }, true);
					ul_transition.run(1);
				});
			}

			current = true;
		},
		o(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			if (local) {
				if (!ul_transition) ul_transition = create_bidirectional_transition(ul, slideUp, { duration: /*duration*/ ctx[4] }, false);
				ul_transition.run(0);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (detaching && ul_transition) ul_transition.end();
			mounted = false;
			dispose();
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let $state;
	let $files;
	let $sidebar;
	component_subscribe($$self, state, $$value => $$invalidate(11, $state = $$value));
	component_subscribe($$self, files, $$value => $$invalidate(12, $files = $$value));
	component_subscribe($$self, sidebar, $$value => $$invalidate(13, $sidebar = $$value));
	let { tree } = $$props;
	let { isRoot = false } = $$props;

	// When the number of children changes, the height changes. This happens instantly, and can clip the child elements as they animate to their new positions. We could animate the height at the same duration and easing as the other transitions, but that's a big performance no-no. So instead we use `step` transitions to wait until the standard transition duration is complete, and then set the new value. OR we set it at the beginning. It depends on whether the folder has grown or shrunk. We determine -that- by comparing the new and old `numVisibleDescendants`.
	let oldNumVisibleDescendants = 0;

	let folderHeight = 0;
	let folderEasing = 0;

	function isExpandedFolder(id) {
		const file = $files.byId[id];
		const isFolder = file.type == "folder";
		const isExpandable = isFolder && file.numChildren;
		const isExpanded = isExpandable && $sidebar.tabsById.project.expanded.some(id => id == file.id);
		return isExpanded;
	}

	function selectFile_handler(event) {
		bubble($$self, event);
	}

	function toggleExpanded_handler(event) {
		bubble($$self, event);
	}

	function selectFile_handler_1(event) {
		bubble($$self, event);
	}

	function toggleExpanded_handler_1(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("tree" in $$props) $$invalidate(0, tree = $$props.tree);
		if ("isRoot" in $$props) $$invalidate(1, isRoot = $$props.isRoot);
	};

	let duration;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$state*/ 2048) {
			 $$invalidate(4, duration = $state.timing.treeListFolder);
		}

		if ($$self.$$.dirty & /*tree, oldNumVisibleDescendants*/ 1025) {
			 {
				if (tree.numVisibleDescendants !== oldNumVisibleDescendants) {
					const hasGrown = tree.numVisibleDescendants > oldNumVisibleDescendants;
					$$invalidate(3, folderEasing = hasGrown ? "step-start" : "step-end");
					$$invalidate(2, folderHeight = tree.numVisibleDescendants * 29);
					$$invalidate(10, oldNumVisibleDescendants = tree.numVisibleDescendants);
				}
			}
		}
	};

	return [
		tree,
		isRoot,
		folderHeight,
		folderEasing,
		duration,
		isExpandedFolder,
		selectFile_handler,
		toggleExpanded_handler,
		selectFile_handler_1,
		toggleExpanded_handler_1
	];
}

class Folder extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-2t6zz2-style")) add_css$9();
		init(this, options, instance$9, create_fragment$9, not_equal, { tree: 0, isRoot: 1 });
	}
}

/* src/js/renderer/component/SideBar/Project.svelte generated by Svelte v3.29.7 */

const { window: window_1 } = globals;

function add_css$a() {
	var style = element("style");
	style.id = "svelte-1plfzan-style";
	style.textContent = "#project.svelte-1plfzan{display:flex;flex-direction:column;overflow:hidden;flex-grow:1}.wrapper.svelte-1plfzan:not(.active){display:none}#results.svelte-1plfzan{padding:10px;flex-grow:1;overflow-y:scroll;position:relative}";
	append(document.head, style);
}

function create_fragment$a(ctx) {
	let div1;
	let header;
	let t0;
	let separator;
	let t1;
	let searchfield;
	let updating_query;
	let t2;
	let div0;
	let folder;
	let current;
	let mounted;
	let dispose;
	header = new Header({ props: { title: /*tab*/ ctx[2].title } });
	separator = new Separator({ props: { marginSides: 10 } });

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[6].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));

	folder = new Folder({
			props: { tree: /*tree*/ ctx[1], isRoot: true }
		});

	folder.$on("selectFile", /*selectFile*/ ctx[4]);
	folder.$on("toggleExpanded", /*toggleExpanded*/ ctx[5]);

	return {
		c() {
			div1 = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			div0 = element("div");
			create_component(folder.$$.fragment);
			attr(div0, "id", "results");
			attr(div0, "class", "svelte-1plfzan");
			attr(div1, "id", "project");
			attr(div1, "class", "wrapper svelte-1plfzan");
			toggle_class(div1, "active", /*tab*/ ctx[2].active);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(header, div1, null);
			append(div1, t0);
			mount_component(separator, div1, null);
			append(div1, t1);
			mount_component(searchfield, div1, null);
			append(div1, t2);
			append(div1, div0);
			mount_component(folder, div0, null);
			current = true;

			if (!mounted) {
				dispose = listen(window_1, "keydown", /*handleKeydown*/ ctx[3]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 4) header_changes.title = /*tab*/ ctx[2].title;

			if (dirty & /*$$scope*/ 8388608) {
				header_changes.$$scope = { dirty, ctx };
			}

			header.$set(header_changes);
			const searchfield_changes = {};

			if (!updating_query && dirty & /*query*/ 1) {
				updating_query = true;
				searchfield_changes.query = /*query*/ ctx[0];
				add_flush_callback(() => updating_query = false);
			}

			searchfield.$set(searchfield_changes);
			const folder_changes = {};
			if (dirty & /*tree*/ 2) folder_changes.tree = /*tree*/ ctx[1];
			folder.$set(folder_changes);

			if (dirty & /*tab*/ 4) {
				toggle_class(div1, "active", /*tab*/ ctx[2].active);
			}
		},
		i(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);
			transition_in(folder.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			transition_out(folder.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(header);
			destroy_component(separator);
			destroy_component(searchfield);
			destroy_component(folder);
			mounted = false;
			dispose();
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	let $files;
	component_subscribe($$self, sidebar, $$value => $$invalidate(7, $sidebar = $$value));
	component_subscribe($$self, project, $$value => $$invalidate(11, $project = $$value));
	component_subscribe($$self, files, $$value => $$invalidate(12, $files = $$value));
	F();
	let query = ""; // Bound to search field
	let resultsVisible = [];

	// $: console.log(tree)
	/* ---- How file updating works ----
 * User makes changes to project directory (e.g. adds a file).
 * Watcher chokidar instance catches. (main)
 * Updates its `files`, then sends patches to render process.
 * StateManager receives patches (render)
 * Applies them to it's 1:1 copy of files (`filesAsObject`), to keep them in sync.
 * Updates its files store (`files`). Which is exported.
 * Svelte components import `files` store.
 * Creates immutabale copy using immer, in `makeStore`
 * Updates whenever `$files` store from StateManager updates.
 * Immutable child components see their dependencies have updated, but only update when their objects are replaced.
 */
	let tree;

	// $: tab.expanded, updateTree()
	function makeTree() {
		// if (!$files.tree) return
		const projectFolder = $files.tree[0];

		// Use immer to apply changes immutably (leaving $files untouched).
		$$invalidate(1, tree = an(projectFolder, draft => {
			sortTree(draft);
			mapVisibleDescendants(draft, true);
			insertEmptyRows(draft);
		})); // (patches, inversePatches) => {
		//   console.log(patches)
		// }

		console.log(tree);
	} // flat = createFlatHierarchy(tree)
	// console.log(flat)

	// flat.forEach((r, index) => {
	//   // Skip top-level folder. Most of it's properties are not set.
	//   const isTopFolder = r.parentId == ''
	//   if (!isTopFolder) {
	//     const color = r.isVisible ? 'white' : 'gray'
	//     console.log(
	//       `%c${r.indexInAllVisible ? r.indexInAllVisible : '/'} ${r.indexInVisibleSiblings} ${'—'.repeat(
	//         r.details.nestDepth
	//       )} ${r.details.name}`,
	//       `color:${color}`
	//     )
	//   }
	// })
	function sortTree(folder) {
		// Sort
		folder.children.sort((a, b) => {
			const itemA = $files.byId[a.id];
			const itemB = $files.byId[b.id];
			return itemA.name.localeCompare(itemB.name);
		});

		folder.children.forEach(c => {
			const type = $files.byId[c.id].type;

			// Recursively sort
			if (type == "folder" && c.children.length) {
				sortTree(c);
			}
		});
	}

	function mapVisibleDescendants(folder, isRoot = false) {
		folder.numVisibleDescendants = 0;
		const isExpanded = tab.expanded.some(id => id == folder.id);
		if (!isRoot && !isExpanded) return { numVisibleDescendants: 0 };

		folder.children.forEach(c => {
			folder.numVisibleDescendants++;
			const file = $files.byId[c.id];

			if (file.type == "folder") {
				const { numVisibleDescendants } = mapVisibleDescendants(c);
				folder.numVisibleDescendants += numVisibleDescendants;
			}
		});

		return {
			numVisibleDescendants: folder.numVisibleDescendants
		};
	}

	function insertEmptyRows(folder) {
		// For each expanded folder, insert empty sibling elements equal to the length of folder's visible descendants.
		for (var i = 0; i < folder.children.length; i++) {
			let c = folder.children[i];
			if (c.id.includes("empty")) continue;
			const file = $files.byId[c.id];
			const isExpandedFolder = file.type == "folder" && tab.expanded.some(id => id == c.id);

			if (isExpandedFolder) {
				let emptyItems = [];

				for (var x = 0; x < c.numVisibleDescendants; x++) {
					emptyItems.push({ id: `empty-${c.id}-${x}` });
				}

				folder.children.splice(i + 1, 0, ...emptyItems);
				insertEmptyRows(c);
			}
		}
	}

	// -------- RESULTS -------- //
	// function updateSelected(children) {
	//   children.forEach((r) => {
	//     r.isSelected = tab.selected.some((id) => id = r.id)
	//     if (r.children && r.children.length) {
	//       updateSelected(r.children)
	//     }
	//   })
	// }
	// Update `resultsTree` and `resultsFlat` when folders, files, or search query change.
	// $: {
	//   index = 0
	//   indexInAllVisibleItems = 0
	//   if (query == '') {
	//     resultsTree = createTreeHierarchy([].concat(...[folders, files]))[0]
	//       .children
	//     sortChildren(resultsTree)
	//   } else {
	//     resultsTree = files.filter((f) =>
	//       // Convert to uppercase so the search is case insensitive
	//       f.name.toUpperCase().includes(query.toUpperCase())
	//     )
	//     sortChildren(resultsTree)
	//   }
	//   resultsFlat = resultsTree.length ? createFlatHierarchy(resultsTree) : []
	// }
	// // Update `resultsVisible` when `resultsFlat` or `tab` changes
	// $: {
	//   resultsVisible = []
	//   if (resultsFlat.length) {
	//     for (let i = 0; i < resultsFlat.length; i++) {
	//       const result = resultsFlat[i]
	//       resultsVisible.push(result)
	//       if (result.type == 'folder') {
	//         const isExpanded = tab.expanded.some((id) => id == result.id)
	//         if (!isExpanded) {
	//           i += result.recursiveChildCount
	//         }
	//       }
	//     }
	//   }
	// }
	// -------- KEY DOWN -------- //
	function handleKeydown(evt) {
		if (!isSidebarFocused) return;

		switch (evt.key) {
			case "ArrowLeft":
			case "ArrowRight":
				evt.preventDefault();
				handleArrowLeftRight(evt.key);
				break;
			case "ArrowUp":
			case "ArrowDown":
				evt.preventDefault();
				handleArrowUpDown(evt.key, evt.shiftKey, evt.altKey);
				break;
		}
	}

	function handleArrowLeftRight(key) {
		console.log("handleArrowLeftRight: ", key);
		return;
	}

	function handleArrowUpDown(key, shiftPressed, altPressed) {
		let item = {};
		let selected = [];

		// Checks
		const indexOfLastSelectedItemInResultsVisible = resultsVisible.findIndex(r => r.id == tab.lastSelected);

		const isStillVisible = indexOfLastSelectedItemInResultsVisible !== -1;
		const isAlreadyAtStartOfResultsVisible = indexOfLastSelectedItemInResultsVisible == 0;
		const isAlreadyAtEndOfResultsVisible = indexOfLastSelectedItemInResultsVisible + 1 == resultsVisible.length;

		// Determine next item
		if (!isStillVisible || altPressed) {
			// If last selected item is no longer visible (e.g. parent folder since toggled closed), OR alt is pressed: select first or last item in list.
			switch (key) {
				case "ArrowUp":
					item = resultsVisible[0];
					break;
				case "ArrowDown":
					item = resultsVisible[resultsVisible.length - 1];
					break;
			}
		} else if (key == "ArrowUp" && isAlreadyAtStartOfResultsVisible) {
			// If arrowing up, and already at start, (re)select first item in list
			item = resultsVisible[0];
		} else if (key == "ArrowDown" && isAlreadyAtEndOfResultsVisible) {
			// If arrowing down, and already at end, (re)select last item in list
			item = resultsVisible[resultsVisible.length - 1];
		} else {
			switch (key) {
				case "ArrowUp":
					item = resultsVisible[indexOfLastSelectedItemInResultsVisible - 1];
					break;
				case "ArrowDown":
					item = resultsVisible[indexOfLastSelectedItemInResultsVisible + 1];
					break;
			}
		}

		// Select it, or add it to existing selection, depending on whether shift is pressed
		if (shiftPressed) {
			selected = tab.selected.slice();
			selected.push(item.id);
		} else {
			selected = [item.id];
		}

		// Update selection
		window.api.send("dispatch", {
			type: "SELECT_SIDEBAR_ITEMS",
			tabName: "project",
			lastSelected: id,
			selected
		});
	}

	// -------- MOUSE DOWN -------- //
	function selectFile(evt) {
		const { file, isSelected } = evt.detail;
		const domEvent = evt.detail.domEvent;

		// Shift-click: Select range of items in list
		// Click while not selected: Make this the only selected item
		// Cmd-click while not selected: Add this to existing items
		// Cmd-click while selected: Remove this from existing items
		const shiftClicked = domEvent.shiftKey;

		const clickedWhileSelected = !domEvent.metaKey && isSelected;
		const clickedWhileNotSelected = !domEvent.metaKey && !isSelected;
		const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected;
		const cmdClickedWhileSelected = domEvent.metaKey && isSelected;
		let selected = [];

		if (clickedWhileSelected) {
			return;
		} else if (shiftClicked) {
			const clickedIndex = resultsVisible.findIndex(r => r.id == file.id);
			const lastSelectedIndex = resultsVisible.findIndex(r => r.id == tab.lastSelected.id);
			const lastSelectedIsStillVisible = lastSelectedIndex !== -1;
			selected = tab.selected.slice();

			if (!lastSelectedIsStillVisible) {
				selected = [file.id];
			} else {
				const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex);
				const selectToIndex = Math.max(clickedIndex, lastSelectedIndex);

				resultsVisible.forEach((r, index) => {
					if (index >= selectFromIndex && index <= selectToIndex) {
						selected.push(r.id);
					}
				});
			}
		} else if (clickedWhileNotSelected) {
			selected.push(file.id);
		} else if (cmdClickedWhileNotSelected) {
			selected = tab.selected.concat([file.id]);
		} else if (cmdClickedWhileSelected) {
			// Copy array and remove this item from it
			selected = tab.selected.slice();

			const indexToRemove = selected.findIndex(id => id == file.id);
			selected.splice(indexToRemove, 1);
		}

		window.api.send("dispatch", {
			type: "SELECT_SIDEBAR_ITEMS",
			tabId: "project",
			lastSelected: id,
			selected
		});
	}

	// -------- HELPERS -------- //
	function toggleExpanded(evt) {
		const { file, isExpanded } = evt.detail;
		let expanded = tab.expanded.slice();

		switch (isExpanded) {
			case true:
				const indexToRemove = expanded.findIndex(id => id == file.id);
				expanded.splice(indexToRemove, 1);
				break;
			case false:
				expanded.push(file.id);
				break;
		}

		window.api.send("dispatch", {
			type: "EXPAND_SIDEBAR_ITEMS",
			tabId: "project",
			expanded
		});
	}

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	let tab;
	let isQueryEmpty;
	let isSidebarFocused;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 128) {
			 $$invalidate(2, tab = $sidebar.tabsById.project);
		}

		if ($$self.$$.dirty & /*query*/ 1) {
			 $$invalidate(8, isQueryEmpty = query == "");
		}

		if ($$self.$$.dirty & /*isQueryEmpty*/ 256) ;

		if ($$self.$$.dirty & /*$project*/ 2048) {
			 isSidebarFocused = $project.focusedLayoutSection == "sidebar";
		}

		if ($$self.$$.dirty & /*$files, tab*/ 4100) {
			 (tab.expanded, makeTree());
		}
	};

	return [
		query,
		tree,
		tab,
		handleKeydown,
		selectFile,
		toggleExpanded,
		searchfield_query_binding
	];
}

class Project extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1plfzan-style")) add_css$a();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});
	}
}

/* src/js/renderer/component/SideBar/Tab.svelte generated by Svelte v3.29.7 */

function add_css$b() {
	var style = element("style");
	style.id = "svelte-h75x2s-style";
	style.textContent = "li.svelte-h75x2s{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;background-color:var(--controlTextColor);list-style-type:none;margin:0 12px 0 0;padding:0;width:14px;height:14px;opacity:70%}li.isActive.svelte-h75x2s{background-color:var(--controlAccentColor);opacity:100%}li.svelte-h75x2s:last-of-type{margin:0}.project.svelte-h75x2s{-webkit-mask-image:var(--img-folder)}.project.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-folder-fill)}.allDocs.svelte-h75x2s{-webkit-mask-image:var(--img-doc-on-doc)}.allDocs.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-doc-on-doc-fill)}.mostRecent.svelte-h75x2s{-webkit-mask-image:var(--img-clock)}.mostRecent.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-clock-fill)}.tags.svelte-h75x2s{-webkit-mask-image:var(--img-tag)}.tags.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-tag-fill)}.media.svelte-h75x2s{-webkit-mask-image:var(--img-photo)}.media.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-photo-fill)}.citations.svelte-h75x2s{-webkit-mask-image:var(--img-quote-bubble)}.citations.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-quote-bubble-fill)}.search.svelte-h75x2s{-webkit-mask-image:var(--img-magnifyingglass)}.search.isActive.svelte-h75x2s{-webkit-mask-image:var(--img-magnifyingglass)}";
	append(document.head, style);
}

function create_fragment$b(ctx) {
	let li;
	let li_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			li = element("li");
			attr(li, "class", li_class_value = "" + (null_to_empty(/*id*/ ctx[0]) + " svelte-h75x2s"));
			toggle_class(li, "isActive", /*isActive*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, li, anchor);

			if (!mounted) {
				dispose = listen(li, "click", /*click_handler*/ ctx[2]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*id*/ 1 && li_class_value !== (li_class_value = "" + (null_to_empty(/*id*/ ctx[0]) + " svelte-h75x2s"))) {
				attr(li, "class", li_class_value);
			}

			if (dirty & /*id, isActive*/ 3) {
				toggle_class(li, "isActive", /*isActive*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(li);
			mounted = false;
			dispose();
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { id } = $$props;
	let { isActive } = $$props;
	const click_handler = () => window.api.send("dispatch", { type: "SELECT_SIDEBAR_TAB_BY_ID", id });

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("isActive" in $$props) $$invalidate(1, isActive = $$props.isActive);
	};

	return [id, isActive, click_handler];
}

class Tab extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-h75x2s-style")) add_css$b();
		init(this, options, instance$b, create_fragment$b, not_equal, { id: 0, isActive: 1 });
	}
}

/* src/js/renderer/component/SideBar/SideBar.svelte generated by Svelte v3.29.7 */

function add_css$c() {
	var style = element("style");
	style.id = "svelte-erw1j7-style";
	style.textContent = "#sidebar.svelte-erw1j7.svelte-erw1j7{--state-sideBarWidth:100px;background-color:var(--windowBackgroundColor);width:var(--state-sideBarWidth);height:100%;position:fixed;margin:0;padding:40px 0 0 0;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--separatorColor)}#sidebar.svelte-erw1j7>div.svelte-erw1j7{max-height:100%}#tabs.svelte-erw1j7.svelte-erw1j7{min-height:30px;display:flex;justify-content:center}#tabs.svelte-erw1j7 ul.svelte-erw1j7{padding:0;margin:0;list-style-type:none;display:flex;flex-direction:row;align-items:center}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[1] = list[i];
	return child_ctx;
}

// (53:6) {#each $sidebar.tabsAll as id}
function create_each_block$1(ctx) {
	let tab;
	let current;

	tab = new Tab({
			props: {
				id: /*id*/ ctx[1],
				isActive: /*$sidebar*/ ctx[0].activeTabId == /*id*/ ctx[1]
			}
		});

	return {
		c() {
			create_component(tab.$$.fragment);
		},
		m(target, anchor) {
			mount_component(tab, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const tab_changes = {};
			if (dirty & /*$sidebar*/ 1) tab_changes.id = /*id*/ ctx[1];
			if (dirty & /*$sidebar*/ 1) tab_changes.isActive = /*$sidebar*/ ctx[0].activeTabId == /*id*/ ctx[1];
			tab.$set(tab_changes);
		},
		i(local) {
			if (current) return;
			transition_in(tab.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(tab.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(tab, detaching);
		}
	};
}

function create_fragment$c(ctx) {
	let div1;
	let div0;
	let ul;
	let t0;
	let separator;
	let t1;
	let project_1;
	let t2;
	let preview2;
	let current;
	let each_value = /*$sidebar*/ ctx[0].tabsAll;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	separator = new Separator({});
	project_1 = new Project({});
	preview2 = new Preview2({});

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(project_1.$$.fragment);
			t2 = space();
			create_component(preview2.$$.fragment);
			attr(ul, "class", "svelte-erw1j7");
			attr(div0, "id", "tabs");
			attr(div0, "class", "svelte-erw1j7");
			attr(div1, "id", "sidebar");
			set_style(div1, "--state-sideBarWidth", "250px");
			attr(div1, "class", "svelte-erw1j7");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div0, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append(div1, t0);
			mount_component(separator, div1, null);
			append(div1, t1);
			mount_component(project_1, div1, null);
			append(div1, t2);
			mount_component(preview2, div1, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*$sidebar*/ 1) {
				each_value = /*$sidebar*/ ctx[0].tabsAll;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(ul, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(separator.$$.fragment, local);
			transition_in(project_1.$$.fragment, local);
			transition_in(preview2.$$.fragment, local);
			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(separator.$$.fragment, local);
			transition_out(project_1.$$.fragment, local);
			transition_out(preview2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_each(each_blocks, detaching);
			destroy_component(separator);
			destroy_component(project_1);
			destroy_component(preview2);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let $sidebar;
	component_subscribe($$self, sidebar, $$value => $$invalidate(0, $sidebar = $$value));
	return [$sidebar];
}

class SideBar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-erw1j7-style")) add_css$c();
		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});
	}
}

/* src/js/renderer/component/StateDisplay.svelte generated by Svelte v3.29.7 */

function add_css$d() {
	var style = element("style");
	style.id = "svelte-10hk4gn-style";
	style.textContent = "#stateDisplay.svelte-10hk4gn.svelte-10hk4gn{padding:0rem 1rem;background-color:var(--windowBackgroundColor);overflow:scroll}h1.svelte-10hk4gn.svelte-10hk4gn{font-family:\"SF Pro Display\";font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px;color:var(--labelColor)}.stateTable.svelte-10hk4gn.svelte-10hk4gn{border:1px solid gray;border-radius:4px;padding:0.4em 0.4em;margin-bottom:2em}.property.svelte-10hk4gn.svelte-10hk4gn{display:flex;direction:column;padding:0.2em 0;border-bottom:1px solid rgba(0, 0, 0, 0.1)}.property.svelte-10hk4gn div.svelte-10hk4gn{display:inline-block;white-space:pre-wrap;overflow:scroll}.property.svelte-10hk4gn .key.svelte-10hk4gn{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;text-align:right;color:var(--labelColor);padding-right:1em}.property.svelte-10hk4gn .val.svelte-10hk4gn{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;flex:1 1 auto;color:var(--secondaryLabelColor)}";
	append(document.head, style);
}

function create_fragment$d(ctx) {
	let div8;
	let h1;
	let t1;
	let div3;
	let div2;
	let div0;
	let t3;
	let div1;
	let t4_value = stringify(/*$state*/ ctx[0]) + "";
	let t4;
	let t5;
	let div7;
	let div6;
	let div4;
	let t7;
	let div5;
	let t8_value = stringify(/*$files*/ ctx[1]) + "";
	let t8;

	return {
		c() {
			div8 = element("div");
			h1 = element("h1");
			h1.textContent = "State";
			t1 = space();
			div3 = element("div");
			div2 = element("div");
			div0 = element("div");
			div0.textContent = "state";
			t3 = space();
			div1 = element("div");
			t4 = text(t4_value);
			t5 = space();
			div7 = element("div");
			div6 = element("div");
			div4 = element("div");
			div4.textContent = "files";
			t7 = space();
			div5 = element("div");
			t8 = text(t8_value);
			attr(h1, "class", "svelte-10hk4gn");
			attr(div0, "class", "key svelte-10hk4gn");
			attr(div1, "class", "val svelte-10hk4gn");
			attr(div2, "class", "property svelte-10hk4gn");
			attr(div3, "class", "stateTable svelte-10hk4gn");
			attr(div4, "class", "key svelte-10hk4gn");
			attr(div5, "class", "val svelte-10hk4gn");
			attr(div6, "class", "property svelte-10hk4gn");
			attr(div7, "class", "stateTable svelte-10hk4gn");
			attr(div8, "id", "stateDisplay");
			attr(div8, "class", "svelte-10hk4gn");
		},
		m(target, anchor) {
			insert(target, div8, anchor);
			append(div8, h1);
			append(div8, t1);
			append(div8, div3);
			append(div3, div2);
			append(div2, div0);
			append(div2, t3);
			append(div2, div1);
			append(div1, t4);
			append(div8, t5);
			append(div8, div7);
			append(div7, div6);
			append(div6, div4);
			append(div6, t7);
			append(div6, div5);
			append(div5, t8);
		},
		p(ctx, [dirty]) {
			if (dirty & /*$state*/ 1 && t4_value !== (t4_value = stringify(/*$state*/ ctx[0]) + "")) set_data(t4, t4_value);
			if (dirty & /*$files*/ 2 && t8_value !== (t8_value = stringify(/*$files*/ ctx[1]) + "")) set_data(t8, t8_value);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div8);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let $state;
	let $files;
	component_subscribe($$self, state, $$value => $$invalidate(0, $state = $$value));
	component_subscribe($$self, files, $$value => $$invalidate(1, $files = $$value));
	return [$state, $files];
}

class StateDisplay extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-10hk4gn-style")) add_css$d();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});
	}
}

/* src/js/renderer/component/UI/ToolbarButton.svelte generated by Svelte v3.29.7 */

function add_css$e() {
	var style = element("style");
	style.id = "svelte-162pao8-style";
	style.textContent = ".button.svelte-162pao8{position:relative}.button.svelte-162pao8:hover{background-color:var(--disabledControlTextColor)}.icon.svelte-162pao8{position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:18px;height:18px}";
	append(document.head, style);
}

// (49:2) {#if label}
function create_if_block_1$4(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*label*/ ctx[0]);
			attr(div, "class", "label");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*label*/ 1) set_data(t, /*label*/ ctx[0]);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (52:2) {#if tooltip}
function create_if_block$6(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*tooltip*/ ctx[1]);
			attr(div, "class", "tooltip");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*tooltip*/ 2) set_data(t, /*tooltip*/ ctx[1]);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

function create_fragment$e(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let if_block0 = /*label*/ ctx[0] && create_if_block_1$4(ctx);
	let if_block1 = /*tooltip*/ ctx[1] && create_if_block$6(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "icon svelte-162pao8");
			attr(div0, "style", /*iconStyles*/ ctx[3]);
			attr(div1, "class", "button svelte-162pao8");
			attr(div1, "role", "button");
			attr(div1, "style", /*buttonStyles*/ ctx[2]);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);
		},
		p(ctx, [dirty]) {
			if (dirty & /*iconStyles*/ 8) {
				attr(div0, "style", /*iconStyles*/ ctx[3]);
			}

			if (/*label*/ ctx[0]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1$4(ctx);
					if_block0.c();
					if_block0.m(div1, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*tooltip*/ ctx[1]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block$6(ctx);
					if_block1.c();
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*buttonStyles*/ 4) {
				attr(div1, "style", /*buttonStyles*/ ctx[2]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div1);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { width = 34 } = $$props;
	let { height = 28 } = $$props;
	let { borderRadius = 6 } = $$props;
	let { iconImage = null } = $$props;
	let { iconColor = "--controlTextColor" } = $$props;
	let { label = null } = $$props;
	let { tooltip = null } = $$props;
	let buttonStyles = "";
	let iconStyles = "";

	$$self.$$set = $$props => {
		if ("width" in $$props) $$invalidate(4, width = $$props.width);
		if ("height" in $$props) $$invalidate(5, height = $$props.height);
		if ("borderRadius" in $$props) $$invalidate(6, borderRadius = $$props.borderRadius);
		if ("iconImage" in $$props) $$invalidate(7, iconImage = $$props.iconImage);
		if ("iconColor" in $$props) $$invalidate(8, iconColor = $$props.iconColor);
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*width, height, borderRadius*/ 112) {
			// Button styles
			 {
				$$invalidate(2, buttonStyles = `width: ${width}px; height: ${height}px; border-radius: ${borderRadius}px;`);
			}
		}

		if ($$self.$$.dirty & /*iconImage, iconColor*/ 384) {
			// Icon styles
			 {
				if (iconImage) {
					$$invalidate(3, iconStyles = `-webkit-mask-image: var(${iconImage}); background-color: var(${iconColor});`);
				}
			}
		}
	};

	return [
		label,
		tooltip,
		buttonStyles,
		iconStyles,
		width,
		height,
		borderRadius,
		iconImage,
		iconColor
	];
}

class ToolbarButton extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-162pao8-style")) add_css$e();

		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
			width: 4,
			height: 5,
			borderRadius: 6,
			iconImage: 7,
			iconColor: 8,
			label: 0,
			tooltip: 1
		});
	}
}

/* src/js/renderer/component/AddressBar.svelte generated by Svelte v3.29.7 */

function add_css$f() {
	var style = element("style");
	style.id = "svelte-oi7a03-style";
	style.textContent = "#addressbar.svelte-oi7a03{margin:0 auto}.searchfield.svelte-oi7a03{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);position:relative;background-color:rgba(0, 0, 0, 0.04);border-radius:4px;min-height:20px;min-width:20rem;max-width:40rem;display:flex;flex-direction:row;align-items:center}.searchfield.svelte-oi7a03:focus-within{animation-fill-mode:forwards;animation-name:svelte-oi7a03-selectField;animation-duration:0.3s}@keyframes svelte-oi7a03-selectField{from{box-shadow:0 0 0 10px transparent}to{box-shadow:0 0 0 3.5px rgba(59, 153, 252, 0.5)}}.magnifying-glass.svelte-oi7a03{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlTextColor);-webkit-mask-image:var(--img-magnifyingglass);position:absolute;width:13px;height:13px;left:5px;opacity:0.5}.placeholder.svelte-oi7a03{position:absolute;top:50%;transform:translate(0, -50%);color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-oi7a03{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}";
	append(document.head, style);
}

// (102:4) {#if !query}
function create_if_block$7(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr(span, "class", "placeholder svelte-oi7a03");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, dirty) {
			if (dirty & /*placeholder*/ 2) set_data(t, /*placeholder*/ ctx[1]);
		},
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

function create_fragment$f(ctx) {
	let div2;
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let mounted;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block$7(ctx);

	return {
		c() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr(div0, "class", "magnifying-glass svelte-oi7a03");
			attr(input_1, "type", "text");
			attr(input_1, "class", "svelte-oi7a03");
			attr(div1, "class", "searchfield svelte-oi7a03");
			attr(div2, "id", "addressbar");
			attr(div2, "class", "svelte-oi7a03");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div1);
			append(div1, div0);
			append(div1, t0);
			if (if_block) if_block.m(div1, null);
			append(div1, t1);
			append(div1, input_1);
			/*input_1_binding*/ ctx[7](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);

			if (!mounted) {
				dispose = [
					listen(window, "keydown", /*handleKeydown*/ ctx[3]),
					listen(div0, "mousedown", prevent_default(/*mousedown_handler*/ ctx[6])),
					listen(input_1, "input", /*input_1_input_handler*/ ctx[8])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$7(ctx);
					if_block.c();
					if_block.m(div1, t1);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*query*/ 1 && input_1.value !== /*query*/ ctx[0]) {
				set_input_value(input_1, /*query*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div2);
			if (if_block) if_block.d();
			/*input_1_binding*/ ctx[7](null);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { placeholder = "Search" } = $$props;
	let { query = "" } = $$props;
	let { focused = false } = $$props;
	let input = null;

	// $: console.log(state.openDoc)
	function handleKeydown(evt) {
		if (!focused) return;

		if (evt.key == "f" && evt.metaKey) {
			input.select();
		}
	}

	const mousedown_handler = () => input.select();

	function input_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			input = $$value;
			$$invalidate(2, input);
		});
	}

	function input_1_input_handler() {
		query = this.value;
		$$invalidate(0, query);
	}

	$$self.$$set = $$props => {
		if ("state" in $$props) $$invalidate(4, state = $$props.state);
		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("focused" in $$props) $$invalidate(5, focused = $$props.focused);
	};

	return [
		query,
		placeholder,
		input,
		handleKeydown,
		state,
		focused,
		mousedown_handler,
		input_1_binding,
		input_1_input_handler
	];
}

class AddressBar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-oi7a03-style")) add_css$f();

		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
			state: 4,
			placeholder: 1,
			query: 0,
			focused: 5
		});
	}
}

/* src/js/renderer/component/Toolbar.svelte generated by Svelte v3.29.7 */

function add_css$g() {
	var style = element("style");
	style.id = "svelte-1pvy7sg-style";
	style.textContent = "#address-bar.svelte-1pvy7sg{width:100%;height:40px;display:flex;flex-direction:row;align-items:center;padding:0 5px}";
	append(document.head, style);
}

function create_fragment$g(ctx) {
	let div;
	let toolbarbutton0;
	let t0;
	let addressbar;
	let t1;
	let toolbarbutton1;
	let current;

	toolbarbutton0 = new ToolbarButton({
			props: {
				class: "sidebarBtn",
				iconImage: "--img-sidebar-left"
			}
		});

	addressbar = new AddressBar({ props: { state: /*state*/ ctx[0] } });

	toolbarbutton1 = new ToolbarButton({
			props: {
				class: "gridBtn",
				iconImage: "--img-rectangle-grid-2x2"
			}
		});

	return {
		c() {
			div = element("div");
			create_component(toolbarbutton0.$$.fragment);
			t0 = space();
			create_component(addressbar.$$.fragment);
			t1 = space();
			create_component(toolbarbutton1.$$.fragment);
			attr(div, "id", "address-bar");
			attr(div, "class", "svelte-1pvy7sg");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(toolbarbutton0, div, null);
			append(div, t0);
			mount_component(addressbar, div, null);
			append(div, t1);
			mount_component(toolbarbutton1, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			const addressbar_changes = {};
			if (dirty & /*state*/ 1) addressbar_changes.state = /*state*/ ctx[0];
			addressbar.$set(addressbar_changes);
		},
		i(local) {
			if (current) return;
			transition_in(toolbarbutton0.$$.fragment, local);
			transition_in(addressbar.$$.fragment, local);
			transition_in(toolbarbutton1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(toolbarbutton0.$$.fragment, local);
			transition_out(addressbar.$$.fragment, local);
			transition_out(toolbarbutton1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(toolbarbutton0);
			destroy_component(addressbar);
			destroy_component(toolbarbutton1);
		}
	};
}

function instance$g($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;

	$$self.$$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
	};

	return [state];
}

class Toolbar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1pvy7sg-style")) add_css$g();
		init(this, options, instance$g, create_fragment$g, safe_not_equal, { state: 0 });
	}
}

/* src/js/renderer/component/Layout.svelte generated by Svelte v3.29.7 */

function add_css$h() {
	var style = element("style");
	style.id = "svelte-oqdvsj-style";
	style.textContent = "#main.svelte-oqdvsj{background-color:var(--windowBackgroundColor);width:calc(100vw - 250px);transform:translate(250px, 0);position:absolute;top:0;left:0}";
	append(document.head, style);
}

// (36:0) {:else}
function create_else_block$1(ctx) {
	let sidebar;
	let t0;
	let div;
	let toolbar;
	let t1;
	let separator;
	let t2;
	let statedisplay;
	let current;
	sidebar = new SideBar({});
	toolbar = new Toolbar({});
	separator = new Separator({});
	statedisplay = new StateDisplay({});

	return {
		c() {
			create_component(sidebar.$$.fragment);
			t0 = space();
			div = element("div");
			create_component(toolbar.$$.fragment);
			t1 = space();
			create_component(separator.$$.fragment);
			t2 = space();
			create_component(statedisplay.$$.fragment);
			attr(div, "id", "main");
			attr(div, "class", "flexContainerColumn svelte-oqdvsj");
		},
		m(target, anchor) {
			mount_component(sidebar, target, anchor);
			insert(target, t0, anchor);
			insert(target, div, anchor);
			mount_component(toolbar, div, null);
			append(div, t1);
			mount_component(separator, div, null);
			append(div, t2);
			mount_component(statedisplay, div, null);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			transition_in(toolbar.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(statedisplay.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			transition_out(toolbar.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(statedisplay.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebar, detaching);
			if (detaching) detach(t0);
			if (detaching) detach(div);
			destroy_component(toolbar);
			destroy_component(separator);
			destroy_component(statedisplay);
		}
	};
}

// (34:0) {#if !directoryIsSet || !filesPopulated}
function create_if_block$8(ctx) {
	let firstrun;
	let current;
	firstrun = new FirstRun({});

	return {
		c() {
			create_component(firstrun.$$.fragment);
		},
		m(target, anchor) {
			mount_component(firstrun, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(firstrun.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(firstrun.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(firstrun, detaching);
		}
	};
}

function create_fragment$h(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$8, create_else_block$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (!/*directoryIsSet*/ ctx[0] || !/*filesPopulated*/ ctx[1]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_blocks[current_block_type_index].m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index !== previous_block_index) {
				group_outros();

				transition_out(if_blocks[previous_block_index], 1, 1, () => {
					if_blocks[previous_block_index] = null;
				});

				check_outros();
				if_block = if_blocks[current_block_type_index];

				if (!if_block) {
					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
					if_block.c();
				} else {
					if_block.p(ctx, dirty);
				}

				transition_in(if_block, 1);
				if_block.m(if_block_anchor.parentNode, if_block_anchor);
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance$h($$self, $$props, $$invalidate) {
	let $project;
	let $files;
	component_subscribe($$self, project, $$value => $$invalidate(2, $project = $$value));
	component_subscribe($$self, files, $$value => $$invalidate(3, $files = $$value));
	let directoryIsSet;
	let filesPopulated;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$project*/ 4) {
			 $$invalidate(0, directoryIsSet = $project.directory);
		}

		if ($$self.$$.dirty & /*$files*/ 8) {
			 $$invalidate(1, filesPopulated = $files.tree);
		}

		if ($$self.$$.dirty & /*$files*/ 8) {
			// console.log("--- Layout.svelte ---")
			// $: console.log(directoryIsSet)
			// $: console.log(filesPopulated)
			// $: console.log($project.directory)
			// $: console.log($files.tree)
			 console.log($files);
		}
	};

	return [directoryIsSet, filesPopulated];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-oqdvsj-style")) add_css$h();
		init(this, options, instance$h, create_fragment$h, safe_not_equal, {});
	}
}

window.api.receive("stateChanged", (state, oldState) => {

  // Close window: On close window, complete necessary actions (e.g. save changes to edited docs), then tell state that window is safe to close. This triggers the window actually closing.
  const mainWantsToCloseWindow = hasChangedTo('window.status', 'wantsToClose', window.project, window.oldProject);

  if (mainWantsToCloseWindow) {
    // DO STUFF...
    window.api.send('dispatch', {
      type: 'CAN_SAFELY_CLOSE_WINDOW',
    });
  }
});

window.api.receive('initialFilesFromMain', (files) => {
  console.log('renderer.js: receive initialFilesFromMain');
});


// Setup renderer
async function setup() {

  console.log('renderer.js: setup');

  // Get initial state and files
  const initialState = await window.api.invoke('getState');
  const initialFiles = await window.api.invoke('getFiles');

  // Create managers
  const stateManager = new StateManager(initialState, initialFiles);
  const themeManager = new ThemeManager(initialState);

  // Create layout
  const layout = new Layout({
    target: document.querySelector('#layout')
  });
  
  // Finish setup by showing window
  window.api.send('showWindow');
  console.log('renderer.js: showWindow');
}


window.addEventListener('DOMContentLoaded', setup);
//# sourceMappingURL=renderer.js.map
