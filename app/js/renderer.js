// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
window.process = { env: { NODE_ENV: "production" } };
var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
}

function commonjsRequire (target) {
	throw new Error('Could not dynamically require "' + target + '". Please configure the dynamicRequireTargets option of @rollup/plugin-commonjs appropriately for this require call to behave properly.');
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

/**
 * Wrap setTimeout in a promise so we can use with async/await. 
 * Use like: `await wait(1000);`
 * @param {*} ms 
 */
async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
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

/**
 * Check Immer patches to see if a property has changed, and (optionally) if it equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
function propHasChanged(patches, props, toValue = '') {
	return patches.some((patch) => {

  	const pathAsString = patch.path.toString();
		const checkMultipleProps = Array.isArray(props);

		const hasChanged = checkMultipleProps ?
    	props.every((key) => pathAsString.includes(key)) :
      pathAsString.includes(props);
    
    // If optional 'toValue' argument is specified, check it.
    // Else, only check `hasChanged`
    if (toValue) {
      const equalsValue = patch.value == toValue;
      return hasChanged && equalsValue
    } else {
      return hasChanged
    }
  })
}




const getNestedObject = (nestedObj, pathArr) => {
	return pathArr.reduce((obj, key) =>
		(obj && obj[key] !== 'undefined') ? obj[key] : undefined, nestedObj);
};

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
function add_location(element, file, line, column, char) {
    element.__svelte_meta = {
        loc: { file, line, column, char }
    };
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
function validate_store(store, name) {
    if (store != null && typeof store.subscribe !== 'function') {
        throw new Error(`'${name}' is not a store with a 'subscribe' method`);
    }
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
function set_input_value(input, value) {
    input.value = value == null ? '' : value;
}
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
// unfortunately this can't be a constant as that wouldn't be tree-shakeable
// so we cache the result instead
let crossorigin;
function is_crossorigin() {
    if (crossorigin === undefined) {
        crossorigin = false;
        try {
            if (typeof window !== 'undefined' && window.parent) {
                void window.parent.document;
            }
        }
        catch (error) {
            crossorigin = true;
        }
    }
    return crossorigin;
}
function add_resize_listener(node, fn) {
    const computed_style = getComputedStyle(node);
    const z_index = (parseInt(computed_style.zIndex) || 0) - 1;
    if (computed_style.position === 'static') {
        node.style.position = 'relative';
    }
    const iframe = element('iframe');
    iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
        `overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: ${z_index};`);
    iframe.setAttribute('aria-hidden', 'true');
    iframe.tabIndex = -1;
    const crossorigin = is_crossorigin();
    let unsubscribe;
    if (crossorigin) {
        iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
        unsubscribe = listen(window, 'message', (event) => {
            if (event.source === iframe.contentWindow)
                fn();
        });
    }
    else {
        iframe.src = 'about:blank';
        iframe.onload = () => {
            unsubscribe = listen(iframe.contentWindow, 'resize', fn);
        };
    }
    append(node, iframe);
    return () => {
        if (crossorigin) {
            unsubscribe();
        }
        else if (unsubscribe && iframe.contentWindow) {
            unsubscribe();
        }
        detach(iframe);
    };
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
function afterUpdate(fn) {
    get_current_component().$$.after_update.push(fn);
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
function setContext(key, context) {
    get_current_component().$$.context.set(key, context);
}
function getContext(key) {
    return get_current_component().$$.context.get(key);
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
function tick() {
    schedule_update();
    return resolved_promise;
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
function wait$1() {
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
function create_out_transition(node, fn, params) {
    let config = fn(node, params);
    let running = true;
    let animation_name;
    const group = outros;
    group.r += 1;
    function go() {
        const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
        if (css)
            animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
        const start_time = now() + delay;
        const end_time = start_time + duration;
        add_render_callback(() => dispatch(node, false, 'start'));
        loop(now => {
            if (running) {
                if (now >= end_time) {
                    tick(0, 1);
                    dispatch(node, false, 'end');
                    if (!--group.r) {
                        // this will result in `end()` being called,
                        // so we don't need to clean up here
                        run_all(group.c);
                    }
                    return false;
                }
                if (now >= start_time) {
                    const t = easing((now - start_time) / duration);
                    tick(1 - t, t);
                }
            }
            return running;
        });
    }
    if (is_function(config)) {
        wait$1().then(() => {
            // @ts-ignore
            config = config();
            go();
        });
    }
    else {
        go();
    }
    return {
        end(reset) {
            if (reset && config.tick) {
                config.tick(1, 0);
            }
            if (running) {
                if (animation_name)
                    delete_rule(node, animation_name);
                running = false;
            }
        }
    };
}
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
                wait$1().then(() => {
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
function validate_each_keys(ctx, list, get_context, get_key) {
    const keys = new Set();
    for (let i = 0; i < list.length; i++) {
        const key = get_key(get_context(ctx, list, i));
        if (keys.has(key)) {
            throw new Error('Cannot have duplicate keys in a keyed each');
        }
        keys.add(key);
    }
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

function dispatch_dev(type, detail) {
    document.dispatchEvent(custom_event(type, Object.assign({ version: '3.30.1' }, detail)));
}
function append_dev(target, node) {
    dispatch_dev('SvelteDOMInsert', { target, node });
    append(target, node);
}
function insert_dev(target, node, anchor) {
    dispatch_dev('SvelteDOMInsert', { target, node, anchor });
    insert(target, node, anchor);
}
function detach_dev(node) {
    dispatch_dev('SvelteDOMRemove', { node });
    detach(node);
}
function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
    const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
    if (has_prevent_default)
        modifiers.push('preventDefault');
    if (has_stop_propagation)
        modifiers.push('stopPropagation');
    dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
    const dispose = listen(node, event, handler, options);
    return () => {
        dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
        dispose();
    };
}
function attr_dev(node, attribute, value) {
    attr(node, attribute, value);
    if (value == null)
        dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
    else
        dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
}
function set_data_dev(text, data) {
    data = '' + data;
    if (text.wholeText === data)
        return;
    dispatch_dev('SvelteDOMSetData', { node: text, data });
    text.data = data;
}
function validate_each_argument(arg) {
    if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
        let msg = '{#each} only iterates over array-like objects.';
        if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
            msg += ' You can use a spread to convert this iterable into an array.';
        }
        throw new Error(msg);
    }
}
function validate_slots(name, slot, keys) {
    for (const slot_key of Object.keys(slot)) {
        if (!~keys.indexOf(slot_key)) {
            console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
        }
    }
}
class SvelteComponentDev extends SvelteComponent {
    constructor(options) {
        if (!options || (!options.target && !options.$$inline)) {
            throw new Error("'target' is a required option");
        }
        super();
    }
    $destroy() {
        super.$destroy();
        this.$destroy = () => {
            console.warn('Component was already destroyed'); // eslint-disable-line no-console
        };
    }
    $capture_state() { }
    $inject_state() { }
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

const state = writable({});
const project = writable({});
const sidebar = writable({});

const files = writable({});
const tooltip = writable({ 
  status: 'hide', // 'show', 'hide', or 'hideAfterDelay'
  text: '', 
  x: 0, 
  y: 0 
});

const menu = writable({
  id: undefined,
  isOpen: false,
  isCompact: false,
  buttonType: 'text', // 'text' or 'icon'
  menuType: 'pulldown', // 'pulldown' or 'popup'
  options: [],
  selectedOption: undefined,
  width: 0,
  itemHeight: 0,
  x: 0,
  y: 0,
});

function openMenu(params) {
  menu.update((m) => { return {...m, ...params}});
}

function selectMenuOption(option) {
  menu.update((m) => { return {...m, selectedOption: option, isOpen: false}});
}

function closeMenu() {
  menu.update((m) => { return { ...m, isOpen: false }});
}


// This (seemingly redundant) `stateAsObject` variable is for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
let stateAsObject = {};
let filesAsObject = {};

// -------- SETUP AND UPDATE -------- //

class StateManager {
  constructor(initialState, initialFiles) {

    // Set `window.id`
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    window.id = urlParams.get('id');

    // -------- FILES -------- //

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
      filesAsObject = vn(filesAsObject, patches);
      updateFilesStore();
    });

    // -------- STATE -------- //

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      stateAsObject = vn(stateAsObject, patches);
      updateStateStores();
      const osAppearanceHasChanged = propHasChanged(patches, ['appearance', 'os']);
      if (osAppearanceHasChanged) updateAppearance();
    });

    // Set initial values
    stateAsObject = initialState;
    updateStateStores();
    updateAppearance();
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

function updateAppearance() {

  const root = document.documentElement;
  const themeName = stateAsObject.appearance.theme;
  const colors = stateAsObject.appearance.os.colors;
  const isDarkMode = stateAsObject.appearance.os.isDarkMode;
  // const isHighContrast = stateAsObject.appearance.os.isHighContrast
  // const isInverted = stateAsObject.appearance.os.isInverted
  // const isReducedMotion = stateAsObject.appearance.os.isReducedMotion

  // Set stylesheet href in index.html to new theme's stylesheet.
  // If stylesheet name = 'gambier-light',
  // then stylesheet href = './styles/themes/gambier-light/gambier-light.css'.
  const stylesheet = document.getElementById('theme-stylesheet');
  const href = `./styles/themes/${themeName}/${themeName}.css`;
  stylesheet.setAttribute('href', href);

  // Make system colors available app-wide as CSS variables on the root element.
  for (const [varName, rgbaHex] of Object.entries(colors)) {
    root.style.setProperty(`--${varName}`, rgbaHex);
  }

  // Set dark/light mode class on bod
  if (isDarkMode) {
    root.classList.add('darkMode');
    root.classList.remove('lightMode');
  } else {
    root.classList.remove('darkMode');
    root.classList.add('lightMode');
  }
}

/* src/js/renderer/component/firstrun/FirstRun.svelte generated by Svelte v3.30.1 */

const file = "src/js/renderer/component/firstrun/FirstRun.svelte";

function add_css() {
	var style = element("style");
	style.id = "svelte-53cky2-style";
	style.textContent = "#firstrun.svelte-53cky2{padding:4rem;background-color:var(--windowBackgroundColor);overflow:scroll;height:100%}h1.svelte-53cky2{font-family:\"SF Pro Display\";font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px;color:var(--labelColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlyc3RSdW4uc3ZlbHRlIiwic291cmNlcyI6WyJGaXJzdFJ1bi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cblxuZnVuY3Rpb24gZHJvcChldnQpIHtcbiAgY29uc3QgZmlsZSA9IGV2dC5kYXRhVHJhbnNmZXIuZmlsZXNbMF1cbiAgY29uc3QgdHlwZSA9IGZpbGUudHlwZSA9PSAnJyA/ICdmb2xkZXInIDogZmlsZS50eXBlLmluY2x1ZGVzKCdtYXJrZG93bicpID8gJ2RvYycgOiB1bmRlZmluZWRcbiAgXG4gIGlmICh0eXBlID09ICdmb2xkZXInKSB7XG4gICAgd2luZG93LmFwaS5zZW5kKCdkaXNwYXRjaCcsIHsgXG4gICAgICB0eXBlOiAnU0VUX1BST0pFQ1RfRElSRUNUT1JZJyxcbiAgICAgIGRpcmVjdG9yeTogZmlsZS5wYXRoXG4gICAgfSlcbiAgfVxufVxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4jZmlyc3RydW4ge1xuICBwYWRkaW5nOiA0cmVtO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS13aW5kb3dCYWNrZ3JvdW5kQ29sb3IpO1xuICBvdmVyZmxvdzogc2Nyb2xsO1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbmgxIHtcbiAgZm9udC1mYW1pbHk6IFwiU0YgUHJvIERpc3BsYXlcIjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogMjBweDtcbiAgbGluZS1oZWlnaHQ6IDI0cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4xMnB4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG59XG5cbmgyIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbn08L3N0eWxlPlxuXG48IS0tIDxzdmVsdGU6Ym9keSBvbjpkcm9wfHByZXZlbnREZWZhdWx0fHN0b3BQcm9wYWdhdGlvbj17ZHJvcH0gLz4gLS0+XG5cbjxkaXYgaWQ9XCJmaXJzdHJ1blwiIG9uOmRyYWdvdmVyfHByZXZlbnREZWZhdWx0IG9uOmRyb3B8cHJldmVudERlZmF1bHQ9e2Ryb3B9PlxuICA8aDE+R2FtYmllcjwvaDE+XG5cbiAgPGJ1dHRvblxuICAgIG9uOmNsaWNrPXsoKSA9PiB7XG4gICAgICB3aW5kb3cuYXBpLnNlbmQoJ2Rpc3BhdGNoJywgeyB0eXBlOiAnU0VMRUNUX1BST0pFQ1RfRElSRUNUT1JZX0ZST01fRElBTE9HJyB9KVxuICAgIH19PlxuICAgIENob29zZSBQcm9qZWN0IEZvbGRlci4uLlxuICA8L2J1dHRvbj5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW9CQSxTQUFTLGNBQUMsQ0FBQyxBQUNULE9BQU8sQ0FBRSxJQUFJLENBQ2IsZ0JBQWdCLENBQUUsSUFBSSx1QkFBdUIsQ0FBQyxDQUM5QyxRQUFRLENBQUUsTUFBTSxDQUNoQixNQUFNLENBQUUsSUFBSSxBQUNkLENBQUMsQUFFRCxFQUFFLGNBQUMsQ0FBQyxBQUNGLFdBQVcsQ0FBRSxnQkFBZ0IsQ0FDN0IsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxDQUN2QixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQUFDMUIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment(ctx) {
	let div;
	let h1;
	let t1;
	let button;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "Gambier";
			t1 = space();
			button = element("button");
			button.textContent = "Choose Project Folder...";
			attr_dev(h1, "class", "svelte-53cky2");
			add_location(h1, file, 48, 2, 1109);
			add_location(button, file, 50, 2, 1129);
			attr_dev(div, "id", "firstrun");
			attr_dev(div, "class", "svelte-53cky2");
			add_location(div, file, 47, 0, 1030);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, h1);
			append_dev(div, t1);
			append_dev(div, button);

			if (!mounted) {
				dispose = [
					listen_dev(button, "click", /*click_handler*/ ctx[1], false, false, false),
					listen_dev(div, "dragover", prevent_default(/*dragover_handler*/ ctx[0]), false, true, false),
					listen_dev(div, "drop", prevent_default(drop), false, true, false)
				];

				mounted = true;
			}
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function drop(evt) {
	const file = evt.dataTransfer.files[0];

	const type = file.type == ""
	? "folder"
	: file.type.includes("markdown") ? "doc" : undefined;

	if (type == "folder") {
		window.api.send("dispatch", {
			type: "SET_PROJECT_DIRECTORY",
			directory: file.path
		});
	}
}

function instance($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("FirstRun", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FirstRun> was created with unknown prop '${key}'`);
	});

	function dragover_handler(event) {
		bubble($$self, event);
	}

	const click_handler = () => {
		window.api.send("dispatch", {
			type: "SELECT_PROJECT_DIRECTORY_FROM_DIALOG"
		});
	};

	$$self.$capture_state = () => ({ drop });
	return [dragover_handler, click_handler];
}

class FirstRun extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-53cky2-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "FirstRun",
			options,
			id: create_fragment.name
		});
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

function setTooltip(node, text) {

  function onMouseEnter(evt) {
    tooltip.set({
      status: 'show',
      text: text,
      x: evt.clientX, 
      y: evt.clientY + 4
    });  
  }

  function onMouseDown() {
    tooltip.set({
      status: 'hide',
      text: '',
      x: 0, 
      y: 0
    });
  }

  function onMouseLeave(evt) {
    tooltip.set({
      status: 'hideAfterDelay',
      text: '',
      x: 0,
      y: 0
    });
  }

  node.addEventListener('mouseenter', onMouseEnter);
  node.addEventListener('mousedown', onMouseDown);
  node.addEventListener('mouseleave', onMouseLeave);

  return {
    destroy() {
			node.removeEventListener('mouseenter', onMouseEnter);
			node.removeEventListener('click', onMouseDown);
			node.removeEventListener('mouseleave', onMouseLeave);
		}
  }
}

// const listItemProps = {
//   id: '', 
//   tabId: '', 
//   tab: {}, 
//   listIds: [], 
//   isSelected: false
// }

// export function listItem(node, props = { ...listItemProps }) {

//   function handleMousedown(evt) {

//     console.log(props)

//     // Shift-click: Select range of items in list
//     // Click while not selected: Make this the only selected item
//     // Cmd-click while not selected: Add this to existing items
//     // Cmd-click while selected: Remove this from existing items

//     const shiftClicked = evt.shiftKey
//     const clickedWhileSelected = !evt.metaKey && props.isSelected
//     const clickedWhileNotSelected = !evt.metaKey && !props.isSelected
//     const cmdClickedWhileNotSelected = evt.metaKey && !props.isSelected
//     const cmdClickedWhileSelected = evt.metaKey && props.isSelected
  
//     let selected = []
  
//     if (clickedWhileSelected) {
//       return
//     } else if (shiftClicked) {
//       const clickedIndex = props.listIds.indexOf(props.id)
//       const lastSelectedIndex = props.listIds.indexOf(props.tab.lastSelected)
//       const lastSelectedIsStillVisible = lastSelectedIndex !== -1
//       if (!lastSelectedIsStillVisible) {
//         // If last selected item is no longer visible (e.g. parent 
//         // folder may have closed), select only this id.
//         selected = [props.id]
//       } else {
//         // Else, select all items between the last selected, and this id.
//         const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex)
//         const selectToIndex = Math.max(clickedIndex, lastSelectedIndex)
//         const newSelected = props.listIds.slice(selectFromIndex, selectToIndex + 1)
//         const lastSelected = [...props.tab.selected]
//         selected = [...newSelected, ...lastSelected]
//       }
//     } else if (clickedWhileNotSelected) {
//       selected = [props.id]
//     } else if (cmdClickedWhileNotSelected) {
//       selected = [props.id, ...props.tab.selected]
//     } else if (cmdClickedWhileSelected) {
//       // Copy array and remove this item from it
//       selected = [...props.tab.selected]
//       const indexToRemove = selected.indexOf(props.id)
//       selected.splice(indexToRemove, 1)
//     }
  
//     // If there are multiple selected, find and remove any duplicates.
//     // Per: https://stackoverflow.com/a/14438954
//     if (selected.length > 1) {
//       selected = Array.from(new Set(selected))
//     }

//     window.api.send('dispatch', {
//       type: 'SIDEBAR_SET_SELECTED',
//       tabId: props.tabId,
//       lastSelected: props.id,
//       selected: selected,
//     })
//   }

//   node.addEventListener('mousedown', handleMousedown);

// 	return {
//     update(newProps) {
//       props = newProps
//     },
// 		destroy() {
// 			node.removeEventListener('mousedown', handleMousedown);
// 		}
// 	};
// }

/* src/js/renderer/component/sidebar/Tab.svelte generated by Svelte v3.30.1 */
const file$1 = "src/js/renderer/component/sidebar/Tab.svelte";

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1auicb7-style";
	style.textContent = "li.svelte-1auicb7{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;background-color:var(--controlTextColor);list-style-type:none;margin:0 12px 0 0;padding:0;width:14px;height:14px;opacity:70%}li.isActive.svelte-1auicb7{background-color:var(--controlAccentColor);opacity:100%}li.svelte-1auicb7:last-of-type{margin:0}.project.svelte-1auicb7{-webkit-mask-image:var(--img-folder)}.project.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-folder-fill)}.allDocs.svelte-1auicb7{-webkit-mask-image:var(--img-doc-on-doc)}.allDocs.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-doc-on-doc-fill)}.mostRecent.svelte-1auicb7{-webkit-mask-image:var(--img-clock)}.mostRecent.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-clock-fill)}.tags.svelte-1auicb7{-webkit-mask-image:var(--img-tag)}.tags.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-tag-fill)}.media.svelte-1auicb7{-webkit-mask-image:var(--img-photo)}.media.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-photo-fill)}.citations.svelte-1auicb7{-webkit-mask-image:var(--img-quote-bubble)}.citations.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-quote-bubble-fill)}.search.svelte-1auicb7{-webkit-mask-image:var(--img-magnifyingglass)}.search.isActive.svelte-1auicb7{-webkit-mask-image:var(--img-magnifyingglass)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFiLnN2ZWx0ZSIsInNvdXJjZXMiOlsiVGFiLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBzaWRlYmFyIH0gZnJvbSAnLi4vLi4vU3RhdGVNYW5hZ2VyJ1xuICBpbXBvcnQgeyBzZXRUb29sdGlwIH0gZnJvbSAnLi4vdWkvYWN0aW9ucydcblxuICBleHBvcnQgbGV0IGlkXG4gIFxuICAkOiB0YWIgPSAkc2lkZWJhci50YWJzQnlJZFtpZF1cbiAgJDogaXNBY3RpdmUgPSAkc2lkZWJhci5hY3RpdmVUYWJJZCA9PSBpZFxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG5saSB7XG4gIC13ZWJraXQtbWFzay1zaXplOiBjb250YWluO1xuICAtd2Via2l0LW1hc2stcG9zaXRpb246IGNlbnRlcjtcbiAgLXdlYmtpdC1tYXNrLXJlcGVhdDogbm8tcmVwZWF0O1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb250cm9sVGV4dENvbG9yKTtcbiAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xuICBtYXJnaW46IDAgMTJweCAwIDA7XG4gIHBhZGRpbmc6IDA7XG4gIHdpZHRoOiAxNHB4O1xuICBoZWlnaHQ6IDE0cHg7XG4gIG9wYWNpdHk6IDcwJTtcbn1cbmxpLmlzQWN0aXZlIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tY29udHJvbEFjY2VudENvbG9yKTtcbiAgb3BhY2l0eTogMTAwJTtcbn1cblxubGk6bGFzdC1vZi10eXBlIHtcbiAgbWFyZ2luOiAwO1xufVxuXG4ucHJvamVjdCB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWZvbGRlcik7XG59XG5cbi5wcm9qZWN0LmlzQWN0aXZlIHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctZm9sZGVyLWZpbGwpO1xufVxuXG4uYWxsRG9jcyB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWRvYy1vbi1kb2MpO1xufVxuXG4uYWxsRG9jcy5pc0FjdGl2ZSB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWRvYy1vbi1kb2MtZmlsbCk7XG59XG5cbi5tb3N0UmVjZW50IHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctY2xvY2spO1xufVxuXG4ubW9zdFJlY2VudC5pc0FjdGl2ZSB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWNsb2NrLWZpbGwpO1xufVxuXG4udGFncyB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLXRhZyk7XG59XG5cbi50YWdzLmlzQWN0aXZlIHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctdGFnLWZpbGwpO1xufVxuXG4ubWVkaWEge1xuICAtd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLWltZy1waG90byk7XG59XG5cbi5tZWRpYS5pc0FjdGl2ZSB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLXBob3RvLWZpbGwpO1xufVxuXG4uY2l0YXRpb25zIHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctcXVvdGUtYnViYmxlKTtcbn1cblxuLmNpdGF0aW9ucy5pc0FjdGl2ZSB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLXF1b3RlLWJ1YmJsZS1maWxsKTtcbn1cblxuLnNlYXJjaCB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLW1hZ25pZnlpbmdnbGFzcyk7XG59XG5cbi5zZWFyY2guaXNBY3RpdmUge1xuICAtd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLWltZy1tYWduaWZ5aW5nZ2xhc3MpO1xufTwvc3R5bGU+XG5cbjxzdmVsdGU6b3B0aW9ucyBpbW11dGFibGU9e3RydWV9IC8+XG5cbjxsaVxuICBvbjpjbGljaz17KCkgPT4gd2luZG93LmFwaS5zZW5kKCdkaXNwYXRjaCcsIHtcbiAgICAgIHR5cGU6ICdTRUxFQ1RfU0lERUJBUl9UQUJfQllfSUQnLFxuICAgICAgaWQ6IGlkLFxuICAgIH0pfVxuICBjbGFzczppc0FjdGl2ZVxuICBjbGFzcz17aWR9IFxuICB1c2U6c2V0VG9vbHRpcD17YFNob3cgJHt0YWIudGl0bGV9YH1cbi8+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW1CQSxFQUFFLGVBQUMsQ0FBQyxBQUNGLGlCQUFpQixDQUFFLE9BQU8sQ0FDMUIscUJBQXFCLENBQUUsTUFBTSxDQUM3QixtQkFBbUIsQ0FBRSxTQUFTLENBQzlCLGdCQUFnQixDQUFFLElBQUksa0JBQWtCLENBQUMsQ0FDekMsZUFBZSxDQUFFLElBQUksQ0FDckIsTUFBTSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDbEIsT0FBTyxDQUFFLENBQUMsQ0FDVixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osT0FBTyxDQUFFLEdBQUcsQUFDZCxDQUFDLEFBQ0QsRUFBRSxTQUFTLGVBQUMsQ0FBQyxBQUNYLGdCQUFnQixDQUFFLElBQUksb0JBQW9CLENBQUMsQ0FDM0MsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsaUJBQUUsYUFBYSxBQUFDLENBQUMsQUFDZixNQUFNLENBQUUsQ0FBQyxBQUNYLENBQUMsQUFFRCxRQUFRLGVBQUMsQ0FBQyxBQUNSLGtCQUFrQixDQUFFLElBQUksWUFBWSxDQUFDLEFBQ3ZDLENBQUMsQUFFRCxRQUFRLFNBQVMsZUFBQyxDQUFDLEFBQ2pCLGtCQUFrQixDQUFFLElBQUksaUJBQWlCLENBQUMsQUFDNUMsQ0FBQyxBQUVELFFBQVEsZUFBQyxDQUFDLEFBQ1Isa0JBQWtCLENBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxBQUMzQyxDQUFDLEFBRUQsUUFBUSxTQUFTLGVBQUMsQ0FBQyxBQUNqQixrQkFBa0IsQ0FBRSxJQUFJLHFCQUFxQixDQUFDLEFBQ2hELENBQUMsQUFFRCxXQUFXLGVBQUMsQ0FBQyxBQUNYLGtCQUFrQixDQUFFLElBQUksV0FBVyxDQUFDLEFBQ3RDLENBQUMsQUFFRCxXQUFXLFNBQVMsZUFBQyxDQUFDLEFBQ3BCLGtCQUFrQixDQUFFLElBQUksZ0JBQWdCLENBQUMsQUFDM0MsQ0FBQyxBQUVELEtBQUssZUFBQyxDQUFDLEFBQ0wsa0JBQWtCLENBQUUsSUFBSSxTQUFTLENBQUMsQUFDcEMsQ0FBQyxBQUVELEtBQUssU0FBUyxlQUFDLENBQUMsQUFDZCxrQkFBa0IsQ0FBRSxJQUFJLGNBQWMsQ0FBQyxBQUN6QyxDQUFDLEFBRUQsTUFBTSxlQUFDLENBQUMsQUFDTixrQkFBa0IsQ0FBRSxJQUFJLFdBQVcsQ0FBQyxBQUN0QyxDQUFDLEFBRUQsTUFBTSxTQUFTLGVBQUMsQ0FBQyxBQUNmLGtCQUFrQixDQUFFLElBQUksZ0JBQWdCLENBQUMsQUFDM0MsQ0FBQyxBQUVELFVBQVUsZUFBQyxDQUFDLEFBQ1Ysa0JBQWtCLENBQUUsSUFBSSxrQkFBa0IsQ0FBQyxBQUM3QyxDQUFDLEFBRUQsVUFBVSxTQUFTLGVBQUMsQ0FBQyxBQUNuQixrQkFBa0IsQ0FBRSxJQUFJLHVCQUF1QixDQUFDLEFBQ2xELENBQUMsQUFFRCxPQUFPLGVBQUMsQ0FBQyxBQUNQLGtCQUFrQixDQUFFLElBQUkscUJBQXFCLENBQUMsQUFDaEQsQ0FBQyxBQUVELE9BQU8sU0FBUyxlQUFDLENBQUMsQUFDaEIsa0JBQWtCLENBQUUsSUFBSSxxQkFBcUIsQ0FBQyxBQUNoRCxDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$1(ctx) {
	let li;
	let li_class_value;
	let setTooltip_action;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			li = element("li");
			attr_dev(li, "class", li_class_value = "" + (null_to_empty(/*id*/ ctx[0]) + " svelte-1auicb7"));
			toggle_class(li, "isActive", /*isActive*/ ctx[2]);
			add_location(li, file$1, 98, 0, 1897);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);

			if (!mounted) {
				dispose = [
					listen_dev(li, "click", /*click_handler*/ ctx[4], false, false, false),
					action_destroyer(setTooltip_action = setTooltip.call(null, li, `Show ${/*tab*/ ctx[1].title}`))
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*id*/ 1 && li_class_value !== (li_class_value = "" + (null_to_empty(/*id*/ ctx[0]) + " svelte-1auicb7"))) {
				attr_dev(li, "class", li_class_value);
			}

			if (setTooltip_action && is_function(setTooltip_action.update) && dirty & /*tab*/ 2) setTooltip_action.update.call(null, `Show ${/*tab*/ ctx[1].title}`);

			if (dirty & /*id, isActive*/ 5) {
				toggle_class(li, "isActive", /*isActive*/ ctx[2]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$1($$self, $$props, $$invalidate) {
	let $sidebar;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(3, $sidebar = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Tab", slots, []);
	let { id } = $$props;
	const writable_props = ["id"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
	});

	const click_handler = () => window.api.send("dispatch", { type: "SELECT_SIDEBAR_TAB_BY_ID", id });

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
	};

	$$self.$capture_state = () => ({
		sidebar,
		setTooltip,
		id,
		tab,
		$sidebar,
		isActive
	});

	$$self.$inject_state = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("isActive" in $$props) $$invalidate(2, isActive = $$props.isActive);
	};

	let tab;
	let isActive;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar, id*/ 9) {
			 $$invalidate(1, tab = $sidebar.tabsById[id]);
		}

		if ($$self.$$.dirty & /*$sidebar, id*/ 9) {
			 $$invalidate(2, isActive = $sidebar.activeTabId == id);
		}
	};

	return [id, tab, isActive, $sidebar, click_handler];
}

class Tab extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1auicb7-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, not_equal, { id: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Tab",
			options,
			id: create_fragment$1.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
			console.warn("<Tab> was created without expected prop 'id'");
		}
	}

	get id() {
		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/Separator.svelte generated by Svelte v3.30.1 */
const file$2 = "src/js/renderer/component/ui/Separator.svelte";

function add_css$2() {
	var style = element("style");
	style.id = "svelte-71yvgo-style";
	style.textContent = "hr.svelte-71yvgo{min-height:1px;border:0;background-color:var(--separatorColor);margin:calc(var(--marginTop) * 1px) calc(var(--marginSides) * 1px) calc(var(--marginBottom) * 1px) calc(var(--marginSides) * 1px)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VwYXJhdG9yLnN2ZWx0ZSIsInNvdXJjZXMiOlsiU2VwYXJhdG9yLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBjc3MgfSBmcm9tIFwiLi9hY3Rpb25zXCI7XG5cbiAgZXhwb3J0IGxldCBtYXJnaW5TaWRlcyA9IDA7XG4gIGV4cG9ydCBsZXQgbWFyZ2luVG9wID0gMDtcbiAgZXhwb3J0IGxldCBtYXJnaW5Cb3R0b20gPSAwO1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG5ociB7XG4gIG1pbi1oZWlnaHQ6IDFweDtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zZXBhcmF0b3JDb2xvcik7XG4gIG1hcmdpbjogY2FsYyh2YXIoLS1tYXJnaW5Ub3ApICogMXB4KSBjYWxjKHZhcigtLW1hcmdpblNpZGVzKSAqIDFweCkgY2FsYyh2YXIoLS1tYXJnaW5Cb3R0b20pICogMXB4KSBjYWxjKHZhcigtLW1hcmdpblNpZGVzKSAqIDFweCk7XG59PC9zdHlsZT5cblxuPGhyIHVzZTpjc3M9e3ttYXJnaW5TaWRlcywgbWFyZ2luVG9wLCBtYXJnaW5Cb3R0b219fSAvPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFhQSxFQUFFLGNBQUMsQ0FBQyxBQUNGLFVBQVUsQ0FBRSxHQUFHLENBQ2YsTUFBTSxDQUFFLENBQUMsQ0FDVCxnQkFBZ0IsQ0FBRSxJQUFJLGdCQUFnQixDQUFDLENBQ3ZDLE1BQU0sQ0FBRSxLQUFLLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssSUFBSSxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLElBQUksYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxBQUNwSSxDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$2(ctx) {
	let hr;
	let css_action;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			hr = element("hr");
			attr_dev(hr, "class", "svelte-71yvgo");
			add_location(hr, file$2, 20, 0, 574);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, hr, anchor);

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, hr, {
					marginSides: /*marginSides*/ ctx[0],
					marginTop: /*marginTop*/ ctx[1],
					marginBottom: /*marginBottom*/ ctx[2]
				}));

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (css_action && is_function(css_action.update) && dirty & /*marginSides, marginTop, marginBottom*/ 7) css_action.update.call(null, {
				marginSides: /*marginSides*/ ctx[0],
				marginTop: /*marginTop*/ ctx[1],
				marginBottom: /*marginBottom*/ ctx[2]
			});
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(hr);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Separator", slots, []);
	let { marginSides = 0 } = $$props;
	let { marginTop = 0 } = $$props;
	let { marginBottom = 0 } = $$props;
	const writable_props = ["marginSides", "marginTop", "marginBottom"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Separator> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("marginSides" in $$props) $$invalidate(0, marginSides = $$props.marginSides);
		if ("marginTop" in $$props) $$invalidate(1, marginTop = $$props.marginTop);
		if ("marginBottom" in $$props) $$invalidate(2, marginBottom = $$props.marginBottom);
	};

	$$self.$capture_state = () => ({
		css,
		marginSides,
		marginTop,
		marginBottom
	});

	$$self.$inject_state = $$props => {
		if ("marginSides" in $$props) $$invalidate(0, marginSides = $$props.marginSides);
		if ("marginTop" in $$props) $$invalidate(1, marginTop = $$props.marginTop);
		if ("marginBottom" in $$props) $$invalidate(2, marginBottom = $$props.marginBottom);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [marginSides, marginTop, marginBottom];
}

class Separator extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-71yvgo-style")) add_css$2();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			marginSides: 0,
			marginTop: 1,
			marginBottom: 2
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Separator",
			options,
			id: create_fragment$2.name
		});
	}

	get marginSides() {
		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set marginSides(value) {
		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get marginTop() {
		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set marginTop(value) {
		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get marginBottom() {
		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set marginBottom(value) {
		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var createCopy = function createCopy(item) {
  if (!item || (typeof item === 'undefined' ? 'undefined' : _typeof(item)) !== 'object') return item;

  var accumulator = Array.isArray(item) ? [] : {};
  return iterator(item, accumulator, createCopy);
};

var iterator = function iterator(iterable, accumulator, callback) {
  for (var key in iterable) {
    if (iterable.hasOwnProperty(key)) {
      accumulator[key] = callback(iterable[key]);
    }
  }
  return accumulator;
};

var createCopy_1 = { createCopy: createCopy, iterator: iterator };

var constants = {
  id: 'id',
  parentId: 'parentId',
  children: 'children',
  excludeParent: false,
  saveExtractedChildren: false
};

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };



var OPTIONS = {};

var id = function id(item) {
  return item && item[OPTIONS.id];
};
var parentId = function parentId(item) {
  return item && item[OPTIONS.parentId];
};
var childrenKey = function childrenKey() {
  return OPTIONS.children;
};

var mergeOptionsBeforeCreateHierarchy = function mergeOptionsBeforeCreateHierarchy() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  OPTIONS = _extends({}, constants, options);
  return OPTIONS;
};

var options = { id: id, parentId: parentId, childrenKey: childrenKey, mergeOptionsBeforeCreateHierarchy: mergeOptionsBeforeCreateHierarchy };

var createCopy$1 = createCopy_1.createCopy;

var id$1 = options.id,
    childrenKey$1 = options.childrenKey,
    parentId$1 = options.parentId,
    mergeOptionsBeforeCreateHierarchy$1 = options.mergeOptionsBeforeCreateHierarchy;

var hasParent = function hasParent(parentId, items) {
  return items.some(function (item) {
    return id$1(item) === parentId;
  });
};

var hasChildren = function hasChildren(item) {
  var key = childrenKey$1();
  return !!(item && item[key] && item[key].length);
};

var getParents = function getParents() {
  var items = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

  return items.filter(function (item) {
    return id$1(item) && !hasParent(parentId$1(item), items);
  });
};

var getChildren = function getChildren(child, items) {
  var childId = id$1(child);
  return childId ? items.filter(function (item) {
    return parentId$1(item) === childId;
  }) : [];
};

var getParentChildren = function getParentChildren(parent) {
  var key = childrenKey$1();
  return Array.isArray(parent[key]) ? parent[key].slice() : [];
};

var mergeChildren = function mergeChildren(parent, children) {
  if (children) {
    var parentChildren = getParentChildren(parent);
    parent[childrenKey$1()] = parentChildren.concat(children);
  }
  return parent;
};

var createHierarchy = function createHierarchy(method) {
  return function (array, options) {
    if (array && array.length) {
      var OPTIONS = mergeOptionsBeforeCreateHierarchy$1(options);
      return method(createCopy$1(array), null, OPTIONS);
    }
  };
};

var common = { getParents: getParents, getChildren: getChildren, mergeChildren: mergeChildren, hasChildren: hasChildren, childrenKey: childrenKey$1, createHierarchy: createHierarchy };

var getParents$1 = common.getParents,
    getChildren$1 = common.getChildren,
    mergeChildren$1 = common.mergeChildren;

var createTreeHierarchy = function createTreeHierarchy(items, parent) {
  var children = [];

  if (parent) children = getChildren$1(parent, items);else children = getParents$1(items);

  if (children.length) {
    parent && mergeChildren$1(parent, children);
    children.forEach(function (item) {
      return createTreeHierarchy(items, item);
    });
  }
  return children;
};

var createTreeHierarchy_1 = { createTreeHierarchy: createTreeHierarchy };

var hasChildren$1 = common.hasChildren,
    childrenKey$2 = common.childrenKey;

var createFlatHierarchy = function createFlatHierarchy(items, parent) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var flatList = [];

  items.forEach(function (item) {
    if (hasChildren$1(item)) {
      var key = childrenKey$2();
      var children = createFlatHierarchy(item[key]);

      !options.saveExtractedChildren && delete item[key];
      !options.excludeParent && children.unshift(item);

      flatList = flatList.concat(children);
    } else {
      !options.excludeParent && flatList.push(item);
    }
  });
  return flatList;
};

var createFlatHierarchy_1 = { createFlatHierarchy: createFlatHierarchy };

var createHierarchy$1 = common.createHierarchy;

var createTreeHierarchy$1 = createTreeHierarchy_1.createTreeHierarchy;

var createFlatHierarchy$1 = createFlatHierarchy_1.createFlatHierarchy;

var lib = {
  createTreeHierarchy: createHierarchy$1(createTreeHierarchy$1),
  createFlatHierarchy: createHierarchy$1(createFlatHierarchy$1)
};

/* src/js/renderer/component/sidebar/Header.svelte generated by Svelte v3.30.1 */

const file$3 = "src/js/renderer/component/sidebar/Header.svelte";

function add_css$3() {
	var style = element("style");
	style.id = "svelte-9aj9no-style";
	style.textContent = "header.svelte-9aj9no.svelte-9aj9no{padding:0 10px;display:flex;position:relative;flex-direction:row;align-items:center;min-height:30px;user-select:none}header.svelte-9aj9no h1.svelte-9aj9no{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);font-weight:bold;flex-grow:1;margin:0;padding:0}.hoverToShowSlot.svelte-9aj9no .slot.svelte-9aj9no{visibility:hidden}.hoverToShowSlot.svelte-9aj9no:hover .slot.svelte-9aj9no,.hoverToShowSlot.svelte-9aj9no:focus-within .slot.svelte-9aj9no{visibility:visible}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGVhZGVyLnN2ZWx0ZSIsInNvdXJjZXMiOlsiSGVhZGVyLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBleHBvcnQgbGV0IHRpdGxlID0gJ1RpdGxlJ1xuICBleHBvcnQgbGV0IGhvdmVyVG9TaG93U2xvdCA9IGZhbHNlXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG5oZWFkZXIge1xuICBwYWRkaW5nOiAwIDEwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgbWluLWhlaWdodDogMzBweDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG59XG5oZWFkZXIgaDEge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMDhweDtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZmxleC1ncm93OiAxO1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDA7XG59XG5cbi5ob3ZlclRvU2hvd1Nsb3QgLnNsb3Qge1xuICB2aXNpYmlsaXR5OiBoaWRkZW47XG59XG5cbi5ob3ZlclRvU2hvd1Nsb3Q6aG92ZXIgLnNsb3QsXG4uaG92ZXJUb1Nob3dTbG90OmZvY3VzLXdpdGhpbiAuc2xvdCB7XG4gIHZpc2liaWxpdHk6IHZpc2libGU7XG59PC9zdHlsZT5cblxuPGhlYWRlciBjbGFzcz17aG92ZXJUb1Nob3dTbG90ID8gJ2hvdmVyVG9TaG93U2xvdCcgOiAnJ30+XG4gIDxoMT57dGl0bGV9PC9oMT5cbiAgPGRpdiBjbGFzcz1cInNsb3RcIj5cbiAgICA8c2xvdD48L3Nsb3Q+XG4gIDwvZGl2PlxuPC9oZWFkZXI+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBU0EsTUFBTSw0QkFBQyxDQUFDLEFBQ04sT0FBTyxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQ2YsT0FBTyxDQUFFLElBQUksQ0FDYixRQUFRLENBQUUsUUFBUSxDQUNsQixjQUFjLENBQUUsR0FBRyxDQUNuQixXQUFXLENBQUUsTUFBTSxDQUNuQixVQUFVLENBQUUsSUFBSSxDQUNoQixXQUFXLENBQUUsSUFBSSxBQUNuQixDQUFDLEFBQ0Qsb0JBQU0sQ0FBQyxFQUFFLGNBQUMsQ0FBQyxBQUNULElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxDQUN2QixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLENBQUMsQ0FDWixNQUFNLENBQUUsQ0FBQyxDQUNULE9BQU8sQ0FBRSxDQUFDLEFBQ1osQ0FBQyxBQUVELDhCQUFnQixDQUFDLEtBQUssY0FBQyxDQUFDLEFBQ3RCLFVBQVUsQ0FBRSxNQUFNLEFBQ3BCLENBQUMsQUFFRCw4QkFBZ0IsTUFBTSxDQUFDLG1CQUFLLENBQzVCLDhCQUFnQixhQUFhLENBQUMsS0FBSyxjQUFDLENBQUMsQUFDbkMsVUFBVSxDQUFFLE9BQU8sQUFDckIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$3(ctx) {
	let header;
	let h1;
	let t0;
	let t1;
	let div;
	let header_class_value;
	let current;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	const block = {
		c: function create() {
			header = element("header");
			h1 = element("h1");
			t0 = text(/*title*/ ctx[0]);
			t1 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			attr_dev(h1, "class", "svelte-9aj9no");
			add_location(h1, file$3, 41, 2, 871);
			attr_dev(div, "class", "slot svelte-9aj9no");
			add_location(div, file$3, 42, 2, 890);
			attr_dev(header, "class", header_class_value = "" + (null_to_empty(/*hoverToShowSlot*/ ctx[1] ? "hoverToShowSlot" : "") + " svelte-9aj9no"));
			add_location(header, file$3, 40, 0, 811);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, header, anchor);
			append_dev(header, h1);
			append_dev(h1, t0);
			append_dev(header, t1);
			append_dev(header, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (!current || dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 4) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
				}
			}

			if (!current || dirty & /*hoverToShowSlot*/ 2 && header_class_value !== (header_class_value = "" + (null_to_empty(/*hoverToShowSlot*/ ctx[1] ? "hoverToShowSlot" : "") + " svelte-9aj9no"))) {
				attr_dev(header, "class", header_class_value);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(header);
			if (default_slot) default_slot.d(detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$3.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Header", slots, ['default']);
	let { title = "Title" } = $$props;
	let { hoverToShowSlot = false } = $$props;
	const writable_props = ["title", "hoverToShowSlot"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("hoverToShowSlot" in $$props) $$invalidate(1, hoverToShowSlot = $$props.hoverToShowSlot);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => ({ title, hoverToShowSlot });

	$$self.$inject_state = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("hoverToShowSlot" in $$props) $$invalidate(1, hoverToShowSlot = $$props.hoverToShowSlot);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [title, hoverToShowSlot, $$scope, slots];
}

class Header extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-9aj9no-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { title: 0, hoverToShowSlot: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Header",
			options,
			id: create_fragment$3.name
		});
	}

	get title() {
		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get hoverToShowSlot() {
		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set hoverToShowSlot(value) {
		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/IconButton.svelte generated by Svelte v3.30.1 */
const file$4 = "src/js/renderer/component/ui/IconButton.svelte";

function add_css$4() {
	var style = element("style");
	style.id = "svelte-1nwzfsj-style";
	style.textContent = ".button.svelte-1nwzfsj.svelte-1nwzfsj{--height:0;min-width:34px;height:calc(var(--height) * 1px);border-radius:6px;padding:0 10px;position:relative;display:flex;align-items:center;outline:none}.icon.svelte-1nwzfsj.svelte-1nwzfsj,.caret.svelte-1nwzfsj.svelte-1nwzfsj{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;pointer-events:none;background-color:rgba(var(--foregroundColor), 0.6)}.icon.svelte-1nwzfsj.svelte-1nwzfsj{width:18px;height:18px}.caret.svelte-1nwzfsj.svelte-1nwzfsj{margin:0 -2px 0 7px;width:8px;height:8px;border:1px solid black;-webkit-mask-image:var(--img-chevron-down-heavy)}.button.isActive.svelte-1nwzfsj.svelte-1nwzfsj,.button.svelte-1nwzfsj.svelte-1nwzfsj:hover{background-color:rgba(var(--foregroundColor), 0.04)}.button.isActive.svelte-1nwzfsj .caret.svelte-1nwzfsj,.button.svelte-1nwzfsj:hover .caret.svelte-1nwzfsj{background-color:var(--labelColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSWNvbkJ1dHRvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIkljb25CdXR0b24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNzcywgc2V0VG9vbHRpcCB9IGZyb20gJy4vYWN0aW9ucyc7XG5cbiAgZXhwb3J0IGxldCBoZWlnaHQgPSAyOFxuICBleHBvcnQgbGV0IGljb24gPSBudWxsIC8vIEUuZy4gJy0taW1nLXBob3RvJ1xuICBleHBvcnQgbGV0IHNob3dDYXJldCA9IGZhbHNlXG4gIGV4cG9ydCBsZXQgaXNBY3RpdmUgPSBmYWxzZVxuICBleHBvcnQgbGV0IHRvb2x0aXAgPSAnJ1xuXG4gIC8vIGV4cG9ydCBsZXQgaWNvbkNvbG9yID0gJy0tY29udHJvbFRleHRDb2xvcidcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLmJ1dHRvbiB7XG4gIC0taGVpZ2h0OiAwO1xuICBtaW4td2lkdGg6IDM0cHg7XG4gIGhlaWdodDogY2FsYyh2YXIoLS1oZWlnaHQpICogMXB4KTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBwYWRkaW5nOiAwIDEwcHg7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgb3V0bGluZTogbm9uZTtcbn1cblxuLmljb24sXG4uY2FyZXQge1xuICAtd2Via2l0LW1hc2stc2l6ZTogY29udGFpbjtcbiAgLXdlYmtpdC1tYXNrLXBvc2l0aW9uOiBjZW50ZXI7XG4gIC13ZWJraXQtbWFzay1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tZm9yZWdyb3VuZENvbG9yKSwgMC42KTtcbn1cblxuLmljb24ge1xuICB3aWR0aDogMThweDtcbiAgaGVpZ2h0OiAxOHB4O1xufVxuXG4uY2FyZXQge1xuICBtYXJnaW46IDAgLTJweCAwIDdweDtcbiAgd2lkdGg6IDhweDtcbiAgaGVpZ2h0OiA4cHg7XG4gIGJvcmRlcjogMXB4IHNvbGlkIGJsYWNrO1xuICAtd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLWltZy1jaGV2cm9uLWRvd24taGVhdnkpO1xufVxuXG4udG9vbHRpcCB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbn1cblxuLmJ1dHRvbi5pc0FjdGl2ZSxcbi5idXR0b246aG92ZXIge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKHZhcigtLWZvcmVncm91bmRDb2xvciksIDAuMDQpO1xufVxuLmJ1dHRvbi5pc0FjdGl2ZSAuY2FyZXQsXG4uYnV0dG9uOmhvdmVyIC5jYXJldCB7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xufTwvc3R5bGU+XG5cbjxkaXYgY2xhc3M6aXNBY3RpdmUgY2xhc3M9XCJidXR0b25cIiByb2xlPVwiYnV0dG9uXCIgdXNlOnNldFRvb2x0aXA9e3Rvb2x0aXB9IHVzZTpjc3M9e3toZWlnaHR9fSB0YWJpbmRleD1cIjBcIiBvbjptb3VzZWRvd24+XG4gIDxkaXYgY2xhc3M9XCJpY29uXCIgc3R5bGU9e2Atd2Via2l0LW1hc2staW1hZ2U6IHZhcigke2ljb259KTtgfSAvPlxuICB7I2lmIHNob3dDYXJldH1cbiAgICA8ZGl2IGNsYXNzPVwiY2FyZXRcIiAvPlxuICB7L2lmfVxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBcUJBLE9BQU8sOEJBQUMsQ0FBQyxBQUNQLFFBQVEsQ0FBRSxDQUFDLENBQ1gsU0FBUyxDQUFFLElBQUksQ0FDZixNQUFNLENBQUUsS0FBSyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDakMsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQ2YsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsT0FBTyxDQUFFLElBQUksQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFFRCxtQ0FBSyxDQUNMLE1BQU0sOEJBQUMsQ0FBQyxBQUNOLGlCQUFpQixDQUFFLE9BQU8sQ0FDMUIscUJBQXFCLENBQUUsTUFBTSxDQUM3QixtQkFBbUIsQ0FBRSxTQUFTLENBQzlCLGNBQWMsQ0FBRSxJQUFJLENBQ3BCLGdCQUFnQixDQUFFLEtBQUssSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEFBQ3JELENBQUMsQUFFRCxLQUFLLDhCQUFDLENBQUMsQUFDTCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLEFBQ2QsQ0FBQyxBQUVELE1BQU0sOEJBQUMsQ0FBQyxBQUNOLE1BQU0sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQ3BCLEtBQUssQ0FBRSxHQUFHLENBQ1YsTUFBTSxDQUFFLEdBQUcsQ0FDWCxNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQ3ZCLGtCQUFrQixDQUFFLElBQUksd0JBQXdCLENBQUMsQUFDbkQsQ0FBQyxBQU1ELE9BQU8sdUNBQVMsQ0FDaEIscUNBQU8sTUFBTSxBQUFDLENBQUMsQUFDYixnQkFBZ0IsQ0FBRSxLQUFLLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxBQUN0RCxDQUFDLEFBQ0QsT0FBTyx3QkFBUyxDQUFDLHFCQUFNLENBQ3ZCLHNCQUFPLE1BQU0sQ0FBQyxNQUFNLGVBQUMsQ0FBQyxBQUNwQixnQkFBZ0IsQ0FBRSxJQUFJLFlBQVksQ0FBQyxBQUNyQyxDQUFDIn0= */";
	append_dev(document.head, style);
}

// (71:2) {#if showCaret}
function create_if_block(ctx) {
	let div;

	const block = {
		c: function create() {
			div = element("div");
			attr_dev(div, "class", "caret svelte-1nwzfsj");
			add_location(div, file$4, 71, 4, 1681);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(71:2) {#if showCaret}",
		ctx
	});

	return block;
}

function create_fragment$4(ctx) {
	let div1;
	let div0;
	let div0_style_value;
	let t;
	let setTooltip_action;
	let css_action;
	let mounted;
	let dispose;
	let if_block = /*showCaret*/ ctx[2] && create_if_block(ctx);

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			t = space();
			if (if_block) if_block.c();
			attr_dev(div0, "class", "icon svelte-1nwzfsj");
			attr_dev(div0, "style", div0_style_value = `-webkit-mask-image: var(${/*icon*/ ctx[1]});`);
			add_location(div0, file$4, 69, 2, 1594);
			attr_dev(div1, "class", "button svelte-1nwzfsj");
			attr_dev(div1, "role", "button");
			attr_dev(div1, "tabindex", "0");
			toggle_class(div1, "isActive", /*isActive*/ ctx[3]);
			add_location(div1, file$4, 68, 0, 1472);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div1, t);
			if (if_block) if_block.m(div1, null);

			if (!mounted) {
				dispose = [
					action_destroyer(setTooltip_action = setTooltip.call(null, div1, /*tooltip*/ ctx[4])),
					action_destroyer(css_action = css.call(null, div1, { height: /*height*/ ctx[0] })),
					listen_dev(div1, "mousedown", /*mousedown_handler*/ ctx[5], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*icon*/ 2 && div0_style_value !== (div0_style_value = `-webkit-mask-image: var(${/*icon*/ ctx[1]});`)) {
				attr_dev(div0, "style", div0_style_value);
			}

			if (/*showCaret*/ ctx[2]) {
				if (if_block) ; else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div1, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (setTooltip_action && is_function(setTooltip_action.update) && dirty & /*tooltip*/ 16) setTooltip_action.update.call(null, /*tooltip*/ ctx[4]);
			if (css_action && is_function(css_action.update) && dirty & /*height*/ 1) css_action.update.call(null, { height: /*height*/ ctx[0] });

			if (dirty & /*isActive*/ 8) {
				toggle_class(div1, "isActive", /*isActive*/ ctx[3]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$4.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("IconButton", slots, []);
	let { height = 28 } = $$props;
	let { icon = null } = $$props; // E.g. '--img-photo'
	let { showCaret = false } = $$props;
	let { isActive = false } = $$props;
	let { tooltip = "" } = $$props;
	const writable_props = ["height", "icon", "showCaret", "isActive", "tooltip"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<IconButton> was created with unknown prop '${key}'`);
	});

	function mousedown_handler(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("height" in $$props) $$invalidate(0, height = $$props.height);
		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
		if ("showCaret" in $$props) $$invalidate(2, showCaret = $$props.showCaret);
		if ("isActive" in $$props) $$invalidate(3, isActive = $$props.isActive);
		if ("tooltip" in $$props) $$invalidate(4, tooltip = $$props.tooltip);
	};

	$$self.$capture_state = () => ({
		css,
		setTooltip,
		height,
		icon,
		showCaret,
		isActive,
		tooltip
	});

	$$self.$inject_state = $$props => {
		if ("height" in $$props) $$invalidate(0, height = $$props.height);
		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
		if ("showCaret" in $$props) $$invalidate(2, showCaret = $$props.showCaret);
		if ("isActive" in $$props) $$invalidate(3, isActive = $$props.isActive);
		if ("tooltip" in $$props) $$invalidate(4, tooltip = $$props.tooltip);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [height, icon, showCaret, isActive, tooltip, mousedown_handler];
}

class IconButton extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1nwzfsj-style")) add_css$4();

		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
			height: 0,
			icon: 1,
			showCaret: 2,
			isActive: 3,
			tooltip: 4
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "IconButton",
			options,
			id: create_fragment$4.name
		});
	}

	get height() {
		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set height(value) {
		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get icon() {
		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get showCaret() {
		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set showCaret(value) {
		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isActive() {
		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isActive(value) {
		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltip() {
		throw new Error("<IconButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltip(value) {
		throw new Error("<IconButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/building-blocks/Label.svelte generated by Svelte v3.30.1 */
const file$5 = "src/js/renderer/component/ui/building-blocks/Label.svelte";

function add_css$5() {
	var style = element("style");
	style.id = "svelte-1ffmu6r-style";
	style.textContent = "span.svelte-1ffmu6r{--padding:8;position:absolute;left:0;top:50%;transform:translate(-100%, -50%);padding-right:calc(var(--padding) * 1px)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGFiZWwuc3ZlbHRlIiwic291cmNlcyI6WyJMYWJlbC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgY3NzIH0gZnJvbSAnLi4vYWN0aW9ucyc7XG5cbiAgZXhwb3J0IGxldCBsYWJlbFxuICBleHBvcnQgbGV0IHBhZGRpbmcgPSAwXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG5zcGFuIHtcbiAgLS1wYWRkaW5nOiA4O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDA7XG4gIHRvcDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMTAwJSwgLTUwJSk7XG4gIHBhZGRpbmctcmlnaHQ6IGNhbGModmFyKC0tcGFkZGluZykgKiAxcHgpO1xufTwvc3R5bGU+XG5cbjxzcGFuIHVzZTpjc3M9e3twYWRkaW5nfX0+XG4gIHtsYWJlbH06XG48L3NwYW4+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWVBLElBQUksZUFBQyxDQUFDLEFBQ0osU0FBUyxDQUFFLENBQUMsQ0FDWixRQUFRLENBQUUsUUFBUSxDQUNsQixJQUFJLENBQUUsQ0FBQyxDQUNQLEdBQUcsQ0FBRSxHQUFHLENBQ1IsU0FBUyxDQUFFLFVBQVUsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ2pDLGFBQWEsQ0FBRSxLQUFLLElBQUksU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxBQUMzQyxDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$5(ctx) {
	let span;
	let t0;
	let t1;
	let css_action;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			span = element("span");
			t0 = text(/*label*/ ctx[0]);
			t1 = text(":");
			attr_dev(span, "class", "svelte-1ffmu6r");
			add_location(span, file$5, 24, 0, 644);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t0);
			append_dev(span, t1);

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, span, { padding: /*padding*/ ctx[1] }));
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*label*/ 1) set_data_dev(t0, /*label*/ ctx[0]);
			if (css_action && is_function(css_action.update) && dirty & /*padding*/ 2) css_action.update.call(null, { padding: /*padding*/ ctx[1] });
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$5.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$5($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Label", slots, []);
	let { label } = $$props;
	let { padding = 0 } = $$props;
	const writable_props = ["label", "padding"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Label> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("padding" in $$props) $$invalidate(1, padding = $$props.padding);
	};

	$$self.$capture_state = () => ({ css, label, padding });

	$$self.$inject_state = $$props => {
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("padding" in $$props) $$invalidate(1, padding = $$props.padding);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [label, padding];
}

class Label extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1ffmu6r-style")) add_css$5();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { label: 0, padding: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Label",
			options,
			id: create_fragment$5.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*label*/ ctx[0] === undefined && !("label" in props)) {
			console.warn("<Label> was created without expected prop 'label'");
		}
	}

	get label() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get padding() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set padding(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/building-blocks/GenericTextButton.svelte generated by Svelte v3.30.1 */
const file$6 = "src/js/renderer/component/ui/building-blocks/GenericTextButton.svelte";

function add_css$6() {
	var style = element("style");
	style.id = "svelte-1qzzyi6-style";
	style.textContent = ".button.isCompact.svelte-1qzzyi6.svelte-1qzzyi6{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;height:18px;border-radius:5px}.button.isCompact.svelte-1qzzyi6 .icon.svelte-1qzzyi6{top:3px;right:3px;width:12px;height:12px;border-radius:3px}.button.isCompact.svelte-1qzzyi6 .icon .img.svelte-1qzzyi6{-webkit-mask-size:6px}.button.svelte-1qzzyi6.svelte-1qzzyi6{width:calc(var(--width) * 1px);height:22px;font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;user-select:none;position:relative;background-color:var(--controlBackgroundColor);border-radius:6px;box-shadow:0 0 0 0.5px rgba(var(--foregroundColor), 0.2) inset, 0 0.5px 0 0 rgba(var(--foregroundColor), 0.15), 0 1px 1px 0 rgba(var(--foregroundColor), 0.1);display:flex;align-items:center}.button.isActive.svelte-1qzzyi6.svelte-1qzzyi6{filter:brightness(0.95)}.label.svelte-1qzzyi6.svelte-1qzzyi6{color:var(--labelColor);flex-grow:1}.push.svelte-1qzzyi6 .label.svelte-1qzzyi6{text-align:center}.popup.svelte-1qzzyi6 .label.svelte-1qzzyi6,.pulldown.svelte-1qzzyi6 .label.svelte-1qzzyi6{padding:0 0 0 8px}.icon.svelte-1qzzyi6.svelte-1qzzyi6{position:absolute;background:linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)), linear-gradient(var(--controlAccentColor), var(--controlAccentColor));right:3px;top:3px;width:16px;height:16px;border-radius:4px}.icon.svelte-1qzzyi6 .img.svelte-1qzzyi6{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);width:14px;height:14px;background-color:white}.popup.svelte-1qzzyi6 .img.svelte-1qzzyi6{-webkit-mask-image:var(--img-chevron-up-down)}.pulldown.svelte-1qzzyi6 .img.svelte-1qzzyi6{-webkit-mask-image:var(--img-chevron-down-bold);-webkit-mask-size:8px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VuZXJpY1RleHRCdXR0b24uc3ZlbHRlIiwic291cmNlcyI6WyJHZW5lcmljVGV4dEJ1dHRvbi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgY3NzIH0gZnJvbSAnLi4vYWN0aW9ucyc7XG5cbiAgZXhwb3J0IGxldCBpc0FjdGl2ZSA9IGZhbHNlXG4gIGV4cG9ydCBsZXQgd2lkdGggPSAxMDBcbiAgZXhwb3J0IGxldCBsYWJlbCA9ICdMYWJlbCdcbiAgZXhwb3J0IGxldCB0eXBlID0gJ3B1c2gnIC8vIHB1c2gsIHB1bGxkb3duLCBvciBwb3B1cFxuICBleHBvcnQgbGV0IGlzQ29tcGFjdCA9IGZhbHNlXG4gICAgXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4uYnV0dG9uLmlzQ29tcGFjdCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbGluZS1oZWlnaHQ6IDEzcHg7XG4gIGxldHRlci1zcGFjaW5nOiAwLjA3cHg7XG4gIGhlaWdodDogMThweDtcbiAgYm9yZGVyLXJhZGl1czogNXB4O1xufVxuLmJ1dHRvbi5pc0NvbXBhY3QgLmljb24ge1xuICB0b3A6IDNweDtcbiAgcmlnaHQ6IDNweDtcbiAgd2lkdGg6IDEycHg7XG4gIGhlaWdodDogMTJweDtcbiAgYm9yZGVyLXJhZGl1czogM3B4O1xufVxuLmJ1dHRvbi5pc0NvbXBhY3QgLmljb24gLmltZyB7XG4gIC13ZWJraXQtbWFzay1zaXplOiA2cHg7XG59XG5cbi5idXR0b24ge1xuICB3aWR0aDogY2FsYyh2YXIoLS13aWR0aCkgKiAxcHgpO1xuICBoZWlnaHQ6IDIycHg7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb250cm9sQmFja2dyb3VuZENvbG9yKTtcbiAgYm9yZGVyLXJhZGl1czogNnB4O1xuICBib3gtc2hhZG93OiAwIDAgMCAwLjVweCByZ2JhKHZhcigtLWZvcmVncm91bmRDb2xvciksIDAuMikgaW5zZXQsIDAgMC41cHggMCAwIHJnYmEodmFyKC0tZm9yZWdyb3VuZENvbG9yKSwgMC4xNSksIDAgMXB4IDFweCAwIHJnYmEodmFyKC0tZm9yZWdyb3VuZENvbG9yKSwgMC4xKTtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbi5idXR0b24uaXNBY3RpdmUge1xuICBmaWx0ZXI6IGJyaWdodG5lc3MoMC45NSk7XG59XG5cbi5sYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1sYWJlbENvbG9yKTtcbiAgZmxleC1ncm93OiAxO1xufVxuXG4ucHVzaCAubGFiZWwge1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG59XG5cbi5wb3B1cCAubGFiZWwsXG4ucHVsbGRvd24gLmxhYmVsIHtcbiAgcGFkZGluZzogMCAwIDAgOHB4O1xufVxuXG4uaWNvbiB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSksIHJnYmEoMjU1LCAyNTUsIDI1NSwgMCkpLCBsaW5lYXItZ3JhZGllbnQodmFyKC0tY29udHJvbEFjY2VudENvbG9yKSwgdmFyKC0tY29udHJvbEFjY2VudENvbG9yKSk7XG4gIHJpZ2h0OiAzcHg7XG4gIHRvcDogM3B4O1xuICB3aWR0aDogMTZweDtcbiAgaGVpZ2h0OiAxNnB4O1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG59XG4uaWNvbiAuaW1nIHtcbiAgLXdlYmtpdC1tYXNrLXNpemU6IGNvbnRhaW47XG4gIC13ZWJraXQtbWFzay1wb3NpdGlvbjogY2VudGVyO1xuICAtd2Via2l0LW1hc2stcmVwZWF0OiBuby1yZXBlYXQ7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogNTAlO1xuICB0b3A6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTUwJSwgLTUwJSk7XG4gIHdpZHRoOiAxNHB4O1xuICBoZWlnaHQ6IDE0cHg7XG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xufVxuXG4ucG9wdXAgLmltZyB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWNoZXZyb24tdXAtZG93bik7XG59XG5cbi5wdWxsZG93biAuaW1nIHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctY2hldnJvbi1kb3duLWJvbGQpO1xuICAtd2Via2l0LW1hc2stc2l6ZTogOHB4O1xufTwvc3R5bGU+XG5cblxuPGRpdiBcbiAgY2xhc3M9XCJidXR0b24ge3R5cGV9XCIgXG4gIGNsYXNzOmlzQWN0aXZlXG4gIGNsYXNzOmlzQ29tcGFjdFxuICB1c2U6Y3NzPXt7d2lkdGh9fSBcbiAgb246bW91c2Vkb3duIFxuICA+XG4gIDxzcGFuIGNsYXNzPVwibGFiZWxcIj57bGFiZWx9PC9zcGFuPlxuICB7I2lmIHR5cGUgPT0gJ3BvcHVwJyB8fCB0eXBlID09ICdwdWxsZG93bid9XG4gICAgPHNwYW4gY2xhc3M9XCJpY29uXCI+XG4gICAgICA8ZGl2IGNsYXNzPVwiaW1nXCI+PC9kaXY+XG4gICAgPC9zcGFuPlxuICB7L2lmfVxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWVBLE9BQU8sVUFBVSw4QkFBQyxDQUFDLEFBQ2pCLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFBTSxDQUN0QixNQUFNLENBQUUsSUFBSSxDQUNaLGFBQWEsQ0FBRSxHQUFHLEFBQ3BCLENBQUMsQUFDRCxPQUFPLHlCQUFVLENBQUMsS0FBSyxlQUFDLENBQUMsQUFDdkIsR0FBRyxDQUFFLEdBQUcsQ0FDUixLQUFLLENBQUUsR0FBRyxDQUNWLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDLEFBQ0QsT0FBTyx5QkFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLGVBQUMsQ0FBQyxBQUM1QixpQkFBaUIsQ0FBRSxHQUFHLEFBQ3hCLENBQUMsQUFFRCxPQUFPLDhCQUFDLENBQUMsQUFDUCxLQUFLLENBQUUsS0FBSyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDL0IsTUFBTSxDQUFFLElBQUksQ0FDWixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsV0FBVyxDQUFFLElBQUksQ0FDakIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsZ0JBQWdCLENBQUUsSUFBSSx3QkFBd0IsQ0FBQyxDQUMvQyxhQUFhLENBQUUsR0FBRyxDQUNsQixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDOUosT0FBTyxDQUFFLElBQUksQ0FDYixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBQ0QsT0FBTyxTQUFTLDhCQUFDLENBQUMsQUFDaEIsTUFBTSxDQUFFLFdBQVcsSUFBSSxDQUFDLEFBQzFCLENBQUMsQUFFRCxNQUFNLDhCQUFDLENBQUMsQUFDTixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsU0FBUyxDQUFFLENBQUMsQUFDZCxDQUFDLEFBRUQsb0JBQUssQ0FBQyxNQUFNLGVBQUMsQ0FBQyxBQUNaLFVBQVUsQ0FBRSxNQUFNLEFBQ3BCLENBQUMsQUFFRCxxQkFBTSxDQUFDLHFCQUFNLENBQ2Isd0JBQVMsQ0FBQyxNQUFNLGVBQUMsQ0FBQyxBQUNoQixPQUFPLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxBQUNwQixDQUFDLEFBRUQsS0FBSyw4QkFBQyxDQUFDLEFBQ0wsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsVUFBVSxDQUFFLGdCQUFnQixLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLElBQUksb0JBQW9CLENBQUMsQ0FBQyxDQUFDLElBQUksb0JBQW9CLENBQUMsQ0FBQyxDQUNySixLQUFLLENBQUUsR0FBRyxDQUNWLEdBQUcsQ0FBRSxHQUFHLENBQ1IsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxDQUNaLGFBQWEsQ0FBRSxHQUFHLEFBQ3BCLENBQUMsQUFDRCxvQkFBSyxDQUFDLElBQUksZUFBQyxDQUFDLEFBQ1YsaUJBQWlCLENBQUUsT0FBTyxDQUMxQixxQkFBcUIsQ0FBRSxNQUFNLENBQzdCLG1CQUFtQixDQUFFLFNBQVMsQ0FDOUIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsSUFBSSxDQUFFLEdBQUcsQ0FDVCxHQUFHLENBQUUsR0FBRyxDQUNSLFNBQVMsQ0FBRSxVQUFVLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNoQyxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osZ0JBQWdCLENBQUUsS0FBSyxBQUN6QixDQUFDLEFBRUQscUJBQU0sQ0FBQyxJQUFJLGVBQUMsQ0FBQyxBQUNYLGtCQUFrQixDQUFFLElBQUkscUJBQXFCLENBQUMsQUFDaEQsQ0FBQyxBQUVELHdCQUFTLENBQUMsSUFBSSxlQUFDLENBQUMsQUFDZCxrQkFBa0IsQ0FBRSxJQUFJLHVCQUF1QixDQUFDLENBQ2hELGlCQUFpQixDQUFFLEdBQUcsQUFDeEIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

// (110:2) {#if type == 'popup' || type == 'pulldown'}
function create_if_block$1(ctx) {
	let span;
	let div;

	const block = {
		c: function create() {
			span = element("span");
			div = element("div");
			attr_dev(div, "class", "img svelte-1qzzyi6");
			add_location(div, file$6, 111, 6, 2373);
			attr_dev(span, "class", "icon svelte-1qzzyi6");
			add_location(span, file$6, 110, 4, 2347);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, div);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(110:2) {#if type == 'popup' || type == 'pulldown'}",
		ctx
	});

	return block;
}

function create_fragment$6(ctx) {
	let div;
	let span;
	let t0;
	let t1;
	let div_class_value;
	let css_action;
	let mounted;
	let dispose;
	let if_block = (/*type*/ ctx[3] == "popup" || /*type*/ ctx[3] == "pulldown") && create_if_block$1(ctx);

	const block = {
		c: function create() {
			div = element("div");
			span = element("span");
			t0 = text(/*label*/ ctx[2]);
			t1 = space();
			if (if_block) if_block.c();
			attr_dev(span, "class", "label svelte-1qzzyi6");
			add_location(span, file$6, 108, 2, 2262);
			attr_dev(div, "class", div_class_value = "button " + /*type*/ ctx[3] + " svelte-1qzzyi6");
			toggle_class(div, "isActive", /*isActive*/ ctx[0]);
			toggle_class(div, "isCompact", /*isCompact*/ ctx[4]);
			add_location(div, file$6, 101, 0, 2153);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, span);
			append_dev(span, t0);
			append_dev(div, t1);
			if (if_block) if_block.m(div, null);

			if (!mounted) {
				dispose = [
					action_destroyer(css_action = css.call(null, div, { width: /*width*/ ctx[1] })),
					listen_dev(div, "mousedown", /*mousedown_handler*/ ctx[5], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*label*/ 4) set_data_dev(t0, /*label*/ ctx[2]);

			if (/*type*/ ctx[3] == "popup" || /*type*/ ctx[3] == "pulldown") {
				if (if_block) ; else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*type*/ 8 && div_class_value !== (div_class_value = "button " + /*type*/ ctx[3] + " svelte-1qzzyi6")) {
				attr_dev(div, "class", div_class_value);
			}

			if (css_action && is_function(css_action.update) && dirty & /*width*/ 2) css_action.update.call(null, { width: /*width*/ ctx[1] });

			if (dirty & /*type, isActive*/ 9) {
				toggle_class(div, "isActive", /*isActive*/ ctx[0]);
			}

			if (dirty & /*type, isCompact*/ 24) {
				toggle_class(div, "isCompact", /*isCompact*/ ctx[4]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$6.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$6($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("GenericTextButton", slots, []);
	let { isActive = false } = $$props;
	let { width = 100 } = $$props;
	let { label = "Label" } = $$props;
	let { type = "push" } = $$props; // push, pulldown, or popup
	let { isCompact = false } = $$props;
	const writable_props = ["isActive", "width", "label", "type", "isCompact"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GenericTextButton> was created with unknown prop '${key}'`);
	});

	function mousedown_handler(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("isActive" in $$props) $$invalidate(0, isActive = $$props.isActive);
		if ("width" in $$props) $$invalidate(1, width = $$props.width);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
		if ("type" in $$props) $$invalidate(3, type = $$props.type);
		if ("isCompact" in $$props) $$invalidate(4, isCompact = $$props.isCompact);
	};

	$$self.$capture_state = () => ({
		css,
		isActive,
		width,
		label,
		type,
		isCompact
	});

	$$self.$inject_state = $$props => {
		if ("isActive" in $$props) $$invalidate(0, isActive = $$props.isActive);
		if ("width" in $$props) $$invalidate(1, width = $$props.width);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
		if ("type" in $$props) $$invalidate(3, type = $$props.type);
		if ("isCompact" in $$props) $$invalidate(4, isCompact = $$props.isCompact);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [isActive, width, label, type, isCompact, mousedown_handler];
}

class GenericTextButton extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1qzzyi6-style")) add_css$6();

		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
			isActive: 0,
			width: 1,
			label: 2,
			type: 3,
			isCompact: 4
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "GenericTextButton",
			options,
			id: create_fragment$6.name
		});
	}

	get isActive() {
		throw new Error("<GenericTextButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isActive(value) {
		throw new Error("<GenericTextButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get width() {
		throw new Error("<GenericTextButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<GenericTextButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<GenericTextButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<GenericTextButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get type() {
		throw new Error("<GenericTextButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set type(value) {
		throw new Error("<GenericTextButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isCompact() {
		throw new Error("<GenericTextButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isCompact(value) {
		throw new Error("<GenericTextButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

// This alphabet uses `A-Za-z0-9_-` symbols. The genetic algorithm helped
// optimize the gzip compression for this alphabet.
let urlAlphabet =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW';

let nanoid = (size = 21) => {
  let id = '';
  // A compact alternative for `for (var i = 0; i < step; i++)`.
  let i = size;
  while (i--) {
    // `| 0` is more compact and faster than `Math.floor()`.
    id += urlAlphabet[(Math.random() * 64) | 0];
  }
  return id
};

/* src/js/renderer/component/ui/MenuButton.svelte generated by Svelte v3.30.1 */
const file$7 = "src/js/renderer/component/ui/MenuButton.svelte";

function add_css$7() {
	var style = element("style");
	style.id = "svelte-19xcn0s-style";
	style.textContent = ".menuButton.svelte-19xcn0s{position:relative}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVudUJ1dHRvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIk1lbnVCdXR0b24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG1lbnUsIG9wZW5NZW51LCBjbG9zZU1lbnUgfSBmcm9tICcuLi8uLi9TdGF0ZU1hbmFnZXInXG4gIGltcG9ydCBJY29uQnV0dG9uIGZyb20gJy4vSWNvbkJ1dHRvbi5zdmVsdGUnXG4gIGltcG9ydCBMYWJlbCBmcm9tICcuL2J1aWxkaW5nLWJsb2Nrcy9MYWJlbC5zdmVsdGUnO1xuICBpbXBvcnQgR2VuZXJpY1RleHRCdXR0b24gZnJvbSAnLi9idWlsZGluZy1ibG9ja3MvR2VuZXJpY1RleHRCdXR0b24uc3ZlbHRlJztcbiAgaW1wb3J0IHsgd2FpdCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscyc7XG4gIGltcG9ydCB7IG5hbm9pZCB9IGZyb20gJ25hbm9pZC9ub24tc2VjdXJlJ1xuICBpbXBvcnQgeyBjcmVhdGVFdmVudERpc3BhdGNoZXIgfSBmcm9tICdzdmVsdGUnO1xuICBjb25zdCBkaXNwYXRjaCA9IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlcigpO1xuXG4gIGV4cG9ydCBsZXQgb3B0aW9ucyA9IFtdXG4gIGV4cG9ydCBsZXQgaXNDb21wYWN0ID0gZmFsc2VcbiAgZXhwb3J0IGxldCB0b29sdGlwID0gJydcbiAgZXhwb3J0IGxldCBsYWJlbCA9ICcnXG4gIGV4cG9ydCBsZXQgYnV0dG9uVHlwZSA9ICd0ZXh0JyAvLyB0ZXh0IG9yIGljb25cbiAgZXhwb3J0IGxldCBidXR0b25XaWR0aCA9IDEwMFxuICBleHBvcnQgbGV0IG1lbnVUeXBlID0gJ3BvcHVwJyAvLyBwb3B1cCBvciBwdWxsZG93blxuICBleHBvcnQgbGV0IG1lbnVXaWR0aCA9IGJ1dHRvbldpZHRoXG4gIGV4cG9ydCBsZXQgbGFiZWxQYWRkaW5nID0gOFxuXG4gIC8vIEVhY2ggTWVudUJ1dHRvbiBpbnN0YW5jZSBuZWVkcyBhIHVuaXF1ZSBpZC4gXG4gIC8vIFdlIHVzZSB0aGlzIGluIHRoZSBgbWVudWAgc3RvcmUgdG8gYXNzb2NpYXRlIHRoZSBhY3RpdmUgbWVudSB3aXRoIGl0J3MgYnV0dG9uLlxuICBsZXQgaWQgPSBuYW5vaWQoKVxuICBsZXQgZGl2XG4gIFxuICAvLyBMYWJlbCB0ZXh0IGlzIHRoZSBjaGVja2VkIG9wdGlvblxuICAkOiBidXR0b25MYWJlbCA9IG9wdGlvbnMuZmluZCgob3B0KSA9PiBvcHQuaXNDaGVja2VkKT8ubGFiZWxcblxuICAvLyBEZXRlcm1pbmUgd2hldGhlciB0aGUgbWVudSBpcyBvcGVuIGFuZCB0YXJnZXRpbmcgdGhpcyBidXR0b24uXG4gIC8vIEJhc2VkIG9uOiBpcyBzdGF0dXMgJ29wZW4nLCBhbmQgZG8gY29vcmRpbmF0ZXMgbWF0Y2g/XG4gICQ6IGlzT3BlbiA9ICRtZW51LmlzT3BlbiAmJiAkbWVudS5pZCA9PSBpZFxuXG4gIC8qKiBcbiAgICogVG9nZ2xlIHRoZSBtZW51IG9wZW4vY2xvc2VkLiBTZXQgbWVudSBwb3NpdGlvbiwgdGhlbiByZXZlYWwgaXQgYnkgc2V0dGluZyBgaXNPcGVuYCB0cnVlLlxuICAgKi9cbiAgZnVuY3Rpb24gdG9nZ2xlT3BlbkNsb3NlKGV2dCkge1xuXG4gICAgLy8gU3RvcCBwcm9wYWdhdGlvbiwgb3IgZWxzZSB3ZSB0cmlnZ2VyIG1vdXNlZG93biBpbiBNZW51LnN2ZWx0ZSBib2R5IGxpc3RlbmVyLCB3aGljaCB3aWxsIGNsb3NlIHRoZSBtZW51IGFzIHNvb24gYXMgaXQgb3BlbnMuXG4gICAgZXZ0LnN0b3BQcm9wYWdhdGlvbigpXG5cbiAgICBpZiAoaXNPcGVuKSB7XG4gICAgICBjbG9zZU1lbnUoKVxuICAgIH0gZWxzZSBpZiAoIWlzT3Blbikge1xuICAgICAgICBcbiAgICAgIC8vIEdldCBlbGVtZW50IHBvc2l0aW9uXG4gICAgICBjb25zdCB7eCwgeX0gPSBkaXYuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIGxldCBtZW51WCA9IHhcbiAgICAgIGxldCBtZW51WSA9IHlcblxuICAgICAgLy8gU2V0IG1lbnUgc3RvcmUgdmFsdWVzXG4gICAgICBvcGVuTWVudSh7XG4gICAgICAgIGlkOiBpZCwgXG4gICAgICAgIGlzT3BlbjogdHJ1ZSxcbiAgICAgICAgaXNDb21wYWN0OiBpc0NvbXBhY3QsXG4gICAgICAgIGJ1dHRvblR5cGU6IGJ1dHRvblR5cGUsXG4gICAgICAgIG1lbnVUeXBlOiBtZW51VHlwZSxcbiAgICAgICAgb3B0aW9uczogb3B0aW9ucyxcbiAgICAgICAgc2VsZWN0ZWRPcHRpb246IHVuZGVmaW5lZCxcbiAgICAgICAgLy8gSWYgYnV0dG9uVHlwZSBpcyAndGV4dCcsIHdlIHdhbnQgbWVudSB0byBtYXRjaCBidXR0b24sIHBsdXMgc29tZSBwYWRkaW5nLlxuICAgICAgICB3aWR0aDogYnV0dG9uVHlwZSA9PSAndGV4dCcgPyBidXR0b25XaWR0aCArIChpc0NvbXBhY3QgPyA2IDogMTIpIDogbWVudVdpZHRoLFxuICAgICAgICB4OiBtZW51WCxcbiAgICAgICAgeTogbWVudVlcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgJDogJG1lbnUuc2VsZWN0ZWRPcHRpb24sIG9uU2VsZWN0KClcblxuICBhc3luYyBmdW5jdGlvbiBvblNlbGVjdCgpIHtcbiAgICBpZiAoJG1lbnUuaXNPcGVuIHx8ICRtZW51LmlkICE9PSBpZCB8fCAhJG1lbnUuc2VsZWN0ZWRPcHRpb24pIHJldHVyblxuICAgIGF3YWl0IHdhaXQoMTAwKVxuICAgIGRpc3BhdGNoKCdzZWxlY3QnLCB7b3B0aW9uOiAkbWVudS5zZWxlY3RlZE9wdGlvbn0pXG4gIH1cblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLm1lbnVCdXR0b24ge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59PC9zdHlsZT5cblxuPGRpdiBiaW5kOnRoaXM9e2Rpdn0gY2xhc3M9XCJtZW51QnV0dG9uXCI+XG5cbiAgeyNpZiBsYWJlbH1cbiAgICA8TGFiZWwgbGFiZWw9eydTb3J0J30gcGFkZGluZz17bGFiZWxQYWRkaW5nfSAvPlxuICB7L2lmfVxuXG4gIDwhLS0gQnV0dG9uIC0tPlxuICB7I2lmIGJ1dHRvblR5cGUgPT0gJ3RleHQnfVxuICAgIDxHZW5lcmljVGV4dEJ1dHRvbiB7aXNDb21wYWN0fSBpc0FjdGl2ZT17aXNPcGVufSB0eXBlPXttZW51VHlwZX0gd2lkdGg9e2J1dHRvbldpZHRofSBsYWJlbD17YnV0dG9uTGFiZWx9IG9uOm1vdXNlZG93bj17dG9nZ2xlT3BlbkNsb3NlfSAvPlxuICB7OmVsc2UgaWYgYnV0dG9uVHlwZSA9PSAnaWNvbid9XG4gICAgPEljb25CdXR0b24ge3Rvb2x0aXB9IGlzQWN0aXZlPXtpc09wZW59IGljb249eyctLWltZy1hcnJvdy11cC1hcnJvdy1kb3duJ30gc2hvd0NhcmV0PXtmYWxzZX0gb246bW91c2Vkb3duPXt0b2dnbGVPcGVuQ2xvc2V9IC8+XG4gIHsvaWZ9XG4gIFxuPC9kaXY+XG5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFnRkEsV0FBVyxlQUFDLENBQUMsQUFDWCxRQUFRLENBQUUsUUFBUSxBQUNwQixDQUFDIn0= */";
	append_dev(document.head, style);
}

// (87:2) {#if label}
function create_if_block_2(ctx) {
	let label_1;
	let current;

	label_1 = new Label({
			props: {
				label: "Sort",
				padding: /*labelPadding*/ ctx[6]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(label_1.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(label_1, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const label_1_changes = {};
			if (dirty & /*labelPadding*/ 64) label_1_changes.padding = /*labelPadding*/ ctx[6];
			label_1.$set(label_1_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(label_1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(label_1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(label_1, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2.name,
		type: "if",
		source: "(87:2) {#if label}",
		ctx
	});

	return block;
}

// (94:33) 
function create_if_block_1(ctx) {
	let iconbutton;
	let current;

	iconbutton = new IconButton({
			props: {
				tooltip: /*tooltip*/ ctx[1],
				isActive: /*isOpen*/ ctx[9],
				icon: "--img-arrow-up-arrow-down",
				showCaret: false
			},
			$$inline: true
		});

	iconbutton.$on("mousedown", /*toggleOpenClose*/ ctx[10]);

	const block = {
		c: function create() {
			create_component(iconbutton.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(iconbutton, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const iconbutton_changes = {};
			if (dirty & /*tooltip*/ 2) iconbutton_changes.tooltip = /*tooltip*/ ctx[1];
			if (dirty & /*isOpen*/ 512) iconbutton_changes.isActive = /*isOpen*/ ctx[9];
			iconbutton.$set(iconbutton_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(iconbutton.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(iconbutton.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(iconbutton, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(94:33) ",
		ctx
	});

	return block;
}

// (92:2) {#if buttonType == 'text'}
function create_if_block$2(ctx) {
	let generictextbutton;
	let current;

	generictextbutton = new GenericTextButton({
			props: {
				isCompact: /*isCompact*/ ctx[0],
				isActive: /*isOpen*/ ctx[9],
				type: /*menuType*/ ctx[5],
				width: /*buttonWidth*/ ctx[4],
				label: /*buttonLabel*/ ctx[8]
			},
			$$inline: true
		});

	generictextbutton.$on("mousedown", /*toggleOpenClose*/ ctx[10]);

	const block = {
		c: function create() {
			create_component(generictextbutton.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(generictextbutton, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const generictextbutton_changes = {};
			if (dirty & /*isCompact*/ 1) generictextbutton_changes.isCompact = /*isCompact*/ ctx[0];
			if (dirty & /*isOpen*/ 512) generictextbutton_changes.isActive = /*isOpen*/ ctx[9];
			if (dirty & /*menuType*/ 32) generictextbutton_changes.type = /*menuType*/ ctx[5];
			if (dirty & /*buttonWidth*/ 16) generictextbutton_changes.width = /*buttonWidth*/ ctx[4];
			if (dirty & /*buttonLabel*/ 256) generictextbutton_changes.label = /*buttonLabel*/ ctx[8];
			generictextbutton.$set(generictextbutton_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(generictextbutton.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(generictextbutton.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(generictextbutton, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$2.name,
		type: "if",
		source: "(92:2) {#if buttonType == 'text'}",
		ctx
	});

	return block;
}

function create_fragment$7(ctx) {
	let div_1;
	let t;
	let current_block_type_index;
	let if_block1;
	let current;
	let if_block0 = /*label*/ ctx[2] && create_if_block_2(ctx);
	const if_block_creators = [create_if_block$2, create_if_block_1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*buttonType*/ ctx[3] == "text") return 0;
		if (/*buttonType*/ ctx[3] == "icon") return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	const block = {
		c: function create() {
			div_1 = element("div");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr_dev(div_1, "class", "menuButton svelte-19xcn0s");
			add_location(div_1, file$7, 84, 0, 2628);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div_1, anchor);
			if (if_block0) if_block0.m(div_1, null);
			append_dev(div_1, t);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div_1, null);
			}

			/*div_1_binding*/ ctx[14](div_1);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (/*label*/ ctx[2]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*label*/ 4) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div_1, t);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block1) {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
				}

				if (~current_block_type_index) {
					if_block1 = if_blocks[current_block_type_index];

					if (!if_block1) {
						if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block1.c();
					} else {
						if_block1.p(ctx, dirty);
					}

					transition_in(if_block1, 1);
					if_block1.m(div_1, null);
				} else {
					if_block1 = null;
				}
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div_1);
			if (if_block0) if_block0.d();

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}

			/*div_1_binding*/ ctx[14](null);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$7.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$7($$self, $$props, $$invalidate) {
	let $menu;
	validate_store(menu, "menu");
	component_subscribe($$self, menu, $$value => $$invalidate(13, $menu = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("MenuButton", slots, []);
	const dispatch = createEventDispatcher();
	let { options = [] } = $$props;
	let { isCompact = false } = $$props;
	let { tooltip = "" } = $$props;
	let { label = "" } = $$props;
	let { buttonType = "text" } = $$props; // text or icon
	let { buttonWidth = 100 } = $$props;
	let { menuType = "popup" } = $$props; // popup or pulldown
	let { menuWidth = buttonWidth } = $$props;
	let { labelPadding = 8 } = $$props;

	// Each MenuButton instance needs a unique id. 
	// We use this in the `menu` store to associate the active menu with it's button.
	let id = nanoid();

	let div;

	/** 
 * Toggle the menu open/closed. Set menu position, then reveal it by setting `isOpen` true.
 */
	function toggleOpenClose(evt) {
		// Stop propagation, or else we trigger mousedown in Menu.svelte body listener, which will close the menu as soon as it opens.
		evt.stopPropagation();

		if (isOpen) {
			closeMenu();
		} else if (!isOpen) {
			// Get element position
			const { x, y } = div.getBoundingClientRect();

			let menuX = x;
			let menuY = y;

			// Set menu store values
			openMenu({
				id,
				isOpen: true,
				isCompact,
				buttonType,
				menuType,
				options,
				selectedOption: undefined,
				// If buttonType is 'text', we want menu to match button, plus some padding.
				width: buttonType == "text"
				? buttonWidth + (isCompact ? 6 : 12)
				: menuWidth,
				x: menuX,
				y: menuY
			});
		}
	}

	async function onSelect() {
		if ($menu.isOpen || $menu.id !== id || !$menu.selectedOption) return;
		await wait(100);
		dispatch("select", { option: $menu.selectedOption });
	}

	const writable_props = [
		"options",
		"isCompact",
		"tooltip",
		"label",
		"buttonType",
		"buttonWidth",
		"menuType",
		"menuWidth",
		"labelPadding"
	];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MenuButton> was created with unknown prop '${key}'`);
	});

	function div_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			div = $$value;
			$$invalidate(7, div);
		});
	}

	$$self.$$set = $$props => {
		if ("options" in $$props) $$invalidate(11, options = $$props.options);
		if ("isCompact" in $$props) $$invalidate(0, isCompact = $$props.isCompact);
		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
		if ("buttonType" in $$props) $$invalidate(3, buttonType = $$props.buttonType);
		if ("buttonWidth" in $$props) $$invalidate(4, buttonWidth = $$props.buttonWidth);
		if ("menuType" in $$props) $$invalidate(5, menuType = $$props.menuType);
		if ("menuWidth" in $$props) $$invalidate(12, menuWidth = $$props.menuWidth);
		if ("labelPadding" in $$props) $$invalidate(6, labelPadding = $$props.labelPadding);
	};

	$$self.$capture_state = () => ({
		menu,
		openMenu,
		closeMenu,
		IconButton,
		Label,
		GenericTextButton,
		wait,
		nanoid,
		createEventDispatcher,
		dispatch,
		options,
		isCompact,
		tooltip,
		label,
		buttonType,
		buttonWidth,
		menuType,
		menuWidth,
		labelPadding,
		id,
		div,
		toggleOpenClose,
		onSelect,
		buttonLabel,
		isOpen,
		$menu
	});

	$$self.$inject_state = $$props => {
		if ("options" in $$props) $$invalidate(11, options = $$props.options);
		if ("isCompact" in $$props) $$invalidate(0, isCompact = $$props.isCompact);
		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
		if ("buttonType" in $$props) $$invalidate(3, buttonType = $$props.buttonType);
		if ("buttonWidth" in $$props) $$invalidate(4, buttonWidth = $$props.buttonWidth);
		if ("menuType" in $$props) $$invalidate(5, menuType = $$props.menuType);
		if ("menuWidth" in $$props) $$invalidate(12, menuWidth = $$props.menuWidth);
		if ("labelPadding" in $$props) $$invalidate(6, labelPadding = $$props.labelPadding);
		if ("id" in $$props) $$invalidate(16, id = $$props.id);
		if ("div" in $$props) $$invalidate(7, div = $$props.div);
		if ("buttonLabel" in $$props) $$invalidate(8, buttonLabel = $$props.buttonLabel);
		if ("isOpen" in $$props) $$invalidate(9, isOpen = $$props.isOpen);
	};

	let buttonLabel;
	let isOpen;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*options*/ 2048) {
			// Label text is the checked option
			 $$invalidate(8, buttonLabel = options.find(opt => opt.isChecked)?.label);
		}

		if ($$self.$$.dirty & /*$menu*/ 8192) {
			// Determine whether the menu is open and targeting this button.
			// Based on: is status 'open', and do coordinates match?
			 $$invalidate(9, isOpen = $menu.isOpen && $menu.id == id);
		}

		if ($$self.$$.dirty & /*$menu*/ 8192) {
			 ($menu.selectedOption, onSelect());
		}
	};

	return [
		isCompact,
		tooltip,
		label,
		buttonType,
		buttonWidth,
		menuType,
		labelPadding,
		div,
		buttonLabel,
		isOpen,
		toggleOpenClose,
		options,
		menuWidth,
		$menu,
		div_1_binding
	];
}

class MenuButton extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-19xcn0s-style")) add_css$7();

		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
			options: 11,
			isCompact: 0,
			tooltip: 1,
			label: 2,
			buttonType: 3,
			buttonWidth: 4,
			menuType: 5,
			menuWidth: 12,
			labelPadding: 6
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "MenuButton",
			options,
			id: create_fragment$7.name
		});
	}

	get options() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set options(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isCompact() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isCompact(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltip() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltip(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get buttonType() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set buttonType(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get buttonWidth() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set buttonWidth(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get menuType() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set menuType(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get menuWidth() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set menuWidth(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get labelPadding() {
		throw new Error("<MenuButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set labelPadding(value) {
		throw new Error("<MenuButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/SortMenu.svelte generated by Svelte v3.30.1 */
const file$8 = "src/js/renderer/component/sidebar/SortMenu.svelte";

function add_css$8() {
	var style = element("style");
	style.id = "svelte-1y6peyo-style";
	style.textContent = ".sortMenu.svelte-1y6peyo{transform:translate(2px, 0)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU29ydE1lbnUuc3ZlbHRlIiwic291cmNlcyI6WyJTb3J0TWVudS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IE1lbnVCdXR0b24gZnJvbSAnLi4vdWkvTWVudUJ1dHRvbi5zdmVsdGUnXG5cdGltcG9ydCB7IHNpZGViYXIgfSBmcm9tICcuLi8uLi9TdGF0ZU1hbmFnZXInXG4gIGltcG9ydCB7IGdldENvbnRleHQgfSBmcm9tICdzdmVsdGUnO1xuXG4gIC8vIExpc3Qgb2Ygb3B0aW9ucyBpbiBmb3JtYXQ6XG5cbiAgZXhwb3J0IGxldCBvcHRpb25zXG5cbiAgY29uc3QgdGFiSWQgPSBnZXRDb250ZXh0KCd0YWJJZCcpXG4gICQ6IHRhYiA9ICRzaWRlYmFyLnRhYnNCeUlkW3RhYklkXVxuXG4gIGZ1bmN0aW9uIHNldFNvcnRpbmcoZXZ0KSB7XG4gICAgY29uc3Qgc2VsZWN0ZWQgPSBldnQuZGV0YWlsLm9wdGlvblxuICAgIG9wdGlvbnMuZm9yRWFjaCgoaSkgPT4ge1xuICAgICAgaWYgKGkuZ3JvdXAgPT0gc2VsZWN0ZWQuZ3JvdXApIHtcbiAgICAgICAgaS5pc0NoZWNrZWQgPSBpLmxhYmVsID09IHNlbGVjdGVkLmxhYmVsXG4gICAgICB9XG4gICAgfSlcblxuICAgIGNvbnN0IHNvcnRCeSA9IG9wdGlvbnMuZmluZCgoaSkgPT4gaS5ncm91cCA9PSAnc29ydEJ5JyAmJiBpLmlzQ2hlY2tlZCk/LmxhYmVsXG4gICAgY29uc3Qgc29ydE9yZGVyID0gb3B0aW9ucy5maW5kKChpKSA9PiBpLmdyb3VwID09ICdzb3J0T3JkZXInICYmIGkuaXNDaGVja2VkKT8ubGFiZWxcblxuICAgIHdpbmRvdy5hcGkuc2VuZCgnZGlzcGF0Y2gnLCB7XG4gICAgICB0eXBlOiAnU0lERUJBUl9TRVRfU09SVElORycsXG4gICAgICB0YWJJZDogdGFiSWQsXG4gICAgICBzb3J0Qnk6IHNvcnRCeSxcbiAgICAgIHNvcnRPcmRlcjogc29ydE9yZGVyLFxuICAgIH0pXG4gIH1cblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLnNvcnRNZW51IHtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMnB4LCAwKTtcbn08L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwic29ydE1lbnVcIj5cbjxNZW51QnV0dG9uIHRvb2x0aXA9eydDaGFuZ2UgdGhlIHNvcnRpbmcgY3JpdGVyaWEgYW5kIGRpcmVjdGlvbid9IGJ1dHRvblR5cGU9eydpY29uJ30gbWVudVR5cGU9eydwdWxsZG93bid9IG1lbnVXaWR0aD17MTA1fSB7b3B0aW9uc30gb246c2VsZWN0PXtzZXRTb3J0aW5nfS8+XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBcUNBLFNBQVMsZUFBQyxDQUFDLEFBQ1QsU0FBUyxDQUFFLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQzlCLENBQUMifQ== */";
	append_dev(document.head, style);
}

function create_fragment$8(ctx) {
	let div;
	let menubutton;
	let current;

	menubutton = new MenuButton({
			props: {
				tooltip: "Change the sorting criteria and direction",
				buttonType: "icon",
				menuType: "pulldown",
				menuWidth: 105,
				options: /*options*/ ctx[0]
			},
			$$inline: true
		});

	menubutton.$on("select", /*setSorting*/ ctx[1]);

	const block = {
		c: function create() {
			div = element("div");
			create_component(menubutton.$$.fragment);
			attr_dev(div, "class", "sortMenu svelte-1y6peyo");
			add_location(div, file$8, 41, 0, 1065);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(menubutton, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const menubutton_changes = {};
			if (dirty & /*options*/ 1) menubutton_changes.options = /*options*/ ctx[0];
			menubutton.$set(menubutton_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(menubutton.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(menubutton.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(menubutton);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$8.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$8($$self, $$props, $$invalidate) {
	let $sidebar;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(2, $sidebar = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SortMenu", slots, []);
	let { options } = $$props;
	const tabId = getContext("tabId");

	function setSorting(evt) {
		const selected = evt.detail.option;

		options.forEach(i => {
			if (i.group == selected.group) {
				i.isChecked = i.label == selected.label;
			}
		});

		const sortBy = options.find(i => i.group == "sortBy" && i.isChecked)?.label;
		const sortOrder = options.find(i => i.group == "sortOrder" && i.isChecked)?.label;

		window.api.send("dispatch", {
			type: "SIDEBAR_SET_SORTING",
			tabId,
			sortBy,
			sortOrder
		});
	}

	const writable_props = ["options"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SortMenu> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("options" in $$props) $$invalidate(0, options = $$props.options);
	};

	$$self.$capture_state = () => ({
		MenuButton,
		sidebar,
		getContext,
		options,
		tabId,
		setSorting,
		tab,
		$sidebar
	});

	$$self.$inject_state = $$props => {
		if ("options" in $$props) $$invalidate(0, options = $$props.options);
		if ("tab" in $$props) tab = $$props.tab;
	};

	let tab;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 4) {
			 tab = $sidebar.tabsById[tabId];
		}
	};

	return [options, setSorting, $sidebar];
}

class SortMenu extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1y6peyo-style")) add_css$8();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { options: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SortMenu",
			options,
			id: create_fragment$8.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*options*/ ctx[0] === undefined && !("options" in props)) {
			console.warn("<SortMenu> was created without expected prop 'options'");
		}
	}

	get options() {
		throw new Error("<SortMenu>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set options(value) {
		throw new Error("<SortMenu>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/SearchField.svelte generated by Svelte v3.30.1 */

const file$9 = "src/js/renderer/component/ui/SearchField.svelte";

function add_css$9() {
	var style = element("style");
	style.id = "svelte-1dyutrg-style";
	style.textContent = ".searchfield.svelte-1dyutrg{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;margin:10px 10px 0;position:relative;background-color:rgba(var(--foregroundColor), 0.05);border-radius:6px;min-height:28px;display:flex;flex-direction:row;align-items:center;border:1px solid rgba(var(--foregroundColor), 0.05)}.searchfield.svelte-1dyutrg:focus-within{animation-fill-mode:forwards;animation-name:svelte-1dyutrg-selectField;animation-duration:0.3s}@keyframes svelte-1dyutrg-selectField{from{box-shadow:0 0 0 10px transparent}to{box-shadow:0 0 0 3.5px rgba(59, 153, 252, 0.5)}}.magnifying-glass.svelte-1dyutrg{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlTextColor);-webkit-mask-image:var(--img-magnifyingglass);position:absolute;width:13px;height:13px;left:5px;opacity:0.5}.placeholder.svelte-1dyutrg{position:absolute;top:50%;transform:translate(0, -50%);user-select:none;color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-1dyutrg{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--textColor);margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VhcmNoRmllbGQuc3ZlbHRlIiwic291cmNlcyI6WyJTZWFyY2hGaWVsZC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCBwbGFjZWhvbGRlciA9ICdTZWFyY2gnXG4gIGV4cG9ydCBsZXQgcXVlcnkgPSAnJ1xuICBleHBvcnQgbGV0IGZvY3VzZWQgPSBmYWxzZVxuXG4gIGxldCBpbnB1dCA9IG51bGxcblxuICBmdW5jdGlvbiBoYW5kbGVLZXlkb3duKGV2dCkge1xuICAgIGlmICghZm9jdXNlZCkgcmV0dXJuXG4gICAgXG4gICAgLy8gRm9jdXMgb24gQ21kLUZcbiAgICBpZiAoZXZ0LmtleSA9PSAnZicgJiYgZXZ0Lm1ldGFLZXkpIHtcbiAgICAgIGlucHV0LnNlbGVjdCgpXG4gICAgfVxuXG4gICAgLy8gU2VsZWN0IGFsbFxuICAgIGlmIChldnQubWV0YUtleSAmJiBldnQua2V5ID09ICdhJykge1xuICAgICAgaW5wdXQuc2VsZWN0KClcbiAgICB9XG4gIH1cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbi5zZWFyY2hmaWVsZCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBtYXJnaW46IDEwcHggMTBweCAwO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEodmFyKC0tZm9yZWdyb3VuZENvbG9yKSwgMC4wNSk7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgbWluLWhlaWdodDogMjhweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgYm9yZGVyOiAxcHggc29saWQgcmdiYSh2YXIoLS1mb3JlZ3JvdW5kQ29sb3IpLCAwLjA1KTtcbn1cbi5zZWFyY2hmaWVsZDpmb2N1cy13aXRoaW4ge1xuICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkcztcbiAgYW5pbWF0aW9uLW5hbWU6IHNlbGVjdEZpZWxkO1xuICBhbmltYXRpb24tZHVyYXRpb246IDAuM3M7XG59XG5cbkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAxMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAzLjVweCByZ2JhKDU5LCAxNTMsIDI1MiwgMC41KTtcbiAgfVxufVxuLm1hZ25pZnlpbmctZ2xhc3Mge1xuICAtd2Via2l0LW1hc2stc2l6ZTogY29udGFpbjtcbiAgLXdlYmtpdC1tYXNrLXBvc2l0aW9uOiBjZW50ZXI7XG4gIC13ZWJraXQtbWFzay1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTUwJSk7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbnRyb2xUZXh0Q29sb3IpO1xuICAtd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLWltZy1tYWduaWZ5aW5nZ2xhc3MpO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHdpZHRoOiAxM3B4O1xuICBoZWlnaHQ6IDEzcHg7XG4gIGxlZnQ6IDVweDtcbiAgb3BhY2l0eTogMC41O1xufVxuXG4ucGxhY2Vob2xkZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtNTAlKTtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIGNvbG9yOiB2YXIoLS1wbGFjZWhvbGRlclRleHRDb2xvcik7XG4gIGxlZnQ6IDI0cHg7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuXG5pbnB1dCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tdGV4dENvbG9yKTtcbiAgbWFyZ2luOiAxcHggMCAwIDI0cHg7XG4gIHdpZHRoOiAxMDAlO1xuICBiYWNrZ3JvdW5kOiB0cmFuc3BhcmVudDtcbiAgb3V0bGluZTogbm9uZTtcbiAgYm9yZGVyOiBub25lO1xufTwvc3R5bGU+XG5cbjxzdmVsdGU6d2luZG93IG9uOmtleWRvd249e2hhbmRsZUtleWRvd259IC8+XG5cbjxkaXYgY2xhc3M9XCJzZWFyY2hmaWVsZFwiPlxuICA8ZGl2XG4gICAgb246bW91c2Vkb3dufHByZXZlbnREZWZhdWx0PXsoKSA9PiBpbnB1dC5zZWxlY3QoKX1cbiAgICBjbGFzcz1cIm1hZ25pZnlpbmctZ2xhc3NcIiAvPlxuICB7I2lmICFxdWVyeX1cbiAgICA8c3BhbiBjbGFzcz1cInBsYWNlaG9sZGVyXCI+e3BsYWNlaG9sZGVyfTwvc3Bhbj5cbiAgey9pZn1cbiAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgYmluZDp0aGlzPXtpbnB1dH0gYmluZDp2YWx1ZT17cXVlcnl9IC8+XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4QkEsWUFBWSxlQUFDLENBQUMsQUFDWixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsTUFBTSxDQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUNuQixRQUFRLENBQUUsUUFBUSxDQUNsQixnQkFBZ0IsQ0FBRSxLQUFLLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNwRCxhQUFhLENBQUUsR0FBRyxDQUNsQixVQUFVLENBQUUsSUFBSSxDQUNoQixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxHQUFHLENBQ25CLFdBQVcsQ0FBRSxNQUFNLENBQ25CLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEFBQ3RELENBQUMsQUFDRCwyQkFBWSxhQUFhLEFBQUMsQ0FBQyxBQUN6QixtQkFBbUIsQ0FBRSxRQUFRLENBQzdCLGNBQWMsQ0FBRSwwQkFBVyxDQUMzQixrQkFBa0IsQ0FBRSxJQUFJLEFBQzFCLENBQUMsQUFFRCxXQUFXLDBCQUFZLENBQUMsQUFDdEIsSUFBSSxBQUFDLENBQUMsQUFDSixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDcEMsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxBQUNqRCxDQUFDLEFBQ0gsQ0FBQyxBQUNELGlCQUFpQixlQUFDLENBQUMsQUFDakIsaUJBQWlCLENBQUUsT0FBTyxDQUMxQixxQkFBcUIsQ0FBRSxNQUFNLENBQzdCLG1CQUFtQixDQUFFLFNBQVMsQ0FDOUIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLEdBQUcsQ0FDUixTQUFTLENBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDN0IsZ0JBQWdCLENBQUUsSUFBSSxrQkFBa0IsQ0FBQyxDQUN6QyxrQkFBa0IsQ0FBRSxJQUFJLHFCQUFxQixDQUFDLENBQzlDLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixJQUFJLENBQUUsR0FBRyxDQUNULE9BQU8sQ0FBRSxHQUFHLEFBQ2QsQ0FBQyxBQUVELFlBQVksZUFBQyxDQUFDLEFBQ1osUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLEdBQUcsQ0FDUixTQUFTLENBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDN0IsV0FBVyxDQUFFLElBQUksQ0FDakIsS0FBSyxDQUFFLElBQUksc0JBQXNCLENBQUMsQ0FDbEMsSUFBSSxDQUFFLElBQUksQ0FDVixjQUFjLENBQUUsSUFBSSxBQUN0QixDQUFDLEFBRUQsS0FBSyxlQUFDLENBQUMsQUFDTCxJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsS0FBSyxDQUFFLElBQUksV0FBVyxDQUFDLENBQ3ZCLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ3BCLEtBQUssQ0FBRSxJQUFJLENBQ1gsVUFBVSxDQUFFLFdBQVcsQ0FDdkIsT0FBTyxDQUFFLElBQUksQ0FDYixNQUFNLENBQUUsSUFBSSxBQUNkLENBQUMifQ== */";
	append_dev(document.head, style);
}

// (107:2) {#if !query}
function create_if_block$3(ctx) {
	let span;
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr_dev(span, "class", "placeholder svelte-1dyutrg");
			add_location(span, file$9, 107, 4, 2391);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*placeholder*/ 2) set_data_dev(t, /*placeholder*/ ctx[1]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$3.name,
		type: "if",
		source: "(107:2) {#if !query}",
		ctx
	});

	return block;
}

function create_fragment$9(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let mounted;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block$3(ctx);

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr_dev(div0, "class", "magnifying-glass svelte-1dyutrg");
			add_location(div0, file$9, 103, 2, 2280);
			attr_dev(input_1, "type", "text");
			attr_dev(input_1, "class", "svelte-1dyutrg");
			add_location(input_1, file$9, 109, 2, 2448);
			attr_dev(div1, "class", "searchfield svelte-1dyutrg");
			add_location(div1, file$9, 102, 0, 2252);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div1, t0);
			if (if_block) if_block.m(div1, null);
			append_dev(div1, t1);
			append_dev(div1, input_1);
			/*input_1_binding*/ ctx[6](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);

			if (!mounted) {
				dispose = [
					listen_dev(window, "keydown", /*handleKeydown*/ ctx[3], false, false, false),
					listen_dev(div0, "mousedown", prevent_default(/*mousedown_handler*/ ctx[5]), false, true, false),
					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[7])
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
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
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			if (if_block) if_block.d();
			/*input_1_binding*/ ctx[6](null);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$9.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$9($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SearchField", slots, []);
	let { placeholder = "Search" } = $$props;
	let { query = "" } = $$props;
	let { focused = false } = $$props;
	let input = null;

	function handleKeydown(evt) {
		if (!focused) return;

		// Focus on Cmd-F
		if (evt.key == "f" && evt.metaKey) {
			input.select();
		}

		// Select all
		if (evt.metaKey && evt.key == "a") {
			input.select();
		}
	}

	const writable_props = ["placeholder", "query", "focused"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SearchField> was created with unknown prop '${key}'`);
	});

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

	$$self.$capture_state = () => ({
		placeholder,
		query,
		focused,
		input,
		handleKeydown
	});

	$$self.$inject_state = $$props => {
		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("focused" in $$props) $$invalidate(4, focused = $$props.focused);
		if ("input" in $$props) $$invalidate(2, input = $$props.input);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

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

class SearchField extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1dyutrg-style")) add_css$9();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { placeholder: 1, query: 0, focused: 4 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SearchField",
			options,
			id: create_fragment$9.name
		});
	}

	get placeholder() {
		throw new Error("<SearchField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set placeholder(value) {
		throw new Error("<SearchField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get query() {
		throw new Error("<SearchField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set query(value) {
		throw new Error("<SearchField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get focused() {
		throw new Error("<SearchField>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set focused(value) {
		throw new Error("<SearchField>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/*
tab
tabId
*/

// -------- MOUSE DOWN -------- //

function onMousedown(domEvent, id, isSelected, tab, tabId, listIds) {

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
    return
  } else if (shiftClicked) {
    const clickedIndex = listIds.indexOf(id);
    const lastSelectedIndex = listIds.indexOf(tab.lastSelected);
    const lastSelectedIsStillVisible = lastSelectedIndex !== -1;
    if (!lastSelectedIsStillVisible) {
      // If last selected item is no longer visible (e.g. parent 
      // folder may have closed), select only this id.
      selected = [id];
    } else {
      // Else, select all items between the last selected, and this id.
      const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex);
      const selectToIndex = Math.max(clickedIndex, lastSelectedIndex);
      const newSelected = listIds.slice(selectFromIndex, selectToIndex + 1);
      const lastSelected = [...tab.selected];
      selected = [...newSelected, ...lastSelected];
    }
  } else if (clickedWhileNotSelected) {
    selected = [id];
  } else if (cmdClickedWhileNotSelected) {
    selected = [id, ...tab.selected];
  } else if (cmdClickedWhileSelected) {
    // Copy array and remove this item from it
    selected = [...tab.selected];
    const indexToRemove = selected.indexOf(id);
    selected.splice(indexToRemove, 1);
  }

  // If there are multiple selected, find and remove any duplicates.
  // Per: https://stackoverflow.com/a/14438954
  if (selected.length > 1) {
    selected = Array.from(new Set(selected));
  }

  window.api.send('dispatch', {
    type: 'SIDEBAR_SET_SELECTED',
    tabId: tabId,
    lastSelected: id,
    selected: selected,
  });
} 

// -------- LEFT/RIGHT -------- //

function arrowUpDown(key, shiftPressed, altPressed, tab, tabId, listIds) {
    
  let id = ''; // of newly-selected item
  let selected = [];

  const lastSelectedIndex = listIds.indexOf(tab.lastSelected);

  const isLastSelectedStillVisible = lastSelectedIndex !== -1;
  const atTop = lastSelectedIndex == 0;
  const atBottom = lastSelectedIndex == listIds.length - 1;

  // Determine next file
  if (!isLastSelectedStillVisible) {
    // If last selected file is no longer visible (e.g. parent folder has since closed), select first or last file in list. On arrow up, select last file. Do oppposite for arrow down. Shift or alt have no effect.
    id = key == 'ArrowUp' ? listIds[listIds.length-1] : listIds[0];
    selected = [id];
  } else if (altPressed) {
    // If alt is pressed, jump to top or bottom of list.
    id = key == 'ArrowUp' ? listIds[0] : listIds[listIds.length-1];
    // If shift pressed, include all items between lastSelected and top/bottom
    // and add to the existing selection.
    if (shiftPressed) {
      const lastSelectedIsStillVisible = lastSelectedIndex !== -1;
      // If last selected item is no longer visible (e.g. parent 
      // folder may have closed), select all items
      if (!lastSelectedIsStillVisible) {
        selected = [...listIds];
      } else {
        const newSelectedIndex = listIds.indexOf(id);
        const selectFromIndex = Math.min(newSelectedIndex, lastSelectedIndex);
        const selectToIndex = Math.max(newSelectedIndex, lastSelectedIndex);
        const newSelected = listIds.slice(selectFromIndex, selectToIndex + 1);
        const lastSelected = [...tab.selected];
        selected = [...newSelected, ...lastSelected];
      }

    } else {
      selected = [id];
    }
  } else if (key == 'ArrowUp' && atTop) {
    // If arrowing up and already at top...
    if (tab.selected.length > 1) {
      // If there are multiple items selected...
      if (!shiftPressed){
        // If shift key is not pressed, clear, and select only first item.
        id = listIds[0];
        selected = [id];
      } else {
        // Else, do nothing.
        return
      }
    } else {
      // Else, do nothing.
      return
    }
  } else if (key == 'ArrowDown' && atBottom) {
    // [Same as arrowing up]
    // If arrowing down and already at bottom...
    if (tab.selected.length > 1) {
      // If there are multiple items selected...
      if (!shiftPressed){
        // If shift key is not pressed, clear, and select only last item.
        id = listIds[listIds.length - 1];
        selected = [id];
      } else {
        // Else, do nothing.
        return
      }
    } else {
      // Else, do nothing.
      return
    }
  } else if (shiftPressed) {
    // const newSelectedIndex = listIds.indexOf(id)

    // Are we shift-arrowing into an existing selection?
    // Get selected id. Then check if it's already selected
    // If yes, deselect lastSelected (thereby shrinking the selectiub)
    
    id = key == 'ArrowUp' ? listIds[lastSelectedIndex - 1] : listIds[lastSelectedIndex + 1];
    const isAlreadySelected = tab.selected.includes(id);
    
    if (isAlreadySelected) {
      const indexOfLastSelectedInSelected = tab.selected.indexOf(tab.lastSelected);
      selected = [...tab.selected];
      selected.splice(indexOfLastSelectedInSelected, 1);
    } else {
      // Else, add id to the existing selection.
      selected = [id, ...tab.selected];
    }
  } else {
    // Select previous or next
    id = key == 'ArrowUp' ? listIds[lastSelectedIndex - 1] : listIds[lastSelectedIndex + 1];
    selected = [id];
  }

  // If there are multiple selected, find and remove any duplicates.
  // Per: https://stackoverflow.com/a/14438954
  if (selected.length > 1) {
    selected = Array.from(new Set(selected));
  }

  // Update selection
  window.api.send('dispatch', {
    type: 'SIDEBAR_SET_SELECTED',
    tabId: tabId,
    lastSelected: id,
    selected: selected,
  });
}

// -------- TREE-LIST FUNCTIONS -------- //
    
function arrowLeftRight(key, tab, tabId, listIds, files) {

  const isMultipleSelected = tab.selected.length > 1;

  if (isMultipleSelected) {

    const selectedFolders = files.allIds.filter((id) => 
      tab.selected.includes(id) && 
      files.byId[id].type == 'folder');

    let expanded = [...tab.expanded];

    if (key == 'ArrowLeft') {
      selectedFolders.forEach((id) => {
        if (expanded.includes(id)) {
          const indexToRemove = expanded.indexOf(id);
          expanded.splice(indexToRemove, 1);
        }
      });
    } else if (key == 'ArrowRight') {
      selectedFolders.forEach((id) => {
        if (!expanded.includes(id)) {
          expanded.push(id);
        }
      });
    }
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_EXPANDED',
      tabId: tabId,
      expanded: expanded,
    });

  } else {

    const file = files.byId[tab.lastSelected];
    const isFolder = file.type == 'folder';
    const isExpanded = isFolder && tab.expanded.some((id) => id == file.id);

    if (key == 'ArrowLeft') {
      if (isFolder && isExpanded) {
        toggleExpanded(file.id, isExpanded, tab, tabId);
      } else {
        selectParentFolder(file.id, tabId, listIds, files);
      }
    } else if (key == 'ArrowRight'){
      if (isFolder && !isExpanded) {
        toggleExpanded(file.id, isExpanded, tab, tabId);
      }
    } 
  }
}

function selectParentFolder(childId, tabId, listIds, files) {
  const parentId = files.byId[childId].parentId;
  
  // If `listIds` does not include parent ID, we're at the top-level.
  // There's no visible parent to select, so return.
  if (!listIds.includes(parentId)) return
  
  window.api.send('dispatch', {
    type: 'SIDEBAR_SET_SELECTED',
    tabId: tabId,
    lastSelected: parentId,
    selected: [parentId],
  });
}

function toggleExpanded(id, isExpanded, tab, tabId) {
  let expanded = [...tab.expanded];
  switch (isExpanded) {
    case true:
      const indexToRemove = expanded.indexOf(id);
      expanded.splice(indexToRemove, 1);
      break
    case false:
      expanded.push(id);
      break
  } 
  window.api.send('dispatch', {
    type: 'SIDEBAR_SET_EXPANDED',
    tabId: tabId,
    expanded: expanded,
  });
}

/* src/js/renderer/component/ui/DisclosureButton.svelte generated by Svelte v3.30.1 */
const file$a = "src/js/renderer/component/ui/DisclosureButton.svelte";

function add_css$a() {
	var style = element("style");
	style.id = "svelte-4dnuku-style";
	style.textContent = ".disclosure.svelte-4dnuku{--width:0;--height:0;--padding:0;--left:0;--rotation:0;--iconColor:\"\";--image:\"\";position:absolute;top:50%;transform:translate(0, -50%);position:absolute;width:calc(var(--width) * 1px);height:calc(var(--height) * 1px);left:calc(var(--left) * 1px)}.icon.svelte-4dnuku{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:calc(100% - calc(var(--padding) * 1px));height:calc(100% - calc(var(--padding) * 1px));position:absolute;top:50%;left:50%;transform:translate(-50%, -50%) rotateZ(calc(var(--rotation) * 1deg));background-color:var(--iconColor);-webkit-mask-image:var(--image)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzY2xvc3VyZUJ1dHRvbi5zdmVsdGUiLCJzb3VyY2VzIjpbIkRpc2Nsb3N1cmVCdXR0b24uc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciB9IGZyb20gJ3N2ZWx0ZSdcbiAgaW1wb3J0IHsgY3NzIH0gZnJvbSAnLi4vdWkvYWN0aW9ucydcbiAgaW1wb3J0IHsgc3RhdGUgfSBmcm9tICcuLi8uLi9TdGF0ZU1hbmFnZXInXG5cbiAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKVxuXG4gIGV4cG9ydCBsZXQgd2lkdGggPSAzNFxuICBleHBvcnQgbGV0IGhlaWdodCA9IDI4XG4gIGV4cG9ydCBsZXQgcGFkZGluZyA9IDRcbiAgZXhwb3J0IGxldCBsZWZ0ID0gNFxuICBleHBvcnQgbGV0IHJvdGF0aW9uID0gMFxuXG4gIGV4cG9ydCBsZXQgaWNvbkNvbG9yID0gJHN0YXRlLmFwcGVhcmFuY2Uub3MuY29sb3JzLmNvbnRyb2xUZXh0Q29sb3JcbiAgZXhwb3J0IGxldCBpY29uSW1hZ2UgPSAnaW1nLWNoZXZyb24tcmlnaHQnXG4gIGV4cG9ydCBsZXQgbGFiZWwgPSBudWxsXG4gIGV4cG9ydCBsZXQgdG9vbHRpcCA9IG51bGxcblxuICAkOiBpbWFnZSA9IGB2YXIoLS0ke2ljb25JbWFnZX0pYFxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4uZGlzY2xvc3VyZSB7XG4gIC0td2lkdGg6IDA7XG4gIC0taGVpZ2h0OiAwO1xuICAtLXBhZGRpbmc6IDA7XG4gIC0tbGVmdDogMDtcbiAgLS1yb3RhdGlvbjogMDtcbiAgLS1pY29uQ29sb3I6IFwiXCI7XG4gIC0taW1hZ2U6IFwiXCI7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIC01MCUpO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHdpZHRoOiBjYWxjKHZhcigtLXdpZHRoKSAqIDFweCk7XG4gIGhlaWdodDogY2FsYyh2YXIoLS1oZWlnaHQpICogMXB4KTtcbiAgbGVmdDogY2FsYyh2YXIoLS1sZWZ0KSAqIDFweCk7XG59XG5cbi5pY29uIHtcbiAgLXdlYmtpdC1tYXNrLXNpemU6IGNvbnRhaW47XG4gIC13ZWJraXQtbWFzay1wb3NpdGlvbjogY2VudGVyO1xuICAtd2Via2l0LW1hc2stcmVwZWF0OiBuby1yZXBlYXQ7XG4gIHdpZHRoOiBjYWxjKDEwMCUgLSBjYWxjKHZhcigtLXBhZGRpbmcpICogMXB4KSk7XG4gIGhlaWdodDogY2FsYygxMDAlIC0gY2FsYyh2YXIoLS1wYWRkaW5nKSAqIDFweCkpO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICBsZWZ0OiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKC01MCUsIC01MCUpIHJvdGF0ZVooY2FsYyh2YXIoLS1yb3RhdGlvbikgKiAxZGVnKSk7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWljb25Db2xvcik7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1hZ2UpO1xufTwvc3R5bGU+XG5cbjxkaXZcbiAgY2xhc3M9XCJkaXNjbG9zdXJlXCJcbiAgdXNlOmNzcz17eyB3aWR0aCwgaGVpZ2h0LCBsZWZ0LCBwYWRkaW5nLCByb3RhdGlvbiwgaWNvbkNvbG9yLCBpbWFnZSB9fVxuICBvbjptb3VzZWRvd258c3RvcFByb3BhZ2F0aW9uPXsoKSA9PiBkaXNwYXRjaCgndG9nZ2xlJyl9XG4gIHJvbGU9XCJidXR0b25cIj5cbiAgPGRpdiBjbGFzcz1cImljb25cIiAvPlxuICB7I2lmIGxhYmVsfVxuICAgIDxkaXYgY2xhc3M9XCJsYWJlbFwiPntsYWJlbH08L2Rpdj5cbiAgey9pZn1cbiAgeyNpZiB0b29sdGlwfVxuICAgIDwhLS0gPGRpdiBjbGFzcz1cInRvb2x0aXBcIj57dG9vbHRpcH08L2Rpdj4gLS0+XG4gIHsvaWZ9XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUE4QkEsV0FBVyxjQUFDLENBQUMsQUFDWCxPQUFPLENBQUUsQ0FBQyxDQUNWLFFBQVEsQ0FBRSxDQUFDLENBQ1gsU0FBUyxDQUFFLENBQUMsQ0FDWixNQUFNLENBQUUsQ0FBQyxDQUNULFVBQVUsQ0FBRSxDQUFDLENBQ2IsV0FBVyxDQUFFLEVBQUUsQ0FDZixPQUFPLENBQUUsRUFBRSxDQUNYLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxHQUFHLENBQ1IsU0FBUyxDQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQzdCLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEtBQUssQ0FBRSxLQUFLLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUMvQixNQUFNLENBQUUsS0FBSyxJQUFJLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDakMsSUFBSSxDQUFFLEtBQUssSUFBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEFBQy9CLENBQUMsQUFFRCxLQUFLLGNBQUMsQ0FBQyxBQUNMLGlCQUFpQixDQUFFLE9BQU8sQ0FDMUIscUJBQXFCLENBQUUsTUFBTSxDQUM3QixtQkFBbUIsQ0FBRSxTQUFTLENBQzlCLEtBQUssQ0FBRSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUM5QyxNQUFNLENBQUUsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDL0MsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLEdBQUcsQ0FDUixJQUFJLENBQUUsR0FBRyxDQUNULFNBQVMsQ0FBRSxVQUFVLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsS0FBSyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUN0RSxnQkFBZ0IsQ0FBRSxJQUFJLFdBQVcsQ0FBQyxDQUNsQyxrQkFBa0IsQ0FBRSxJQUFJLE9BQU8sQ0FBQyxBQUNsQyxDQUFDIn0= */";
	append_dev(document.head, style);
}

// (68:2) {#if label}
function create_if_block_1$1(ctx) {
	let div;
	let t;

	const block = {
		c: function create() {
			div = element("div");
			t = text(/*label*/ ctx[6]);
			attr_dev(div, "class", "label");
			add_location(div, file$a, 68, 4, 1855);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*label*/ 64) set_data_dev(t, /*label*/ ctx[6]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$1.name,
		type: "if",
		source: "(68:2) {#if label}",
		ctx
	});

	return block;
}

// (71:2) {#if tooltip}
function create_if_block$4(ctx) {
	const block = { c: noop, m: noop, d: noop };

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$4.name,
		type: "if",
		source: "(71:2) {#if tooltip}",
		ctx
	});

	return block;
}

function create_fragment$a(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let css_action;
	let mounted;
	let dispose;
	let if_block0 = /*label*/ ctx[6] && create_if_block_1$1(ctx);
	let if_block1 = /*tooltip*/ ctx[7] && create_if_block$4(ctx);

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			attr_dev(div0, "class", "icon svelte-4dnuku");
			add_location(div0, file$a, 66, 2, 1816);
			attr_dev(div1, "class", "disclosure svelte-4dnuku");
			attr_dev(div1, "role", "button");
			add_location(div1, file$a, 61, 0, 1640);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append_dev(div1, t1);
			if (if_block1) if_block1.m(div1, null);

			if (!mounted) {
				dispose = [
					action_destroyer(css_action = css.call(null, div1, {
						width: /*width*/ ctx[0],
						height: /*height*/ ctx[1],
						left: /*left*/ ctx[3],
						padding: /*padding*/ ctx[2],
						rotation: /*rotation*/ ctx[4],
						iconColor: /*iconColor*/ ctx[5],
						image: /*image*/ ctx[8]
					})),
					listen_dev(div1, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[11]), false, false, true)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (/*label*/ ctx[6]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_1$1(ctx);
					if_block0.c();
					if_block0.m(div1, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*tooltip*/ ctx[7]) {
				if (if_block1) ; else {
					if_block1 = create_if_block$4(ctx);
					if_block1.c();
					if_block1.m(div1, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (css_action && is_function(css_action.update) && dirty & /*width, height, left, padding, rotation, iconColor, image*/ 319) css_action.update.call(null, {
				width: /*width*/ ctx[0],
				height: /*height*/ ctx[1],
				left: /*left*/ ctx[3],
				padding: /*padding*/ ctx[2],
				rotation: /*rotation*/ ctx[4],
				iconColor: /*iconColor*/ ctx[5],
				image: /*image*/ ctx[8]
			});
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$a.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$a($$self, $$props, $$invalidate) {
	let $state;
	validate_store(state, "state");
	component_subscribe($$self, state, $$value => $$invalidate(12, $state = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("DisclosureButton", slots, []);
	const dispatch = createEventDispatcher();
	let { width = 34 } = $$props;
	let { height = 28 } = $$props;
	let { padding = 4 } = $$props;
	let { left = 4 } = $$props;
	let { rotation = 0 } = $$props;
	let { iconColor = $state.appearance.os.colors.controlTextColor } = $$props;
	let { iconImage = "img-chevron-right" } = $$props;
	let { label = null } = $$props;
	let { tooltip = null } = $$props;

	const writable_props = [
		"width",
		"height",
		"padding",
		"left",
		"rotation",
		"iconColor",
		"iconImage",
		"label",
		"tooltip"
	];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DisclosureButton> was created with unknown prop '${key}'`);
	});

	const mousedown_handler = () => dispatch("toggle");

	$$self.$$set = $$props => {
		if ("width" in $$props) $$invalidate(0, width = $$props.width);
		if ("height" in $$props) $$invalidate(1, height = $$props.height);
		if ("padding" in $$props) $$invalidate(2, padding = $$props.padding);
		if ("left" in $$props) $$invalidate(3, left = $$props.left);
		if ("rotation" in $$props) $$invalidate(4, rotation = $$props.rotation);
		if ("iconColor" in $$props) $$invalidate(5, iconColor = $$props.iconColor);
		if ("iconImage" in $$props) $$invalidate(10, iconImage = $$props.iconImage);
		if ("label" in $$props) $$invalidate(6, label = $$props.label);
		if ("tooltip" in $$props) $$invalidate(7, tooltip = $$props.tooltip);
	};

	$$self.$capture_state = () => ({
		createEventDispatcher,
		css,
		state,
		dispatch,
		width,
		height,
		padding,
		left,
		rotation,
		iconColor,
		iconImage,
		label,
		tooltip,
		$state,
		image
	});

	$$self.$inject_state = $$props => {
		if ("width" in $$props) $$invalidate(0, width = $$props.width);
		if ("height" in $$props) $$invalidate(1, height = $$props.height);
		if ("padding" in $$props) $$invalidate(2, padding = $$props.padding);
		if ("left" in $$props) $$invalidate(3, left = $$props.left);
		if ("rotation" in $$props) $$invalidate(4, rotation = $$props.rotation);
		if ("iconColor" in $$props) $$invalidate(5, iconColor = $$props.iconColor);
		if ("iconImage" in $$props) $$invalidate(10, iconImage = $$props.iconImage);
		if ("label" in $$props) $$invalidate(6, label = $$props.label);
		if ("tooltip" in $$props) $$invalidate(7, tooltip = $$props.tooltip);
		if ("image" in $$props) $$invalidate(8, image = $$props.image);
	};

	let image;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*iconImage*/ 1024) {
			 $$invalidate(8, image = `var(--${iconImage})`);
		}
	};

	return [
		width,
		height,
		padding,
		left,
		rotation,
		iconColor,
		label,
		tooltip,
		image,
		dispatch,
		iconImage,
		mousedown_handler
	];
}

class DisclosureButton extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-4dnuku-style")) add_css$a();

		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
			width: 0,
			height: 1,
			padding: 2,
			left: 3,
			rotation: 4,
			iconColor: 5,
			iconImage: 10,
			label: 6,
			tooltip: 7
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "DisclosureButton",
			options,
			id: create_fragment$a.name
		});
	}

	get width() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set width(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get height() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set height(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get padding() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set padding(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get left() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set left(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get rotation() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set rotation(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get iconColor() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set iconColor(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get iconImage() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set iconImage(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get tooltip() {
		throw new Error("<DisclosureButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set tooltip(value) {
		throw new Error("<DisclosureButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/list/File.svelte generated by Svelte v3.30.1 */
const file_1 = "src/js/renderer/component/sidebar/list/File.svelte";

function add_css$b() {
	var style = element("style");
	style.id = "svelte-167fim5-style";
	style.textContent = ".file.svelte-167fim5.svelte-167fim5{--leftOffset:0;contain:strict;user-select:none;border-radius:4px;margin-bottom:1px;width:100%;height:28px}.file.svelte-167fim5 .icon.svelte-167fim5{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlAccentColor);left:calc(calc(var(--leftOffset) * 1px) + 20px);width:14px;height:14px}.file.svelte-167fim5 .label.svelte-167fim5{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;position:absolute;top:50%;transform:translate(0, -50%);color:var(--labelColor);left:calc(calc(var(--leftOffset) * 1px) + 42px);white-space:nowrap}.file.svelte-167fim5 .counter.svelte-167fim5{position:absolute;top:50%;transform:translate(0, -50%);font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--tertiaryLabelColor);position:absolute;right:7px}.folder.svelte-167fim5 .icon.svelte-167fim5{-webkit-mask-image:var(--img-folder)}.doc.svelte-167fim5 .icon.svelte-167fim5{-webkit-mask-image:var(--img-doc-text)}.img.svelte-167fim5 .icon.svelte-167fim5{-webkit-mask-image:var(--img-photo)}.av.svelte-167fim5 .icon.svelte-167fim5{-webkit-mask-image:var(--img-play-rectangle)}.isSelected.svelte-167fim5 .icon.svelte-167fim5{background-color:var(--selectedMenuItemTextColor)}.isSelected.svelte-167fim5 .label.svelte-167fim5{color:var(--selectedMenuItemTextColor)}.isSelected.svelte-167fim5 .counter.svelte-167fim5{color:var(--controlColor)}.isSelected.isSidebarFocused.svelte-167fim5.svelte-167fim5{background-color:var(--selectedContentBackgroundColor)}.isSelected.svelte-167fim5.svelte-167fim5:not(.isSidebarFocused){background-color:var(--disabledControlTextColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRmlsZS5zdmVsdGUiLCJzb3VyY2VzIjpbIkZpbGUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNyZWF0ZUV2ZW50RGlzcGF0Y2hlciwgYWZ0ZXJVcGRhdGUgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCB7IHN0YXRlLCBwcm9qZWN0LCBmaWxlcywgc2lkZWJhciB9IGZyb20gJy4uLy4uLy4uL1N0YXRlTWFuYWdlcidcbiAgaW1wb3J0IHsgY3NzIH0gZnJvbSAnLi4vLi4vdWkvYWN0aW9ucydcbiAgaW1wb3J0IHtvbk1vdXNlZG93biwgdG9nZ2xlRXhwYW5kZWR9IGZyb20gJy4vaW50ZXJhY3Rpb25zJ1xuICBpbXBvcnQgRGlzY2xvc3VyZUJ1dHRvbiBmcm9tICcuLi8uLi91aS9EaXNjbG9zdXJlQnV0dG9uLnN2ZWx0ZSdcbiAgaW1wb3J0IHsgZ2V0Q29udGV4dCB9IGZyb20gJ3N2ZWx0ZSc7XG5cbiAgZXhwb3J0IGxldCBpZCA9ICcnXG5cdGV4cG9ydCBsZXQgbGlzdElkcyA9IFtdXG4gIGV4cG9ydCBsZXQgbmVzdERlcHRoID0gMCAgXG4gIFxuXHRjb25zdCB0YWJJZCA9IGdldENvbnRleHQoJ3RhYklkJylcblx0JDogdGFiID0gJHNpZGViYXIudGFic0J5SWRbdGFiSWRdXG4gICQ6IGZpbGUgPSAkZmlsZXMuYnlJZFtpZF1cbiAgJDogaXNFeHBhbmRhYmxlID0gZmlsZS50eXBlID09ICdmb2xkZXInICYmIGZpbGUubnVtQ2hpbGRyZW5cbiAgJDogaXNFeHBhbmRlZCA9ICRzaWRlYmFyLnRhYnNCeUlkLnByb2plY3QuZXhwYW5kZWQuc29tZSgoaWQpID0+IGlkID09IGZpbGUuaWQpXG4gICQ6IGlzU2VsZWN0ZWQgPSAkc2lkZWJhci50YWJzQnlJZC5wcm9qZWN0LnNlbGVjdGVkLnNvbWUoKGlkKSA9PiBpZCA9PSBmaWxlLmlkKVxuICAkOiBsZWZ0T2Zmc2V0ID0gbmVzdERlcHRoICogMTVcbiAgJDogaXNTaWRlYmFyRm9jdXNlZCA9ICRwcm9qZWN0LmZvY3VzZWRMYXlvdXRTZWN0aW9uID09ICdzaWRlYmFyJ1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4uZmlsZSB7XG4gIC0tbGVmdE9mZnNldDogMDtcbiAgY29udGFpbjogc3RyaWN0O1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBtYXJnaW4tYm90dG9tOiAxcHg7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDI4cHg7XG59XG4uZmlsZSAuaWNvbiB7XG4gIC13ZWJraXQtbWFzay1zaXplOiBjb250YWluO1xuICAtd2Via2l0LW1hc2stcG9zaXRpb246IGNlbnRlcjtcbiAgLXdlYmtpdC1tYXNrLXJlcGVhdDogbm8tcmVwZWF0O1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtNTAlKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tY29udHJvbEFjY2VudENvbG9yKTtcbiAgbGVmdDogY2FsYyhjYWxjKHZhcigtLWxlZnRPZmZzZXQpICogMXB4KSArIDIwcHgpO1xuICB3aWR0aDogMTRweDtcbiAgaGVpZ2h0OiAxNHB4O1xufVxuLmZpbGUgLmxhYmVsIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgdG9wOiA1MCU7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIC01MCUpO1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIGxlZnQ6IGNhbGMoY2FsYyh2YXIoLS1sZWZ0T2Zmc2V0KSAqIDFweCkgKyA0MnB4KTtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbn1cbi5maWxlIC5jb3VudGVyIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTUwJSk7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tdGVydGlhcnlMYWJlbENvbG9yKTtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICByaWdodDogN3B4O1xufVxuXG4uZm9sZGVyIC5pY29uIHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctZm9sZGVyKTtcbn1cblxuLmRvYyAuaWNvbiB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWRvYy10ZXh0KTtcbn1cblxuLmltZyAuaWNvbiB7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLXBob3RvKTtcbn1cblxuLmF2IC5pY29uIHtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctcGxheS1yZWN0YW5nbGUpO1xufVxuXG4uaXNTZWxlY3RlZCAuZGlzY2xvc3VyZSBbcm9sZT1idXR0b25dLFxuLmlzU2VsZWN0ZWQgLmljb24ge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zZWxlY3RlZE1lbnVJdGVtVGV4dENvbG9yKTtcbn1cbi5pc1NlbGVjdGVkIC5sYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1zZWxlY3RlZE1lbnVJdGVtVGV4dENvbG9yKTtcbn1cbi5pc1NlbGVjdGVkIC5jb3VudGVyIHtcbiAgY29sb3I6IHZhcigtLWNvbnRyb2xDb2xvcik7XG59XG4uaXNTZWxlY3RlZC5pc1NpZGViYXJGb2N1c2VkIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tc2VsZWN0ZWRDb250ZW50QmFja2dyb3VuZENvbG9yKTtcbn1cbi5pc1NlbGVjdGVkOm5vdCguaXNTaWRlYmFyRm9jdXNlZCkge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1kaXNhYmxlZENvbnRyb2xUZXh0Q29sb3IpO1xufTwvc3R5bGU+XG5cbjxzdmVsdGU6b3B0aW9ucyBpbW11dGFibGU9e3RydWV9IC8+XG5cbjwhLS0gdXNlOmxpc3RJdGVtPXt7aWQsIHRhYklkLCB0YWIsIGxpc3RJZHMsIGlzU2VsZWN0ZWR9fSAtLT5cbjxkaXZcbiAgdXNlOmNzcz17eyBsZWZ0T2Zmc2V0IH19XG4gIGNsYXNzPVwiZmlsZSB7ZmlsZS50eXBlfVwiXG4gIGNsYXNzOmlzU2lkZWJhckZvY3VzZWRcbiAgY2xhc3M6aXNTZWxlY3RlZFxuICBjbGFzczppc0V4cGFuZGVkXG4gIG9uOm1vdXNlZG93bj17KGV2dCkgPT4gb25Nb3VzZWRvd24oZXZ0LCBpZCwgaXNTZWxlY3RlZCwgdGFiLCB0YWJJZCwgbGlzdElkcyl9XG4gID5cbiAgICBcbiAgeyNpZiBpc0V4cGFuZGFibGV9XG4gICAgPERpc2Nsb3N1cmVCdXR0b25cbiAgICAgIHdpZHRoPXsxNH1cbiAgICAgIGhlaWdodD17MTR9XG4gICAgICBwYWRkaW5nPXs2fVxuICAgICAgbGVmdD17bGVmdE9mZnNldCArIDN9XG4gICAgICByb3RhdGlvbj17aXNFeHBhbmRlZCA/IDkwIDogMH1cbiAgICAgIHRvb2x0aXA9eydUb2dnbGUgRXhwYW5kZWQnfVxuICAgICAgaWNvbkNvbG9yPXtpc1NlbGVjdGVkID8gJ3doaXRlJyA6ICRzdGF0ZS5hcHBlYXJhbmNlLm9zLmNvbG9ycy5jb250cm9sVGV4dENvbG9yfVxuICAgICAgb246dG9nZ2xlPXsoKSA9PiB0b2dnbGVFeHBhbmRlZChpZCwgaXNFeHBhbmRlZCwgdGFiLCB0YWJJZCl9IC8+XG5cbiAgey9pZn1cbiAgPGRpdiBjbGFzcz1cImljb25cIiAvPlxuICA8ZGl2IGNsYXNzPVwibGFiZWxcIj57ZmlsZS50aXRsZSA/IGZpbGUudGl0bGUgOiBmaWxlLm5hbWV9PC9kaXY+XG4gIHsjaWYgaXNFeHBhbmRhYmxlfVxuICAgIDxkaXYgY2xhc3M9XCJjb3VudGVyXCI+e2ZpbGUubnVtRGVzY2VuZGFudHN9PC9kaXY+XG4gIHsvaWZ9XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBK0JBLEtBQUssOEJBQUMsQ0FBQyxBQUNMLFlBQVksQ0FBRSxDQUFDLENBQ2YsT0FBTyxDQUFFLE1BQU0sQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixhQUFhLENBQUUsR0FBRyxDQUNsQixhQUFhLENBQUUsR0FBRyxDQUNsQixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLEFBQ2QsQ0FBQyxBQUNELG9CQUFLLENBQUMsS0FBSyxlQUFDLENBQUMsQUFDWCxpQkFBaUIsQ0FBRSxPQUFPLENBQzFCLHFCQUFxQixDQUFFLE1BQU0sQ0FDN0IsbUJBQW1CLENBQUUsU0FBUyxDQUM5QixRQUFRLENBQUUsUUFBUSxDQUNsQixHQUFHLENBQUUsR0FBRyxDQUNSLFNBQVMsQ0FBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUM3QixnQkFBZ0IsQ0FBRSxJQUFJLG9CQUFvQixDQUFDLENBQzNDLElBQUksQ0FBRSxLQUFLLEtBQUssSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNoRCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLEFBQ2QsQ0FBQyxBQUNELG9CQUFLLENBQUMsTUFBTSxlQUFDLENBQUMsQUFDWixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLEdBQUcsQ0FDUixTQUFTLENBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDN0IsS0FBSyxDQUFFLElBQUksWUFBWSxDQUFDLENBQ3hCLElBQUksQ0FBRSxLQUFLLEtBQUssSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUNoRCxXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBQ0Qsb0JBQUssQ0FBQyxRQUFRLGVBQUMsQ0FBQyxBQUNkLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxHQUFHLENBQ1IsU0FBUyxDQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQzdCLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxDQUN2QixLQUFLLENBQUUsSUFBSSxvQkFBb0IsQ0FBQyxDQUNoQyxRQUFRLENBQUUsUUFBUSxDQUNsQixLQUFLLENBQUUsR0FBRyxBQUNaLENBQUMsQUFFRCxzQkFBTyxDQUFDLEtBQUssZUFBQyxDQUFDLEFBQ2Isa0JBQWtCLENBQUUsSUFBSSxZQUFZLENBQUMsQUFDdkMsQ0FBQyxBQUVELG1CQUFJLENBQUMsS0FBSyxlQUFDLENBQUMsQUFDVixrQkFBa0IsQ0FBRSxJQUFJLGNBQWMsQ0FBQyxBQUN6QyxDQUFDLEFBRUQsbUJBQUksQ0FBQyxLQUFLLGVBQUMsQ0FBQyxBQUNWLGtCQUFrQixDQUFFLElBQUksV0FBVyxDQUFDLEFBQ3RDLENBQUMsQUFFRCxrQkFBRyxDQUFDLEtBQUssZUFBQyxDQUFDLEFBQ1Qsa0JBQWtCLENBQUUsSUFBSSxvQkFBb0IsQ0FBQyxBQUMvQyxDQUFDLEFBR0QsMEJBQVcsQ0FBQyxLQUFLLGVBQUMsQ0FBQyxBQUNqQixnQkFBZ0IsQ0FBRSxJQUFJLDJCQUEyQixDQUFDLEFBQ3BELENBQUMsQUFDRCwwQkFBVyxDQUFDLE1BQU0sZUFBQyxDQUFDLEFBQ2xCLEtBQUssQ0FBRSxJQUFJLDJCQUEyQixDQUFDLEFBQ3pDLENBQUMsQUFDRCwwQkFBVyxDQUFDLFFBQVEsZUFBQyxDQUFDLEFBQ3BCLEtBQUssQ0FBRSxJQUFJLGNBQWMsQ0FBQyxBQUM1QixDQUFDLEFBQ0QsV0FBVyxpQkFBaUIsOEJBQUMsQ0FBQyxBQUM1QixnQkFBZ0IsQ0FBRSxJQUFJLGdDQUFnQyxDQUFDLEFBQ3pELENBQUMsQUFDRCx5Q0FBVyxLQUFLLGlCQUFpQixDQUFDLEFBQUMsQ0FBQyxBQUNsQyxnQkFBZ0IsQ0FBRSxJQUFJLDBCQUEwQixDQUFDLEFBQ25ELENBQUMifQ== */";
	append_dev(document.head, style);
}

// (125:2) {#if isExpandable}
function create_if_block_1$2(ctx) {
	let disclosurebutton;
	let current;

	disclosurebutton = new DisclosureButton({
			props: {
				width: 14,
				height: 14,
				padding: 6,
				left: /*leftOffset*/ ctx[7] + 3,
				rotation: /*isExpanded*/ ctx[5] ? 90 : 0,
				tooltip: "Toggle Expanded",
				iconColor: /*isSelected*/ ctx[6]
				? "white"
				: /*$state*/ ctx[9].appearance.os.colors.controlTextColor
			},
			$$inline: true
		});

	disclosurebutton.$on("toggle", /*toggle_handler*/ ctx[15]);

	const block = {
		c: function create() {
			create_component(disclosurebutton.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(disclosurebutton, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const disclosurebutton_changes = {};
			if (dirty & /*leftOffset*/ 128) disclosurebutton_changes.left = /*leftOffset*/ ctx[7] + 3;
			if (dirty & /*isExpanded*/ 32) disclosurebutton_changes.rotation = /*isExpanded*/ ctx[5] ? 90 : 0;

			if (dirty & /*isSelected, $state*/ 576) disclosurebutton_changes.iconColor = /*isSelected*/ ctx[6]
			? "white"
			: /*$state*/ ctx[9].appearance.os.colors.controlTextColor;

			disclosurebutton.$set(disclosurebutton_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(disclosurebutton.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(disclosurebutton.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(disclosurebutton, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$2.name,
		type: "if",
		source: "(125:2) {#if isExpandable}",
		ctx
	});

	return block;
}

// (139:2) {#if isExpandable}
function create_if_block$5(ctx) {
	let div;
	let t_value = /*file*/ ctx[2].numDescendants + "";
	let t;

	const block = {
		c: function create() {
			div = element("div");
			t = text(t_value);
			attr_dev(div, "class", "counter svelte-167fim5");
			add_location(div, file_1, 139, 4, 3711);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*file*/ 4 && t_value !== (t_value = /*file*/ ctx[2].numDescendants + "")) set_data_dev(t, t_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$5.name,
		type: "if",
		source: "(139:2) {#if isExpandable}",
		ctx
	});

	return block;
}

function create_fragment$b(ctx) {
	let div2;
	let t0;
	let div0;
	let t1;
	let div1;

	let t2_value = (/*file*/ ctx[2].title
	? /*file*/ ctx[2].title
	: /*file*/ ctx[2].name) + "";

	let t2;
	let t3;
	let div2_class_value;
	let css_action;
	let current;
	let mounted;
	let dispose;
	let if_block0 = /*isExpandable*/ ctx[4] && create_if_block_1$2(ctx);
	let if_block1 = /*isExpandable*/ ctx[4] && create_if_block$5(ctx);

	const block = {
		c: function create() {
			div2 = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			div0 = element("div");
			t1 = space();
			div1 = element("div");
			t2 = text(t2_value);
			t3 = space();
			if (if_block1) if_block1.c();
			attr_dev(div0, "class", "icon svelte-167fim5");
			add_location(div0, file_1, 136, 2, 3600);
			attr_dev(div1, "class", "label svelte-167fim5");
			add_location(div1, file_1, 137, 2, 3623);
			attr_dev(div2, "class", div2_class_value = "file " + /*file*/ ctx[2].type + " svelte-167fim5");
			toggle_class(div2, "isSidebarFocused", /*isSidebarFocused*/ ctx[8]);
			toggle_class(div2, "isSelected", /*isSelected*/ ctx[6]);
			toggle_class(div2, "isExpanded", /*isExpanded*/ ctx[5]);
			add_location(div2, file_1, 115, 0, 3027);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			if (if_block0) if_block0.m(div2, null);
			append_dev(div2, t0);
			append_dev(div2, div0);
			append_dev(div2, t1);
			append_dev(div2, div1);
			append_dev(div1, t2);
			append_dev(div2, t3);
			if (if_block1) if_block1.m(div2, null);
			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(css_action = css.call(null, div2, { leftOffset: /*leftOffset*/ ctx[7] })),
					listen_dev(div2, "mousedown", /*mousedown_handler*/ ctx[16], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (/*isExpandable*/ ctx[4]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*isExpandable*/ 16) {
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

			if ((!current || dirty & /*file*/ 4) && t2_value !== (t2_value = (/*file*/ ctx[2].title
			? /*file*/ ctx[2].title
			: /*file*/ ctx[2].name) + "")) set_data_dev(t2, t2_value);

			if (/*isExpandable*/ ctx[4]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block$5(ctx);
					if_block1.c();
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!current || dirty & /*file*/ 4 && div2_class_value !== (div2_class_value = "file " + /*file*/ ctx[2].type + " svelte-167fim5")) {
				attr_dev(div2, "class", div2_class_value);
			}

			if (css_action && is_function(css_action.update) && dirty & /*leftOffset*/ 128) css_action.update.call(null, { leftOffset: /*leftOffset*/ ctx[7] });

			if (dirty & /*file, isSidebarFocused*/ 260) {
				toggle_class(div2, "isSidebarFocused", /*isSidebarFocused*/ ctx[8]);
			}

			if (dirty & /*file, isSelected*/ 68) {
				toggle_class(div2, "isSelected", /*isSelected*/ ctx[6]);
			}

			if (dirty & /*file, isExpanded*/ 36) {
				toggle_class(div2, "isExpanded", /*isExpanded*/ ctx[5]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block0);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block0);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$b.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$b($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	let $project;
	let $state;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(12, $sidebar = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(13, $files = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(14, $project = $$value));
	validate_store(state, "state");
	component_subscribe($$self, state, $$value => $$invalidate(9, $state = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("File", slots, []);
	let { id = "" } = $$props;
	let { listIds = [] } = $$props;
	let { nestDepth = 0 } = $$props;
	const tabId = getContext("tabId");
	const writable_props = ["id", "listIds", "nestDepth"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<File> was created with unknown prop '${key}'`);
	});

	const toggle_handler = () => toggleExpanded(id, isExpanded, tab, tabId);
	const mousedown_handler = evt => onMousedown(evt, id, isSelected, tab, tabId, listIds);

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("nestDepth" in $$props) $$invalidate(11, nestDepth = $$props.nestDepth);
	};

	$$self.$capture_state = () => ({
		createEventDispatcher,
		afterUpdate,
		state,
		project,
		files,
		sidebar,
		css,
		onMousedown,
		toggleExpanded,
		DisclosureButton,
		getContext,
		id,
		listIds,
		nestDepth,
		tabId,
		tab,
		$sidebar,
		file,
		$files,
		isExpandable,
		isExpanded,
		isSelected,
		leftOffset,
		isSidebarFocused,
		$project,
		$state
	});

	$$self.$inject_state = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("nestDepth" in $$props) $$invalidate(11, nestDepth = $$props.nestDepth);
		if ("tab" in $$props) $$invalidate(3, tab = $$props.tab);
		if ("file" in $$props) $$invalidate(2, file = $$props.file);
		if ("isExpandable" in $$props) $$invalidate(4, isExpandable = $$props.isExpandable);
		if ("isExpanded" in $$props) $$invalidate(5, isExpanded = $$props.isExpanded);
		if ("isSelected" in $$props) $$invalidate(6, isSelected = $$props.isSelected);
		if ("leftOffset" in $$props) $$invalidate(7, leftOffset = $$props.leftOffset);
		if ("isSidebarFocused" in $$props) $$invalidate(8, isSidebarFocused = $$props.isSidebarFocused);
	};

	let tab;
	let file;
	let isExpandable;
	let isExpanded;
	let isSelected;
	let leftOffset;
	let isSidebarFocused;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 4096) {
			 $$invalidate(3, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$files, id*/ 8193) {
			 $$invalidate(2, file = $files.byId[id]);
		}

		if ($$self.$$.dirty & /*file*/ 4) {
			 $$invalidate(4, isExpandable = file.type == "folder" && file.numChildren);
		}

		if ($$self.$$.dirty & /*$sidebar, file*/ 4100) {
			 $$invalidate(5, isExpanded = $sidebar.tabsById.project.expanded.some(id => id == file.id));
		}

		if ($$self.$$.dirty & /*$sidebar, file*/ 4100) {
			 $$invalidate(6, isSelected = $sidebar.tabsById.project.selected.some(id => id == file.id));
		}

		if ($$self.$$.dirty & /*nestDepth*/ 2048) {
			 $$invalidate(7, leftOffset = nestDepth * 15);
		}

		if ($$self.$$.dirty & /*$project*/ 16384) {
			 $$invalidate(8, isSidebarFocused = $project.focusedLayoutSection == "sidebar");
		}
	};

	return [
		id,
		listIds,
		file,
		tab,
		isExpandable,
		isExpanded,
		isSelected,
		leftOffset,
		isSidebarFocused,
		$state,
		tabId,
		nestDepth,
		$sidebar,
		$files,
		$project,
		toggle_handler,
		mousedown_handler
	];
}

class File extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-167fim5-style")) add_css$b();
		init(this, options, instance$b, create_fragment$b, not_equal, { id: 0, listIds: 1, nestDepth: 11 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "File",
			options,
			id: create_fragment$b.name
		});
	}

	get id() {
		throw new Error("<File>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<File>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get listIds() {
		throw new Error("<File>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listIds(value) {
		throw new Error("<File>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get nestDepth() {
		throw new Error("<File>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set nestDepth(value) {
		throw new Error("<File>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function cubicOut(t) {
    const f = t - 1.0;
    return f * f * f + 1.0;
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

/**
 * Set parent to overflow:hidden to make it look like the sliding element is being masked.
 * @param {*} node 
 * @param {*} param1 
 */
function slideUp(node, { duration = 100, easing = standardEase }) {
  return {
    duration: duration,
    easing,
    css: (t, u) => `transform: translate(0, ${u * -100}%)`,
  }
}

/* src/js/renderer/component/sidebar/list/Folder.svelte generated by Svelte v3.30.1 */
const file$b = "src/js/renderer/component/sidebar/list/Folder.svelte";

function add_css$c() {
	var style = element("style");
	style.id = "svelte-1jae9wm-style";
	style.textContent = ".folder.svelte-1jae9wm{position:absolute;width:100%;overflow:hidden;height:calc(var(--folderHeight) * 1px);transition:height calc(var(--duration) * 1ms) var(--folderEasing)}.folder.isRoot.svelte-1jae9wm{position:relative}.folder.svelte-1jae9wm,ul.svelte-1jae9wm{transform-origin:left top;will-change:transform}ul.svelte-1jae9wm,li.svelte-1jae9wm{margin:0;padding:0;text-indent:0;list-style-type:none}li.svelte-1jae9wm{position:relative;display:block}li.empty.svelte-1jae9wm{height:28px;pointer-events:none;visibility:hidden;margin-bottom:1px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRm9sZGVyLnN2ZWx0ZSIsInNvdXJjZXMiOlsiRm9sZGVyLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuXHRpbXBvcnQgRmlsZSBmcm9tICcuL0ZpbGUuc3ZlbHRlJ1xuXHRpbXBvcnQgeyBzdGF0ZSwgZmlsZXMsIHNpZGViYXIgfSBmcm9tICcuLi8uLi8uLi9TdGF0ZU1hbmFnZXIuanMnXG5cdGltcG9ydCB7IGZsaXAgfSBmcm9tICdzdmVsdGUvYW5pbWF0ZSc7XG5cdGltcG9ydCB7IGNzcyB9IGZyb20gJy4uLy4uL3VpL2FjdGlvbnMnXG5cdGltcG9ydCB7IHN0YW5kYXJkRWFzZSB9IGZyb20gJy4uLy4uL3VpL2Vhc2luZydcblx0aW1wb3J0IHsgc2xpZGVVcCB9IGZyb20gJy4uLy4uL3VpL3RyYW5zaXRpb24nXG4gIGltcG9ydCB7IGdldENvbnRleHQgfSBmcm9tICdzdmVsdGUnO1xuXG5cdGV4cG9ydCBsZXQgc3VidHJlZVx0XG5cdGV4cG9ydCBsZXQgbGlzdElkc1xuXHRleHBvcnQgbGV0IGlzUm9vdCA9IHRydWVcblx0ZXhwb3J0IGxldCBuZXN0RGVwdGggPSAwXG5cdFxuXHRjb25zdCB0YWJJZCA9IGdldENvbnRleHQoJ3RhYklkJylcblx0JDogZHVyYXRpb24gPSAkc3RhdGUudGltaW5nLnRyZWVMaXN0Rm9sZGVyXG5cdFxuXHQvLyBXaGVuIHRoZSBudW1iZXIgb2YgY2hpbGRyZW4gY2hhbmdlcywgdGhlIGhlaWdodCBjaGFuZ2VzLiBUaGlzIGhhcHBlbnMgaW5zdGFudGx5LCBhbmQgY2FuIGNsaXAgdGhlIGNoaWxkIGVsZW1lbnRzIGFzIHRoZXkgYW5pbWF0ZSB0byB0aGVpciBuZXcgcG9zaXRpb25zLiBXZSB3YW50IHRvIGF2b2lkIHRoYXQuIFdlIGNvdWxkIGFuaW1hdGUgdGhlIGhlaWdodCBhdCB0aGUgc2FtZSBkdXJhdGlvbiBhbmQgZWFzaW5nIGFzIHRoZSBvdGhlciB0cmFuc2l0aW9ucywgYnV0IHRoYXQncyBhIGJpZyBwZXJmb3JtYW5jZSBuby1uby4gU28gaW5zdGVhZCB3ZSB1c2UgYHN0ZXBgIHRyYW5zaXRpb25zIHRvIHdhaXQgdW50aWwgdGhlIHN0YW5kYXJkIHRyYW5zaXRpb24gZHVyYXRpb24gaXMgY29tcGxldGUsIGFuZCB0aGVuIHNldCB0aGUgbmV3IHZhbHVlLiBPUiB3ZSBzZXQgaXQgYXQgdGhlIGJlZ2lubmluZy4gSXQgZGVwZW5kcyBvbiB3aGV0aGVyIHRoZSBmb2xkZXIgaGFzIGdyb3duIG9yIHNocnVuay4gV2UgZGV0ZXJtaW5lIC10aGF0LSBieSBjb21wYXJpbmcgdGhlIG5ldyBhbmQgb2xkIGBudW1WaXNpYmxlRGVzY2VuZGFudHNgLlxuXG5cdGxldCBvbGROdW1WaXNpYmxlRGVzY2VuZGFudHMgPSAwXG5cdGxldCBmb2xkZXJIZWlnaHQgPSAwXG5cdGxldCBmb2xkZXJFYXNpbmcgPSAwXG5cdFxuXHQkOiB7XG5cdFx0aWYgKHN1YnRyZWUubnVtVmlzaWJsZURlc2NlbmRhbnRzICE9PSBvbGROdW1WaXNpYmxlRGVzY2VuZGFudHMpIHtcblx0XHRcdGNvbnN0IGhhc0dyb3duID0gc3VidHJlZS5udW1WaXNpYmxlRGVzY2VuZGFudHMgPiBvbGROdW1WaXNpYmxlRGVzY2VuZGFudHNcblx0XHRcdGZvbGRlckVhc2luZyA9IGhhc0dyb3duID8gJ3N0ZXAtc3RhcnQnIDogJ3N0ZXAtZW5kJ1xuXHRcdFx0Zm9sZGVySGVpZ2h0ID0gc3VidHJlZS5udW1WaXNpYmxlRGVzY2VuZGFudHMgKiAyOVxuXHRcdFx0b2xkTnVtVmlzaWJsZURlc2NlbmRhbnRzID0gc3VidHJlZS5udW1WaXNpYmxlRGVzY2VuZGFudHNcblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBpc0V4cGFuZGVkRm9sZGVyKGlkKSB7XG5cdFx0Y29uc3QgZmlsZSA9ICRmaWxlcy5ieUlkW2lkXVxuXHRcdGNvbnN0IGlzRm9sZGVyID0gZmlsZS50eXBlID09ICdmb2xkZXInXG4gIFx0Y29uc3QgaXNFeHBhbmRhYmxlID0gaXNGb2xkZXIgJiYgZmlsZS5udW1DaGlsZHJlblxuXHRcdGNvbnN0IGlzRXhwYW5kZWQgPSBpc0V4cGFuZGFibGUgJiYgJHNpZGViYXIudGFic0J5SWQucHJvamVjdC5leHBhbmRlZC5zb21lKChpZCkgPT4gaWQgPT0gZmlsZS5pZClcblx0XHRyZXR1cm4gaXNFeHBhbmRlZFxuXHR9XG5cdFxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLmZvbGRlciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgd2lkdGg6IDEwMCU7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIGhlaWdodDogY2FsYyh2YXIoLS1mb2xkZXJIZWlnaHQpICogMXB4KTtcbiAgdHJhbnNpdGlvbjogaGVpZ2h0IGNhbGModmFyKC0tZHVyYXRpb24pICogMW1zKSB2YXIoLS1mb2xkZXJFYXNpbmcpO1xufVxuLmZvbGRlci5pc1Jvb3Qge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59XG5cbi5mb2xkZXIsXG51bCB7XG4gIHRyYW5zZm9ybS1vcmlnaW46IGxlZnQgdG9wO1xuICB3aWxsLWNoYW5nZTogdHJhbnNmb3JtO1xufVxuXG51bCxcbmxpIHtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwO1xuICB0ZXh0LWluZGVudDogMDtcbiAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xufVxuXG5saSB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgZGlzcGxheTogYmxvY2s7XG59XG5saS5lbXB0eSB7XG4gIGhlaWdodDogMjhweDtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIHZpc2liaWxpdHk6IGhpZGRlbjtcbiAgbWFyZ2luLWJvdHRvbTogMXB4O1xufTwvc3R5bGU+XG5cbjwhLS0gPHN2ZWx0ZTpvcHRpb25zIGltbXV0YWJsZT17ZmFsc2V9IC8+IC0tPlxuXG48ZGl2IFxuXHRjbGFzcz1cImZvbGRlclwiIFxuXHR1c2U6Y3NzPXt7Zm9sZGVySGVpZ2h0LCBmb2xkZXJFYXNpbmcsIGR1cmF0aW9ufX1cblx0Y2xhc3M6aXNSb290IFxuXHQ+XG5cdDx1bCBjbGFzcz1cInJvd3NcIiB0cmFuc2l0aW9uOnNsaWRlVXB8bG9jYWw9e3sgZHVyYXRpb246IGlzUm9vdCA/IDAgOiBkdXJhdGlvbiB9fT5cblx0XHR7I2VhY2ggc3VidHJlZS5jaGlsZHJlbiBhcyBjaGlsZCAoY2hpbGQuaWQpfVxuXHRcdFx0PGxpIGFuaW1hdGU6ZmxpcD17e2R1cmF0aW9uOiBkdXJhdGlvbiwgZWFzaW5nOiBzdGFuZGFyZEVhc2UgfX0gY2xhc3M6ZW1wdHk9e2NoaWxkLmlkLmluY2x1ZGVzKCdlbXB0eScpfT5cblx0XHRcdFx0eyNpZiAhY2hpbGQuaWQuaW5jbHVkZXMoJ2VtcHR5Jyl9XG5cdFx0XHRcdFxuXHRcdFx0XHRcdDwhLS0gRmlsZSAtLT5cblx0XHRcdFx0XHQ8RmlsZSBpZD17Y2hpbGQuaWR9IHt0YWJJZH0ge2xpc3RJZHN9IG5lc3REZXB0aD17bmVzdERlcHRofSAvPlxuXHRcdFx0XHRcdFxuXHRcdFx0XHRcdDwhLS0gRm9sZGVyIC0tPlxuXHRcdFx0XHRcdHsjaWYgaXNFeHBhbmRlZEZvbGRlcihjaGlsZC5pZCl9XG5cdFx0XHRcdFx0XHQ8c3ZlbHRlOnNlbGZcblx0XHRcdFx0XHRcdHN1YnRyZWU9e2NoaWxkfVxuXHRcdFx0XHRcdFx0e2xpc3RJZHN9XG5cdFx0XHRcdFx0XHRpc1Jvb3Q9e2ZhbHNlfVxuXHRcdFx0XHRcdFx0bmVzdERlcHRoPXtuZXN0RGVwdGgrMX1cblx0XHRcdFx0XHRcdC8+XG5cdFx0XHRcdFx0ey9pZn1cblx0XHRcdFx0ey9pZn1cblx0XHRcdDwvbGk+XG5cdFx0ey9lYWNofVxuXHQ8L3VsPlxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBOENBLE9BQU8sZUFBQyxDQUFDLEFBQ1AsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsS0FBSyxDQUFFLElBQUksQ0FDWCxRQUFRLENBQUUsTUFBTSxDQUNoQixNQUFNLENBQUUsS0FBSyxJQUFJLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDdkMsVUFBVSxDQUFFLE1BQU0sQ0FBQyxLQUFLLElBQUksVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksY0FBYyxDQUFDLEFBQ3BFLENBQUMsQUFDRCxPQUFPLE9BQU8sZUFBQyxDQUFDLEFBQ2QsUUFBUSxDQUFFLFFBQVEsQUFDcEIsQ0FBQyxBQUVELHNCQUFPLENBQ1AsRUFBRSxlQUFDLENBQUMsQUFDRixnQkFBZ0IsQ0FBRSxJQUFJLENBQUMsR0FBRyxDQUMxQixXQUFXLENBQUUsU0FBUyxBQUN4QixDQUFDLEFBRUQsaUJBQUUsQ0FDRixFQUFFLGVBQUMsQ0FBQyxBQUNGLE1BQU0sQ0FBRSxDQUFDLENBQ1QsT0FBTyxDQUFFLENBQUMsQ0FDVixXQUFXLENBQUUsQ0FBQyxDQUNkLGVBQWUsQ0FBRSxJQUFJLEFBQ3ZCLENBQUMsQUFFRCxFQUFFLGVBQUMsQ0FBQyxBQUNGLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLE9BQU8sQ0FBRSxLQUFLLEFBQ2hCLENBQUMsQUFDRCxFQUFFLE1BQU0sZUFBQyxDQUFDLEFBQ1IsTUFBTSxDQUFFLElBQUksQ0FDWixjQUFjLENBQUUsSUFBSSxDQUNwQixVQUFVLENBQUUsTUFBTSxDQUNsQixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDIn0= */";
	append_dev(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[13] = list[i];
	return child_ctx;
}

// (93:4) {#if !child.id.includes('empty')}
function create_if_block$6(ctx) {
	let file_1;
	let t;
	let show_if = /*isExpandedFolder*/ ctx[8](/*child*/ ctx[13].id);
	let if_block_anchor;
	let current;

	file_1 = new File({
			props: {
				id: /*child*/ ctx[13].id,
				tabId: /*tabId*/ ctx[7],
				listIds: /*listIds*/ ctx[1],
				nestDepth: /*nestDepth*/ ctx[3]
			},
			$$inline: true
		});

	let if_block = show_if && create_if_block_1$3(ctx);

	const block = {
		c: function create() {
			create_component(file_1.$$.fragment);
			t = space();
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			mount_component(file_1, target, anchor);
			insert_dev(target, t, anchor);
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const file_1_changes = {};
			if (dirty & /*subtree*/ 1) file_1_changes.id = /*child*/ ctx[13].id;
			if (dirty & /*listIds*/ 2) file_1_changes.listIds = /*listIds*/ ctx[1];
			if (dirty & /*nestDepth*/ 8) file_1_changes.nestDepth = /*nestDepth*/ ctx[3];
			file_1.$set(file_1_changes);
			if (dirty & /*subtree*/ 1) show_if = /*isExpandedFolder*/ ctx[8](/*child*/ ctx[13].id);

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*subtree*/ 1) {
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
		i: function intro(local) {
			if (current) return;
			transition_in(file_1.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(file_1.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(file_1, detaching);
			if (detaching) detach_dev(t);
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$6.name,
		type: "if",
		source: "(93:4) {#if !child.id.includes('empty')}",
		ctx
	});

	return block;
}

// (99:5) {#if isExpandedFolder(child.id)}
function create_if_block_1$3(ctx) {
	let folder;
	let current;

	folder = new Folder({
			props: {
				subtree: /*child*/ ctx[13],
				listIds: /*listIds*/ ctx[1],
				isRoot: false,
				nestDepth: /*nestDepth*/ ctx[3] + 1
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(folder.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(folder, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const folder_changes = {};
			if (dirty & /*subtree*/ 1) folder_changes.subtree = /*child*/ ctx[13];
			if (dirty & /*listIds*/ 2) folder_changes.listIds = /*listIds*/ ctx[1];
			if (dirty & /*nestDepth*/ 8) folder_changes.nestDepth = /*nestDepth*/ ctx[3] + 1;
			folder.$set(folder_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(folder.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(folder.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(folder, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$3.name,
		type: "if",
		source: "(99:5) {#if isExpandedFolder(child.id)}",
		ctx
	});

	return block;
}

// (91:2) {#each subtree.children as child (child.id)}
function create_each_block(key_1, ctx) {
	let li;
	let show_if = !/*child*/ ctx[13].id.includes("empty");
	let t;
	let rect;
	let stop_animation = noop;
	let current;
	let if_block = show_if && create_if_block$6(ctx);

	const block = {
		key: key_1,
		first: null,
		c: function create() {
			li = element("li");
			if (if_block) if_block.c();
			t = space();
			attr_dev(li, "class", "svelte-1jae9wm");
			toggle_class(li, "empty", /*child*/ ctx[13].id.includes("empty"));
			add_location(li, file$b, 91, 3, 2793);
			this.first = li;
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			if (if_block) if_block.m(li, null);
			append_dev(li, t);
			current = true;
		},
		p: function update(ctx, dirty) {
			if (dirty & /*subtree*/ 1) show_if = !/*child*/ ctx[13].id.includes("empty");

			if (show_if) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*subtree*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$6(ctx);
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

			if (dirty & /*subtree*/ 1) {
				toggle_class(li, "empty", /*child*/ ctx[13].id.includes("empty"));
			}
		},
		r: function measure() {
			rect = li.getBoundingClientRect();
		},
		f: function fix() {
			fix_position(li);
			stop_animation();
		},
		a: function animate() {
			stop_animation();

			stop_animation = create_animation(li, rect, flip, {
				duration: /*duration*/ ctx[6],
				easing: standardEase
			});
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			if (if_block) if_block.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(91:2) {#each subtree.children as child (child.id)}",
		ctx
	});

	return block;
}

function create_fragment$c(ctx) {
	let div;
	let ul;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let ul_transition;
	let css_action;
	let current;
	let mounted;
	let dispose;
	let each_value = /*subtree*/ ctx[0].children;
	validate_each_argument(each_value);
	const get_key = ctx => /*child*/ ctx[13].id;
	validate_each_keys(ctx, each_value, get_each_context, get_key);

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
	}

	const block = {
		c: function create() {
			div = element("div");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(ul, "class", "rows svelte-1jae9wm");
			add_location(ul, file$b, 89, 1, 2662);
			attr_dev(div, "class", "folder svelte-1jae9wm");
			toggle_class(div, "isRoot", /*isRoot*/ ctx[2]);
			add_location(div, file$b, 84, 0, 2570);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, div, {
					folderHeight: /*folderHeight*/ ctx[4],
					folderEasing: /*folderEasing*/ ctx[5],
					duration: /*duration*/ ctx[6]
				}));

				mounted = true;
			}
		},
		p: function update(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (dirty & /*subtree, listIds, nestDepth, isExpandedFolder, tabId*/ 395) {
				const each_value = /*subtree*/ ctx[0].children;
				validate_each_argument(each_value);
				group_outros();
				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
				validate_each_keys(ctx, each_value, get_each_context, get_key);
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ul, fix_and_outro_and_destroy_block, create_each_block, null, get_each_context);
				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
				check_outros();
			}

			if (css_action && is_function(css_action.update) && dirty & /*folderHeight, folderEasing, duration*/ 112) css_action.update.call(null, {
				folderHeight: /*folderHeight*/ ctx[4],
				folderEasing: /*folderEasing*/ ctx[5],
				duration: /*duration*/ ctx[6]
			});

			if (dirty & /*isRoot*/ 4) {
				toggle_class(div, "isRoot", /*isRoot*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			if (local) {
				add_render_callback(() => {
					if (!ul_transition) ul_transition = create_bidirectional_transition(
						ul,
						slideUp,
						{
							duration: /*isRoot*/ ctx[2] ? 0 : /*duration*/ ctx[6]
						},
						true
					);

					ul_transition.run(1);
				});
			}

			current = true;
		},
		o: function outro(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			if (local) {
				if (!ul_transition) ul_transition = create_bidirectional_transition(
					ul,
					slideUp,
					{
						duration: /*isRoot*/ ctx[2] ? 0 : /*duration*/ ctx[6]
					},
					false
				);

				ul_transition.run(0);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			if (detaching && ul_transition) ul_transition.end();
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$c.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$c($$self, $$props, $$invalidate) {
	let $state;
	let $files;
	let $sidebar;
	validate_store(state, "state");
	component_subscribe($$self, state, $$value => $$invalidate(10, $state = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(11, $files = $$value));
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(12, $sidebar = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Folder", slots, []);
	let { subtree } = $$props;
	let { listIds } = $$props;
	let { isRoot = true } = $$props;
	let { nestDepth = 0 } = $$props;
	const tabId = getContext("tabId");

	// When the number of children changes, the height changes. This happens instantly, and can clip the child elements as they animate to their new positions. We want to avoid that. We could animate the height at the same duration and easing as the other transitions, but that's a big performance no-no. So instead we use `step` transitions to wait until the standard transition duration is complete, and then set the new value. OR we set it at the beginning. It depends on whether the folder has grown or shrunk. We determine -that- by comparing the new and old `numVisibleDescendants`.
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

	const writable_props = ["subtree", "listIds", "isRoot", "nestDepth"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Folder> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("subtree" in $$props) $$invalidate(0, subtree = $$props.subtree);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("isRoot" in $$props) $$invalidate(2, isRoot = $$props.isRoot);
		if ("nestDepth" in $$props) $$invalidate(3, nestDepth = $$props.nestDepth);
	};

	$$self.$capture_state = () => ({
		File,
		state,
		files,
		sidebar,
		flip,
		css,
		standardEase,
		slideUp,
		getContext,
		subtree,
		listIds,
		isRoot,
		nestDepth,
		tabId,
		oldNumVisibleDescendants,
		folderHeight,
		folderEasing,
		isExpandedFolder,
		duration,
		$state,
		$files,
		$sidebar
	});

	$$self.$inject_state = $$props => {
		if ("subtree" in $$props) $$invalidate(0, subtree = $$props.subtree);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("isRoot" in $$props) $$invalidate(2, isRoot = $$props.isRoot);
		if ("nestDepth" in $$props) $$invalidate(3, nestDepth = $$props.nestDepth);
		if ("oldNumVisibleDescendants" in $$props) $$invalidate(9, oldNumVisibleDescendants = $$props.oldNumVisibleDescendants);
		if ("folderHeight" in $$props) $$invalidate(4, folderHeight = $$props.folderHeight);
		if ("folderEasing" in $$props) $$invalidate(5, folderEasing = $$props.folderEasing);
		if ("duration" in $$props) $$invalidate(6, duration = $$props.duration);
	};

	let duration;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$state*/ 1024) {
			 $$invalidate(6, duration = $state.timing.treeListFolder);
		}

		if ($$self.$$.dirty & /*subtree, oldNumVisibleDescendants*/ 513) {
			 {
				if (subtree.numVisibleDescendants !== oldNumVisibleDescendants) {
					const hasGrown = subtree.numVisibleDescendants > oldNumVisibleDescendants;
					$$invalidate(5, folderEasing = hasGrown ? "step-start" : "step-end");
					$$invalidate(4, folderHeight = subtree.numVisibleDescendants * 29);
					$$invalidate(9, oldNumVisibleDescendants = subtree.numVisibleDescendants);
				}
			}
		}
	};

	return [
		subtree,
		listIds,
		isRoot,
		nestDepth,
		folderHeight,
		folderEasing,
		duration,
		tabId,
		isExpandedFolder,
		oldNumVisibleDescendants,
		$state
	];
}

class Folder extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1jae9wm-style")) add_css$c();

		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
			subtree: 0,
			listIds: 1,
			isRoot: 2,
			nestDepth: 3
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Folder",
			options,
			id: create_fragment$c.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*subtree*/ ctx[0] === undefined && !("subtree" in props)) {
			console.warn("<Folder> was created without expected prop 'subtree'");
		}

		if (/*listIds*/ ctx[1] === undefined && !("listIds" in props)) {
			console.warn("<Folder> was created without expected prop 'listIds'");
		}
	}

	get subtree() {
		throw new Error("<Folder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subtree(value) {
		throw new Error("<Folder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get listIds() {
		throw new Error("<Folder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listIds(value) {
		throw new Error("<Folder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isRoot() {
		throw new Error("<Folder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isRoot(value) {
		throw new Error("<Folder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get nestDepth() {
		throw new Error("<Folder>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set nestDepth(value) {
		throw new Error("<Folder>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/list/TreeList.svelte generated by Svelte v3.30.1 */
const file$c = "src/js/renderer/component/sidebar/list/TreeList.svelte";

function add_css$d() {
	var style = element("style");
	style.id = "svelte-ummn2l-style";
	style.textContent = ".list.svelte-ummn2l{padding:10px;flex-grow:1;overflow-y:scroll;position:relative}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJlZUxpc3Quc3ZlbHRlIiwic291cmNlcyI6WyJUcmVlTGlzdC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cblx0aW1wb3J0IHsgcHJvamVjdCwgc2lkZWJhciwgZmlsZXMgfSBmcm9tICcuLi8uLi8uLi9TdGF0ZU1hbmFnZXInXG5cdGltcG9ydCB7b25Nb3VzZWRvd24sIGFycm93TGVmdFJpZ2h0LCBhcnJvd1VwRG93bn0gZnJvbSAnLi9pbnRlcmFjdGlvbnMnXG4gIGltcG9ydCBGb2xkZXIgZnJvbSAnLi9Gb2xkZXIuc3ZlbHRlJztcbiAgaW1wb3J0IHsgZ2V0Q29udGV4dCB9IGZyb20gJ3N2ZWx0ZSc7XG5cblx0ZXhwb3J0IGxldCBzdWJ0cmVlID0ge31cbiAgZXhwb3J0IGxldCBsaXN0SWRzID0gW11cbiAgXG4gIGNvbnN0IHRhYklkID0gZ2V0Q29udGV4dCgndGFiSWQnKVxuICAkOiB0YWIgPSAkc2lkZWJhci50YWJzQnlJZFt0YWJJZF1cblx0JDogaXNTaWRlYmFyRm9jdXNlZCA9ICRwcm9qZWN0LmZvY3VzZWRMYXlvdXRTZWN0aW9uID09ICdzaWRlYmFyJ1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4ubGlzdCB7XG4gIHBhZGRpbmc6IDEwcHg7XG4gIGZsZXgtZ3JvdzogMTtcbiAgb3ZlcmZsb3cteTogc2Nyb2xsO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG59PC9zdHlsZT5cblxuPHN2ZWx0ZTp3aW5kb3cgb246a2V5ZG93bj17KGV2dCkgPT4ge1xuXHRpZiAoIWlzU2lkZWJhckZvY3VzZWQpIHJldHVyblxuICBzd2l0Y2ggKGV2dC5rZXkpIHtcbiAgICBjYXNlICdBcnJvd0xlZnQnOlxuICAgIGNhc2UgJ0Fycm93UmlnaHQnOlxuICAgICAgZXZ0LnByZXZlbnREZWZhdWx0KClcbiAgICAgIGFycm93TGVmdFJpZ2h0KGV2dC5rZXksIHRhYiwgdGFiSWQsIGxpc3RJZHMsICRmaWxlcylcbiAgICAgIGJyZWFrXG4gICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgY2FzZSAnQXJyb3dEb3duJzpcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBhcnJvd1VwRG93bihldnQua2V5LCBldnQuc2hpZnRLZXksIGV2dC5hbHRLZXksIHRhYiwgdGFiSWQsIGxpc3RJZHMpXG4gICAgICBicmVha1xuICB9XG59fSAvPlxuXG48ZGl2IGNsYXNzPVwibGlzdFwiPlxuXHQ8Rm9sZGVyIHt0YWJJZH0ge3N1YnRyZWV9IHtsaXN0SWRzfSAvPlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQW1CQSxLQUFLLGNBQUMsQ0FBQyxBQUNMLE9BQU8sQ0FBRSxJQUFJLENBQ2IsU0FBUyxDQUFFLENBQUMsQ0FDWixVQUFVLENBQUUsTUFBTSxDQUNsQixRQUFRLENBQUUsUUFBUSxBQUNwQixDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$d(ctx) {
	let div;
	let folder;
	let current;
	let mounted;
	let dispose;

	folder = new Folder({
			props: {
				tabId: /*tabId*/ ctx[5],
				subtree: /*subtree*/ ctx[0],
				listIds: /*listIds*/ ctx[1]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			create_component(folder.$$.fragment);
			attr_dev(div, "class", "list svelte-ummn2l");
			add_location(div, file$c, 42, 0, 1129);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(folder, div, null);
			current = true;

			if (!mounted) {
				dispose = listen_dev(window, "keydown", /*keydown_handler*/ ctx[8], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			const folder_changes = {};
			if (dirty & /*subtree*/ 1) folder_changes.subtree = /*subtree*/ ctx[0];
			if (dirty & /*listIds*/ 2) folder_changes.listIds = /*listIds*/ ctx[1];
			folder.$set(folder_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(folder.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(folder.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(folder);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$d.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$d($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(6, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(7, $project = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(4, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("TreeList", slots, []);
	let { subtree = {} } = $$props;
	let { listIds = [] } = $$props;
	const tabId = getContext("tabId");
	const writable_props = ["subtree", "listIds"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TreeList> was created with unknown prop '${key}'`);
	});

	const keydown_handler = evt => {
		if (!isSidebarFocused) return;

		switch (evt.key) {
			case "ArrowLeft":
			case "ArrowRight":
				evt.preventDefault();
				arrowLeftRight(evt.key, tab, tabId, listIds, $files);
				break;
			case "ArrowUp":
			case "ArrowDown":
				evt.preventDefault();
				arrowUpDown(evt.key, evt.shiftKey, evt.altKey, tab, tabId, listIds);
				break;
		}
	};

	$$self.$$set = $$props => {
		if ("subtree" in $$props) $$invalidate(0, subtree = $$props.subtree);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
	};

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		onMousedown,
		arrowLeftRight,
		arrowUpDown,
		Folder,
		getContext,
		subtree,
		listIds,
		tabId,
		tab,
		$sidebar,
		isSidebarFocused,
		$project,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("subtree" in $$props) $$invalidate(0, subtree = $$props.subtree);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("tab" in $$props) $$invalidate(2, tab = $$props.tab);
		if ("isSidebarFocused" in $$props) $$invalidate(3, isSidebarFocused = $$props.isSidebarFocused);
	};

	let tab;
	let isSidebarFocused;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 64) {
			 $$invalidate(2, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 128) {
			 $$invalidate(3, isSidebarFocused = $project.focusedLayoutSection == "sidebar");
		}
	};

	return [
		subtree,
		listIds,
		tab,
		isSidebarFocused,
		$files,
		tabId,
		$sidebar,
		$project,
		keydown_handler
	];
}

class TreeList extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-ummn2l-style")) add_css$d();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { subtree: 0, listIds: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "TreeList",
			options,
			id: create_fragment$d.name
		});
	}

	get subtree() {
		throw new Error("<TreeList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set subtree(value) {
		throw new Error("<TreeList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get listIds() {
		throw new Error("<TreeList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listIds(value) {
		throw new Error("<TreeList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/list/DocList.svelte generated by Svelte v3.30.1 */
const file$d = "src/js/renderer/component/sidebar/list/DocList.svelte";

function add_css$e() {
	var style = element("style");
	style.id = "svelte-ummn2l-style";
	style.textContent = ".list.svelte-ummn2l{padding:10px;flex-grow:1;overflow-y:scroll;position:relative}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9jTGlzdC5zdmVsdGUiLCJzb3VyY2VzIjpbIkRvY0xpc3Quc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG5cdGltcG9ydCB7IHByb2plY3QsIHNpZGViYXIsIGZpbGVzIH0gZnJvbSAnLi4vLi4vLi4vU3RhdGVNYW5hZ2VyJ1xuXHRpbXBvcnQge29uTW91c2Vkb3duLCBhcnJvd1VwRG93bn0gZnJvbSAnLi9pbnRlcmFjdGlvbnMnXG4gIGltcG9ydCB7IGdldENvbnRleHQgfSBmcm9tICdzdmVsdGUnO1xuXHRcblx0ZXhwb3J0IGxldCBsaXN0SWRzID0gW11cbiAgZXhwb3J0IGxldCBjb21wb25lbnRcbiAgZXhwb3J0IGxldCBzaG93VGFncyA9IGZhbHNlXG4gIFxuICBjb25zdCB0YWJJZCA9IGdldENvbnRleHQoJ3RhYklkJylcbiAgJDogdGFiID0gJHNpZGViYXIudGFic0J5SWRbdGFiSWRdXG5cdCQ6IGlzU2lkZWJhckZvY3VzZWQgPSAkcHJvamVjdC5mb2N1c2VkTGF5b3V0U2VjdGlvbiA9PSAnc2lkZWJhcidcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLmxpc3Qge1xuICBwYWRkaW5nOiAxMHB4O1xuICBmbGV4LWdyb3c6IDE7XG4gIG92ZXJmbG93LXk6IHNjcm9sbDtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufTwvc3R5bGU+XG5cbjxzdmVsdGU6d2luZG93IG9uOmtleWRvd249eyhldnQpID0+IHtcblx0aWYgKCFpc1NpZGViYXJGb2N1c2VkKSByZXR1cm5cbiAgc3dpdGNoIChldnQua2V5KSB7XG4gICAgY2FzZSAnQXJyb3dVcCc6XG4gICAgY2FzZSAnQXJyb3dEb3duJzpcbiAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBhcnJvd1VwRG93bihldnQua2V5LCBldnQuc2hpZnRLZXksIGV2dC5hbHRLZXksIHRhYiwgdGFiSWQsIGxpc3RJZHMpXG4gICAgICBicmVha1xuICB9XG59fSAvPlxuXG48ZGl2IGNsYXNzPVwibGlzdFwiPlxuXHR7I2VhY2ggbGlzdElkcyBhcyBpZCAoaWQpfVxuXHRcdDxzdmVsdGU6Y29tcG9uZW50IHRoaXM9e2NvbXBvbmVudH0ge2lkfSB7bGlzdElkc30ge3Nob3dUYWdzfSAvPlxuXHR7L2VhY2h9XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBbUJBLEtBQUssY0FBQyxDQUFDLEFBQ0wsT0FBTyxDQUFFLElBQUksQ0FDYixTQUFTLENBQUUsQ0FBQyxDQUNaLFVBQVUsQ0FBRSxNQUFNLENBQ2xCLFFBQVEsQ0FBRSxRQUFRLEFBQ3BCLENBQUMifQ== */";
	append_dev(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[9] = list[i];
	return child_ctx;
}

// (39:1) {#each listIds as id (id)}
function create_each_block$1(key_1, ctx) {
	let first;
	let switch_instance;
	let switch_instance_anchor;
	let current;
	var switch_value = /*component*/ ctx[1];

	function switch_props(ctx) {
		return {
			props: {
				id: /*id*/ ctx[9],
				listIds: /*listIds*/ ctx[0],
				showTags: /*showTags*/ ctx[2]
			},
			$$inline: true
		};
	}

	if (switch_value) {
		switch_instance = new switch_value(switch_props(ctx));
	}

	const block = {
		key: key_1,
		first: null,
		c: function create() {
			first = empty();
			if (switch_instance) create_component(switch_instance.$$.fragment);
			switch_instance_anchor = empty();
			this.first = first;
		},
		m: function mount(target, anchor) {
			insert_dev(target, first, anchor);

			if (switch_instance) {
				mount_component(switch_instance, target, anchor);
			}

			insert_dev(target, switch_instance_anchor, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const switch_instance_changes = {};
			if (dirty & /*listIds*/ 1) switch_instance_changes.id = /*id*/ ctx[9];
			if (dirty & /*listIds*/ 1) switch_instance_changes.listIds = /*listIds*/ ctx[0];
			if (dirty & /*showTags*/ 4) switch_instance_changes.showTags = /*showTags*/ ctx[2];

			if (switch_value !== (switch_value = /*component*/ ctx[1])) {
				if (switch_instance) {
					group_outros();
					const old_component = switch_instance;

					transition_out(old_component.$$.fragment, 1, 0, () => {
						destroy_component(old_component, 1);
					});

					check_outros();
				}

				if (switch_value) {
					switch_instance = new switch_value(switch_props(ctx));
					create_component(switch_instance.$$.fragment);
					transition_in(switch_instance.$$.fragment, 1);
					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
				} else {
					switch_instance = null;
				}
			} else if (switch_value) {
				switch_instance.$set(switch_instance_changes);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(first);
			if (detaching) detach_dev(switch_instance_anchor);
			if (switch_instance) destroy_component(switch_instance, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$1.name,
		type: "each",
		source: "(39:1) {#each listIds as id (id)}",
		ctx
	});

	return block;
}

function create_fragment$e(ctx) {
	let div;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let current;
	let mounted;
	let dispose;
	let each_value = /*listIds*/ ctx[0];
	validate_each_argument(each_value);
	const get_key = ctx => /*id*/ ctx[9];
	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$1(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
	}

	const block = {
		c: function create() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "list svelte-ummn2l");
			add_location(div, file$d, 37, 0, 958);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;

			if (!mounted) {
				dispose = listen_dev(window, "keydown", /*keydown_handler*/ ctx[8], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*component, listIds, showTags*/ 7) {
				const each_value = /*listIds*/ ctx[0];
				validate_each_argument(each_value);
				group_outros();
				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$1, null, get_each_context$1);
				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$e.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$e($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(6, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(7, $project = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("DocList", slots, []);
	let { listIds = [] } = $$props;
	let { component } = $$props;
	let { showTags = false } = $$props;
	const tabId = getContext("tabId");
	const writable_props = ["listIds", "component", "showTags"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DocList> was created with unknown prop '${key}'`);
	});

	const keydown_handler = evt => {
		if (!isSidebarFocused) return;

		switch (evt.key) {
			case "ArrowUp":
			case "ArrowDown":
				evt.preventDefault();
				arrowUpDown(evt.key, evt.shiftKey, evt.altKey, tab, tabId, listIds);
				break;
		}
	};

	$$self.$$set = $$props => {
		if ("listIds" in $$props) $$invalidate(0, listIds = $$props.listIds);
		if ("component" in $$props) $$invalidate(1, component = $$props.component);
		if ("showTags" in $$props) $$invalidate(2, showTags = $$props.showTags);
	};

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		onMousedown,
		arrowUpDown,
		getContext,
		listIds,
		component,
		showTags,
		tabId,
		tab,
		$sidebar,
		isSidebarFocused,
		$project
	});

	$$self.$inject_state = $$props => {
		if ("listIds" in $$props) $$invalidate(0, listIds = $$props.listIds);
		if ("component" in $$props) $$invalidate(1, component = $$props.component);
		if ("showTags" in $$props) $$invalidate(2, showTags = $$props.showTags);
		if ("tab" in $$props) $$invalidate(3, tab = $$props.tab);
		if ("isSidebarFocused" in $$props) $$invalidate(4, isSidebarFocused = $$props.isSidebarFocused);
	};

	let tab;
	let isSidebarFocused;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 64) {
			 $$invalidate(3, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 128) {
			 $$invalidate(4, isSidebarFocused = $project.focusedLayoutSection == "sidebar");
		}
	};

	return [
		listIds,
		component,
		showTags,
		tab,
		isSidebarFocused,
		tabId,
		$sidebar,
		$project,
		keydown_handler
	];
}

class DocList extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-ummn2l-style")) add_css$e();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, { listIds: 0, component: 1, showTags: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "DocList",
			options,
			id: create_fragment$e.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*component*/ ctx[1] === undefined && !("component" in props)) {
			console.warn("<DocList> was created without expected prop 'component'");
		}
	}

	get listIds() {
		throw new Error("<DocList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listIds(value) {
		throw new Error("<DocList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get component() {
		throw new Error("<DocList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set component(value) {
		throw new Error("<DocList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get showTags() {
		throw new Error("<DocList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set showTags(value) {
		throw new Error("<DocList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

var moment = createCommonjsModule(function (module, exports) {
(function (global, factory) {
     module.exports = factory() ;
}(commonjsGlobal, (function () {
    var hookCallback;

    function hooks() {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback(callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return (
            input instanceof Array ||
            Object.prototype.toString.call(input) === '[object Array]'
        );
    }

    function isObject(input) {
        // IE8 will treat undefined and null as object if it wasn't for
        // input != null
        return (
            input != null &&
            Object.prototype.toString.call(input) === '[object Object]'
        );
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function isObjectEmpty(obj) {
        if (Object.getOwnPropertyNames) {
            return Object.getOwnPropertyNames(obj).length === 0;
        } else {
            var k;
            for (k in obj) {
                if (hasOwnProp(obj, k)) {
                    return false;
                }
            }
            return true;
        }
    }

    function isUndefined(input) {
        return input === void 0;
    }

    function isNumber(input) {
        return (
            typeof input === 'number' ||
            Object.prototype.toString.call(input) === '[object Number]'
        );
    }

    function isDate(input) {
        return (
            input instanceof Date ||
            Object.prototype.toString.call(input) === '[object Date]'
        );
    }

    function map(arr, fn) {
        var res = [],
            i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function createUTC(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty: false,
            unusedTokens: [],
            unusedInput: [],
            overflow: -2,
            charsLeftOver: 0,
            nullInput: false,
            invalidEra: null,
            invalidMonth: null,
            invalidFormat: false,
            userInvalidated: false,
            iso: false,
            parsedDateParts: [],
            era: null,
            meridiem: null,
            rfc2822: false,
            weekdayMismatch: false,
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    var some;
    if (Array.prototype.some) {
        some = Array.prototype.some;
    } else {
        some = function (fun) {
            var t = Object(this),
                len = t.length >>> 0,
                i;

            for (i = 0; i < len; i++) {
                if (i in t && fun.call(this, t[i], i, t)) {
                    return true;
                }
            }

            return false;
        };
    }

    function isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m),
                parsedParts = some.call(flags.parsedDateParts, function (i) {
                    return i != null;
                }),
                isNowValid =
                    !isNaN(m._d.getTime()) &&
                    flags.overflow < 0 &&
                    !flags.empty &&
                    !flags.invalidEra &&
                    !flags.invalidMonth &&
                    !flags.invalidWeekday &&
                    !flags.weekdayMismatch &&
                    !flags.nullInput &&
                    !flags.invalidFormat &&
                    !flags.userInvalidated &&
                    (!flags.meridiem || (flags.meridiem && parsedParts));

            if (m._strict) {
                isNowValid =
                    isNowValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }

            if (Object.isFrozen == null || !Object.isFrozen(m)) {
                m._isValid = isNowValid;
            } else {
                return isNowValid;
            }
        }
        return m._isValid;
    }

    function createInvalid(flags) {
        var m = createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        } else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = (hooks.momentProperties = []),
        updateInProgress = false;

    function copyConfig(to, from) {
        var i, prop, val;

        if (!isUndefined(from._isAMomentObject)) {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (!isUndefined(from._i)) {
            to._i = from._i;
        }
        if (!isUndefined(from._f)) {
            to._f = from._f;
        }
        if (!isUndefined(from._l)) {
            to._l = from._l;
        }
        if (!isUndefined(from._strict)) {
            to._strict = from._strict;
        }
        if (!isUndefined(from._tzm)) {
            to._tzm = from._tzm;
        }
        if (!isUndefined(from._isUTC)) {
            to._isUTC = from._isUTC;
        }
        if (!isUndefined(from._offset)) {
            to._offset = from._offset;
        }
        if (!isUndefined(from._pf)) {
            to._pf = getParsingFlags(from);
        }
        if (!isUndefined(from._locale)) {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i = 0; i < momentProperties.length; i++) {
                prop = momentProperties[i];
                val = from[prop];
                if (!isUndefined(val)) {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        if (!this.isValid()) {
            this._d = new Date(NaN);
        }
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment(obj) {
        return (
            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
        );
    }

    function warn(msg) {
        if (
            hooks.suppressDeprecationWarnings === false &&
            typeof console !== 'undefined' &&
            console.warn
        ) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (hooks.deprecationHandler != null) {
                hooks.deprecationHandler(null, msg);
            }
            if (firstTime) {
                var args = [],
                    arg,
                    i,
                    key;
                for (i = 0; i < arguments.length; i++) {
                    arg = '';
                    if (typeof arguments[i] === 'object') {
                        arg += '\n[' + i + '] ';
                        for (key in arguments[0]) {
                            if (hasOwnProp(arguments[0], key)) {
                                arg += key + ': ' + arguments[0][key] + ', ';
                            }
                        }
                        arg = arg.slice(0, -2); // Remove trailing comma and space
                    } else {
                        arg = arguments[i];
                    }
                    args.push(arg);
                }
                warn(
                    msg +
                        '\nArguments: ' +
                        Array.prototype.slice.call(args).join('') +
                        '\n' +
                        new Error().stack
                );
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (hooks.deprecationHandler != null) {
            hooks.deprecationHandler(name, msg);
        }
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    hooks.suppressDeprecationWarnings = false;
    hooks.deprecationHandler = null;

    function isFunction(input) {
        return (
            (typeof Function !== 'undefined' && input instanceof Function) ||
            Object.prototype.toString.call(input) === '[object Function]'
        );
    }

    function set(config) {
        var prop, i;
        for (i in config) {
            if (hasOwnProp(config, i)) {
                prop = config[i];
                if (isFunction(prop)) {
                    this[i] = prop;
                } else {
                    this['_' + i] = prop;
                }
            }
        }
        this._config = config;
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
        // TODO: Remove "ordinalParse" fallback in next major release.
        this._dayOfMonthOrdinalParseLenient = new RegExp(
            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
                '|' +
                /\d{1,2}/.source
        );
    }

    function mergeConfigs(parentConfig, childConfig) {
        var res = extend({}, parentConfig),
            prop;
        for (prop in childConfig) {
            if (hasOwnProp(childConfig, prop)) {
                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
                    res[prop] = {};
                    extend(res[prop], parentConfig[prop]);
                    extend(res[prop], childConfig[prop]);
                } else if (childConfig[prop] != null) {
                    res[prop] = childConfig[prop];
                } else {
                    delete res[prop];
                }
            }
        }
        for (prop in parentConfig) {
            if (
                hasOwnProp(parentConfig, prop) &&
                !hasOwnProp(childConfig, prop) &&
                isObject(parentConfig[prop])
            ) {
                // make sure changes to properties don't modify parent config
                res[prop] = extend({}, res[prop]);
            }
        }
        return res;
    }

    function Locale(config) {
        if (config != null) {
            this.set(config);
        }
    }

    var keys;

    if (Object.keys) {
        keys = Object.keys;
    } else {
        keys = function (obj) {
            var i,
                res = [];
            for (i in obj) {
                if (hasOwnProp(obj, i)) {
                    res.push(i);
                }
            }
            return res;
        };
    }

    var defaultCalendar = {
        sameDay: '[Today at] LT',
        nextDay: '[Tomorrow at] LT',
        nextWeek: 'dddd [at] LT',
        lastDay: '[Yesterday at] LT',
        lastWeek: '[Last] dddd [at] LT',
        sameElse: 'L',
    };

    function calendar(key, mom, now) {
        var output = this._calendar[key] || this._calendar['sameElse'];
        return isFunction(output) ? output.call(mom, now) : output;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (
            (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
            absNumber
        );
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
        formatFunctions = {},
        formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken(token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(
                    func.apply(this, arguments),
                    token
                );
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens),
            i,
            length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '',
                i;
            for (i = 0; i < length; i++) {
                output += isFunction(array[i])
                    ? array[i].call(mom, format)
                    : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] =
            formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(
                localFormattingTokens,
                replaceLongDateFormatTokens
            );
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var defaultLongDateFormat = {
        LTS: 'h:mm:ss A',
        LT: 'h:mm A',
        L: 'MM/DD/YYYY',
        LL: 'MMMM D, YYYY',
        LLL: 'MMMM D, YYYY h:mm A',
        LLLL: 'dddd, MMMM D, YYYY h:mm A',
    };

    function longDateFormat(key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper
            .match(formattingTokens)
            .map(function (tok) {
                if (
                    tok === 'MMMM' ||
                    tok === 'MM' ||
                    tok === 'DD' ||
                    tok === 'dddd'
                ) {
                    return tok.slice(1);
                }
                return tok;
            })
            .join('');

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate() {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d',
        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

    function ordinal(number) {
        return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
        future: 'in %s',
        past: '%s ago',
        s: 'a few seconds',
        ss: '%d seconds',
        m: 'a minute',
        mm: '%d minutes',
        h: 'an hour',
        hh: '%d hours',
        d: 'a day',
        dd: '%d days',
        w: 'a week',
        ww: '%d weeks',
        M: 'a month',
        MM: '%d months',
        y: 'a year',
        yy: '%d years',
    };

    function relativeTime(number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return isFunction(output)
            ? output(number, withoutSuffix, string, isFuture)
            : output.replace(/%d/i, number);
    }

    function pastFuture(diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias(unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string'
            ? aliases[units] || aliases[units.toLowerCase()]
            : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
        priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
        var units = [],
            u;
        for (u in unitsObj) {
            if (hasOwnProp(unitsObj, u)) {
                units.push({ unit: u, priority: priorities[u] });
            }
        }
        units.sort(function (a, b) {
            return a.priority - b.priority;
        });
        return units;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    function absFloor(number) {
        if (number < 0) {
            // -0 -> 0
            return Math.ceil(number) || 0;
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function makeGetSet(unit, keepTime) {
        return function (value) {
            if (value != null) {
                set$1(this, unit, value);
                hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get(this, unit);
            }
        };
    }

    function get(mom, unit) {
        return mom.isValid()
            ? mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]()
            : NaN;
    }

    function set$1(mom, unit, value) {
        if (mom.isValid() && !isNaN(value)) {
            if (
                unit === 'FullYear' &&
                isLeapYear(mom.year()) &&
                mom.month() === 1 &&
                mom.date() === 29
            ) {
                value = toInt(value);
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](
                    value,
                    mom.month(),
                    daysInMonth(value, mom.month())
                );
            } else {
                mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
            }
        }
    }

    // MOMENTS

    function stringGet(units) {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
            return this[units]();
        }
        return this;
    }

    function stringSet(units, value) {
        if (typeof units === 'object') {
            units = normalizeObjectUnits(units);
            var prioritized = getPrioritizedUnits(units),
                i;
            for (i = 0; i < prioritized.length; i++) {
                this[prioritized[i].unit](units[prioritized[i].unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (isFunction(this[units])) {
                return this[units](value);
            }
        }
        return this;
    }

    var match1 = /\d/, //       0 - 9
        match2 = /\d\d/, //      00 - 99
        match3 = /\d{3}/, //     000 - 999
        match4 = /\d{4}/, //    0000 - 9999
        match6 = /[+-]?\d{6}/, // -999999 - 999999
        match1to2 = /\d\d?/, //       0 - 99
        match3to4 = /\d\d\d\d?/, //     999 - 9999
        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
        match1to3 = /\d{1,3}/, //       0 - 999
        match1to4 = /\d{1,4}/, //       0 - 9999
        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
        matchUnsigned = /\d+/, //       0 - inf
        matchSigned = /[+-]?\d+/, //    -inf - inf
        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
        // any word (or two) characters or numbers including two/three word month in arabic.
        // includes scottish gaelic two word and hyphenated months
        matchWord = /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
        regexes;

    regexes = {};

    function addRegexToken(token, regex, strictRegex) {
        regexes[token] = isFunction(regex)
            ? regex
            : function (isStrict, localeData) {
                  return isStrict && strictRegex ? strictRegex : regex;
              };
    }

    function getParseRegexForToken(token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return regexEscape(
            s
                .replace('\\', '')
                .replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (
                    matched,
                    p1,
                    p2,
                    p3,
                    p4
                ) {
                    return p1 || p2 || p3 || p4;
                })
        );
    }

    function regexEscape(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken(token, callback) {
        var i,
            func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (isNumber(callback)) {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken(token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0,
        MONTH = 1,
        DATE = 2,
        HOUR = 3,
        MINUTE = 4,
        SECOND = 5,
        MILLISECOND = 6,
        WEEK = 7,
        WEEKDAY = 8;

    function mod(n, x) {
        return ((n % x) + x) % x;
    }

    var indexOf;

    if (Array.prototype.indexOf) {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function (o) {
            // I know
            var i;
            for (i = 0; i < this.length; ++i) {
                if (this[i] === o) {
                    return i;
                }
            }
            return -1;
        };
    }

    function daysInMonth(year, month) {
        if (isNaN(year) || isNaN(month)) {
            return NaN;
        }
        var modMonth = mod(month, 12);
        year += (month - modMonth) / 12;
        return modMonth === 1
            ? isLeapYear(year)
                ? 29
                : 28
            : 31 - ((modMonth % 7) % 2);
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M', match1to2);
    addRegexToken('MM', match1to2, match2);
    addRegexToken('MMM', function (isStrict, locale) {
        return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
        return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split(
            '_'
        ),
        defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split(
            '_'
        ),
        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
        defaultMonthsShortRegex = matchWord,
        defaultMonthsRegex = matchWord;

    function localeMonths(m, format) {
        if (!m) {
            return isArray(this._months)
                ? this._months
                : this._months['standalone'];
        }
        return isArray(this._months)
            ? this._months[m.month()]
            : this._months[
                  (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
                      ? 'format'
                      : 'standalone'
              ][m.month()];
    }

    function localeMonthsShort(m, format) {
        if (!m) {
            return isArray(this._monthsShort)
                ? this._monthsShort
                : this._monthsShort['standalone'];
        }
        return isArray(this._monthsShort)
            ? this._monthsShort[m.month()]
            : this._monthsShort[
                  MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
              ][m.month()];
    }

    function handleStrictParse(monthName, format, strict) {
        var i,
            ii,
            mom,
            llc = monthName.toLocaleLowerCase();
        if (!this._monthsParse) {
            // this is not used
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
            for (i = 0; i < 12; ++i) {
                mom = createUTC([2000, i]);
                this._shortMonthsParse[i] = this.monthsShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'MMM') {
                ii = indexOf.call(this._shortMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._longMonthsParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._longMonthsParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortMonthsParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeMonthsParse(monthName, format, strict) {
        var i, mom, regex;

        if (this._monthsParseExact) {
            return handleStrictParse.call(this, monthName, format, strict);
        }

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        // TODO: add sorting
        // Sorting makes sure if one month (or abbr) is a prefix of another
        // see sorting in computeMonthsParse
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp(
                    '^' + this.months(mom, '').replace('.', '') + '$',
                    'i'
                );
                this._shortMonthsParse[i] = new RegExp(
                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
                    'i'
                );
            }
            if (!strict && !this._monthsParse[i]) {
                regex =
                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'MMMM' &&
                this._longMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'MMM' &&
                this._shortMonthsParse[i].test(monthName)
            ) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth(mom, value) {
        var dayOfMonth;

        if (!mom.isValid()) {
            // No op
            return mom;
        }

        if (typeof value === 'string') {
            if (/^\d+$/.test(value)) {
                value = toInt(value);
            } else {
                value = mom.localeData().monthsParse(value);
                // TODO: Another silent failure?
                if (!isNumber(value)) {
                    return mom;
                }
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth(value) {
        if (value != null) {
            setMonth(this, value);
            hooks.updateOffset(this, true);
            return this;
        } else {
            return get(this, 'Month');
        }
    }

    function getDaysInMonth() {
        return daysInMonth(this.year(), this.month());
    }

    function monthsShortRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsShortStrictRegex;
            } else {
                return this._monthsShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsShortRegex')) {
                this._monthsShortRegex = defaultMonthsShortRegex;
            }
            return this._monthsShortStrictRegex && isStrict
                ? this._monthsShortStrictRegex
                : this._monthsShortRegex;
        }
    }

    function monthsRegex(isStrict) {
        if (this._monthsParseExact) {
            if (!hasOwnProp(this, '_monthsRegex')) {
                computeMonthsParse.call(this);
            }
            if (isStrict) {
                return this._monthsStrictRegex;
            } else {
                return this._monthsRegex;
            }
        } else {
            if (!hasOwnProp(this, '_monthsRegex')) {
                this._monthsRegex = defaultMonthsRegex;
            }
            return this._monthsStrictRegex && isStrict
                ? this._monthsStrictRegex
                : this._monthsRegex;
        }
    }

    function computeMonthsParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom;
        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, i]);
            shortPieces.push(this.monthsShort(mom, ''));
            longPieces.push(this.months(mom, ''));
            mixedPieces.push(this.months(mom, ''));
            mixedPieces.push(this.monthsShort(mom, ''));
        }
        // Sorting makes sure if one month (or abbr) is a prefix of another it
        // will match the longer piece.
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);
        for (i = 0; i < 12; i++) {
            shortPieces[i] = regexEscape(shortPieces[i]);
            longPieces[i] = regexEscape(longPieces[i]);
        }
        for (i = 0; i < 24; i++) {
            mixedPieces[i] = regexEscape(mixedPieces[i]);
        }

        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._monthsShortRegex = this._monthsRegex;
        this._monthsStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._monthsShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
        var y = this.year();
        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY', 4], 0, 'year');
    addFormatToken(0, ['YYYYY', 5], 0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y', matchSigned);
    addRegexToken('YY', match1to2, match2);
    addRegexToken('YYYY', match1to4, match4);
    addRegexToken('YYYYY', match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] =
            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
        array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    // HOOKS

    hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear() {
        return isLeapYear(this.year());
    }

    function createDate(y, m, d, h, M, s, ms) {
        // can't just apply() to create a date:
        // https://stackoverflow.com/q/181348
        var date;
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            date = new Date(y + 400, m, d, h, M, s, ms);
            if (isFinite(date.getFullYear())) {
                date.setFullYear(y);
            }
        } else {
            date = new Date(y, m, d, h, M, s, ms);
        }

        return date;
    }

    function createUTCDate(y) {
        var date, args;
        // the Date.UTC function remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            args = Array.prototype.slice.call(arguments);
            // preserve leap years using a full 400 year cycle, then reset
            args[0] = y + 400;
            date = new Date(Date.UTC.apply(null, args));
            if (isFinite(date.getUTCFullYear())) {
                date.setUTCFullYear(y);
            }
        } else {
            date = new Date(Date.UTC.apply(null, arguments));
        }

        return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
            fwd = 7 + dow - doy,
            // first-week day local weekday -- which local weekday is fwd
            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

        return -fwdlw + fwd - 1;
    }

    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
        var localWeekday = (7 + weekday - dow) % 7,
            weekOffset = firstWeekOffset(year, dow, doy),
            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
            resYear,
            resDayOfYear;

        if (dayOfYear <= 0) {
            resYear = year - 1;
            resDayOfYear = daysInYear(resYear) + dayOfYear;
        } else if (dayOfYear > daysInYear(year)) {
            resYear = year + 1;
            resDayOfYear = dayOfYear - daysInYear(year);
        } else {
            resYear = year;
            resDayOfYear = dayOfYear;
        }

        return {
            year: resYear,
            dayOfYear: resDayOfYear,
        };
    }

    function weekOfYear(mom, dow, doy) {
        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
            resWeek,
            resYear;

        if (week < 1) {
            resYear = mom.year() - 1;
            resWeek = week + weeksInYear(resYear, dow, doy);
        } else if (week > weeksInYear(mom.year(), dow, doy)) {
            resWeek = week - weeksInYear(mom.year(), dow, doy);
            resYear = mom.year() + 1;
        } else {
            resYear = mom.year();
            resWeek = week;
        }

        return {
            week: resWeek,
            year: resYear,
        };
    }

    function weeksInYear(year, dow, doy) {
        var weekOffset = firstWeekOffset(year, dow, doy),
            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w', match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W', match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (
        input,
        week,
        config,
        token
    ) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek(mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow: 0, // Sunday is the first day of the week.
        doy: 6, // The week that contains Jan 6th is the first week of the year.
    };

    function localeFirstDayOfWeek() {
        return this._week.dow;
    }

    function localeFirstDayOfYear() {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek(input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek(input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d', match1to2);
    addRegexToken('e', match1to2);
    addRegexToken('E', match1to2);
    addRegexToken('dd', function (isStrict, locale) {
        return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd', function (isStrict, locale) {
        return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd', function (isStrict, locale) {
        return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
        var weekday = config._locale.weekdaysParse(input, token, config._strict);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    function parseIsoWeekday(input, locale) {
        if (typeof input === 'string') {
            return locale.weekdaysParse(input) % 7 || 7;
        }
        return isNaN(input) ? null : input;
    }

    // LOCALES
    function shiftWeekdays(ws, n) {
        return ws.slice(n, 7).concat(ws.slice(0, n));
    }

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split(
            '_'
        ),
        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
        defaultWeekdaysRegex = matchWord,
        defaultWeekdaysShortRegex = matchWord,
        defaultWeekdaysMinRegex = matchWord;

    function localeWeekdays(m, format) {
        var weekdays = isArray(this._weekdays)
            ? this._weekdays
            : this._weekdays[
                  m && m !== true && this._weekdays.isFormat.test(format)
                      ? 'format'
                      : 'standalone'
              ];
        return m === true
            ? shiftWeekdays(weekdays, this._week.dow)
            : m
            ? weekdays[m.day()]
            : weekdays;
    }

    function localeWeekdaysShort(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
            : m
            ? this._weekdaysShort[m.day()]
            : this._weekdaysShort;
    }

    function localeWeekdaysMin(m) {
        return m === true
            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
            : m
            ? this._weekdaysMin[m.day()]
            : this._weekdaysMin;
    }

    function handleStrictParse$1(weekdayName, format, strict) {
        var i,
            ii,
            mom,
            llc = weekdayName.toLocaleLowerCase();
        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._minWeekdaysParse = [];

            for (i = 0; i < 7; ++i) {
                mom = createUTC([2000, 1]).day(i);
                this._minWeekdaysParse[i] = this.weekdaysMin(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._shortWeekdaysParse[i] = this.weekdaysShort(
                    mom,
                    ''
                ).toLocaleLowerCase();
                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
            }
        }

        if (strict) {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        } else {
            if (format === 'dddd') {
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else if (format === 'ddd') {
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._minWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            } else {
                ii = indexOf.call(this._minWeekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._weekdaysParse, llc);
                if (ii !== -1) {
                    return ii;
                }
                ii = indexOf.call(this._shortWeekdaysParse, llc);
                return ii !== -1 ? ii : null;
            }
        }
    }

    function localeWeekdaysParse(weekdayName, format, strict) {
        var i, mom, regex;

        if (this._weekdaysParseExact) {
            return handleStrictParse$1.call(this, weekdayName, format, strict);
        }

        if (!this._weekdaysParse) {
            this._weekdaysParse = [];
            this._minWeekdaysParse = [];
            this._shortWeekdaysParse = [];
            this._fullWeekdaysParse = [];
        }

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already

            mom = createUTC([2000, 1]).day(i);
            if (strict && !this._fullWeekdaysParse[i]) {
                this._fullWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._shortWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
                this._minWeekdaysParse[i] = new RegExp(
                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
                    'i'
                );
            }
            if (!this._weekdaysParse[i]) {
                regex =
                    '^' +
                    this.weekdays(mom, '') +
                    '|^' +
                    this.weekdaysShort(mom, '') +
                    '|^' +
                    this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (
                strict &&
                format === 'dddd' &&
                this._fullWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'ddd' &&
                this._shortWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (
                strict &&
                format === 'dd' &&
                this._minWeekdaysParse[i].test(weekdayName)
            ) {
                return i;
            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek(input) {
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }

        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.

        if (input != null) {
            var weekday = parseIsoWeekday(input, this.localeData());
            return this.day(this.day() % 7 ? weekday : weekday - 7);
        } else {
            return this.day() || 7;
        }
    }

    function weekdaysRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysStrictRegex;
            } else {
                return this._weekdaysRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                this._weekdaysRegex = defaultWeekdaysRegex;
            }
            return this._weekdaysStrictRegex && isStrict
                ? this._weekdaysStrictRegex
                : this._weekdaysRegex;
        }
    }

    function weekdaysShortRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysShortStrictRegex;
            } else {
                return this._weekdaysShortRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
            }
            return this._weekdaysShortStrictRegex && isStrict
                ? this._weekdaysShortStrictRegex
                : this._weekdaysShortRegex;
        }
    }

    function weekdaysMinRegex(isStrict) {
        if (this._weekdaysParseExact) {
            if (!hasOwnProp(this, '_weekdaysRegex')) {
                computeWeekdaysParse.call(this);
            }
            if (isStrict) {
                return this._weekdaysMinStrictRegex;
            } else {
                return this._weekdaysMinRegex;
            }
        } else {
            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
            }
            return this._weekdaysMinStrictRegex && isStrict
                ? this._weekdaysMinStrictRegex
                : this._weekdaysMinRegex;
        }
    }

    function computeWeekdaysParse() {
        function cmpLenRev(a, b) {
            return b.length - a.length;
        }

        var minPieces = [],
            shortPieces = [],
            longPieces = [],
            mixedPieces = [],
            i,
            mom,
            minp,
            shortp,
            longp;
        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            mom = createUTC([2000, 1]).day(i);
            minp = regexEscape(this.weekdaysMin(mom, ''));
            shortp = regexEscape(this.weekdaysShort(mom, ''));
            longp = regexEscape(this.weekdays(mom, ''));
            minPieces.push(minp);
            shortPieces.push(shortp);
            longPieces.push(longp);
            mixedPieces.push(minp);
            mixedPieces.push(shortp);
            mixedPieces.push(longp);
        }
        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
        // will match the longer piece.
        minPieces.sort(cmpLenRev);
        shortPieces.sort(cmpLenRev);
        longPieces.sort(cmpLenRev);
        mixedPieces.sort(cmpLenRev);

        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._weekdaysShortRegex = this._weekdaysRegex;
        this._weekdaysMinRegex = this._weekdaysRegex;

        this._weekdaysStrictRegex = new RegExp(
            '^(' + longPieces.join('|') + ')',
            'i'
        );
        this._weekdaysShortStrictRegex = new RegExp(
            '^(' + shortPieces.join('|') + ')',
            'i'
        );
        this._weekdaysMinStrictRegex = new RegExp(
            '^(' + minPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    function hFormat() {
        return this.hours() % 12 || 12;
    }

    function kFormat() {
        return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
        return (
            '' +
            hFormat.apply(this) +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    addFormatToken('Hmm', 0, 0, function () {
        return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
        return (
            '' +
            this.hours() +
            zeroFill(this.minutes(), 2) +
            zeroFill(this.seconds(), 2)
        );
    });

    function meridiem(token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(
                this.hours(),
                this.minutes(),
                lowercase
            );
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem(isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a', matchMeridiem);
    addRegexToken('A', matchMeridiem);
    addRegexToken('H', match1to2);
    addRegexToken('h', match1to2);
    addRegexToken('k', match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);
    addRegexToken('kk', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['k', 'kk'], function (input, array, config) {
        var kInput = toInt(input);
        array[HOUR] = kInput === 24 ? 0 : kInput;
    });
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
        getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
        var pos = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos));
        array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
        var pos1 = input.length - 4,
            pos2 = input.length - 2;
        array[HOUR] = toInt(input.substr(0, pos1));
        array[MINUTE] = toInt(input.substr(pos1, 2));
        array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM(input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return (input + '').toLowerCase().charAt(0) === 'p';
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
        // Setting the hour should keep the time, because the user explicitly
        // specified which hour they want. So trying to maintain the same hour (in
        // a new timezone) makes sense. Adding/subtracting hours does not follow
        // this rule.
        getSetHour = makeGetSet('Hours', true);

    function localeMeridiem(hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }

    var baseConfig = {
        calendar: defaultCalendar,
        longDateFormat: defaultLongDateFormat,
        invalidDate: defaultInvalidDate,
        ordinal: defaultOrdinal,
        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
        relativeTime: defaultRelativeTime,

        months: defaultLocaleMonths,
        monthsShort: defaultLocaleMonthsShort,

        week: defaultLocaleWeek,

        weekdays: defaultLocaleWeekdays,
        weekdaysMin: defaultLocaleWeekdaysMin,
        weekdaysShort: defaultLocaleWeekdaysShort,

        meridiemParse: defaultLocaleMeridiemParse,
    };

    // internal storage for locale config files
    var locales = {},
        localeFamilies = {},
        globalLocale;

    function commonPrefix(arr1, arr2) {
        var i,
            minl = Math.min(arr1.length, arr2.length);
        for (i = 0; i < minl; i += 1) {
            if (arr1[i] !== arr2[i]) {
                return i;
            }
        }
        return minl;
    }

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0,
            j,
            next,
            locale,
            split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (
                    next &&
                    next.length >= j &&
                    commonPrefix(split, next) >= j - 1
                ) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return globalLocale;
    }

    function loadLocale(name) {
        var oldLocale = null,
            aliasedRequire;
        // TODO: Find a better way to register and load all the locales in Node
        if (
            locales[name] === undefined &&
            'object' !== 'undefined' &&
            module &&
            module.exports
        ) {
            try {
                oldLocale = globalLocale._abbr;
                aliasedRequire = commonjsRequire;
                aliasedRequire('./locale/' + name);
                getSetGlobalLocale(oldLocale);
            } catch (e) {
                // mark as not found to avoid repeating expensive file require call causing high CPU
                // when trying to find en-US, en_US, en-us for every format call
                locales[name] = null; // null means not found
            }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function getSetGlobalLocale(key, values) {
        var data;
        if (key) {
            if (isUndefined(values)) {
                data = getLocale(key);
            } else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            } else {
                if (typeof console !== 'undefined' && console.warn) {
                    //warn user if arguments are passed but the locale could not be set
                    console.warn(
                        'Locale ' + key + ' not found. Did you forget to load it?'
                    );
                }
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale(name, config) {
        if (config !== null) {
            var locale,
                parentConfig = baseConfig;
            config.abbr = name;
            if (locales[name] != null) {
                deprecateSimple(
                    'defineLocaleOverride',
                    'use moment.updateLocale(localeName, config) to change ' +
                        'an existing locale. moment.defineLocale(localeName, ' +
                        'config) should only be used for creating a new locale ' +
                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
                );
                parentConfig = locales[name]._config;
            } else if (config.parentLocale != null) {
                if (locales[config.parentLocale] != null) {
                    parentConfig = locales[config.parentLocale]._config;
                } else {
                    locale = loadLocale(config.parentLocale);
                    if (locale != null) {
                        parentConfig = locale._config;
                    } else {
                        if (!localeFamilies[config.parentLocale]) {
                            localeFamilies[config.parentLocale] = [];
                        }
                        localeFamilies[config.parentLocale].push({
                            name: name,
                            config: config,
                        });
                        return null;
                    }
                }
            }
            locales[name] = new Locale(mergeConfigs(parentConfig, config));

            if (localeFamilies[name]) {
                localeFamilies[name].forEach(function (x) {
                    defineLocale(x.name, x.config);
                });
            }

            // backwards compat for now: also set the locale
            // make sure we set the locale AFTER all child locales have been
            // created, so we won't end up with the child locale set.
            getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    function updateLocale(name, config) {
        if (config != null) {
            var locale,
                tmpLocale,
                parentConfig = baseConfig;

            if (locales[name] != null && locales[name].parentLocale != null) {
                // Update existing child locale in-place to avoid memory-leaks
                locales[name].set(mergeConfigs(locales[name]._config, config));
            } else {
                // MERGE
                tmpLocale = loadLocale(name);
                if (tmpLocale != null) {
                    parentConfig = tmpLocale._config;
                }
                config = mergeConfigs(parentConfig, config);
                if (tmpLocale == null) {
                    // updateLocale is called for creating a new locale
                    // Set abbr so it will have a name (getters return
                    // undefined otherwise).
                    config.abbr = name;
                }
                locale = new Locale(config);
                locale.parentLocale = locales[name];
                locales[name] = locale;
            }

            // backwards compat for now: also set the locale
            getSetGlobalLocale(name);
        } else {
            // pass null for config to unupdate, useful for tests
            if (locales[name] != null) {
                if (locales[name].parentLocale != null) {
                    locales[name] = locales[name].parentLocale;
                    if (name === getSetGlobalLocale()) {
                        getSetGlobalLocale(name);
                    }
                } else if (locales[name] != null) {
                    delete locales[name];
                }
            }
        }
        return locales[name];
    }

    // returns locale data
    function getLocale(key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    function listLocales() {
        return keys(locales);
    }

    function checkOverflow(m) {
        var overflow,
            a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH] < 0 || a[MONTH] > 11
                    ? MONTH
                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
                    ? DATE
                    : a[HOUR] < 0 ||
                      a[HOUR] > 24 ||
                      (a[HOUR] === 24 &&
                          (a[MINUTE] !== 0 ||
                              a[SECOND] !== 0 ||
                              a[MILLISECOND] !== 0))
                    ? HOUR
                    : a[MINUTE] < 0 || a[MINUTE] > 59
                    ? MINUTE
                    : a[SECOND] < 0 || a[SECOND] > 59
                    ? SECOND
                    : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
                    ? MILLISECOND
                    : -1;

            if (
                getParsingFlags(m)._overflowDayOfYear &&
                (overflow < YEAR || overflow > DATE)
            ) {
                overflow = DATE;
            }
            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
                overflow = WEEK;
            }
            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
                overflow = WEEKDAY;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
        isoDates = [
            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
            ['YYYY-DDD', /\d{4}-\d{3}/],
            ['YYYY-MM', /\d{4}-\d\d/, false],
            ['YYYYYYMMDD', /[+-]\d{10}/],
            ['YYYYMMDD', /\d{8}/],
            ['GGGG[W]WWE', /\d{4}W\d{3}/],
            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
            ['YYYYDDD', /\d{7}/],
            ['YYYYMM', /\d{6}/, false],
            ['YYYY', /\d{4}/, false],
        ],
        // iso time formats and regexes
        isoTimes = [
            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
            ['HH:mm', /\d\d:\d\d/],
            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
            ['HHmmss', /\d\d\d\d\d\d/],
            ['HHmm', /\d\d\d\d/],
            ['HH', /\d\d/],
        ],
        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
        rfc2822 = /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
        obsOffsets = {
            UT: 0,
            GMT: 0,
            EDT: -4 * 60,
            EST: -5 * 60,
            CDT: -5 * 60,
            CST: -6 * 60,
            MDT: -6 * 60,
            MST: -7 * 60,
            PDT: -7 * 60,
            PST: -8 * 60,
        };

    // date from iso format
    function configFromISO(config) {
        var i,
            l,
            string = config._i,
            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
            allowTime,
            dateFormat,
            timeFormat,
            tzFormat;

        if (match) {
            getParsingFlags(config).iso = true;

            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(match[1])) {
                    dateFormat = isoDates[i][0];
                    allowTime = isoDates[i][2] !== false;
                    break;
                }
            }
            if (dateFormat == null) {
                config._isValid = false;
                return;
            }
            if (match[3]) {
                for (i = 0, l = isoTimes.length; i < l; i++) {
                    if (isoTimes[i][1].exec(match[3])) {
                        // match[2] should be 'T' or space
                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
                        break;
                    }
                }
                if (timeFormat == null) {
                    config._isValid = false;
                    return;
                }
            }
            if (!allowTime && timeFormat != null) {
                config._isValid = false;
                return;
            }
            if (match[4]) {
                if (tzRegex.exec(match[4])) {
                    tzFormat = 'Z';
                } else {
                    config._isValid = false;
                    return;
                }
            }
            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    function extractFromRFC2822Strings(
        yearStr,
        monthStr,
        dayStr,
        hourStr,
        minuteStr,
        secondStr
    ) {
        var result = [
            untruncateYear(yearStr),
            defaultLocaleMonthsShort.indexOf(monthStr),
            parseInt(dayStr, 10),
            parseInt(hourStr, 10),
            parseInt(minuteStr, 10),
        ];

        if (secondStr) {
            result.push(parseInt(secondStr, 10));
        }

        return result;
    }

    function untruncateYear(yearStr) {
        var year = parseInt(yearStr, 10);
        if (year <= 49) {
            return 2000 + year;
        } else if (year <= 999) {
            return 1900 + year;
        }
        return year;
    }

    function preprocessRFC2822(s) {
        // Remove comments and folding whitespace and replace multiple-spaces with a single space
        return s
            .replace(/\([^)]*\)|[\n\t]/g, ' ')
            .replace(/(\s\s+)/g, ' ')
            .replace(/^\s\s*/, '')
            .replace(/\s\s*$/, '');
    }

    function checkWeekday(weekdayStr, parsedInput, config) {
        if (weekdayStr) {
            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
                weekdayActual = new Date(
                    parsedInput[0],
                    parsedInput[1],
                    parsedInput[2]
                ).getDay();
            if (weekdayProvided !== weekdayActual) {
                getParsingFlags(config).weekdayMismatch = true;
                config._isValid = false;
                return false;
            }
        }
        return true;
    }

    function calculateOffset(obsOffset, militaryOffset, numOffset) {
        if (obsOffset) {
            return obsOffsets[obsOffset];
        } else if (militaryOffset) {
            // the only allowed military tz is Z
            return 0;
        } else {
            var hm = parseInt(numOffset, 10),
                m = hm % 100,
                h = (hm - m) / 100;
            return h * 60 + m;
        }
    }

    // date and time from ref 2822 format
    function configFromRFC2822(config) {
        var match = rfc2822.exec(preprocessRFC2822(config._i)),
            parsedArray;
        if (match) {
            parsedArray = extractFromRFC2822Strings(
                match[4],
                match[3],
                match[2],
                match[5],
                match[6],
                match[7]
            );
            if (!checkWeekday(match[1], parsedArray, config)) {
                return;
            }

            config._a = parsedArray;
            config._tzm = calculateOffset(match[8], match[9], match[10]);

            config._d = createUTCDate.apply(null, config._a);
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

            getParsingFlags(config).rfc2822 = true;
        } else {
            config._isValid = false;
        }
    }

    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);
        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        configFromRFC2822(config);
        if (config._isValid === false) {
            delete config._isValid;
        } else {
            return;
        }

        if (config._strict) {
            config._isValid = false;
        } else {
            // Final attempt, use Input Fallback
            hooks.createFromInputFallback(config);
        }
    }

    hooks.createFromInputFallback = deprecate(
        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
            'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        // hooks is actually the exported moment object
        var nowValue = new Date(hooks.now());
        if (config._useUTC) {
            return [
                nowValue.getUTCFullYear(),
                nowValue.getUTCMonth(),
                nowValue.getUTCDate(),
            ];
        }
        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray(config) {
        var i,
            date,
            input = [],
            currentDate,
            expectedWeekday,
            yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear != null) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (
                config._dayOfYear > daysInYear(yearToUse) ||
                config._dayOfYear === 0
            ) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] =
                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (
            config._a[HOUR] === 24 &&
            config._a[MINUTE] === 0 &&
            config._a[SECOND] === 0 &&
            config._a[MILLISECOND] === 0
        ) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(
            null,
            input
        );
        expectedWeekday = config._useUTC
            ? config._d.getUTCDay()
            : config._d.getDay();

        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }

        // check for mismatching day of week
        if (
            config._w &&
            typeof config._w.d !== 'undefined' &&
            config._w.d !== expectedWeekday
        ) {
            getParsingFlags(config).weekdayMismatch = true;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(
                w.GG,
                config._a[YEAR],
                weekOfYear(createLocal(), 1, 4).year
            );
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
            if (weekday < 1 || weekday > 7) {
                weekdayOverflow = true;
            }
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            curWeek = weekOfYear(createLocal(), dow, doy);

            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

            // Default to current week.
            week = defaults(w.w, curWeek.week);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < 0 || weekday > 6) {
                    weekdayOverflow = true;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from beginning of week
                weekday = w.e + dow;
                if (w.e < 0 || w.e > 6) {
                    weekdayOverflow = true;
                }
            } else {
                // default to beginning of week
                weekday = dow;
            }
        }
        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
            getParsingFlags(config)._overflowWeeks = true;
        } else if (weekdayOverflow != null) {
            getParsingFlags(config)._overflowWeekday = true;
        } else {
            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
            config._a[YEAR] = temp.year;
            config._dayOfYear = temp.dayOfYear;
        }
    }

    // constant that refers to the ISO standard
    hooks.ISO_8601 = function () {};

    // constant that refers to the RFC 2822 form
    hooks.RFC_2822 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === hooks.ISO_8601) {
            configFromISO(config);
            return;
        }
        if (config._f === hooks.RFC_2822) {
            configFromRFC2822(config);
            return;
        }
        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i,
            parsedInput,
            tokens,
            token,
            skipped,
            stringLength = string.length,
            totalParsedInputLength = 0,
            era;

        tokens =
            expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
                [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(
                    string.indexOf(parsedInput) + parsedInput.length
                );
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                } else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            } else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver =
            stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (
            config._a[HOUR] <= 12 &&
            getParsingFlags(config).bigHour === true &&
            config._a[HOUR] > 0
        ) {
            getParsingFlags(config).bigHour = undefined;
        }

        getParsingFlags(config).parsedDateParts = config._a.slice(0);
        getParsingFlags(config).meridiem = config._meridiem;
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(
            config._locale,
            config._a[HOUR],
            config._meridiem
        );

        // handle era
        era = getParsingFlags(config).era;
        if (era !== null) {
            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
        }

        configFromArray(config);
        checkOverflow(config);
    }

    function meridiemFixWrap(locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,
            scoreToBeat,
            i,
            currentScore,
            validFormatFound,
            bestFormatIsValid = false;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            validFormatFound = false;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (isValid(tempConfig)) {
                validFormatFound = true;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (!bestFormatIsValid) {
                if (
                    scoreToBeat == null ||
                    currentScore < scoreToBeat ||
                    validFormatFound
                ) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                    if (validFormatFound) {
                        bestFormatIsValid = true;
                    }
                }
            } else {
                if (currentScore < scoreToBeat) {
                    scoreToBeat = currentScore;
                    bestMoment = tempConfig;
                }
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i),
            dayOrDate = i.day === undefined ? i.date : i.day;
        config._a = map(
            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
            function (obj) {
                return obj && parseInt(obj, 10);
            }
        );

        configFromArray(config);
    }

    function createFromConfig(config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig(config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return createInvalid({ nullInput: true });
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isDate(input)) {
            config._d = input;
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else {
            configFromInput(config);
        }

        if (!isValid(config)) {
            config._d = null;
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (isUndefined(input)) {
            config._d = new Date(hooks.now());
        } else if (isDate(input)) {
            config._d = new Date(input.valueOf());
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (isObject(input)) {
            configFromObject(config);
        } else if (isNumber(input)) {
            // from milliseconds
            config._d = new Date(input);
        } else {
            hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC(input, format, locale, strict, isUTC) {
        var c = {};

        if (format === true || format === false) {
            strict = format;
            format = undefined;
        }

        if (locale === true || locale === false) {
            strict = locale;
            locale = undefined;
        }

        if (
            (isObject(input) && isObjectEmpty(input)) ||
            (isArray(input) && input.length === 0)
        ) {
            input = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function createLocal(input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other < this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        ),
        prototypeMax = deprecate(
            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
            function () {
                var other = createLocal.apply(null, arguments);
                if (this.isValid() && other.isValid()) {
                    return other > this ? this : other;
                } else {
                    return createInvalid();
                }
            }
        );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max() {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    var now = function () {
        return Date.now ? Date.now() : +new Date();
    };

    var ordering = [
        'year',
        'quarter',
        'month',
        'week',
        'day',
        'hour',
        'minute',
        'second',
        'millisecond',
    ];

    function isDurationValid(m) {
        var key,
            unitHasDecimal = false,
            i;
        for (key in m) {
            if (
                hasOwnProp(m, key) &&
                !(
                    indexOf.call(ordering, key) !== -1 &&
                    (m[key] == null || !isNaN(m[key]))
                )
            ) {
                return false;
            }
        }

        for (i = 0; i < ordering.length; ++i) {
            if (m[ordering[i]]) {
                if (unitHasDecimal) {
                    return false; // only allow non-integers for smallest unit
                }
                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
                    unitHasDecimal = true;
                }
            }
        }

        return true;
    }

    function isValid$1() {
        return this._isValid;
    }

    function createInvalid$1() {
        return createDuration(NaN);
    }

    function Duration(duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        this._isValid = isDurationValid(normalizedInput);

        // representation for dateAddRemove
        this._milliseconds =
            +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days + weeks * 7;
        // It is impossible to translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months + quarters * 3 + years * 12;

        this._data = {};

        this._locale = getLocale();

        this._bubble();
    }

    function isDuration(obj) {
        return obj instanceof Duration;
    }

    function absRound(number) {
        if (number < 0) {
            return Math.round(-1 * number) * -1;
        } else {
            return Math.round(number);
        }
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if (
                (dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
            ) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    // FORMATTING

    function offset(token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset(),
                sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return (
                sign +
                zeroFill(~~(offset / 60), 2) +
                separator +
                zeroFill(~~offset % 60, 2)
            );
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z', matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
        var matches = (string || '').match(matcher),
            chunk,
            parts,
            minutes;

        if (matches === null) {
            return null;
        }

        chunk = matches[matches.length - 1] || [];
        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        minutes = +(parts[1] * 60) + toInt(parts[2]);

        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff =
                (isMoment(input) || isDate(input)
                    ? input.valueOf()
                    : createLocal(input).valueOf()) - res.valueOf();
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(res._d.valueOf() + diff);
            hooks.updateOffset(res, false);
            return res;
        } else {
            return createLocal(input).local();
        }
    }

    function getDateOffset(m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset());
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset(input, keepLocalTime, keepMinutes) {
        var offset = this._offset || 0,
            localAdjust;
        if (!this.isValid()) {
            return input != null ? this : NaN;
        }
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(matchShortOffset, input);
                if (input === null) {
                    return this;
                }
            } else if (Math.abs(input) < 16 && !keepMinutes) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    addSubtract(
                        this,
                        createDuration(input - offset, 'm'),
                        1,
                        false
                    );
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone(input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC(keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal(keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset() {
        if (this._tzm != null) {
            this.utcOffset(this._tzm, false, true);
        } else if (typeof this._i === 'string') {
            var tZone = offsetFromString(matchOffset, this._i);
            if (tZone != null) {
                this.utcOffset(tZone);
            } else {
                this.utcOffset(0, true);
            }
        }
        return this;
    }

    function hasAlignedHourOffset(input) {
        if (!this.isValid()) {
            return false;
        }
        input = input ? createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime() {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted() {
        if (!isUndefined(this._isDSTShifted)) {
            return this._isDSTShifted;
        }

        var c = {},
            other;

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
            this._isDSTShifted =
                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal() {
        return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset() {
        return this.isValid() ? this._isUTC : false;
    }

    function isUtc() {
        return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
        // and further modified to allow for strings containing both week and day
        isoRegex = /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

    function createDuration(input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms: input._milliseconds,
                d: input._days,
                M: input._months,
            };
        } else if (isNumber(input) || !isNaN(+input)) {
            duration = {};
            if (key) {
                duration[key] = +input;
            } else {
                duration.milliseconds = +input;
            }
        } else if ((match = aspNetRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: 0,
                d: toInt(match[DATE]) * sign,
                h: toInt(match[HOUR]) * sign,
                m: toInt(match[MINUTE]) * sign,
                s: toInt(match[SECOND]) * sign,
                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
            };
        } else if ((match = isoRegex.exec(input))) {
            sign = match[1] === '-' ? -1 : 1;
            duration = {
                y: parseIso(match[2], sign),
                M: parseIso(match[3], sign),
                w: parseIso(match[4], sign),
                d: parseIso(match[5], sign),
                h: parseIso(match[6], sign),
                m: parseIso(match[7], sign),
                s: parseIso(match[8], sign),
            };
        } else if (duration == null) {
            // checks for null or undefined
            duration = {};
        } else if (
            typeof duration === 'object' &&
            ('from' in duration || 'to' in duration)
        ) {
            diffRes = momentsDifference(
                createLocal(duration.from),
                createLocal(duration.to)
            );

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
            ret._isValid = input._isValid;
        }

        return ret;
    }

    createDuration.fn = Duration.prototype;
    createDuration.invalid = createInvalid$1;

    function parseIso(inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {};

        res.months =
            other.month() - base.month() + (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +base.clone().add(res.months, 'M');

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        if (!(base.isValid() && other.isValid())) {
            return { milliseconds: 0, months: 0 };
        }

        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(
                    name,
                    'moment().' +
                        name +
                        '(period, number) is deprecated. Please use moment().' +
                        name +
                        '(number, period). ' +
                        'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
                );
                tmp = val;
                val = period;
                period = tmp;
            }

            dur = createDuration(val, period);
            addSubtract(this, dur, direction);
            return this;
        };
    }

    function addSubtract(mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = absRound(duration._days),
            months = absRound(duration._months);

        if (!mom.isValid()) {
            // No op
            return;
        }

        updateOffset = updateOffset == null ? true : updateOffset;

        if (months) {
            setMonth(mom, get(mom, 'Month') + months * isAdding);
        }
        if (days) {
            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
        }
        if (milliseconds) {
            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
        }
        if (updateOffset) {
            hooks.updateOffset(mom, days || months);
        }
    }

    var add = createAdder(1, 'add'),
        subtract = createAdder(-1, 'subtract');

    function isString(input) {
        return typeof input === 'string' || input instanceof String;
    }

    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
    function isMomentInput(input) {
        return (
            isMoment(input) ||
            isDate(input) ||
            isString(input) ||
            isNumber(input) ||
            isNumberOrStringArray(input) ||
            isMomentInputObject(input) ||
            input === null ||
            input === undefined
        );
    }

    function isMomentInputObject(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'years',
                'year',
                'y',
                'months',
                'month',
                'M',
                'days',
                'day',
                'd',
                'dates',
                'date',
                'D',
                'hours',
                'hour',
                'h',
                'minutes',
                'minute',
                'm',
                'seconds',
                'second',
                's',
                'milliseconds',
                'millisecond',
                'ms',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function isNumberOrStringArray(input) {
        var arrayTest = isArray(input),
            dataTypeTest = false;
        if (arrayTest) {
            dataTypeTest =
                input.filter(function (item) {
                    return !isNumber(item) && isString(input);
                }).length === 0;
        }
        return arrayTest && dataTypeTest;
    }

    function isCalendarSpec(input) {
        var objectTest = isObject(input) && !isObjectEmpty(input),
            propertyTest = false,
            properties = [
                'sameDay',
                'nextDay',
                'lastDay',
                'nextWeek',
                'lastWeek',
                'sameElse',
            ],
            i,
            property;

        for (i = 0; i < properties.length; i += 1) {
            property = properties[i];
            propertyTest = propertyTest || hasOwnProp(input, property);
        }

        return objectTest && propertyTest;
    }

    function getCalendarFormat(myMoment, now) {
        var diff = myMoment.diff(now, 'days', true);
        return diff < -6
            ? 'sameElse'
            : diff < -1
            ? 'lastWeek'
            : diff < 0
            ? 'lastDay'
            : diff < 1
            ? 'sameDay'
            : diff < 2
            ? 'nextDay'
            : diff < 7
            ? 'nextWeek'
            : 'sameElse';
    }

    function calendar$1(time, formats) {
        // Support for single parameter, formats only overload to the calendar function
        if (arguments.length === 1) {
            if (!arguments[0]) {
                time = undefined;
                formats = undefined;
            } else if (isMomentInput(arguments[0])) {
                time = arguments[0];
                formats = undefined;
            } else if (isCalendarSpec(arguments[0])) {
                formats = arguments[0];
                time = undefined;
            }
        }
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            format = hooks.calendarFormat(this, sod) || 'sameElse',
            output =
                formats &&
                (isFunction(formats[format])
                    ? formats[format].call(this, now)
                    : formats[format]);

        return this.format(
            output || this.localeData().calendar(format, this, createLocal(now))
        );
    }

    function clone() {
        return new Moment(this);
    }

    function isAfter(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() > localInput.valueOf();
        } else {
            return localInput.valueOf() < this.clone().startOf(units).valueOf();
        }
    }

    function isBefore(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input);
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() < localInput.valueOf();
        } else {
            return this.clone().endOf(units).valueOf() < localInput.valueOf();
        }
    }

    function isBetween(from, to, units, inclusivity) {
        var localFrom = isMoment(from) ? from : createLocal(from),
            localTo = isMoment(to) ? to : createLocal(to);
        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
            return false;
        }
        inclusivity = inclusivity || '()';
        return (
            (inclusivity[0] === '('
                ? this.isAfter(localFrom, units)
                : !this.isBefore(localFrom, units)) &&
            (inclusivity[1] === ')'
                ? this.isBefore(localTo, units)
                : !this.isAfter(localTo, units))
        );
    }

    function isSame(input, units) {
        var localInput = isMoment(input) ? input : createLocal(input),
            inputMs;
        if (!(this.isValid() && localInput.isValid())) {
            return false;
        }
        units = normalizeUnits(units) || 'millisecond';
        if (units === 'millisecond') {
            return this.valueOf() === localInput.valueOf();
        } else {
            inputMs = localInput.valueOf();
            return (
                this.clone().startOf(units).valueOf() <= inputMs &&
                inputMs <= this.clone().endOf(units).valueOf()
            );
        }
    }

    function isSameOrAfter(input, units) {
        return this.isSame(input, units) || this.isAfter(input, units);
    }

    function isSameOrBefore(input, units) {
        return this.isSame(input, units) || this.isBefore(input, units);
    }

    function diff(input, units, asFloat) {
        var that, zoneDelta, output;

        if (!this.isValid()) {
            return NaN;
        }

        that = cloneWithOffset(input, this);

        if (!that.isValid()) {
            return NaN;
        }

        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

        units = normalizeUnits(units);

        switch (units) {
            case 'year':
                output = monthDiff(this, that) / 12;
                break;
            case 'month':
                output = monthDiff(this, that);
                break;
            case 'quarter':
                output = monthDiff(this, that) / 3;
                break;
            case 'second':
                output = (this - that) / 1e3;
                break; // 1000
            case 'minute':
                output = (this - that) / 6e4;
                break; // 1000 * 60
            case 'hour':
                output = (this - that) / 36e5;
                break; // 1000 * 60 * 60
            case 'day':
                output = (this - that - zoneDelta) / 864e5;
                break; // 1000 * 60 * 60 * 24, negate dst
            case 'week':
                output = (this - that - zoneDelta) / 6048e5;
                break; // 1000 * 60 * 60 * 24 * 7, negate dst
            default:
                output = this - that;
        }

        return asFloat ? output : absFloor(output);
    }

    function monthDiff(a, b) {
        if (a.date() < b.date()) {
            // end-of-month calculations work correct when the start month has more
            // days than the end month.
            return -monthDiff(b, a);
        }
        // difference in months
        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2,
            adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        //check for negative zero, return zero if negative zero
        return -(wholeMonthDiff + adjust) || 0;
    }

    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString() {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function toISOString(keepOffset) {
        if (!this.isValid()) {
            return null;
        }
        var utc = keepOffset !== true,
            m = utc ? this.clone().utc() : this;
        if (m.year() < 0 || m.year() > 9999) {
            return formatMoment(
                m,
                utc
                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
            );
        }
        if (isFunction(Date.prototype.toISOString)) {
            // native implementation is ~50x faster, use it when we can
            if (utc) {
                return this.toDate().toISOString();
            } else {
                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
                    .toISOString()
                    .replace('Z', formatMoment(m, 'Z'));
            }
        }
        return formatMoment(
            m,
            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
        );
    }

    /**
     * Return a human readable representation of a moment that can
     * also be evaluated to get a new moment which is the same
     *
     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
     */
    function inspect() {
        if (!this.isValid()) {
            return 'moment.invalid(/* ' + this._i + ' */)';
        }
        var func = 'moment',
            zone = '',
            prefix,
            year,
            datetime,
            suffix;
        if (!this.isLocal()) {
            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
            zone = 'Z';
        }
        prefix = '[' + func + '("]';
        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
        datetime = '-MM-DD[T]HH:mm:ss.SSS';
        suffix = zone + '[")]';

        return this.format(prefix + year + datetime + suffix);
    }

    function format(inputString) {
        if (!inputString) {
            inputString = this.isUtc()
                ? hooks.defaultFormatUtc
                : hooks.defaultFormat;
        }
        var output = formatMoment(this, inputString);
        return this.localeData().postformat(output);
    }

    function from(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ to: this, from: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function fromNow(withoutSuffix) {
        return this.from(createLocal(), withoutSuffix);
    }

    function to(time, withoutSuffix) {
        if (
            this.isValid() &&
            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
        ) {
            return createDuration({ from: this, to: time })
                .locale(this.locale())
                .humanize(!withoutSuffix);
        } else {
            return this.localeData().invalidDate();
        }
    }

    function toNow(withoutSuffix) {
        return this.to(createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale(key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData() {
        return this._locale;
    }

    var MS_PER_SECOND = 1000,
        MS_PER_MINUTE = 60 * MS_PER_SECOND,
        MS_PER_HOUR = 60 * MS_PER_MINUTE,
        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

    // actual modulo - handles negative numbers (for dates before 1970):
    function mod$1(dividend, divisor) {
        return ((dividend % divisor) + divisor) % divisor;
    }

    function localStartOfDate(y, m, d) {
        // the date constructor remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return new Date(y, m, d).valueOf();
        }
    }

    function utcStartOfDate(y, m, d) {
        // Date.UTC remaps years 0-99 to 1900-1999
        if (y < 100 && y >= 0) {
            // preserve leap years using a full 400 year cycle, then reset
            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
        } else {
            return Date.UTC(y, m, d);
        }
    }

    function startOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year(), 0, 1);
                break;
            case 'quarter':
                time = startOfDate(
                    this.year(),
                    this.month() - (this.month() % 3),
                    1
                );
                break;
            case 'month':
                time = startOfDate(this.year(), this.month(), 1);
                break;
            case 'week':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - this.weekday()
                );
                break;
            case 'isoWeek':
                time = startOfDate(
                    this.year(),
                    this.month(),
                    this.date() - (this.isoWeekday() - 1)
                );
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date());
                break;
            case 'hour':
                time = this._d.valueOf();
                time -= mod$1(
                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                    MS_PER_HOUR
                );
                break;
            case 'minute':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_MINUTE);
                break;
            case 'second':
                time = this._d.valueOf();
                time -= mod$1(time, MS_PER_SECOND);
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function endOf(units) {
        var time, startOfDate;
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond' || !this.isValid()) {
            return this;
        }

        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

        switch (units) {
            case 'year':
                time = startOfDate(this.year() + 1, 0, 1) - 1;
                break;
            case 'quarter':
                time =
                    startOfDate(
                        this.year(),
                        this.month() - (this.month() % 3) + 3,
                        1
                    ) - 1;
                break;
            case 'month':
                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
                break;
            case 'week':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - this.weekday() + 7
                    ) - 1;
                break;
            case 'isoWeek':
                time =
                    startOfDate(
                        this.year(),
                        this.month(),
                        this.date() - (this.isoWeekday() - 1) + 7
                    ) - 1;
                break;
            case 'day':
            case 'date':
                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
                break;
            case 'hour':
                time = this._d.valueOf();
                time +=
                    MS_PER_HOUR -
                    mod$1(
                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
                        MS_PER_HOUR
                    ) -
                    1;
                break;
            case 'minute':
                time = this._d.valueOf();
                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
                break;
            case 'second':
                time = this._d.valueOf();
                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
                break;
        }

        this._d.setTime(time);
        hooks.updateOffset(this, true);
        return this;
    }

    function valueOf() {
        return this._d.valueOf() - (this._offset || 0) * 60000;
    }

    function unix() {
        return Math.floor(this.valueOf() / 1000);
    }

    function toDate() {
        return new Date(this.valueOf());
    }

    function toArray() {
        var m = this;
        return [
            m.year(),
            m.month(),
            m.date(),
            m.hour(),
            m.minute(),
            m.second(),
            m.millisecond(),
        ];
    }

    function toObject() {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds(),
        };
    }

    function toJSON() {
        // new Date(NaN).toJSON() === null
        return this.isValid() ? this.toISOString() : null;
    }

    function isValid$2() {
        return isValid(this);
    }

    function parsingFlags() {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt() {
        return getParsingFlags(this).overflow;
    }

    function creationData() {
        return {
            input: this._i,
            format: this._f,
            locale: this._locale,
            isUTC: this._isUTC,
            strict: this._strict,
        };
    }

    addFormatToken('N', 0, 0, 'eraAbbr');
    addFormatToken('NN', 0, 0, 'eraAbbr');
    addFormatToken('NNN', 0, 0, 'eraAbbr');
    addFormatToken('NNNN', 0, 0, 'eraName');
    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
    addFormatToken('y', ['yy', 2], 0, 'eraYear');
    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

    addRegexToken('N', matchEraAbbr);
    addRegexToken('NN', matchEraAbbr);
    addRegexToken('NNN', matchEraAbbr);
    addRegexToken('NNNN', matchEraName);
    addRegexToken('NNNNN', matchEraNarrow);

    addParseToken(['N', 'NN', 'NNN', 'NNNN', 'NNNNN'], function (
        input,
        array,
        config,
        token
    ) {
        var era = config._locale.erasParse(input, token, config._strict);
        if (era) {
            getParsingFlags(config).era = era;
        } else {
            getParsingFlags(config).invalidEra = input;
        }
    });

    addRegexToken('y', matchUnsigned);
    addRegexToken('yy', matchUnsigned);
    addRegexToken('yyy', matchUnsigned);
    addRegexToken('yyyy', matchUnsigned);
    addRegexToken('yo', matchEraYearOrdinal);

    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
    addParseToken(['yo'], function (input, array, config, token) {
        var match;
        if (config._locale._eraYearOrdinalRegex) {
            match = input.match(config._locale._eraYearOrdinalRegex);
        }

        if (config._locale.eraYearOrdinalParse) {
            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
        } else {
            array[YEAR] = parseInt(input, 10);
        }
    });

    function localeEras(m, format) {
        var i,
            l,
            date,
            eras = this._eras || getLocale('en')._eras;
        for (i = 0, l = eras.length; i < l; ++i) {
            switch (typeof eras[i].since) {
                case 'string':
                    // truncate time
                    date = hooks(eras[i].since).startOf('day');
                    eras[i].since = date.valueOf();
                    break;
            }

            switch (typeof eras[i].until) {
                case 'undefined':
                    eras[i].until = +Infinity;
                    break;
                case 'string':
                    // truncate time
                    date = hooks(eras[i].until).startOf('day').valueOf();
                    eras[i].until = date.valueOf();
                    break;
            }
        }
        return eras;
    }

    function localeErasParse(eraName, format, strict) {
        var i,
            l,
            eras = this.eras(),
            name,
            abbr,
            narrow;
        eraName = eraName.toUpperCase();

        for (i = 0, l = eras.length; i < l; ++i) {
            name = eras[i].name.toUpperCase();
            abbr = eras[i].abbr.toUpperCase();
            narrow = eras[i].narrow.toUpperCase();

            if (strict) {
                switch (format) {
                    case 'N':
                    case 'NN':
                    case 'NNN':
                        if (abbr === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNN':
                        if (name === eraName) {
                            return eras[i];
                        }
                        break;

                    case 'NNNNN':
                        if (narrow === eraName) {
                            return eras[i];
                        }
                        break;
                }
            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
                return eras[i];
            }
        }
    }

    function localeErasConvertYear(era, year) {
        var dir = era.since <= era.until ? +1 : -1;
        if (year === undefined) {
            return hooks(era.since).year();
        } else {
            return hooks(era.since).year() + (year - era.offset) * dir;
        }
    }

    function getEraName() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].name;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].name;
            }
        }

        return '';
    }

    function getEraNarrow() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].narrow;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].narrow;
            }
        }

        return '';
    }

    function getEraAbbr() {
        var i,
            l,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (eras[i].since <= val && val <= eras[i].until) {
                return eras[i].abbr;
            }
            if (eras[i].until <= val && val <= eras[i].since) {
                return eras[i].abbr;
            }
        }

        return '';
    }

    function getEraYear() {
        var i,
            l,
            dir,
            val,
            eras = this.localeData().eras();
        for (i = 0, l = eras.length; i < l; ++i) {
            dir = eras[i].since <= eras[i].until ? +1 : -1;

            // truncate time
            val = this.clone().startOf('day').valueOf();

            if (
                (eras[i].since <= val && val <= eras[i].until) ||
                (eras[i].until <= val && val <= eras[i].since)
            ) {
                return (
                    (this.year() - hooks(eras[i].since).year()) * dir +
                    eras[i].offset
                );
            }
        }

        return this.year();
    }

    function erasNameRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNameRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNameRegex : this._erasRegex;
    }

    function erasAbbrRegex(isStrict) {
        if (!hasOwnProp(this, '_erasAbbrRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasAbbrRegex : this._erasRegex;
    }

    function erasNarrowRegex(isStrict) {
        if (!hasOwnProp(this, '_erasNarrowRegex')) {
            computeErasParse.call(this);
        }
        return isStrict ? this._erasNarrowRegex : this._erasRegex;
    }

    function matchEraAbbr(isStrict, locale) {
        return locale.erasAbbrRegex(isStrict);
    }

    function matchEraName(isStrict, locale) {
        return locale.erasNameRegex(isStrict);
    }

    function matchEraNarrow(isStrict, locale) {
        return locale.erasNarrowRegex(isStrict);
    }

    function matchEraYearOrdinal(isStrict, locale) {
        return locale._eraYearOrdinalRegex || matchUnsigned;
    }

    function computeErasParse() {
        var abbrPieces = [],
            namePieces = [],
            narrowPieces = [],
            mixedPieces = [],
            i,
            l,
            eras = this.eras();

        for (i = 0, l = eras.length; i < l; ++i) {
            namePieces.push(regexEscape(eras[i].name));
            abbrPieces.push(regexEscape(eras[i].abbr));
            narrowPieces.push(regexEscape(eras[i].narrow));

            mixedPieces.push(regexEscape(eras[i].name));
            mixedPieces.push(regexEscape(eras[i].abbr));
            mixedPieces.push(regexEscape(eras[i].narrow));
        }

        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
        this._erasNarrowRegex = new RegExp(
            '^(' + narrowPieces.join('|') + ')',
            'i'
        );
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken(token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg', 'weekYear');
    addWeekYearFormatToken('ggggg', 'weekYear');
    addWeekYearFormatToken('GGGG', 'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);

    // PARSING

    addRegexToken('G', matchSigned);
    addRegexToken('g', matchSigned);
    addRegexToken('GG', match1to2, match2);
    addRegexToken('gg', match1to2, match2);
    addRegexToken('GGGG', match1to4, match4);
    addRegexToken('gggg', match1to4, match4);
    addRegexToken('GGGGG', match1to6, match6);
    addRegexToken('ggggg', match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (
        input,
        week,
        config,
        token
    ) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.week(),
            this.weekday(),
            this.localeData()._week.dow,
            this.localeData()._week.doy
        );
    }

    function getSetISOWeekYear(input) {
        return getSetWeekYearHelper.call(
            this,
            input,
            this.isoWeek(),
            this.isoWeekday(),
            1,
            4
        );
    }

    function getISOWeeksInYear() {
        return weeksInYear(this.year(), 1, 4);
    }

    function getISOWeeksInISOWeekYear() {
        return weeksInYear(this.isoWeekYear(), 1, 4);
    }

    function getWeeksInYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getWeeksInWeekYear() {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
        var weeksTarget;
        if (input == null) {
            return weekOfYear(this, dow, doy).year;
        } else {
            weeksTarget = weeksInYear(input, dow, doy);
            if (week > weeksTarget) {
                week = weeksTarget;
            }
            return setWeekAll.call(this, input, week, weekday, dow, doy);
        }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

        this.year(date.getUTCFullYear());
        this.month(date.getUTCMonth());
        this.date(date.getUTCDate());
        return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter(input) {
        return input == null
            ? Math.ceil((this.month() + 1) / 3)
            : this.month((input - 1) * 3 + (this.month() % 3));
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIORITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D', match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        // TODO: Remove "ordinalParse" fallback in next major release.
        return isStrict
            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
            : locale._dayOfMonthOrdinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0]);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD', match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear(input) {
        var dayOfYear =
            Math.round(
                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
            ) + 1;
        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m', match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s', match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });

    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S', match1to3, match1);
    addRegexToken('SS', match1to3, match2);
    addRegexToken('SSS', match1to3, match3);

    var token, getSetMillisecond;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }

    getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z', 0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr() {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName() {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var proto = Moment.prototype;

    proto.add = add;
    proto.calendar = calendar$1;
    proto.clone = clone;
    proto.diff = diff;
    proto.endOf = endOf;
    proto.format = format;
    proto.from = from;
    proto.fromNow = fromNow;
    proto.to = to;
    proto.toNow = toNow;
    proto.get = stringGet;
    proto.invalidAt = invalidAt;
    proto.isAfter = isAfter;
    proto.isBefore = isBefore;
    proto.isBetween = isBetween;
    proto.isSame = isSame;
    proto.isSameOrAfter = isSameOrAfter;
    proto.isSameOrBefore = isSameOrBefore;
    proto.isValid = isValid$2;
    proto.lang = lang;
    proto.locale = locale;
    proto.localeData = localeData;
    proto.max = prototypeMax;
    proto.min = prototypeMin;
    proto.parsingFlags = parsingFlags;
    proto.set = stringSet;
    proto.startOf = startOf;
    proto.subtract = subtract;
    proto.toArray = toArray;
    proto.toObject = toObject;
    proto.toDate = toDate;
    proto.toISOString = toISOString;
    proto.inspect = inspect;
    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
            return 'Moment<' + this.format() + '>';
        };
    }
    proto.toJSON = toJSON;
    proto.toString = toString;
    proto.unix = unix;
    proto.valueOf = valueOf;
    proto.creationData = creationData;
    proto.eraName = getEraName;
    proto.eraNarrow = getEraNarrow;
    proto.eraAbbr = getEraAbbr;
    proto.eraYear = getEraYear;
    proto.year = getSetYear;
    proto.isLeapYear = getIsLeapYear;
    proto.weekYear = getSetWeekYear;
    proto.isoWeekYear = getSetISOWeekYear;
    proto.quarter = proto.quarters = getSetQuarter;
    proto.month = getSetMonth;
    proto.daysInMonth = getDaysInMonth;
    proto.week = proto.weeks = getSetWeek;
    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
    proto.weeksInYear = getWeeksInYear;
    proto.weeksInWeekYear = getWeeksInWeekYear;
    proto.isoWeeksInYear = getISOWeeksInYear;
    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
    proto.date = getSetDayOfMonth;
    proto.day = proto.days = getSetDayOfWeek;
    proto.weekday = getSetLocaleDayOfWeek;
    proto.isoWeekday = getSetISODayOfWeek;
    proto.dayOfYear = getSetDayOfYear;
    proto.hour = proto.hours = getSetHour;
    proto.minute = proto.minutes = getSetMinute;
    proto.second = proto.seconds = getSetSecond;
    proto.millisecond = proto.milliseconds = getSetMillisecond;
    proto.utcOffset = getSetOffset;
    proto.utc = setOffsetToUTC;
    proto.local = setOffsetToLocal;
    proto.parseZone = setOffsetToParsedOffset;
    proto.hasAlignedHourOffset = hasAlignedHourOffset;
    proto.isDST = isDaylightSavingTime;
    proto.isLocal = isLocal;
    proto.isUtcOffset = isUtcOffset;
    proto.isUtc = isUtc;
    proto.isUTC = isUtc;
    proto.zoneAbbr = getZoneAbbr;
    proto.zoneName = getZoneName;
    proto.dates = deprecate(
        'dates accessor is deprecated. Use date instead.',
        getSetDayOfMonth
    );
    proto.months = deprecate(
        'months accessor is deprecated. Use month instead',
        getSetMonth
    );
    proto.years = deprecate(
        'years accessor is deprecated. Use year instead',
        getSetYear
    );
    proto.zone = deprecate(
        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
        getSetZone
    );
    proto.isDSTShifted = deprecate(
        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
        isDaylightSavingTimeShifted
    );

    function createUnix(input) {
        return createLocal(input * 1000);
    }

    function createInZone() {
        return createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat(string) {
        return string;
    }

    var proto$1 = Locale.prototype;

    proto$1.calendar = calendar;
    proto$1.longDateFormat = longDateFormat;
    proto$1.invalidDate = invalidDate;
    proto$1.ordinal = ordinal;
    proto$1.preparse = preParsePostFormat;
    proto$1.postformat = preParsePostFormat;
    proto$1.relativeTime = relativeTime;
    proto$1.pastFuture = pastFuture;
    proto$1.set = set;
    proto$1.eras = localeEras;
    proto$1.erasParse = localeErasParse;
    proto$1.erasConvertYear = localeErasConvertYear;
    proto$1.erasAbbrRegex = erasAbbrRegex;
    proto$1.erasNameRegex = erasNameRegex;
    proto$1.erasNarrowRegex = erasNarrowRegex;

    proto$1.months = localeMonths;
    proto$1.monthsShort = localeMonthsShort;
    proto$1.monthsParse = localeMonthsParse;
    proto$1.monthsRegex = monthsRegex;
    proto$1.monthsShortRegex = monthsShortRegex;
    proto$1.week = localeWeek;
    proto$1.firstDayOfYear = localeFirstDayOfYear;
    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

    proto$1.weekdays = localeWeekdays;
    proto$1.weekdaysMin = localeWeekdaysMin;
    proto$1.weekdaysShort = localeWeekdaysShort;
    proto$1.weekdaysParse = localeWeekdaysParse;

    proto$1.weekdaysRegex = weekdaysRegex;
    proto$1.weekdaysShortRegex = weekdaysShortRegex;
    proto$1.weekdaysMinRegex = weekdaysMinRegex;

    proto$1.isPM = localeIsPM;
    proto$1.meridiem = localeMeridiem;

    function get$1(format, index, field, setter) {
        var locale = getLocale(),
            utc = createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function listMonthsImpl(format, index, field) {
        if (isNumber(format)) {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return get$1(format, index, field, 'month');
        }

        var i,
            out = [];
        for (i = 0; i < 12; i++) {
            out[i] = get$1(format, i, field, 'month');
        }
        return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl(localeSorted, format, index, field) {
        if (typeof localeSorted === 'boolean') {
            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        } else {
            format = localeSorted;
            index = format;
            localeSorted = false;

            if (isNumber(format)) {
                index = format;
                format = undefined;
            }

            format = format || '';
        }

        var locale = getLocale(),
            shift = localeSorted ? locale._week.dow : 0,
            i,
            out = [];

        if (index != null) {
            return get$1(format, (index + shift) % 7, field, 'day');
        }

        for (i = 0; i < 7; i++) {
            out[i] = get$1(format, (i + shift) % 7, field, 'day');
        }
        return out;
    }

    function listMonths(format, index) {
        return listMonthsImpl(format, index, 'months');
    }

    function listMonthsShort(format, index) {
        return listMonthsImpl(format, index, 'monthsShort');
    }

    function listWeekdays(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function listWeekdaysShort(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function listWeekdaysMin(localeSorted, format, index) {
        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    getSetGlobalLocale('en', {
        eras: [
            {
                since: '0001-01-01',
                until: +Infinity,
                offset: 1,
                name: 'Anno Domini',
                narrow: 'AD',
                abbr: 'AD',
            },
            {
                since: '0000-12-31',
                until: -Infinity,
                offset: 1,
                name: 'Before Christ',
                narrow: 'BC',
                abbr: 'BC',
            },
        ],
        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal: function (number) {
            var b = number % 10,
                output =
                    toInt((number % 100) / 10) === 1
                        ? 'th'
                        : b === 1
                        ? 'st'
                        : b === 2
                        ? 'nd'
                        : b === 3
                        ? 'rd'
                        : 'th';
            return number + output;
        },
    });

    // Side effect imports

    hooks.lang = deprecate(
        'moment.lang is deprecated. Use moment.locale instead.',
        getSetGlobalLocale
    );
    hooks.langData = deprecate(
        'moment.langData is deprecated. Use moment.localeData instead.',
        getLocale
    );

    var mathAbs = Math.abs;

    function abs() {
        var data = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days = mathAbs(this._days);
        this._months = mathAbs(this._months);

        data.milliseconds = mathAbs(data.milliseconds);
        data.seconds = mathAbs(data.seconds);
        data.minutes = mathAbs(data.minutes);
        data.hours = mathAbs(data.hours);
        data.months = mathAbs(data.months);
        data.years = mathAbs(data.years);

        return this;
    }

    function addSubtract$1(duration, input, value, direction) {
        var other = createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days += direction * other._days;
        duration._months += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function add$1(input, value) {
        return addSubtract$1(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function subtract$1(input, value) {
        return addSubtract$1(this, input, value, -1);
    }

    function absCeil(number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble() {
        var milliseconds = this._milliseconds,
            days = this._days,
            months = this._months,
            data = this._data,
            seconds,
            minutes,
            hours,
            years,
            monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (
            !(
                (milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0)
            )
        ) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds = absFloor(milliseconds / 1000);
        data.seconds = seconds % 60;

        minutes = absFloor(seconds / 60);
        data.minutes = minutes % 60;

        hours = absFloor(minutes / 60);
        data.hours = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days = days;
        data.months = months;
        data.years = years;

        return this;
    }

    function daysToMonths(days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return (days * 4800) / 146097;
    }

    function monthsToDays(months) {
        // the reverse of daysToMonths
        return (months * 146097) / 4800;
    }

    function as(units) {
        if (!this.isValid()) {
            return NaN;
        }
        var days,
            months,
            milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'quarter' || units === 'year') {
            days = this._days + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            switch (units) {
                case 'month':
                    return months;
                case 'quarter':
                    return months / 3;
                case 'year':
                    return months / 12;
            }
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week':
                    return days / 7 + milliseconds / 6048e5;
                case 'day':
                    return days + milliseconds / 864e5;
                case 'hour':
                    return days * 24 + milliseconds / 36e5;
                case 'minute':
                    return days * 1440 + milliseconds / 6e4;
                case 'second':
                    return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond':
                    return Math.floor(days * 864e5) + milliseconds;
                default:
                    throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function valueOf$1() {
        if (!this.isValid()) {
            return NaN;
        }
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs(alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms'),
        asSeconds = makeAs('s'),
        asMinutes = makeAs('m'),
        asHours = makeAs('h'),
        asDays = makeAs('d'),
        asWeeks = makeAs('w'),
        asMonths = makeAs('M'),
        asQuarters = makeAs('Q'),
        asYears = makeAs('y');

    function clone$1() {
        return createDuration(this);
    }

    function get$2(units) {
        units = normalizeUnits(units);
        return this.isValid() ? this[units + 's']() : NaN;
    }

    function makeGetter(name) {
        return function () {
            return this.isValid() ? this._data[name] : NaN;
        };
    }

    var milliseconds = makeGetter('milliseconds'),
        seconds = makeGetter('seconds'),
        minutes = makeGetter('minutes'),
        hours = makeGetter('hours'),
        days = makeGetter('days'),
        months = makeGetter('months'),
        years = makeGetter('years');

    function weeks() {
        return absFloor(this.days() / 7);
    }

    var round = Math.round,
        thresholds = {
            ss: 44, // a few seconds to seconds
            s: 45, // seconds to minute
            m: 45, // minutes to hour
            h: 22, // hours to day
            d: 26, // days to month/week
            w: null, // weeks to month
            M: 11, // months to year
        };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
        var duration = createDuration(posNegDuration).abs(),
            seconds = round(duration.as('s')),
            minutes = round(duration.as('m')),
            hours = round(duration.as('h')),
            days = round(duration.as('d')),
            months = round(duration.as('M')),
            weeks = round(duration.as('w')),
            years = round(duration.as('y')),
            a =
                (seconds <= thresholds.ss && ['s', seconds]) ||
                (seconds < thresholds.s && ['ss', seconds]) ||
                (minutes <= 1 && ['m']) ||
                (minutes < thresholds.m && ['mm', minutes]) ||
                (hours <= 1 && ['h']) ||
                (hours < thresholds.h && ['hh', hours]) ||
                (days <= 1 && ['d']) ||
                (days < thresholds.d && ['dd', days]);

        if (thresholds.w != null) {
            a =
                a ||
                (weeks <= 1 && ['w']) ||
                (weeks < thresholds.w && ['ww', weeks]);
        }
        a = a ||
            (months <= 1 && ['M']) ||
            (months < thresholds.M && ['MM', months]) ||
            (years <= 1 && ['y']) || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function getSetRelativeTimeRounding(roundingFunction) {
        if (roundingFunction === undefined) {
            return round;
        }
        if (typeof roundingFunction === 'function') {
            round = roundingFunction;
            return true;
        }
        return false;
    }

    // This function allows you to set a threshold for relative time strings
    function getSetRelativeTimeThreshold(threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        if (threshold === 's') {
            thresholds.ss = limit - 1;
        }
        return true;
    }

    function humanize(argWithSuffix, argThresholds) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var withSuffix = false,
            th = thresholds,
            locale,
            output;

        if (typeof argWithSuffix === 'object') {
            argThresholds = argWithSuffix;
            argWithSuffix = false;
        }
        if (typeof argWithSuffix === 'boolean') {
            withSuffix = argWithSuffix;
        }
        if (typeof argThresholds === 'object') {
            th = Object.assign({}, thresholds, argThresholds);
            if (argThresholds.s != null && argThresholds.ss == null) {
                th.ss = argThresholds.s - 1;
            }
        }

        locale = this.localeData();
        output = relativeTime$1(this, !withSuffix, th, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var abs$1 = Math.abs;

    function sign(x) {
        return (x > 0) - (x < 0) || +x;
    }

    function toISOString$1() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }

        var seconds = abs$1(this._milliseconds) / 1000,
            days = abs$1(this._days),
            months = abs$1(this._months),
            minutes,
            hours,
            years,
            s,
            total = this.asSeconds(),
            totalSign,
            ymSign,
            daysSign,
            hmsSign;

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes = absFloor(seconds / 60);
        hours = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

        totalSign = total < 0 ? '-' : '';
        ymSign = sign(this._months) !== sign(total) ? '-' : '';
        daysSign = sign(this._days) !== sign(total) ? '-' : '';
        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

        return (
            totalSign +
            'P' +
            (years ? ymSign + years + 'Y' : '') +
            (months ? ymSign + months + 'M' : '') +
            (days ? daysSign + days + 'D' : '') +
            (hours || minutes || seconds ? 'T' : '') +
            (hours ? hmsSign + hours + 'H' : '') +
            (minutes ? hmsSign + minutes + 'M' : '') +
            (seconds ? hmsSign + s + 'S' : '')
        );
    }

    var proto$2 = Duration.prototype;

    proto$2.isValid = isValid$1;
    proto$2.abs = abs;
    proto$2.add = add$1;
    proto$2.subtract = subtract$1;
    proto$2.as = as;
    proto$2.asMilliseconds = asMilliseconds;
    proto$2.asSeconds = asSeconds;
    proto$2.asMinutes = asMinutes;
    proto$2.asHours = asHours;
    proto$2.asDays = asDays;
    proto$2.asWeeks = asWeeks;
    proto$2.asMonths = asMonths;
    proto$2.asQuarters = asQuarters;
    proto$2.asYears = asYears;
    proto$2.valueOf = valueOf$1;
    proto$2._bubble = bubble;
    proto$2.clone = clone$1;
    proto$2.get = get$2;
    proto$2.milliseconds = milliseconds;
    proto$2.seconds = seconds;
    proto$2.minutes = minutes;
    proto$2.hours = hours;
    proto$2.days = days;
    proto$2.weeks = weeks;
    proto$2.months = months;
    proto$2.years = years;
    proto$2.humanize = humanize;
    proto$2.toISOString = toISOString$1;
    proto$2.toString = toISOString$1;
    proto$2.toJSON = toISOString$1;
    proto$2.locale = locale;
    proto$2.localeData = localeData;

    proto$2.toIsoString = deprecate(
        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
        toISOString$1
    );
    proto$2.lang = lang;

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    //! moment.js

    hooks.version = '2.29.1';

    setHookCallback(createLocal);

    hooks.fn = proto;
    hooks.min = min;
    hooks.max = max;
    hooks.now = now;
    hooks.utc = createUTC;
    hooks.unix = createUnix;
    hooks.months = listMonths;
    hooks.isDate = isDate;
    hooks.locale = getSetGlobalLocale;
    hooks.invalid = createInvalid;
    hooks.duration = createDuration;
    hooks.isMoment = isMoment;
    hooks.weekdays = listWeekdays;
    hooks.parseZone = createInZone;
    hooks.localeData = getLocale;
    hooks.isDuration = isDuration;
    hooks.monthsShort = listMonthsShort;
    hooks.weekdaysMin = listWeekdaysMin;
    hooks.defineLocale = defineLocale;
    hooks.updateLocale = updateLocale;
    hooks.locales = listLocales;
    hooks.weekdaysShort = listWeekdaysShort;
    hooks.normalizeUnits = normalizeUnits;
    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
    hooks.calendarFormat = getCalendarFormat;
    hooks.prototype = proto;

    // currently HTML5 input type only supports 24-hour formats
    hooks.HTML5_FMT = {
        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
        DATE: 'YYYY-MM-DD', // <input type="date" />
        TIME: 'HH:mm', // <input type="time" />
        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
        WEEK: 'GGGG-[W]WW', // <input type="week" />
        MONTH: 'YYYY-MM', // <input type="month" />
    };

    return hooks;

})));
});

/* src/js/renderer/component/sidebar/Project.svelte generated by Svelte v3.30.1 */
const file$e = "src/js/renderer/component/sidebar/Project.svelte";

// (226:2) <Header title={tab.title} hoverToShowSlot={true}>
function create_default_slot(ctx) {
	let sortmenu;
	let current;

	sortmenu = new SortMenu({
			props: { options: /*sortOptions*/ ctx[3] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(sortmenu.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(sortmenu, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const sortmenu_changes = {};
			if (dirty & /*sortOptions*/ 8) sortmenu_changes.options = /*sortOptions*/ ctx[3];
			sortmenu.$set(sortmenu_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sortmenu.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sortmenu.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sortmenu, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot.name,
		type: "slot",
		source: "(226:2) <Header title={tab.title} hoverToShowSlot={true}>",
		ctx
	});

	return block;
}

// (233:2) {:else}
function create_else_block(ctx) {
	let doclist;
	let current;

	doclist = new DocList({
			props: {
				listIds: /*data*/ ctx[2].allIds,
				component: File
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(doclist.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(doclist, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const doclist_changes = {};
			if (dirty & /*data*/ 4) doclist_changes.listIds = /*data*/ ctx[2].allIds;
			doclist.$set(doclist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(doclist, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block.name,
		type: "else",
		source: "(233:2) {:else}",
		ctx
	});

	return block;
}

// (231:2) {#if query == ''}
function create_if_block$7(ctx) {
	let treelist;
	let current;

	treelist = new TreeList({
			props: {
				subtree: /*data*/ ctx[2].tree[0],
				listIds: /*data*/ ctx[2].allIds
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(treelist.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(treelist, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const treelist_changes = {};
			if (dirty & /*data*/ 4) treelist_changes.subtree = /*data*/ ctx[2].tree[0];
			if (dirty & /*data*/ 4) treelist_changes.listIds = /*data*/ ctx[2].allIds;
			treelist.$set(treelist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(treelist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(treelist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(treelist, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$7.name,
		type: "if",
		source: "(231:2) {#if query == ''}",
		ctx
	});

	return block;
}

function create_fragment$f(ctx) {
	let div;
	let header;
	let t0;
	let separator;
	let t1;
	let searchfield;
	let updating_query;
	let t2;
	let current_block_type_index;
	let if_block;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[1].title,
				hoverToShowSlot: true,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[7].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));
	const if_block_creators = [create_if_block$7, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*query*/ ctx[0] == "") return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			div = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			if_block.c();
			attr_dev(div, "class", "section");
			add_location(div, file$e, 224, 0, 7731);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(header, div, null);
			append_dev(div, t0);
			mount_component(separator, div, null);
			append_dev(div, t1);
			mount_component(searchfield, div, null);
			append_dev(div, t2);
			if_blocks[current_block_type_index].m(div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope, sortOptions*/ 32776) {
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
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
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
				if_block.m(div, null);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(header);
			destroy_component(separator);
			destroy_component(searchfield);
			if_blocks[current_block_type_index].d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$f.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$f($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(4, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(5, $project = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(6, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Project", slots, []);
	let query = ""; // Bound to search field
	let tabId = "project";
	setContext("tabId", tabId);

	/* ---- How file updating works ----
 - User makes changes to project directory (e.g. adds a file).
 - Watcher chokidar instance catches. (main)
 - Updates its `files`, then sends patches to render process.
 - StateManager receives patches (render)
 - Applies them to it's 1:1 copy of files (`filesAsObject`), to keep them in sync.
 - Updates its files store (`files`). Which is exported.
 - Svelte components import `files` store.
 - Creates immutabale copy using immer, in `makeStore`
 - Updates whenever `$files` store from StateManager updates.
 - Immutable child components see their dependencies have updated, but only update when their objects are replaced.
 */
	// -------- DATA -------- //
	let data = { tree: {}, allIds: [] };

	/**
 * Create the data tree that we'll use to list of files and folders. Start with `files.tree[0]` and create an immutable clone that is sorted, pruned of non-visible items, and that has empty rows inserted (see `insertEmptyRows` documentation for why). Also create a flattened list of the ids.
*/
	function getData() {
		// Use immer to apply changes immutably (leaving $files untouched).
		// console.log($files)
		$$invalidate(2, data = an($files, draft => {
			// If query is empty, render list as tree, and show all files.
			// Else, render list as DocList, and only show files that match query criteria.
			if (query == "") {
				// Delete `byId` array
				delete draft.byId;

				// Make tree of files
				sortSubTree(draft.tree[0]);

				mapVisibleDescendants(draft.tree[0], true);
				insertEmptyRows(draft.tree[0]);

				// Make flat array of files
				draft.allIds = lib.createFlatHierarchy(draft.tree[0].children);

				draft.allIds = draft.allIds.filter(file => !file.id.includes("empty")).map(f => f.id);
			} else {
				// Filter draft.allIds to files that match query
				// Then build tree of results
				const QUERY = query.toUpperCase();

				draft.allIds = draft.allIds.filter(id => {
					const file = draft.byId[id];
					const NAME = file.name.toUpperCase();
					const TITLE = file.type == "doc" ? file.title.toUpperCase() : "";

					if (file.type !== "folder" && (NAME.includes(QUERY) || TITLE.includes(QUERY))) {
						return true;
					} else {
						return false;
					}
				});

				// Delete `byId` array and `tree`. For displaying search results, we only need the array of ids from `allIds`.
				delete draft.tree;

				delete draft.byId;
			}

			// Set selection. First try to maintain the current selection. But if none of the search results are already selected, then select the first result.
			let noResultsAreSelected = !tab.selected.some(selectedId => {
				return draft.allIds.some(id => id == selectedId);
			});

			if (noResultsAreSelected) {
				const firstResultId = draft.allIds[0];

				window.api.send("dispatch", {
					type: "SIDEBAR_SET_SELECTED",
					tabId: "project",
					lastSelected: firstResultId,
					selected: [firstResultId]
				});
			}
		}));
	} // console.log(data)

	/** 
 * For a given list of items, sort by the sort criteria 
 */
	function sort(items) {
		items.sort((a, b) => {
			const itemA = $files.byId[a.id];
			const itemB = $files.byId[b.id];

			if (tab.sortBy == "By Title") {
				if (tab.sortOrder == "Ascending") {
					return itemA.name.localeCompare(itemB.name);
				} else {
					return itemB.name.localeCompare(itemA.name);
				}
			} else if (tab.sortBy == "By Modified") {
				if (tab.sortOrder == "Ascending") {
					return moment(itemA.modified).isBefore(itemB.modified);
				} else {
					return moment(itemB.modified).isBefore(itemA.modified);
				}
			}
		});
	}

	/**
 * Sort tree items by sorting criteria.
*/
	function sortSubTree(folder) {
		// Sort
		sort(folder.children);

		folder.children.forEach(c => {
			const type = $files.byId[c.id].type;

			if (type == "folder" && c.children.length) {
				// If folder is not expanded, remove children.
				// Else, recursively sort
				const isExpanded = tab.expanded.includes(c.id);

				if (!isExpanded) {
					c.children = [];
				} else {
					sortSubTree(c);
				}
			}
		});
	}

	/**
 * Determine how many visible descendants each expanded folder has.
 * We use these values to determine how many "empty" row items to insert.
*/
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

	/**
 * For each visible descendant of an expanded folder, insert an empty sibling row. Empty rows are just empty, invsible divs, of the same height as normal rows. We use them to create spaces in the lists where child folders and their children render. We use this overall so we can take advantage of Svelte's FLIP animate directive, which automatically tweens elements in keyed {#each} loops their new positions when their order changes.
*/
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

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Project> was created with unknown prop '${key}'`);
	});

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		createTreeHierarchy: lib.createTreeHierarchy,
		createFlatHierarchy: lib.createFlatHierarchy,
		produce: an,
		Header,
		SortMenu,
		SearchField,
		Separator,
		TreeList,
		DocList,
		File,
		setContext,
		moment,
		query,
		tabId,
		data,
		getData,
		sort,
		sortSubTree,
		mapVisibleDescendants,
		insertEmptyRows,
		tab,
		$sidebar,
		isSidebarFocused,
		$project,
		sortOptions,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("tabId" in $$props) $$invalidate(9, tabId = $$props.tabId);
		if ("data" in $$props) $$invalidate(2, data = $$props.data);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("isSidebarFocused" in $$props) isSidebarFocused = $$props.isSidebarFocused;
		if ("sortOptions" in $$props) $$invalidate(3, sortOptions = $$props.sortOptions);
	};

	let tab;
	let isSidebarFocused;
	let sortOptions;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 16) {
			 $$invalidate(1, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 32) {
			 isSidebarFocused = $project.focusedLayoutSection == "sidebar";
		}

		if ($$self.$$.dirty & /*tab*/ 2) {
			 $$invalidate(3, sortOptions = [
				{
					label: "By Title",
					group: "sortBy",
					isChecked: tab.sortBy == "By Title"
				},
				{
					label: "By Modified",
					group: "sortBy",
					isChecked: tab.sortBy == "By Modified"
				},
				{ label: "separator" },
				{
					label: "Ascending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Ascending"
				},
				{
					label: "Descending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Descending"
				}
			]);
		}

		if ($$self.$$.dirty & /*$files, tab, query*/ 67) {
			 (tab.expanded, getData());
		}
	};

	return [
		query,
		tab,
		data,
		sortOptions,
		$sidebar,
		$project,
		$files,
		searchfield_query_binding
	];
}

class Project extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$f, create_fragment$f, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Project",
			options,
			id: create_fragment$f.name
		});
	}
}

/* src/js/renderer/component/ui/Token.svelte generated by Svelte v3.30.1 */
const file$f = "src/js/renderer/component/ui/Token.svelte";

function add_css$f() {
	var style = element("style");
	style.id = "svelte-bpt3ra-style";
	style.textContent = ".token.svelte-bpt3ra{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--secondaryLabelColor);padding:0 4px;border-radius:3px;background-color:rgba(var(--foregroundColor), 0.08);margin-left:3px;height:16px;display:inline-flex;align-items:center;user-select:none;white-space:nowrap}.token.svelte-bpt3ra:first-child{margin:0}.isSelected.svelte-bpt3ra{color:var(--controlColor);background-color:rgba(var(--foregroundColor), 0.3)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9rZW4uc3ZlbHRlIiwic291cmNlcyI6WyJUb2tlbi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyIH0gZnJvbSAnc3ZlbHRlJztcbiAgY29uc3QgZGlzcGF0Y2ggPSBjcmVhdGVFdmVudERpc3BhdGNoZXIoKTtcblxuICBleHBvcnQgbGV0IGlzU2VsZWN0ZWQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGxhYmVsID0gJydcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLnRva2VuIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgcGFkZGluZzogMCA0cHg7XG4gIGJvcmRlci1yYWRpdXM6IDNweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1mb3JlZ3JvdW5kQ29sb3IpLCAwLjA4KTtcbiAgbWFyZ2luLWxlZnQ6IDNweDtcbiAgaGVpZ2h0OiAxNnB4O1xuICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG59XG5cbi50b2tlbjpmaXJzdC1jaGlsZCB7XG4gIG1hcmdpbjogMDtcbn1cblxuLmlzU2VsZWN0ZWQge1xuICBjb2xvcjogdmFyKC0tY29udHJvbENvbG9yKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSh2YXIoLS1mb3JlZ3JvdW5kQ29sb3IpLCAwLjMpO1xufTwvc3R5bGU+XG5cbjxzcGFuIGNsYXNzPVwidG9rZW5cIiBjbGFzczppc1NlbGVjdGVkIG9uOmNsaWNrPXsoZXZ0KSA9PiBkaXNwYXRjaCgnc2VsZWN0JywgeyBkb21FdmVudDogZXZ0LCB0YWc6IGxhYmVsIH0pfT5cbiAge2xhYmVsfVxuPC9zcGFuPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpQkEsTUFBTSxjQUFDLENBQUMsQUFDTixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsQ0FDakMsT0FBTyxDQUFFLENBQUMsQ0FBQyxHQUFHLENBQ2QsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsZ0JBQWdCLENBQUUsS0FBSyxJQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDcEQsV0FBVyxDQUFFLEdBQUcsQ0FDaEIsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsV0FBVyxDQUNwQixXQUFXLENBQUUsTUFBTSxDQUNuQixXQUFXLENBQUUsSUFBSSxDQUNqQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBRUQsb0JBQU0sWUFBWSxBQUFDLENBQUMsQUFDbEIsTUFBTSxDQUFFLENBQUMsQUFDWCxDQUFDLEFBRUQsV0FBVyxjQUFDLENBQUMsQUFDWCxLQUFLLENBQUUsSUFBSSxjQUFjLENBQUMsQ0FDMUIsZ0JBQWdCLENBQUUsS0FBSyxJQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQUFDckQsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$g(ctx) {
	let span;
	let t;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			span = element("span");
			t = text(/*label*/ ctx[1]);
			attr_dev(span, "class", "token svelte-bpt3ra");
			toggle_class(span, "isSelected", /*isSelected*/ ctx[0]);
			add_location(span, file$f, 44, 0, 1080);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);

			if (!mounted) {
				dispose = listen_dev(span, "click", /*click_handler*/ ctx[3], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*label*/ 2) set_data_dev(t, /*label*/ ctx[1]);

			if (dirty & /*isSelected*/ 1) {
				toggle_class(span, "isSelected", /*isSelected*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$g.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$g($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Token", slots, []);
	const dispatch = createEventDispatcher();
	let { isSelected = false } = $$props;
	let { label = "" } = $$props;
	const writable_props = ["isSelected", "label"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Token> was created with unknown prop '${key}'`);
	});

	const click_handler = evt => dispatch("select", { domEvent: evt, tag: label });

	$$self.$$set = $$props => {
		if ("isSelected" in $$props) $$invalidate(0, isSelected = $$props.isSelected);
		if ("label" in $$props) $$invalidate(1, label = $$props.label);
	};

	$$self.$capture_state = () => ({
		createEventDispatcher,
		dispatch,
		isSelected,
		label
	});

	$$self.$inject_state = $$props => {
		if ("isSelected" in $$props) $$invalidate(0, isSelected = $$props.isSelected);
		if ("label" in $$props) $$invalidate(1, label = $$props.label);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [isSelected, label, dispatch, click_handler];
}

class Token extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-bpt3ra-style")) add_css$f();
		init(this, options, instance$g, create_fragment$g, safe_not_equal, { isSelected: 0, label: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Token",
			options,
			id: create_fragment$g.name
		});
	}

	get isSelected() {
		throw new Error("<Token>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isSelected(value) {
		throw new Error("<Token>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Token>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Token>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/list/Doc.svelte generated by Svelte v3.30.1 */
const file$g = "src/js/renderer/component/sidebar/list/Doc.svelte";

function add_css$g() {
	var style = element("style");
	style.id = "svelte-11fqt6r-style";
	style.textContent = ".doc.svelte-11fqt6r.svelte-11fqt6r{contain:strict;user-select:none;border-radius:0;margin:0;padding:7px 0.75em;width:100%;height:80px;border-bottom:1px solid var(--separatorColor)}.title.svelte-11fqt6r.svelte-11fqt6r{font:caption;font-weight:bold;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);text-overflow:ellipsis;overflow:hidden;white-space:nowrap;line-height:16px}.tags.svelte-11fqt6r.svelte-11fqt6r{margin-bottom:3px;white-space:nowrap;overflow:hidden}.excerpt.svelte-11fqt6r.svelte-11fqt6r{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--secondaryLabelColor);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;pointer-events:none;word-break:break-word;line-break:auto;line-height:16px}.showTags.svelte-11fqt6r .excerpt.svelte-11fqt6r{-webkit-line-clamp:2}.isSelected.svelte-11fqt6r.svelte-11fqt6r{border-radius:4px;border-bottom:0;height:79px;margin-bottom:1px}.isSelected.svelte-11fqt6r .title.svelte-11fqt6r,.isSelected.svelte-11fqt6r .excerpt.svelte-11fqt6r{color:var(--controlColor)}.isSelected.isSidebarFocused.svelte-11fqt6r.svelte-11fqt6r{background-color:var(--selectedContentBackgroundColor)}.isSelected.svelte-11fqt6r.svelte-11fqt6r:not(.isSidebarFocused){background-color:var(--disabledControlTextColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRG9jLnN2ZWx0ZSIsInNvdXJjZXMiOlsiRG9jLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuXHRpbXBvcnQgeyBwcm9qZWN0LCBmaWxlcywgc2lkZWJhciB9IGZyb20gJy4uLy4uLy4uL1N0YXRlTWFuYWdlcidcblx0aW1wb3J0IFRva2VuIGZyb20gJy4uLy4uL3VpL1Rva2VuLnN2ZWx0ZSdcbiAgaW1wb3J0IHsgb25Nb3VzZWRvd24gfSBmcm9tICcuL2ludGVyYWN0aW9ucydcbiAgaW1wb3J0IHsgZ2V0Q29udGV4dCB9IGZyb20gJ3N2ZWx0ZSc7XG5cblx0ZXhwb3J0IGxldCBpZFxuXHRleHBvcnQgbGV0IGxpc3RJZHNcblx0ZXhwb3J0IGxldCBzaG93VGFncyA9IGZhbHNlXG5cdFxuXHRjb25zdCB0YWJJZCA9IGdldENvbnRleHQoJ3RhYklkJylcblx0JDogdGFiID0gJHNpZGViYXIudGFic0J5SWRbdGFiSWRdXG5cdCQ6IGRvYyA9ICRmaWxlcy5ieUlkW2lkXVxuXHQkOiBpc1NlbGVjdGVkID0gdGFiLnNlbGVjdGVkLnNvbWUoKGlkKSA9PiBpZCA9PSBkb2MuaWQpXG5cdCQ6IGlzU2lkZWJhckZvY3VzZWQgPSAkcHJvamVjdC5mb2N1c2VkTGF5b3V0U2VjdGlvbiA9PSAnc2lkZWJhcidcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLmRvYyB7XG4gIGNvbnRhaW46IHN0cmljdDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIGJvcmRlci1yYWRpdXM6IDA7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogN3B4IDAuNzVlbTtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogODBweDtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHZhcigtLXNlcGFyYXRvckNvbG9yKTtcbn1cblxuLnRpdGxlIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICBsaW5lLWhlaWdodDogMTZweDtcbn1cblxuLnRhZ3Mge1xuICBtYXJnaW4tYm90dG9tOiAzcHg7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG59XG5cbi5leGNlcnB0IHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gIC13ZWJraXQtbGluZS1jbGFtcDogMztcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIGxpbmUtYnJlYWs6IGF1dG87XG4gIGxpbmUtaGVpZ2h0OiAxNnB4O1xufVxuXG4uc2hvd1RhZ3MgLmV4Y2VycHQge1xuICAtd2Via2l0LWxpbmUtY2xhbXA6IDI7XG59XG5cbi5pc1NlbGVjdGVkIHtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBib3JkZXItYm90dG9tOiAwO1xuICBoZWlnaHQ6IDc5cHg7XG4gIG1hcmdpbi1ib3R0b206IDFweDtcbn1cbi5pc1NlbGVjdGVkIC50aXRsZSwgLmlzU2VsZWN0ZWQgLmV4Y2VycHQge1xuICBjb2xvcjogdmFyKC0tY29udHJvbENvbG9yKTtcbn1cbi5pc1NlbGVjdGVkLmlzU2lkZWJhckZvY3VzZWQge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zZWxlY3RlZENvbnRlbnRCYWNrZ3JvdW5kQ29sb3IpO1xufVxuLmlzU2VsZWN0ZWQ6bm90KC5pc1NpZGViYXJGb2N1c2VkKSB7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWRpc2FibGVkQ29udHJvbFRleHRDb2xvcik7XG59PC9zdHlsZT5cblxuPHN2ZWx0ZTpvcHRpb25zIGltbXV0YWJsZT17dHJ1ZX0gLz5cblxuPGRpdlxuXHRjbGFzcz1cImRvY1wiXG5cdGNsYXNzOnNob3dUYWdzXG5cdGNsYXNzOmlzU2VsZWN0ZWRcblx0Y2xhc3M6aXNTaWRlYmFyRm9jdXNlZFxuXHRvbjptb3VzZWRvd249eyhldnQpID0+IG9uTW91c2Vkb3duKGV2dCwgaWQsIGlzU2VsZWN0ZWQsIHRhYiwgdGFiSWQsIGxpc3RJZHMpfVxuXHQ+XG5cdFx0PGRpdiBjbGFzcz1cInRpdGxlXCI+e2RvYy50aXRsZSA/IGRvYy50aXRsZSA6IGRvYy5uYW1lfTwvZGl2PlxuXHRcdFx0eyNpZiBzaG93VGFnc31cblx0XHRcdFx0PGRpdiBjbGFzcz1cInRhZ3NcIj5cblx0XHRcdFx0XHR7I2VhY2ggZG9jLnRhZ3MgYXMgdGFnfVxuXHRcdFx0XHRcdFx0PFRva2VuIGxhYmVsPXt0YWd9IC8+XG5cdFx0XHRcdFx0ey9lYWNofVxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdHsvaWZ9XG5cdFx0PGRpdiBjbGFzcz1cImV4Y2VycHRcIj57ZG9jLmV4Y2VycHR9PC9kaXY+XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBMEJBLElBQUksOEJBQUMsQ0FBQyxBQUNKLE9BQU8sQ0FBRSxNQUFNLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsYUFBYSxDQUFFLENBQUMsQ0FDaEIsTUFBTSxDQUFFLENBQUMsQ0FDVCxPQUFPLENBQUUsR0FBRyxDQUFDLE1BQU0sQ0FDbkIsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxDQUNaLGFBQWEsQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksZ0JBQWdCLENBQUMsQUFDaEQsQ0FBQyxBQUVELE1BQU0sOEJBQUMsQ0FBQyxBQUNOLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxDQUN2QixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsYUFBYSxDQUFFLFFBQVEsQ0FDdkIsUUFBUSxDQUFFLE1BQU0sQ0FDaEIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsV0FBVyxDQUFFLElBQUksQUFDbkIsQ0FBQyxBQUVELEtBQUssOEJBQUMsQ0FBQyxBQUNMLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFFBQVEsQ0FBRSxNQUFNLEFBQ2xCLENBQUMsQUFFRCxRQUFRLDhCQUFDLENBQUMsQUFDUixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsQ0FDakMsT0FBTyxDQUFFLFdBQVcsQ0FDcEIsa0JBQWtCLENBQUUsUUFBUSxDQUM1QixrQkFBa0IsQ0FBRSxDQUFDLENBQ3JCLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLGNBQWMsQ0FBRSxJQUFJLENBQ3BCLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLFdBQVcsQ0FBRSxJQUFJLEFBQ25CLENBQUMsQUFFRCx3QkFBUyxDQUFDLFFBQVEsZUFBQyxDQUFDLEFBQ2xCLGtCQUFrQixDQUFFLENBQUMsQUFDdkIsQ0FBQyxBQUVELFdBQVcsOEJBQUMsQ0FBQyxBQUNYLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLGFBQWEsQ0FBRSxDQUFDLENBQ2hCLE1BQU0sQ0FBRSxJQUFJLENBQ1osYUFBYSxDQUFFLEdBQUcsQUFDcEIsQ0FBQyxBQUNELDBCQUFXLENBQUMscUJBQU0sQ0FBRSwwQkFBVyxDQUFDLFFBQVEsZUFBQyxDQUFDLEFBQ3hDLEtBQUssQ0FBRSxJQUFJLGNBQWMsQ0FBQyxBQUM1QixDQUFDLEFBQ0QsV0FBVyxpQkFBaUIsOEJBQUMsQ0FBQyxBQUM1QixnQkFBZ0IsQ0FBRSxJQUFJLGdDQUFnQyxDQUFDLEFBQ3pELENBQUMsQUFDRCx5Q0FBVyxLQUFLLGlCQUFpQixDQUFDLEFBQUMsQ0FBQyxBQUNsQyxnQkFBZ0IsQ0FBRSxJQUFJLDBCQUEwQixDQUFDLEFBQ25ELENBQUMifQ== */";
	append_dev(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[12] = list[i];
	return child_ctx;
}

// (104:3) {#if showTags}
function create_if_block$8(ctx) {
	let div;
	let current;
	let each_value = /*doc*/ ctx[4].tags;
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "tags svelte-11fqt6r");
			add_location(div, file$g, 104, 4, 2424);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			if (dirty & /*doc*/ 16) {
				each_value = /*doc*/ ctx[4].tags;
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$8.name,
		type: "if",
		source: "(104:3) {#if showTags}",
		ctx
	});

	return block;
}

// (106:5) {#each doc.tags as tag}
function create_each_block$2(ctx) {
	let token;
	let current;

	token = new Token({
			props: { label: /*tag*/ ctx[12] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(token.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(token, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const token_changes = {};
			if (dirty & /*doc*/ 16) token_changes.label = /*tag*/ ctx[12];
			token.$set(token_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(token.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(token.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(token, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$2.name,
		type: "each",
		source: "(106:5) {#each doc.tags as tag}",
		ctx
	});

	return block;
}

function create_fragment$h(ctx) {
	let div2;
	let div0;

	let t0_value = (/*doc*/ ctx[4].title
	? /*doc*/ ctx[4].title
	: /*doc*/ ctx[4].name) + "";

	let t0;
	let t1;
	let t2;
	let div1;
	let t3_value = /*doc*/ ctx[4].excerpt + "";
	let t3;
	let current;
	let mounted;
	let dispose;
	let if_block = /*showTags*/ ctx[2] && create_if_block$8(ctx);

	const block = {
		c: function create() {
			div2 = element("div");
			div0 = element("div");
			t0 = text(t0_value);
			t1 = space();
			if (if_block) if_block.c();
			t2 = space();
			div1 = element("div");
			t3 = text(t3_value);
			attr_dev(div0, "class", "title svelte-11fqt6r");
			add_location(div0, file$g, 102, 2, 2342);
			attr_dev(div1, "class", "excerpt svelte-11fqt6r");
			add_location(div1, file$g, 110, 2, 2535);
			attr_dev(div2, "class", "doc svelte-11fqt6r");
			toggle_class(div2, "showTags", /*showTags*/ ctx[2]);
			toggle_class(div2, "isSelected", /*isSelected*/ ctx[5]);
			toggle_class(div2, "isSidebarFocused", /*isSidebarFocused*/ ctx[6]);
			add_location(div2, file$g, 95, 0, 2182);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			append_dev(div2, div0);
			append_dev(div0, t0);
			append_dev(div2, t1);
			if (if_block) if_block.m(div2, null);
			append_dev(div2, t2);
			append_dev(div2, div1);
			append_dev(div1, t3);
			current = true;

			if (!mounted) {
				dispose = listen_dev(div2, "mousedown", /*mousedown_handler*/ ctx[11], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if ((!current || dirty & /*doc*/ 16) && t0_value !== (t0_value = (/*doc*/ ctx[4].title
			? /*doc*/ ctx[4].title
			: /*doc*/ ctx[4].name) + "")) set_data_dev(t0, t0_value);

			if (/*showTags*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*showTags*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$8(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div2, t2);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if ((!current || dirty & /*doc*/ 16) && t3_value !== (t3_value = /*doc*/ ctx[4].excerpt + "")) set_data_dev(t3, t3_value);

			if (dirty & /*showTags*/ 4) {
				toggle_class(div2, "showTags", /*showTags*/ ctx[2]);
			}

			if (dirty & /*isSelected*/ 32) {
				toggle_class(div2, "isSelected", /*isSelected*/ ctx[5]);
			}

			if (dirty & /*isSidebarFocused*/ 64) {
				toggle_class(div2, "isSidebarFocused", /*isSidebarFocused*/ ctx[6]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
			if (if_block) if_block.d();
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$h.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$h($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	let $project;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(8, $sidebar = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(9, $files = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(10, $project = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Doc", slots, []);
	let { id } = $$props;
	let { listIds } = $$props;
	let { showTags = false } = $$props;
	const tabId = getContext("tabId");
	const writable_props = ["id", "listIds", "showTags"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Doc> was created with unknown prop '${key}'`);
	});

	const mousedown_handler = evt => onMousedown(evt, id, isSelected, tab, tabId, listIds);

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("showTags" in $$props) $$invalidate(2, showTags = $$props.showTags);
	};

	$$self.$capture_state = () => ({
		project,
		files,
		sidebar,
		Token,
		onMousedown,
		getContext,
		id,
		listIds,
		showTags,
		tabId,
		tab,
		$sidebar,
		doc,
		$files,
		isSelected,
		isSidebarFocused,
		$project
	});

	$$self.$inject_state = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("showTags" in $$props) $$invalidate(2, showTags = $$props.showTags);
		if ("tab" in $$props) $$invalidate(3, tab = $$props.tab);
		if ("doc" in $$props) $$invalidate(4, doc = $$props.doc);
		if ("isSelected" in $$props) $$invalidate(5, isSelected = $$props.isSelected);
		if ("isSidebarFocused" in $$props) $$invalidate(6, isSidebarFocused = $$props.isSidebarFocused);
	};

	let tab;
	let doc;
	let isSelected;
	let isSidebarFocused;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 256) {
			 $$invalidate(3, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$files, id*/ 513) {
			 $$invalidate(4, doc = $files.byId[id]);
		}

		if ($$self.$$.dirty & /*tab, doc*/ 24) {
			 $$invalidate(5, isSelected = tab.selected.some(id => id == doc.id));
		}

		if ($$self.$$.dirty & /*$project*/ 1024) {
			 $$invalidate(6, isSidebarFocused = $project.focusedLayoutSection == "sidebar");
		}
	};

	return [
		id,
		listIds,
		showTags,
		tab,
		doc,
		isSelected,
		isSidebarFocused,
		tabId,
		$sidebar,
		$files,
		$project,
		mousedown_handler
	];
}

class Doc extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-11fqt6r-style")) add_css$g();
		init(this, options, instance$h, create_fragment$h, not_equal, { id: 0, listIds: 1, showTags: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Doc",
			options,
			id: create_fragment$h.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
			console.warn("<Doc> was created without expected prop 'id'");
		}

		if (/*listIds*/ ctx[1] === undefined && !("listIds" in props)) {
			console.warn("<Doc> was created without expected prop 'listIds'");
		}
	}

	get id() {
		throw new Error("<Doc>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Doc>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get listIds() {
		throw new Error("<Doc>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listIds(value) {
		throw new Error("<Doc>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get showTags() {
		throw new Error("<Doc>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set showTags(value) {
		throw new Error("<Doc>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/AllDocuments.svelte generated by Svelte v3.30.1 */
const file$h = "src/js/renderer/component/sidebar/AllDocuments.svelte";

// (76:2) <Header title={tab.title} hoverToShowSlot={true}>
function create_default_slot$1(ctx) {
	let sortmenu;
	let current;

	sortmenu = new SortMenu({
			props: { options: /*sortOptions*/ ctx[3] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(sortmenu.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(sortmenu, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const sortmenu_changes = {};
			if (dirty & /*sortOptions*/ 8) sortmenu_changes.options = /*sortOptions*/ ctx[3];
			sortmenu.$set(sortmenu_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sortmenu.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sortmenu.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sortmenu, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$1.name,
		type: "slot",
		source: "(76:2) <Header title={tab.title} hoverToShowSlot={true}>",
		ctx
	});

	return block;
}

function create_fragment$i(ctx) {
	let div;
	let header;
	let t0;
	let separator;
	let t1;
	let searchfield;
	let updating_query;
	let t2;
	let doclist;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[1].title,
				hoverToShowSlot: true,
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[7].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));

	doclist = new DocList({
			props: { listIds: /*data*/ ctx[2], component: Doc },
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			create_component(doclist.$$.fragment);
			attr_dev(div, "class", "section");
			add_location(div, file$h, 74, 0, 2188);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(header, div, null);
			append_dev(div, t0);
			mount_component(separator, div, null);
			append_dev(div, t1);
			mount_component(searchfield, div, null);
			append_dev(div, t2);
			mount_component(doclist, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope, sortOptions*/ 2056) {
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
			const doclist_changes = {};
			if (dirty & /*data*/ 4) doclist_changes.listIds = /*data*/ ctx[2];
			doclist.$set(doclist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(header);
			destroy_component(separator);
			destroy_component(searchfield);
			destroy_component(doclist);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$i.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$i($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(4, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(5, $project = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(6, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("AllDocuments", slots, []);
	let query = ""; // Bound to search field
	let tabId = "allDocs";
	setContext("tabId", tabId);

	// -------- DATA -------- //
	let data = [];

	function getData() {
		$$invalidate(2, data = an($files.allIds, draft => {
			// Get ids with file type 'doc'
			draft = draft.filter(id => $files.byId[id].type == "doc");

			// Filter by query 
			if (query) {
				draft = draft.filter(id => $files.byId[id].name.includes(query));
			}

			// Sort
			draft = draft.sort((a, b) => {
				const itemA = $files.byId[a];
				const itemB = $files.byId[b];

				if (tab.sortBy == "By Title") {
					if (tab.sortOrder == "Ascending") {
						return itemA.name.localeCompare(itemB.name);
					} else {
						return itemB.name.localeCompare(itemA.name);
					}
				} else if (tab.sortBy == "By Modified") {
					if (tab.sortOrder == "Ascending") {
						return moment(itemA.modified).isBefore(itemB.modified);
					} else {
						return moment(itemB.modified).isBefore(itemA.modified);
					}
				}
			});

			return draft;
		}));
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AllDocuments> was created with unknown prop '${key}'`);
	});

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		produce: an,
		Header,
		SortMenu,
		SearchField,
		Separator,
		DocList,
		Doc,
		setContext,
		moment,
		query,
		tabId,
		data,
		getData,
		tab,
		$sidebar,
		isSidebarFocused,
		$project,
		sortOptions,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("tabId" in $$props) $$invalidate(9, tabId = $$props.tabId);
		if ("data" in $$props) $$invalidate(2, data = $$props.data);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("isSidebarFocused" in $$props) isSidebarFocused = $$props.isSidebarFocused;
		if ("sortOptions" in $$props) $$invalidate(3, sortOptions = $$props.sortOptions);
	};

	let tab;
	let isSidebarFocused;
	let sortOptions;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 16) {
			 $$invalidate(1, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 32) {
			 isSidebarFocused = $project.focusedLayoutSection == "sidebar";
		}

		if ($$self.$$.dirty & /*tab*/ 2) {
			 $$invalidate(3, sortOptions = [
				{
					label: "By Title",
					group: "sortBy",
					isChecked: tab.sortBy == "By Title"
				},
				{
					label: "By Modified",
					group: "sortBy",
					isChecked: tab.sortBy == "By Modified"
				},
				{ label: "separator" },
				{
					label: "Ascending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Ascending"
				},
				{
					label: "Descending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Descending"
				}
			]);
		}

		if ($$self.$$.dirty & /*$files, query, tab*/ 67) {
			 (tab.sortBy, tab.sortOrder, getData());
		}
	};

	return [
		query,
		tab,
		data,
		sortOptions,
		$sidebar,
		$project,
		$files,
		searchfield_query_binding
	];
}

class AllDocuments extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$i, create_fragment$i, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "AllDocuments",
			options,
			id: create_fragment$i.name
		});
	}
}

/* src/js/renderer/component/sidebar/MostRecent.svelte generated by Svelte v3.30.1 */
const file$i = "src/js/renderer/component/sidebar/MostRecent.svelte";

// (66:2) <Header title={tab.title} hoverToShowSlot={true}>
function create_default_slot$2(ctx) {
	let sortmenu;
	let current;

	sortmenu = new SortMenu({
			props: { options: /*sortOptions*/ ctx[3] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(sortmenu.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(sortmenu, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const sortmenu_changes = {};
			if (dirty & /*sortOptions*/ 8) sortmenu_changes.options = /*sortOptions*/ ctx[3];
			sortmenu.$set(sortmenu_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sortmenu.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sortmenu.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sortmenu, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$2.name,
		type: "slot",
		source: "(66:2) <Header title={tab.title} hoverToShowSlot={true}>",
		ctx
	});

	return block;
}

function create_fragment$j(ctx) {
	let div;
	let header;
	let t0;
	let separator;
	let t1;
	let searchfield;
	let updating_query;
	let t2;
	let doclist;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[1].title,
				hoverToShowSlot: true,
				$$slots: { default: [create_default_slot$2] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[7].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));

	doclist = new DocList({
			props: { listIds: /*data*/ ctx[2], component: Doc },
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			create_component(doclist.$$.fragment);
			attr_dev(div, "class", "section");
			add_location(div, file$i, 64, 0, 1703);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(header, div, null);
			append_dev(div, t0);
			mount_component(separator, div, null);
			append_dev(div, t1);
			mount_component(searchfield, div, null);
			append_dev(div, t2);
			mount_component(doclist, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope, sortOptions*/ 2056) {
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
			const doclist_changes = {};
			if (dirty & /*data*/ 4) doclist_changes.listIds = /*data*/ ctx[2];
			doclist.$set(doclist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(header);
			destroy_component(separator);
			destroy_component(searchfield);
			destroy_component(doclist);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$j.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$j($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(4, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(5, $project = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(6, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("MostRecent", slots, []);
	let query = ""; // Bound to search field
	let tabId = "mostRecent";
	setContext("tabId", tabId);

	// -------- DATA -------- //
	let data = [];

	function getData() {
		$$invalidate(2, data = an($files.allIds, draft => {
			// Get ids with file type 'doc'
			draft = draft.filter(id => $files.byId[id].type == "doc");

			// Filter by query 
			if (query) {
				draft = draft.filter(id => $files.byId[id].name.includes(query));
			}

			// Sort
			draft = draft.sort((a, b) => {
				const itemA = $files.byId[a];
				const itemB = $files.byId[b];

				if (tab.sortOrder == "Ascending") {
					return moment(itemA.modified).isBefore(itemB.modified);
				} else {
					return moment(itemB.modified).isBefore(itemA.modified);
				}
			});

			return draft;
		}));
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MostRecent> was created with unknown prop '${key}'`);
	});

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		produce: an,
		Header,
		SortMenu,
		SearchField,
		Separator,
		DocList,
		Doc,
		setContext,
		moment,
		query,
		tabId,
		data,
		getData,
		tab,
		$sidebar,
		isSidebarFocused,
		$project,
		sortOptions,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("tabId" in $$props) $$invalidate(9, tabId = $$props.tabId);
		if ("data" in $$props) $$invalidate(2, data = $$props.data);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("isSidebarFocused" in $$props) isSidebarFocused = $$props.isSidebarFocused;
		if ("sortOptions" in $$props) $$invalidate(3, sortOptions = $$props.sortOptions);
	};

	let tab;
	let isSidebarFocused;
	let sortOptions;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 16) {
			 $$invalidate(1, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 32) {
			 isSidebarFocused = $project.focusedLayoutSection == "sidebar";
		}

		if ($$self.$$.dirty & /*tab*/ 2) {
			 $$invalidate(3, sortOptions = [
				{
					label: "Ascending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Ascending"
				},
				{
					label: "Descending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Descending"
				}
			]);
		}

		if ($$self.$$.dirty & /*$files, query, tab*/ 67) {
			 (tab.sortBy, tab.sortOrder, getData());
		}
	};

	return [
		query,
		tab,
		data,
		sortOptions,
		$sidebar,
		$project,
		$files,
		searchfield_query_binding
	];
}

class MostRecent extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$j, create_fragment$j, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "MostRecent",
			options,
			id: create_fragment$j.name
		});
	}
}

/* src/js/renderer/component/sidebar/Tags.svelte generated by Svelte v3.30.1 */

const { Object: Object_1 } = globals;
const file$j = "src/js/renderer/component/sidebar/Tags.svelte";

function add_css$h() {
	var style = element("style");
	style.id = "svelte-114lvfy-style";
	style.textContent = "#tagsList.svelte-114lvfy{padding:8px 10px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGFncy5zdmVsdGUiLCJzb3VyY2VzIjpbIlRhZ3Muc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IHByb2plY3QsIHNpZGViYXIsIGZpbGVzIH0gZnJvbSAnLi4vLi4vU3RhdGVNYW5hZ2VyJ1xuICBpbXBvcnQgcHJvZHVjZSBmcm9tICdpbW1lcidcbiAgaW1wb3J0IEhlYWRlciBmcm9tICcuL0hlYWRlci5zdmVsdGUnXG4gIGltcG9ydCBTb3J0TWVudSBmcm9tICcuL1NvcnRNZW51LnN2ZWx0ZSdcbiAgaW1wb3J0IFRva2VuIGZyb20gJy4uL3VpL1Rva2VuLnN2ZWx0ZSdcbiAgaW1wb3J0IFNlcGFyYXRvciBmcm9tICcuLi91aS9TZXBhcmF0b3Iuc3ZlbHRlJ1xuICBpbXBvcnQgRG9jTGlzdCBmcm9tICcuL2xpc3QvRG9jTGlzdC5zdmVsdGUnXG4gIGltcG9ydCBEb2MgZnJvbSAnLi9saXN0L0RvYy5zdmVsdGUnXG4gIGltcG9ydCB7IHNldENvbnRleHQgfSBmcm9tICdzdmVsdGUnXG4gIGltcG9ydCBtb21lbnQgZnJvbSAnbW9tZW50J1xuICBcbiAgbGV0IHRhYklkID0gJ3RhZ3MnXG4gIHNldENvbnRleHQoJ3RhYklkJywgdGFiSWQpO1xuICAkOiB0YWIgPSAkc2lkZWJhci50YWJzQnlJZFt0YWJJZF1cblxuICAvLyBEZWZpbmUgc29ydCBvcHRpb25cbiAgJDogc29ydE9wdGlvbnMgPSBbXG4gICAgeyBsYWJlbDogJ0J5IFRpdGxlJywgZ3JvdXA6ICdzb3J0QnknLCBpc0NoZWNrZWQ6IHRhYi5zb3J0QnkgPT0gJ0J5IFRpdGxlJyB9LFxuICAgIHsgbGFiZWw6ICdCeSBNb2RpZmllZCcsIGdyb3VwOiAnc29ydEJ5JywgaXNDaGVja2VkOiB0YWIuc29ydEJ5ID09ICdCeSBNb2RpZmllZCcgfSxcbiAgICB7IGxhYmVsOiAnc2VwYXJhdG9yJyB9LFxuICAgIHsgbGFiZWw6ICdBc2NlbmRpbmcnLCBncm91cDogJ3NvcnRPcmRlcicsIGlzQ2hlY2tlZDogdGFiLnNvcnRPcmRlciA9PSAnQXNjZW5kaW5nJyB9LFxuICAgIHsgbGFiZWw6ICdEZXNjZW5kaW5nJywgZ3JvdXA6ICdzb3J0T3JkZXInLCBpc0NoZWNrZWQ6IHRhYi5zb3J0T3JkZXIgPT0gJ0Rlc2NlbmRpbmcnIH0sXG4gIF1cblxuICAvLyAkOiBpc1NpZGViYXJGb2N1c2VkID0gJHByb2plY3QuZm9jdXNlZExheW91dFNlY3Rpb24gPT0gJ3NpZGViYXInXG5cbiAgbGV0IGFsbFRhZ3MgPSBbXVxuICAkOiBzZWxlY3RlZFRhZ3MgPSB0YWIuc2VsZWN0ZWRUYWdzXG4gIFxuICAkOiAkZmlsZXMuYnlJZCwgZ2V0VGFncygpXG5cbiAgLyoqXG4gICAqIEJ1aWxkIGxpc3Qgb2YgdGFncyBmcm9tIGZpbGVzLiBcbiAgICogQWRkIGVhY2ggdW5pcXVlIHRhZyBpbiBlYWNoIGZpbGUgdG8gdGhlIGxpc3QuXG4gICAqL1xuICBmdW5jdGlvbiBnZXRUYWdzKCkge1xuICAgIGFsbFRhZ3MgPSBbXVxuICAgIFxuICAgIGZvciAoY29uc3QgW2lkLCBmaWxlXSBvZiBPYmplY3QuZW50cmllcygkZmlsZXMuYnlJZCkpIHtcbiAgICAgIGZpbGUudGFncz8uZm9yRWFjaCgodGFnKSA9PiB7XG4gICAgICAgIGlmICghYWxsVGFncy5pbmNsdWRlcyh0YWcpKSB7XG4gICAgICAgICAgYWxsVGFncy5wdXNoKHRhZylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9XG5cbiAgICAvLyBTb3J0IGFscGhhYmV0aWNhbGx5XG4gICAgYWxsVGFncy5zb3J0KChhLCBiKSA9PiBhLmxvY2FsZUNvbXBhcmUoYikpXG4gIH1cblxuICAvLyAtLS0tLS0tLSBEQVRBIC0tLS0tLS0tIC8vXG5cbiAgbGV0IGRhdGEgPSBbXVxuXG4gICQ6ICRmaWxlcywgc2VsZWN0ZWRUYWdzLCB0YWIuc29ydEJ5LCB0YWIuc29ydE9yZGVyLCBnZXREYXRhKClcblxuICBmdW5jdGlvbiBnZXREYXRhKCkge1xuICAgIGRhdGEgPSBwcm9kdWNlKCRmaWxlcy5hbGxJZHMsIChkcmFmdCkgPT4ge1xuICAgICAgXG4gICAgICAvLyBHZXQgaWRzIHdpdGggZmlsZSB0eXBlICdkb2MnXG4gICAgICBkcmFmdCA9IGRyYWZ0LmZpbHRlcigoaWQpID0+IHtcbiAgICAgICAgY29uc3QgZmlsZSA9ICRmaWxlcy5ieUlkW2lkXVxuICAgICAgICBjb25zdCBpc0RvYyA9IGZpbGUudHlwZSA9PSAnZG9jJ1xuICAgICAgICBjb25zdCBoYXNUYWcgPSBmaWxlLnRhZ3M/LnNvbWUoKGZpbGVUYWcpID0+IHNlbGVjdGVkVGFncy5pbmNsdWRlcyhmaWxlVGFnKSlcbiAgICAgICAgcmV0dXJuIGlzRG9jICYmIGhhc1RhZ1xuICAgICAgfSlcbiAgICBcbiAgICAgIFxuICAgICAgLy8gU29ydFxuICAgICAgZHJhZnQgPSBkcmFmdC5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgIGNvbnN0IGl0ZW1BID0gJGZpbGVzLmJ5SWRbYV1cbiAgICAgICAgY29uc3QgaXRlbUIgPSAkZmlsZXMuYnlJZFtiXVxuXG4gICAgICAgIGlmICh0YWIuc29ydEJ5ID09ICdCeSBUaXRsZScpIHtcbiAgICAgICAgICBpZiAodGFiLnNvcnRPcmRlciA9PSAnQXNjZW5kaW5nJykge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1BLm5hbWUubG9jYWxlQ29tcGFyZShpdGVtQi5uYW1lKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlbUIubmFtZS5sb2NhbGVDb21wYXJlKGl0ZW1BLm5hbWUpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHRhYi5zb3J0QnkgPT0gJ0J5IE1vZGlmaWVkJykge1xuICAgICAgICAgIGlmICh0YWIuc29ydE9yZGVyID09ICdBc2NlbmRpbmcnKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9tZW50KGl0ZW1BLm1vZGlmaWVkKS5pc0JlZm9yZShpdGVtQi5tb2RpZmllZClcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG1vbWVudChpdGVtQi5tb2RpZmllZCkuaXNCZWZvcmUoaXRlbUEubW9kaWZpZWQpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgcmV0dXJuIGRyYWZ0XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdChldnQpIHtcblxuICAgIGNvbnN0IHsgdGFnLCBkb21FdmVudCB9ID0gZXZ0LmRldGFpbFxuICAgIGxldCBuZXdTZWxlY3RlZCA9IFtdXG5cbiAgICAvLyBJZiBtZXRhIGtleSBpcyBoZWxkLCBhZGQgb3IgcmVtb3ZlIGZyb20gZXhpc3Rpbmcgc2VsZWN0aW9uXG4gICAgLy8gRWxzZSwgc2VsZWN0IHRoZSBjbGlja2VkIHRhZyAoaWYgaXQncyBub3QgYWxyZWFkeSBzZWxlY3RlZCkuXG4gICAgaWYgKGRvbUV2ZW50Lm1ldGFLZXkpIHtcblxuICAgICAgbmV3U2VsZWN0ZWQgPSBbLi4uc2VsZWN0ZWRUYWdzXVxuICAgICAgXG4gICAgICAvLyBJZiB0YWcgaXMgYWxyZWFkeSBzZWxlY3RlZCwgcmVtb3ZlIGl0LiBFbHNlLCBhZGQgaXQuXG4gICAgICBpZiAoc2VsZWN0ZWRUYWdzLmluY2x1ZGVzKHRhZykpIHtcbiAgICAgICAgY29uc3QgaW5kZXhUb1JlbW92ZSA9IHNlbGVjdGVkVGFncy5pbmRleE9mKHRhZylcbiAgICAgICAgbmV3U2VsZWN0ZWQuc3BsaWNlKGluZGV4VG9SZW1vdmUsIDEpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdTZWxlY3RlZC5wdXNoKHRhZylcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbmV3U2VsZWN0ZWQgPSBbdGFnXVxuICAgIH1cblxuICAgIGlmIChuZXdTZWxlY3RlZCA9PSBbXSkgcmV0dXJuXG5cbiAgICB3aW5kb3cuYXBpLnNlbmQoJ2Rpc3BhdGNoJywge1xuICAgICAgdHlwZTogJ1NJREVCQVJfU0VMRUNUX1RBR1MnLFxuICAgICAgdGFiSWQ6IHRhYklkLFxuICAgICAgdGFnczogbmV3U2VsZWN0ZWQsXG4gICAgfSlcbiAgfVxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L2Nzc1wiPlxuXG4gICN0YWdzTGlzdCB7XG4gICAgcGFkZGluZzogOHB4IDEwcHg7XG4gIH1cblxuPC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cbiAgPEhlYWRlciB0aXRsZT17dGFiLnRpdGxlfSBob3ZlclRvU2hvd1Nsb3Q9e3RydWV9PlxuICAgIDxTb3J0TWVudSBvcHRpb25zPXtzb3J0T3B0aW9uc30gLz5cbiAgPC9IZWFkZXI+XG4gIDxTZXBhcmF0b3IgbWFyZ2luU2lkZXM9ezEwfSAvPlxuICA8ZGl2IGlkPVwidGFnc0xpc3RcIj5cbiAgICB7I2VhY2ggYWxsVGFncyBhcyB0YWd9XG4gICAgICA8VG9rZW4gbGFiZWw9e3RhZ30gaXNTZWxlY3RlZD17dGFiLnNlbGVjdGVkVGFncy5pbmNsdWRlcyh0YWcpfSBvbjpzZWxlY3Q9e3NlbGVjdH0gLz5cbiAgICB7L2VhY2h9XG4gIDwvZGl2PlxuICA8U2VwYXJhdG9yIG1hcmdpblNpZGVzPXsxMH0gLz5cbiAgPCEtLSA8U2VhcmNoRmllbGQgZm9jdXNlZCBiaW5kOnF1ZXJ5IHBsYWNlaG9sZGVyPXsnTmFtZSd9IC8+IC0tPlxuICA8RG9jTGlzdCBsaXN0SWRzPXtkYXRhfSBjb21wb25lbnQ9e0RvY30gc2hvd1RhZ3M9e3NlbGVjdGVkVGFncy5sZW5ndGggPiAxfSAvPlxuPC9kaXY+XG5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErSEUsU0FBUyxlQUFDLENBQUMsQUFDVCxPQUFPLENBQUUsR0FBRyxDQUFDLElBQUksQUFDbkIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i];
	return child_ctx;
}

// (135:2) <Header title={tab.title} hoverToShowSlot={true}>
function create_default_slot$3(ctx) {
	let sortmenu;
	let current;

	sortmenu = new SortMenu({
			props: { options: /*sortOptions*/ ctx[4] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(sortmenu.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(sortmenu, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const sortmenu_changes = {};
			if (dirty & /*sortOptions*/ 16) sortmenu_changes.options = /*sortOptions*/ ctx[4];
			sortmenu.$set(sortmenu_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sortmenu.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sortmenu.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sortmenu, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$3.name,
		type: "slot",
		source: "(135:2) <Header title={tab.title} hoverToShowSlot={true}>",
		ctx
	});

	return block;
}

// (140:4) {#each allTags as tag}
function create_each_block$3(ctx) {
	let token;
	let current;

	token = new Token({
			props: {
				label: /*tag*/ ctx[11],
				isSelected: /*tab*/ ctx[0].selectedTags.includes(/*tag*/ ctx[11])
			},
			$$inline: true
		});

	token.$on("select", /*select*/ ctx[5]);

	const block = {
		c: function create() {
			create_component(token.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(token, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const token_changes = {};
			if (dirty & /*allTags*/ 4) token_changes.label = /*tag*/ ctx[11];
			if (dirty & /*tab, allTags*/ 5) token_changes.isSelected = /*tab*/ ctx[0].selectedTags.includes(/*tag*/ ctx[11]);
			token.$set(token_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(token.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(token.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(token, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$3.name,
		type: "each",
		source: "(140:4) {#each allTags as tag}",
		ctx
	});

	return block;
}

function create_fragment$k(ctx) {
	let div1;
	let header;
	let t0;
	let separator0;
	let t1;
	let div0;
	let t2;
	let separator1;
	let t3;
	let doclist;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[0].title,
				hoverToShowSlot: true,
				$$slots: { default: [create_default_slot$3] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator0 = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	let each_value = /*allTags*/ ctx[2];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	separator1 = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	doclist = new DocList({
			props: {
				listIds: /*data*/ ctx[3],
				component: Doc,
				showTags: /*selectedTags*/ ctx[1].length > 1
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div1 = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator0.$$.fragment);
			t1 = space();
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t2 = space();
			create_component(separator1.$$.fragment);
			t3 = space();
			create_component(doclist.$$.fragment);
			attr_dev(div0, "id", "tagsList");
			attr_dev(div0, "class", "svelte-114lvfy");
			add_location(div0, file$j, 138, 2, 3672);
			attr_dev(div1, "class", "section");
			add_location(div1, file$j, 133, 0, 3512);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			mount_component(header, div1, null);
			append_dev(div1, t0);
			mount_component(separator0, div1, null);
			append_dev(div1, t1);
			append_dev(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}

			append_dev(div1, t2);
			mount_component(separator1, div1, null);
			append_dev(div1, t3);
			mount_component(doclist, div1, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 1) header_changes.title = /*tab*/ ctx[0].title;

			if (dirty & /*$$scope, sortOptions*/ 16400) {
				header_changes.$$scope = { dirty, ctx };
			}

			header.$set(header_changes);

			if (dirty & /*allTags, tab, select*/ 37) {
				each_value = /*allTags*/ ctx[2];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(div0, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			const doclist_changes = {};
			if (dirty & /*data*/ 8) doclist_changes.listIds = /*data*/ ctx[3];
			if (dirty & /*selectedTags*/ 2) doclist_changes.showTags = /*selectedTags*/ ctx[1].length > 1;
			doclist.$set(doclist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator0.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(separator1.$$.fragment, local);
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator0.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(separator1.$$.fragment, local);
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(header);
			destroy_component(separator0);
			destroy_each(each_blocks, detaching);
			destroy_component(separator1);
			destroy_component(doclist);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$k.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$k($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(6, $sidebar = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(7, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Tags", slots, []);
	let tabId = "tags";
	setContext("tabId", tabId);

	// $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'
	let allTags = [];

	/**
 * Build list of tags from files. 
 * Add each unique tag in each file to the list.
 */
	function getTags() {
		$$invalidate(2, allTags = []);

		for (const [id, file] of Object.entries($files.byId)) {
			file.tags?.forEach(tag => {
				if (!allTags.includes(tag)) {
					allTags.push(tag);
				}
			});
		}

		// Sort alphabetically
		allTags.sort((a, b) => a.localeCompare(b));
	}

	// -------- DATA -------- //
	let data = [];

	function getData() {
		$$invalidate(3, data = an($files.allIds, draft => {
			// Get ids with file type 'doc'
			draft = draft.filter(id => {
				const file = $files.byId[id];
				const isDoc = file.type == "doc";
				const hasTag = file.tags?.some(fileTag => selectedTags.includes(fileTag));
				return isDoc && hasTag;
			});

			// Sort
			draft = draft.sort((a, b) => {
				const itemA = $files.byId[a];
				const itemB = $files.byId[b];

				if (tab.sortBy == "By Title") {
					if (tab.sortOrder == "Ascending") {
						return itemA.name.localeCompare(itemB.name);
					} else {
						return itemB.name.localeCompare(itemA.name);
					}
				} else if (tab.sortBy == "By Modified") {
					if (tab.sortOrder == "Ascending") {
						return moment(itemA.modified).isBefore(itemB.modified);
					} else {
						return moment(itemB.modified).isBefore(itemA.modified);
					}
				}
			});

			return draft;
		}));
	}

	function select(evt) {
		const { tag, domEvent } = evt.detail;
		let newSelected = [];

		// If meta key is held, add or remove from existing selection
		// Else, select the clicked tag (if it's not already selected).
		if (domEvent.metaKey) {
			newSelected = [...selectedTags];

			// If tag is already selected, remove it. Else, add it.
			if (selectedTags.includes(tag)) {
				const indexToRemove = selectedTags.indexOf(tag);
				newSelected.splice(indexToRemove, 1);
			} else {
				newSelected.push(tag);
			}
		} else {
			newSelected = [tag];
		}

		if (newSelected == []) return;

		window.api.send("dispatch", {
			type: "SIDEBAR_SELECT_TAGS",
			tabId,
			tags: newSelected
		});
	}

	const writable_props = [];

	Object_1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tags> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		produce: an,
		Header,
		SortMenu,
		Token,
		Separator,
		DocList,
		Doc,
		setContext,
		moment,
		tabId,
		allTags,
		getTags,
		data,
		getData,
		select,
		tab,
		$sidebar,
		sortOptions,
		selectedTags,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("tabId" in $$props) $$invalidate(8, tabId = $$props.tabId);
		if ("allTags" in $$props) $$invalidate(2, allTags = $$props.allTags);
		if ("data" in $$props) $$invalidate(3, data = $$props.data);
		if ("tab" in $$props) $$invalidate(0, tab = $$props.tab);
		if ("sortOptions" in $$props) $$invalidate(4, sortOptions = $$props.sortOptions);
		if ("selectedTags" in $$props) $$invalidate(1, selectedTags = $$props.selectedTags);
	};

	let tab;
	let sortOptions;
	let selectedTags;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 64) {
			 $$invalidate(0, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*tab*/ 1) {
			// Define sort option
			 $$invalidate(4, sortOptions = [
				{
					label: "By Title",
					group: "sortBy",
					isChecked: tab.sortBy == "By Title"
				},
				{
					label: "By Modified",
					group: "sortBy",
					isChecked: tab.sortBy == "By Modified"
				},
				{ label: "separator" },
				{
					label: "Ascending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Ascending"
				},
				{
					label: "Descending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Descending"
				}
			]);
		}

		if ($$self.$$.dirty & /*tab*/ 1) {
			 $$invalidate(1, selectedTags = tab.selectedTags);
		}

		if ($$self.$$.dirty & /*$files*/ 128) {
			 ($files.byId, getTags());
		}

		if ($$self.$$.dirty & /*$files, selectedTags, tab*/ 131) {
			 (tab.sortBy, tab.sortOrder, getData());
		}
	};

	return [tab, selectedTags, allTags, data, sortOptions, select, $sidebar, $files];
}

class Tags extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-114lvfy-style")) add_css$h();
		init(this, options, instance$k, create_fragment$k, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Tags",
			options,
			id: create_fragment$k.name
		});
	}
}

/* src/js/renderer/component/ui/Label.svelte generated by Svelte v3.30.1 */
const file$k = "src/js/renderer/component/ui/Label.svelte";

function add_css$i() {
	var style = element("style");
	style.id = "svelte-zgjiwf-style";
	style.textContent = "div.svelte-zgjiwf,span.svelte-zgjiwf{--opacity:1;--align:1;opacity:var(--opacity);text-align:var(--align)}.isSelected.svelte-zgjiwf{color:var(--controlColor) !important}div.svelte-zgjiwf{flex-grow:1}.primary.svelte-zgjiwf{color:var(--labelColor)}.secondary.svelte-zgjiwf{color:var(--secondaryLabelColor)}.tertiary.svelte-zgjiwf{color:var(--tertiaryLabelColor)}.quaternary.svelte-zgjiwf{color:var(--quaternaryLabelColor)}.label-normal.svelte-zgjiwf{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px}.label-normal-bold.svelte-zgjiwf{font:caption;font-weight:bold;font-size:13px;line-height:15px;letter-spacing:-0.08px}.label-normal-small.svelte-zgjiwf{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px}.label-normal-small-bold.svelte-zgjiwf{font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px}.label-large-bold.svelte-zgjiwf{font-family:\"SF Pro Display\";font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px}.column.svelte-zgjiwf{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGFiZWwuc3ZlbHRlIiwic291cmNlcyI6WyJMYWJlbC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgY3NzIH0gZnJvbSAnLi4vdWkvYWN0aW9ucydcbiAgXG4gIGV4cG9ydCBsZXQgb3BhY2l0eSA9ICcxJ1xuICBleHBvcnQgbGV0IGRpc3BsYXkgPSAnYmxvY2snXG4gIGV4cG9ydCBsZXQgYWxpZ24gPSAnbGVmdCdcbiAgZXhwb3J0IGxldCBjb2xvciA9ICdwcmltYXJ5J1xuICBleHBvcnQgbGV0IHR5cG9ncmFwaHkgPSAnbGFiZWwtbm9ybWFsJ1xuICBleHBvcnQgbGV0IGlzU2VsZWN0ZWQgPSBmYWxzZVxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG5kaXYsIHNwYW4ge1xuICAtLW9wYWNpdHk6IDE7XG4gIC0tYWxpZ246IDE7XG4gIG9wYWNpdHk6IHZhcigtLW9wYWNpdHkpO1xuICB0ZXh0LWFsaWduOiB2YXIoLS1hbGlnbik7XG59XG5cbi5pc1NlbGVjdGVkIHtcbiAgY29sb3I6IHZhcigtLWNvbnRyb2xDb2xvcikgIWltcG9ydGFudDtcbn1cblxuZGl2IHtcbiAgZmxleC1ncm93OiAxO1xufVxuXG4ucHJpbWFyeSB7XG4gIGNvbG9yOiB2YXIoLS1sYWJlbENvbG9yKTtcbn1cblxuLnNlY29uZGFyeSB7XG4gIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbn1cblxuLnRlcnRpYXJ5IHtcbiAgY29sb3I6IHZhcigtLXRlcnRpYXJ5TGFiZWxDb2xvcik7XG59XG5cbi5xdWF0ZXJuYXJ5IHtcbiAgY29sb3I6IHZhcigtLXF1YXRlcm5hcnlMYWJlbENvbG9yKTtcbn1cblxuLmxhYmVsLW5vcm1hbCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xufVxuXG4ubGFiZWwtbm9ybWFsLWJvbGQge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG59XG5cbi5sYWJlbC1ub3JtYWwtc21hbGwge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMC4wN3B4O1xufVxuXG4ubGFiZWwtbm9ybWFsLXNtYWxsLWJvbGQge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBsaW5lLWhlaWdodDogMTNweDtcbiAgbGV0dGVyLXNwYWNpbmc6IDAuMDdweDtcbn1cblxuLmxhYmVsLWxhcmdlLWJvbGQge1xuICBmb250LWZhbWlseTogXCJTRiBQcm8gRGlzcGxheVwiO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiAyMHB4O1xuICBsaW5lLWhlaWdodDogMjRweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjEycHg7XG59XG5cbi5jb2x1bW4ge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogNTAwO1xuICBmb250LXNpemU6IDEycHg7XG4gIGxpbmUtaGVpZ2h0OiAxNnB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMDdweDtcbn08L3N0eWxlPlxuXG57I2lmIGRpc3BsYXkgPT0gJ2Jsb2NrJ31cbiAgPGRpdiBjbGFzcz1cImxhYmVsIHtjb2xvcn0ge3R5cG9ncmFwaHl9XCIgY2xhc3M6aXNTZWxlY3RlZCB1c2U6Y3NzPXt7b3BhY2l0eSwgYWxpZ259fT5cbiAgICA8c2xvdD48L3Nsb3Q+XG4gIDwvZGl2PlxuezplbHNlIGlmIGRpc3BsYXkgPT0gJ2lubGluZSd9XG4gIDxzcGFuIGNsYXNzPVwibGFiZWwge2NvbG9yfSB7dHlwb2dyYXBoeX1cIiBjbGFzczppc1NlbGVjdGVkIHVzZTpjc3M9e3tvcGFjaXR5LCBhbGlnbn19PlxuICAgIDxzbG90Pjwvc2xvdD5cbiAgPC9zcGFuPlxuey9pZn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFvQkEsaUJBQUcsQ0FBRSxJQUFJLGNBQUMsQ0FBQyxBQUNULFNBQVMsQ0FBRSxDQUFDLENBQ1osT0FBTyxDQUFFLENBQUMsQ0FDVixPQUFPLENBQUUsSUFBSSxTQUFTLENBQUMsQ0FDdkIsVUFBVSxDQUFFLElBQUksT0FBTyxDQUFDLEFBQzFCLENBQUMsQUFFRCxXQUFXLGNBQUMsQ0FBQyxBQUNYLEtBQUssQ0FBRSxJQUFJLGNBQWMsQ0FBQyxDQUFDLFVBQVUsQUFDdkMsQ0FBQyxBQUVELEdBQUcsY0FBQyxDQUFDLEFBQ0gsU0FBUyxDQUFFLENBQUMsQUFDZCxDQUFDLEFBRUQsUUFBUSxjQUFDLENBQUMsQUFDUixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQUFDMUIsQ0FBQyxBQUVELFVBQVUsY0FBQyxDQUFDLEFBQ1YsS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsQUFDbkMsQ0FBQyxBQUVELFNBQVMsY0FBQyxDQUFDLEFBQ1QsS0FBSyxDQUFFLElBQUksb0JBQW9CLENBQUMsQUFDbEMsQ0FBQyxBQUVELFdBQVcsY0FBQyxDQUFDLEFBQ1gsS0FBSyxDQUFFLElBQUksc0JBQXNCLENBQUMsQUFDcEMsQ0FBQyxBQUVELGFBQWEsY0FBQyxDQUFDLEFBQ2IsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLEFBQ3pCLENBQUMsQUFFRCxrQkFBa0IsY0FBQyxDQUFDLEFBQ2xCLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxBQUN6QixDQUFDLEFBRUQsbUJBQW1CLGNBQUMsQ0FBQyxBQUNuQixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQUFDeEIsQ0FBQyxBQUVELHdCQUF3QixjQUFDLENBQUMsQUFDeEIsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsSUFBSSxDQUNqQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxNQUFNLEFBQ3hCLENBQUMsQUFFRCxpQkFBaUIsY0FBQyxDQUFDLEFBQ2pCLFdBQVcsQ0FBRSxnQkFBZ0IsQ0FDN0IsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxBQUN6QixDQUFDLEFBRUQsT0FBTyxjQUFDLENBQUMsQUFDUCxJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxHQUFHLENBQ2hCLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQUFDekIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

// (104:30) 
function create_if_block_1$4(ctx) {
	let span;
	let span_class_value;
	let css_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

	const block = {
		c: function create() {
			span = element("span");
			if (default_slot) default_slot.c();
			attr_dev(span, "class", span_class_value = "label " + /*color*/ ctx[3] + " " + /*typography*/ ctx[4] + " svelte-zgjiwf");
			toggle_class(span, "isSelected", /*isSelected*/ ctx[5]);
			add_location(span, file$k, 104, 2, 1979);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);

			if (default_slot) {
				default_slot.m(span, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, span, {
					opacity: /*opacity*/ ctx[0],
					align: /*align*/ ctx[2]
				}));

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 64) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
				}
			}

			if (!current || dirty & /*color, typography*/ 24 && span_class_value !== (span_class_value = "label " + /*color*/ ctx[3] + " " + /*typography*/ ctx[4] + " svelte-zgjiwf")) {
				attr_dev(span, "class", span_class_value);
			}

			if (css_action && is_function(css_action.update) && dirty & /*opacity, align*/ 5) css_action.update.call(null, {
				opacity: /*opacity*/ ctx[0],
				align: /*align*/ ctx[2]
			});

			if (dirty & /*color, typography, isSelected*/ 56) {
				toggle_class(span, "isSelected", /*isSelected*/ ctx[5]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$4.name,
		type: "if",
		source: "(104:30) ",
		ctx
	});

	return block;
}

// (100:0) {#if display == 'block'}
function create_if_block$9(ctx) {
	let div;
	let div_class_value;
	let css_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[7].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr_dev(div, "class", div_class_value = "label " + /*color*/ ctx[3] + " " + /*typography*/ ctx[4] + " svelte-zgjiwf");
			toggle_class(div, "isSelected", /*isSelected*/ ctx[5]);
			add_location(div, file$k, 100, 2, 1834);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, div, {
					opacity: /*opacity*/ ctx[0],
					align: /*align*/ ctx[2]
				}));

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 64) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], dirty, null, null);
				}
			}

			if (!current || dirty & /*color, typography*/ 24 && div_class_value !== (div_class_value = "label " + /*color*/ ctx[3] + " " + /*typography*/ ctx[4] + " svelte-zgjiwf")) {
				attr_dev(div, "class", div_class_value);
			}

			if (css_action && is_function(css_action.update) && dirty & /*opacity, align*/ 5) css_action.update.call(null, {
				opacity: /*opacity*/ ctx[0],
				align: /*align*/ ctx[2]
			});

			if (dirty & /*color, typography, isSelected*/ 56) {
				toggle_class(div, "isSelected", /*isSelected*/ ctx[5]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$9.name,
		type: "if",
		source: "(100:0) {#if display == 'block'}",
		ctx
	});

	return block;
}

function create_fragment$l(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$9, create_if_block_1$4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*display*/ ctx[1] == "block") return 0;
		if (/*display*/ ctx[1] == "inline") return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(target, anchor);
			}

			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
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
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				} else {
					if_block = null;
				}
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d(detaching);
			}

			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$l.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$l($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Label", slots, ['default']);
	let { opacity = "1" } = $$props;
	let { display = "block" } = $$props;
	let { align = "left" } = $$props;
	let { color = "primary" } = $$props;
	let { typography = "label-normal" } = $$props;
	let { isSelected = false } = $$props;
	const writable_props = ["opacity", "display", "align", "color", "typography", "isSelected"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Label> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("opacity" in $$props) $$invalidate(0, opacity = $$props.opacity);
		if ("display" in $$props) $$invalidate(1, display = $$props.display);
		if ("align" in $$props) $$invalidate(2, align = $$props.align);
		if ("color" in $$props) $$invalidate(3, color = $$props.color);
		if ("typography" in $$props) $$invalidate(4, typography = $$props.typography);
		if ("isSelected" in $$props) $$invalidate(5, isSelected = $$props.isSelected);
		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => ({
		css,
		opacity,
		display,
		align,
		color,
		typography,
		isSelected
	});

	$$self.$inject_state = $$props => {
		if ("opacity" in $$props) $$invalidate(0, opacity = $$props.opacity);
		if ("display" in $$props) $$invalidate(1, display = $$props.display);
		if ("align" in $$props) $$invalidate(2, align = $$props.align);
		if ("color" in $$props) $$invalidate(3, color = $$props.color);
		if ("typography" in $$props) $$invalidate(4, typography = $$props.typography);
		if ("isSelected" in $$props) $$invalidate(5, isSelected = $$props.isSelected);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [opacity, display, align, color, typography, isSelected, $$scope, slots];
}

class Label$1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-zgjiwf-style")) add_css$i();

		init(this, options, instance$l, create_fragment$l, safe_not_equal, {
			opacity: 0,
			display: 1,
			align: 2,
			color: 3,
			typography: 4,
			isSelected: 5
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Label",
			options,
			id: create_fragment$l.name
		});
	}

	get opacity() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set opacity(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get display() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set display(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get align() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set align(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get color() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set color(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get typography() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set typography(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isSelected() {
		throw new Error("<Label>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isSelected(value) {
		throw new Error("<Label>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/Thumbnail.svelte generated by Svelte v3.30.1 */

const file$l = "src/js/renderer/component/ui/Thumbnail.svelte";

function add_css$j() {
	var style = element("style");
	style.id = "svelte-xig4tb-style";
	style.textContent = ".thumbnail.svelte-xig4tb{overflow:hidden;width:100%;height:100%}img.svelte-xig4tb{width:100%;height:100%;object-fit:contain;object-position:center}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGh1bWJuYWlsLnN2ZWx0ZSIsInNvdXJjZXMiOlsiVGh1bWJuYWlsLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBleHBvcnQgbGV0IHNyY1xuICBleHBvcnQgbGV0IG1hcmdpbiA9ICcwIDAgMCAwJ1xuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLnRodW1ibmFpbCB7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG59XG5cbmltZyB7XG4gIC8qIFNjYWxlIHRoZSBpbWFnZSBzbyBpdCBjb3ZlcnMgd2hvbGUgYXJlYSwgdGh1cyB3aWxsIGxpa2VseSBjcm9wICovXG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIG9iamVjdC1maXQ6IGNvbnRhaW47XG4gIG9iamVjdC1wb3NpdGlvbjogY2VudGVyO1xufTwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJ0aHVtYm5haWxcIiBzdHlsZT1cIm1hcmdpbjoge21hcmdpbn1cIj5cbiAgeyNpZiBzcmN9XG4gICAgPGltZyB7c3JjfSAvPlxuICB7OmVsc2V9XG4gICAgPGltZyBzcmM9XCJwbGFjZWhvbGRlclwiIC8+XG4gIHsvaWZ9XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxVQUFVLGNBQUMsQ0FBQyxBQUNWLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQUFDZCxDQUFDLEFBRUQsR0FBRyxjQUFDLENBQUMsQUFFSCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osVUFBVSxDQUFFLE9BQU8sQ0FDbkIsZUFBZSxDQUFFLE1BQU0sQUFDekIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

// (27:2) {:else}
function create_else_block$1(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			if (img.src !== (img_src_value = "placeholder")) attr_dev(img, "src", img_src_value);
			attr_dev(img, "class", "svelte-xig4tb");
			add_location(img, file$l, 27, 4, 601);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$1.name,
		type: "else",
		source: "(27:2) {:else}",
		ctx
	});

	return block;
}

// (25:2) {#if src}
function create_if_block$a(ctx) {
	let img;
	let img_src_value;

	const block = {
		c: function create() {
			img = element("img");
			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr_dev(img, "src", img_src_value);
			attr_dev(img, "class", "svelte-xig4tb");
			add_location(img, file$l, 25, 4, 573);
		},
		m: function mount(target, anchor) {
			insert_dev(target, img, anchor);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*src*/ 1 && img.src !== (img_src_value = /*src*/ ctx[0])) {
				attr_dev(img, "src", img_src_value);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(img);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$a.name,
		type: "if",
		source: "(25:2) {#if src}",
		ctx
	});

	return block;
}

function create_fragment$m(ctx) {
	let div;

	function select_block_type(ctx, dirty) {
		if (/*src*/ ctx[0]) return create_if_block$a;
		return create_else_block$1;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	const block = {
		c: function create() {
			div = element("div");
			if_block.c();
			attr_dev(div, "class", "thumbnail svelte-xig4tb");
			set_style(div, "margin", /*margin*/ ctx[1]);
			add_location(div, file$l, 23, 0, 508);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if_block.m(div, null);
		},
		p: function update(ctx, [dirty]) {
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
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if_block.d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$m.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$m($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Thumbnail", slots, []);
	let { src } = $$props;
	let { margin = "0 0 0 0" } = $$props;
	const writable_props = ["src", "margin"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Thumbnail> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("margin" in $$props) $$invalidate(1, margin = $$props.margin);
	};

	$$self.$capture_state = () => ({ src, margin });

	$$self.$inject_state = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("margin" in $$props) $$invalidate(1, margin = $$props.margin);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [src, margin];
}

class Thumbnail extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-xig4tb-style")) add_css$j();
		init(this, options, instance$m, create_fragment$m, safe_not_equal, { src: 0, margin: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Thumbnail",
			options,
			id: create_fragment$m.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*src*/ ctx[0] === undefined && !("src" in props)) {
			console.warn("<Thumbnail> was created without expected prop 'src'");
		}
	}

	get src() {
		throw new Error("<Thumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set src(value) {
		throw new Error("<Thumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get margin() {
		throw new Error("<Thumbnail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set margin(value) {
		throw new Error("<Thumbnail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/list/Media.svelte generated by Svelte v3.30.1 */
const file_1$1 = "src/js/renderer/component/sidebar/list/Media.svelte";

function add_css$k() {
	var style = element("style");
	style.id = "svelte-13a9buu-style";
	style.textContent = ".media.svelte-13a9buu.svelte-13a9buu{contain:strict;user-select:none;border-radius:0;margin:0;padding:7px 0.75em;width:100%;height:68px;border-bottom:1px solid var(--separatorColor);display:flex}.thumb.svelte-13a9buu.svelte-13a9buu{flex-grow:0;flex-basis:60px;flex-shrink:0;overflow:hidden;margin-right:10px;background:#D8D8D8;border:2px solid #FFFFFF;box-shadow:0 0 2px 0 rgba(0, 0, 0, 0.13), inset 0 0 1px 2px rgba(0, 0, 0, 0.06)}.thumb.svelte-13a9buu img.svelte-13a9buu{width:100%;height:100%;object-fit:cover;object-position:center}.details.svelte-13a9buu.svelte-13a9buu{flex-grow:1}.filename.svelte-13a9buu.svelte-13a9buu{font:caption;font-weight:bold;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);text-overflow:ellipsis;overflow:hidden;white-space:nowrap;line-height:16px}.metadata.svelte-13a9buu.svelte-13a9buu{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--secondaryLabelColor);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;overflow:hidden;pointer-events:none;word-break:break-word;line-break:auto;line-height:16px}.isSelected.svelte-13a9buu.svelte-13a9buu{border-radius:4px;border-bottom:0;height:67px;margin-bottom:1px}.isSelected.svelte-13a9buu .filename.svelte-13a9buu,.isSelected.svelte-13a9buu .metadata.svelte-13a9buu{color:var(--controlColor)}.isSelected.isSidebarFocused.svelte-13a9buu.svelte-13a9buu{background-color:var(--selectedContentBackgroundColor)}.isSelected.svelte-13a9buu.svelte-13a9buu:not(.isSidebarFocused){background-color:var(--disabledControlTextColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVkaWEuc3ZlbHRlIiwic291cmNlcyI6WyJNZWRpYS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgcHJldHR5U2l6ZSB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC91dGlscydcblx0aW1wb3J0IHsgY3JlYXRlRXZlbnREaXNwYXRjaGVyLCBhZnRlclVwZGF0ZSB9IGZyb20gJ3N2ZWx0ZSdcblx0aW1wb3J0IHsgc3RhdGUsIHByb2plY3QsIGZpbGVzLCBzaWRlYmFyIH0gZnJvbSAnLi4vLi4vLi4vU3RhdGVNYW5hZ2VyJ1xuICBpbXBvcnQgeyBvbk1vdXNlZG93biB9IGZyb20gJy4vaW50ZXJhY3Rpb25zJ1xuICBpbXBvcnQgeyBnZXRDb250ZXh0IH0gZnJvbSAnc3ZlbHRlJztcbiAgaW1wb3J0IExhYmVsIGZyb20gJy4uLy4uL3VpL0xhYmVsLnN2ZWx0ZSdcbiAgaW1wb3J0IFRodW1ibmFpbCBmcm9tICcuLi8uLi91aS9UaHVtYm5haWwuc3ZlbHRlJ1xuXG5cdGV4cG9ydCBsZXQgaWRcblx0ZXhwb3J0IGxldCBsaXN0SWRzXG5cdFxuXHRjb25zdCB0YWJJZCA9IGdldENvbnRleHQoJ3RhYklkJylcblx0JDogdGFiID0gJHNpZGViYXIudGFic0J5SWRbdGFiSWRdXG5cdCQ6IGZpbGUgPSAkZmlsZXMuYnlJZFtpZF1cblx0JDogaXNTZWxlY3RlZCA9IHRhYi5zZWxlY3RlZC5zb21lKChpZCkgPT4gaWQgPT0gZmlsZS5pZClcblx0JDogaXNTaWRlYmFyRm9jdXNlZCA9ICRwcm9qZWN0LmZvY3VzZWRMYXlvdXRTZWN0aW9uID09ICdzaWRlYmFyJ1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4ubWVkaWEge1xuICBjb250YWluOiBzdHJpY3Q7XG4gIHVzZXItc2VsZWN0OiBub25lO1xuICBib3JkZXItcmFkaXVzOiAwO1xuICBtYXJnaW46IDA7XG4gIHBhZGRpbmc6IDdweCAwLjc1ZW07XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDY4cHg7XG4gIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCB2YXIoLS1zZXBhcmF0b3JDb2xvcik7XG4gIGRpc3BsYXk6IGZsZXg7XG59XG5cbi50aHVtYiB7XG4gIGZsZXgtZ3JvdzogMDtcbiAgZmxleC1iYXNpczogNjBweDtcbiAgZmxleC1zaHJpbms6IDA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIG1hcmdpbi1yaWdodDogMTBweDtcbiAgYmFja2dyb3VuZDogI0Q4RDhEODtcbiAgYm9yZGVyOiAycHggc29saWQgI0ZGRkZGRjtcbiAgYm94LXNoYWRvdzogMCAwIDJweCAwIHJnYmEoMCwgMCwgMCwgMC4xMyksIGluc2V0IDAgMCAxcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4wNik7XG59XG4udGh1bWIgaW1nIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgb2JqZWN0LWZpdDogY292ZXI7XG4gIG9iamVjdC1wb3NpdGlvbjogY2VudGVyO1xufVxuXG4uZGV0YWlscyB7XG4gIGZsZXgtZ3JvdzogMTtcbn1cblxuLmZpbGVuYW1lIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIHRleHQtb3ZlcmZsb3c6IGVsbGlwc2lzO1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICBsaW5lLWhlaWdodDogMTZweDtcbn1cblxuLm1ldGFkYXRhIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgZGlzcGxheTogLXdlYmtpdC1ib3g7XG4gIC13ZWJraXQtYm94LW9yaWVudDogdmVydGljYWw7XG4gIC13ZWJraXQtbGluZS1jbGFtcDogMztcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIGxpbmUtYnJlYWs6IGF1dG87XG4gIGxpbmUtaGVpZ2h0OiAxNnB4O1xufVxuXG4uaXNTZWxlY3RlZCB7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgYm9yZGVyLWJvdHRvbTogMDtcbiAgaGVpZ2h0OiA2N3B4O1xuICBtYXJnaW4tYm90dG9tOiAxcHg7XG59XG4uaXNTZWxlY3RlZCAuZmlsZW5hbWUsIC5pc1NlbGVjdGVkIC5tZXRhZGF0YSB7XG4gIGNvbG9yOiB2YXIoLS1jb250cm9sQ29sb3IpO1xufVxuLmlzU2VsZWN0ZWQuaXNTaWRlYmFyRm9jdXNlZCB7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLXNlbGVjdGVkQ29udGVudEJhY2tncm91bmRDb2xvcik7XG59XG4uaXNTZWxlY3RlZDpub3QoLmlzU2lkZWJhckZvY3VzZWQpIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tZGlzYWJsZWRDb250cm9sVGV4dENvbG9yKTtcbn08L3N0eWxlPlxuXG48c3ZlbHRlOm9wdGlvbnMgaW1tdXRhYmxlPXt0cnVlfSAvPlxuXG48ZGl2XG5cdGNsYXNzPVwibWVkaWFcIlxuXHRjbGFzczppc1NlbGVjdGVkXG5cdGNsYXNzOmlzU2lkZWJhckZvY3VzZWRcblx0b246bW91c2Vkb3duPXsoZXZ0KSA9PiBvbk1vdXNlZG93bihldnQsIGlkLCBpc1NlbGVjdGVkLCB0YWIsIHRhYklkLCBsaXN0SWRzKX1cbiAgPlxuICAgIDxkaXYgY2xhc3M9XCJ0aHVtYlwiPlxuICAgICAgPGltZyBzcmM9e2ZpbGUucGF0aH0gLz5cbiAgICA8L2Rpdj5cbiAgICA8ZGl2IGNsYXNzPVwiZGV0YWlsc1wiPlxuICAgICAgPGRpdiBjbGFzcz1cImZpbGVuYW1lXCI+e2ZpbGUubmFtZX08L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtZXRhZGF0YVwiPlxuICAgICAgICB7ZmlsZS5mb3JtYXQudG9VcHBlckNhc2UoKX0gLSB7cHJldHR5U2l6ZShmaWxlLnNpemVJbkJ5dGVzLCAnICcpfTxiciAvPlxuICAgICAgICB7ZmlsZS5kaW1lbnNpb25zLndpZHRofSB4IHtmaWxlLmRpbWVuc2lvbnMuaGVpZ2h0fVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBNEJBLE1BQU0sOEJBQUMsQ0FBQyxBQUNOLE9BQU8sQ0FBRSxNQUFNLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsYUFBYSxDQUFFLENBQUMsQ0FDaEIsTUFBTSxDQUFFLENBQUMsQ0FDVCxPQUFPLENBQUUsR0FBRyxDQUFDLE1BQU0sQ0FDbkIsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxDQUNaLGFBQWEsQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksZ0JBQWdCLENBQUMsQ0FDOUMsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBRUQsTUFBTSw4QkFBQyxDQUFDLEFBQ04sU0FBUyxDQUFFLENBQUMsQ0FDWixVQUFVLENBQUUsSUFBSSxDQUNoQixXQUFXLENBQUUsQ0FBQyxDQUNkLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLFlBQVksQ0FBRSxJQUFJLENBQ2xCLFVBQVUsQ0FBRSxPQUFPLENBQ25CLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FDekIsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxBQUNsRixDQUFDLEFBQ0QscUJBQU0sQ0FBQyxHQUFHLGVBQUMsQ0FBQyxBQUNWLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixVQUFVLENBQUUsS0FBSyxDQUNqQixlQUFlLENBQUUsTUFBTSxBQUN6QixDQUFDLEFBRUQsUUFBUSw4QkFBQyxDQUFDLEFBQ1IsU0FBUyxDQUFFLENBQUMsQUFDZCxDQUFDLEFBRUQsU0FBUyw4QkFBQyxDQUFDLEFBQ1QsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsSUFBSSxDQUNqQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLEtBQUssQ0FBRSxJQUFJLFlBQVksQ0FBQyxDQUN4QixhQUFhLENBQUUsUUFBUSxDQUN2QixRQUFRLENBQUUsTUFBTSxDQUNoQixXQUFXLENBQUUsTUFBTSxDQUNuQixXQUFXLENBQUUsSUFBSSxBQUNuQixDQUFDLEFBRUQsU0FBUyw4QkFBQyxDQUFDLEFBQ1QsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLEtBQUssQ0FBRSxJQUFJLHFCQUFxQixDQUFDLENBQ2pDLE9BQU8sQ0FBRSxXQUFXLENBQ3BCLGtCQUFrQixDQUFFLFFBQVEsQ0FDNUIsa0JBQWtCLENBQUUsQ0FBQyxDQUNyQixRQUFRLENBQUUsTUFBTSxDQUNoQixjQUFjLENBQUUsSUFBSSxDQUNwQixVQUFVLENBQUUsVUFBVSxDQUN0QixVQUFVLENBQUUsSUFBSSxDQUNoQixXQUFXLENBQUUsSUFBSSxBQUNuQixDQUFDLEFBRUQsV0FBVyw4QkFBQyxDQUFDLEFBQ1gsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsYUFBYSxDQUFFLENBQUMsQ0FDaEIsTUFBTSxDQUFFLElBQUksQ0FDWixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDLEFBQ0QsMEJBQVcsQ0FBQyx3QkFBUyxDQUFFLDBCQUFXLENBQUMsU0FBUyxlQUFDLENBQUMsQUFDNUMsS0FBSyxDQUFFLElBQUksY0FBYyxDQUFDLEFBQzVCLENBQUMsQUFDRCxXQUFXLGlCQUFpQiw4QkFBQyxDQUFDLEFBQzVCLGdCQUFnQixDQUFFLElBQUksZ0NBQWdDLENBQUMsQUFDekQsQ0FBQyxBQUNELHlDQUFXLEtBQUssaUJBQWlCLENBQUMsQUFBQyxDQUFDLEFBQ2xDLGdCQUFnQixDQUFFLElBQUksMEJBQTBCLENBQUMsQUFDbkQsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$n(ctx) {
	let div4;
	let div0;
	let img;
	let img_src_value;
	let t0;
	let div3;
	let div1;
	let t1_value = /*file*/ ctx[3].name + "";
	let t1;
	let t2;
	let div2;
	let t3_value = /*file*/ ctx[3].format.toUpperCase() + "";
	let t3;
	let t4;
	let t5_value = prettySize(/*file*/ ctx[3].sizeInBytes, " ") + "";
	let t5;
	let br;
	let t6;
	let t7_value = /*file*/ ctx[3].dimensions.width + "";
	let t7;
	let t8;
	let t9_value = /*file*/ ctx[3].dimensions.height + "";
	let t9;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div4 = element("div");
			div0 = element("div");
			img = element("img");
			t0 = space();
			div3 = element("div");
			div1 = element("div");
			t1 = text(t1_value);
			t2 = space();
			div2 = element("div");
			t3 = text(t3_value);
			t4 = text(" - ");
			t5 = text(t5_value);
			br = element("br");
			t6 = space();
			t7 = text(t7_value);
			t8 = text(" x ");
			t9 = text(t9_value);
			if (img.src !== (img_src_value = /*file*/ ctx[3].path)) attr_dev(img, "src", img_src_value);
			attr_dev(img, "class", "svelte-13a9buu");
			add_location(img, file_1$1, 116, 6, 2777);
			attr_dev(div0, "class", "thumb svelte-13a9buu");
			add_location(div0, file_1$1, 115, 4, 2751);
			attr_dev(div1, "class", "filename svelte-13a9buu");
			add_location(div1, file_1$1, 119, 6, 2844);
			add_location(br, file_1$1, 121, 73, 2986);
			attr_dev(div2, "class", "metadata svelte-13a9buu");
			add_location(div2, file_1$1, 120, 6, 2890);
			attr_dev(div3, "class", "details svelte-13a9buu");
			add_location(div3, file_1$1, 118, 4, 2816);
			attr_dev(div4, "class", "media svelte-13a9buu");
			toggle_class(div4, "isSelected", /*isSelected*/ ctx[4]);
			toggle_class(div4, "isSidebarFocused", /*isSidebarFocused*/ ctx[5]);
			add_location(div4, file_1$1, 109, 0, 2602);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div4, anchor);
			append_dev(div4, div0);
			append_dev(div0, img);
			append_dev(div4, t0);
			append_dev(div4, div3);
			append_dev(div3, div1);
			append_dev(div1, t1);
			append_dev(div3, t2);
			append_dev(div3, div2);
			append_dev(div2, t3);
			append_dev(div2, t4);
			append_dev(div2, t5);
			append_dev(div2, br);
			append_dev(div2, t6);
			append_dev(div2, t7);
			append_dev(div2, t8);
			append_dev(div2, t9);

			if (!mounted) {
				dispose = listen_dev(div4, "mousedown", /*mousedown_handler*/ ctx[10], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*file*/ 8 && img.src !== (img_src_value = /*file*/ ctx[3].path)) {
				attr_dev(img, "src", img_src_value);
			}

			if (dirty & /*file*/ 8 && t1_value !== (t1_value = /*file*/ ctx[3].name + "")) set_data_dev(t1, t1_value);
			if (dirty & /*file*/ 8 && t3_value !== (t3_value = /*file*/ ctx[3].format.toUpperCase() + "")) set_data_dev(t3, t3_value);
			if (dirty & /*file*/ 8 && t5_value !== (t5_value = prettySize(/*file*/ ctx[3].sizeInBytes, " ") + "")) set_data_dev(t5, t5_value);
			if (dirty & /*file*/ 8 && t7_value !== (t7_value = /*file*/ ctx[3].dimensions.width + "")) set_data_dev(t7, t7_value);
			if (dirty & /*file*/ 8 && t9_value !== (t9_value = /*file*/ ctx[3].dimensions.height + "")) set_data_dev(t9, t9_value);

			if (dirty & /*isSelected*/ 16) {
				toggle_class(div4, "isSelected", /*isSelected*/ ctx[4]);
			}

			if (dirty & /*isSidebarFocused*/ 32) {
				toggle_class(div4, "isSidebarFocused", /*isSidebarFocused*/ ctx[5]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div4);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$n.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$n($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	let $project;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(7, $sidebar = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(8, $files = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(9, $project = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Media", slots, []);
	let { id } = $$props;
	let { listIds } = $$props;
	const tabId = getContext("tabId");
	const writable_props = ["id", "listIds"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Media> was created with unknown prop '${key}'`);
	});

	const mousedown_handler = evt => onMousedown(evt, id, isSelected, tab, tabId, listIds);

	$$self.$$set = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
	};

	$$self.$capture_state = () => ({
		prettySize,
		createEventDispatcher,
		afterUpdate,
		state,
		project,
		files,
		sidebar,
		onMousedown,
		getContext,
		Label: Label$1,
		Thumbnail,
		id,
		listIds,
		tabId,
		tab,
		$sidebar,
		file,
		$files,
		isSelected,
		isSidebarFocused,
		$project
	});

	$$self.$inject_state = $$props => {
		if ("id" in $$props) $$invalidate(0, id = $$props.id);
		if ("listIds" in $$props) $$invalidate(1, listIds = $$props.listIds);
		if ("tab" in $$props) $$invalidate(2, tab = $$props.tab);
		if ("file" in $$props) $$invalidate(3, file = $$props.file);
		if ("isSelected" in $$props) $$invalidate(4, isSelected = $$props.isSelected);
		if ("isSidebarFocused" in $$props) $$invalidate(5, isSidebarFocused = $$props.isSidebarFocused);
	};

	let tab;
	let file;
	let isSelected;
	let isSidebarFocused;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 128) {
			 $$invalidate(2, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$files, id*/ 257) {
			 $$invalidate(3, file = $files.byId[id]);
		}

		if ($$self.$$.dirty & /*tab, file*/ 12) {
			 $$invalidate(4, isSelected = tab.selected.some(id => id == file.id));
		}

		if ($$self.$$.dirty & /*$project*/ 512) {
			 $$invalidate(5, isSidebarFocused = $project.focusedLayoutSection == "sidebar");
		}
	};

	return [
		id,
		listIds,
		tab,
		file,
		isSelected,
		isSidebarFocused,
		tabId,
		$sidebar,
		$files,
		$project,
		mousedown_handler
	];
}

class Media extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-13a9buu-style")) add_css$k();
		init(this, options, instance$n, create_fragment$n, not_equal, { id: 0, listIds: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Media",
			options,
			id: create_fragment$n.name
		});

		const { ctx } = this.$$;
		const props = options.props || {};

		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
			console.warn("<Media> was created without expected prop 'id'");
		}

		if (/*listIds*/ ctx[1] === undefined && !("listIds" in props)) {
			console.warn("<Media> was created without expected prop 'listIds'");
		}
	}

	get id() {
		throw new Error("<Media>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set id(value) {
		throw new Error("<Media>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get listIds() {
		throw new Error("<Media>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set listIds(value) {
		throw new Error("<Media>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/Media.svelte generated by Svelte v3.30.1 */
const file$m = "src/js/renderer/component/sidebar/Media.svelte";

// (77:2) <Header title={tab.title} hoverToShowSlot={true}>
function create_default_slot$4(ctx) {
	let sortmenu;
	let current;

	sortmenu = new SortMenu({
			props: { options: /*sortOptions*/ ctx[3] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(sortmenu.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(sortmenu, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const sortmenu_changes = {};
			if (dirty & /*sortOptions*/ 8) sortmenu_changes.options = /*sortOptions*/ ctx[3];
			sortmenu.$set(sortmenu_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sortmenu.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sortmenu.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sortmenu, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$4.name,
		type: "slot",
		source: "(77:2) <Header title={tab.title} hoverToShowSlot={true}>",
		ctx
	});

	return block;
}

function create_fragment$o(ctx) {
	let div;
	let header;
	let t0;
	let separator;
	let t1;
	let searchfield;
	let updating_query;
	let t2;
	let doclist;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[1].title,
				hoverToShowSlot: true,
				$$slots: { default: [create_default_slot$4] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[7].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));

	doclist = new DocList({
			props: {
				listIds: /*data*/ ctx[2],
				component: Media
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			create_component(doclist.$$.fragment);
			attr_dev(div, "class", "section");
			add_location(div, file$m, 75, 0, 2234);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(header, div, null);
			append_dev(div, t0);
			mount_component(separator, div, null);
			append_dev(div, t1);
			mount_component(searchfield, div, null);
			append_dev(div, t2);
			mount_component(doclist, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope, sortOptions*/ 2056) {
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
			const doclist_changes = {};
			if (dirty & /*data*/ 4) doclist_changes.listIds = /*data*/ ctx[2];
			doclist.$set(doclist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(header);
			destroy_component(separator);
			destroy_component(searchfield);
			destroy_component(doclist);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$o.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$o($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(4, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(5, $project = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(6, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Media", slots, []);
	let query = ""; // Bound to search field
	let tabId = "media";
	setContext("tabId", tabId);

	// -------- DATA -------- //
	let data = [];

	function getData() {
		$$invalidate(2, data = an($files.allIds, draft => {
			// Get ids with file type 'img' or 'av'
			draft = draft.filter(id => $files.byId[id].type == "img" || $files.byId[id].type == "av");

			// Filter by query 
			if (query) {
				draft = draft.filter(id => $files.byId[id].name.includes(query));
			}

			// Sort
			draft = draft.sort((a, b) => {
				const itemA = $files.byId[a];
				const itemB = $files.byId[b];

				if (tab.sortBy == "By Name") {
					if (tab.sortOrder == "Ascending") {
						return itemA.name.localeCompare(itemB.name);
					} else {
						return itemB.name.localeCompare(itemA.name);
					}
				} else if (tab.sortBy == "By Modified") {
					if (tab.sortOrder == "Ascending") {
						return moment(itemA.modified).isBefore(itemB.modified);
					} else {
						return moment(itemB.modified).isBefore(itemA.modified);
					}
				}
			});

			return draft;
		}));
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Media> was created with unknown prop '${key}'`);
	});

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		produce: an,
		Header,
		SortMenu,
		SearchField,
		Separator,
		DocList,
		Media,
		setContext,
		moment,
		query,
		tabId,
		data,
		getData,
		tab,
		$sidebar,
		isSidebarFocused,
		$project,
		sortOptions,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("tabId" in $$props) $$invalidate(9, tabId = $$props.tabId);
		if ("data" in $$props) $$invalidate(2, data = $$props.data);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("isSidebarFocused" in $$props) isSidebarFocused = $$props.isSidebarFocused;
		if ("sortOptions" in $$props) $$invalidate(3, sortOptions = $$props.sortOptions);
	};

	let tab;
	let isSidebarFocused;
	let sortOptions;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 16) {
			 $$invalidate(1, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 32) {
			 isSidebarFocused = $project.focusedLayoutSection == "sidebar";
		}

		if ($$self.$$.dirty & /*tab*/ 2) {
			 $$invalidate(3, sortOptions = [
				{
					label: "By Name",
					group: "sortBy",
					isChecked: tab.sortBy == "By Name"
				},
				{
					label: "By Modified",
					group: "sortBy",
					isChecked: tab.sortBy == "By Modified"
				},
				{ label: "separator" },
				{
					label: "Ascending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Ascending"
				},
				{
					label: "Descending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Descending"
				}
			]);
		}

		if ($$self.$$.dirty & /*$files, query, tab*/ 67) {
			 (tab.sortBy, tab.sortOrder, getData());
		}
	};

	return [
		query,
		tab,
		data,
		sortOptions,
		$sidebar,
		$project,
		$files,
		searchfield_query_binding
	];
}

class Media_1 extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Media_1",
			options,
			id: create_fragment$o.name
		});
	}
}

/* src/js/renderer/component/sidebar/list/Citation.svelte generated by Svelte v3.30.1 */

function create_fragment$p(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Citation!");
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$p.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$p($$self, $$props) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Citation", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Citation> was created with unknown prop '${key}'`);
	});

	return [];
}

class Citation extends SvelteComponentDev {
	constructor(options) {
		super(options);
		init(this, options, instance$p, create_fragment$p, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Citation",
			options,
			id: create_fragment$p.name
		});
	}
}

/* src/js/renderer/component/sidebar/Citations.svelte generated by Svelte v3.30.1 */
const file$n = "src/js/renderer/component/sidebar/Citations.svelte";

function add_css$l() {
	var style = element("style");
	style.id = "svelte-vhu3y1-style";
	style.textContent = ".selectCitationsPrompt.svelte-vhu3y1{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;padding:0 10px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2l0YXRpb25zLnN2ZWx0ZSIsInNvdXJjZXMiOlsiQ2l0YXRpb25zLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBwcm9qZWN0LCBzaWRlYmFyLCBmaWxlcyB9IGZyb20gJy4uLy4uL1N0YXRlTWFuYWdlcidcbiAgaW1wb3J0IEhlYWRlciBmcm9tICcuL0hlYWRlci5zdmVsdGUnXG4gIGltcG9ydCBTZXBhcmF0b3IgZnJvbSAnLi4vdWkvU2VwYXJhdG9yLnN2ZWx0ZSdcbiAgaW1wb3J0IFNlYXJjaEZpZWxkIGZyb20gJy4uL3VpL1NlYXJjaEZpZWxkLnN2ZWx0ZSdcbiAgaW1wb3J0IERvY0xpc3QgZnJvbSAnLi9saXN0L0RvY0xpc3Quc3ZlbHRlJ1xuICBpbXBvcnQgQ2l0YXRpb24gZnJvbSAnLi9saXN0L0NpdGF0aW9uLnN2ZWx0ZSdcbiAgaW1wb3J0IHsgc2V0Q29udGV4dCB9IGZyb20gJ3N2ZWx0ZSdcblxuICBsZXQgcXVlcnkgPSAnJyAvLyBCb3VuZCB0byBzZWFyY2ggZmllbGRcblxuICBsZXQgdGFiSWQgPSAnY2l0YXRpb25zJ1xuICBzZXRDb250ZXh0KCd0YWJJZCcsIHRhYklkKTtcbiAgJDogdGFiID0gJHNpZGViYXIudGFic0J5SWRbdGFiSWRdXG5cbiAgJDogY2l0YXRpb25zID0gJHByb2plY3QuY2l0YXRpb25zXG5cbiAgLy8gLS0tLS0tLS0gREFUQSAtLS0tLS0tLSAvL1xuXG4gIGxldCBkYXRhID0gW11cblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLnNlbGVjdENpdGF0aW9uc1Byb21wdCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBwYWRkaW5nOiAwIDEwcHg7XG59PC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cInNlY3Rpb25cIj5cbiAgPEhlYWRlciB0aXRsZT17dGFiLnRpdGxlfSBob3ZlclRvU2hvd1Nsb3Q9e3RydWV9PlxuICAgIDwhLS0gPFNvcnRNZW51IG9wdGlvbnM9e3NvcnRPcHRpb25zfSAvPiAtLT5cbiAgPC9IZWFkZXI+XG4gIDxTZXBhcmF0b3IgbWFyZ2luU2lkZXM9ezEwfSAvPlxuICB7I2lmIGNpdGF0aW9uc31cbiAgICA8U2VhcmNoRmllbGQgZm9jdXNlZCBiaW5kOnF1ZXJ5IHBsYWNlaG9sZGVyPXsnVGl0bGUgb3IgS2V5J30gLz5cbiAgICA8RG9jTGlzdCBsaXN0SWRzPXtkYXRhfSBjb21wb25lbnQ9e0NpdGF0aW9ufSAvPlxuICB7OmVsc2V9XG4gICAgPGRpdiBjbGFzcz1cInNlbGVjdENpdGF0aW9uc1Byb21wdFwiPlxuICAgICAgPHA+U2VsZWN0IGEgPGEgaHJlZj1cImh0dHBzOi8vY2l0ZXByb2MtanMucmVhZHRoZWRvY3MuaW8vZW4vbGF0ZXN0L2NzbC1qc29uL21hcmt1cC5odG1sXCI+Q1NMLUpTT048L2E+IGZpbGUgY29udGFpbmluZyBjaXRhdGlvbnMuPC9wPlxuICAgICAgPGJ1dHRvblxuICAgICAgICBvbjpjbGljaz17KCkgPT4ge1xuICAgICAgICAgIHdpbmRvdy5hcGkuc2VuZCgnZGlzcGF0Y2gnLCB7IHR5cGU6ICdTRUxFQ1RfQ0lUQVRJT05TX0ZJTEVfRlJPTV9ESUFMT0cnIH0pXG4gICAgICAgIH19PlxuICAgICAgICBDaG9vc2UgQ2l0YXRpb25zIEZpbGUuLi5cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICB7L2lmfVxuPC9kaXY+XG5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUErQkEsc0JBQXNCLGNBQUMsQ0FBQyxBQUN0QixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsT0FBTyxDQUFFLENBQUMsQ0FBQyxJQUFJLEFBQ2pCLENBQUMifQ== */";
	append_dev(document.head, style);
}

// (49:2) {:else}
function create_else_block$2(ctx) {
	let div;
	let p;
	let t0;
	let a;
	let t2;
	let t3;
	let button;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div = element("div");
			p = element("p");
			t0 = text("Select a ");
			a = element("a");
			a.textContent = "CSL-JSON";
			t2 = text(" file containing citations.");
			t3 = space();
			button = element("button");
			button.textContent = "Choose Citations File...";
			attr_dev(a, "href", "https://citeproc-js.readthedocs.io/en/latest/csl-json/markup.html");
			add_location(a, file$n, 50, 18, 1496);
			add_location(p, file$n, 50, 6, 1484);
			add_location(button, file$n, 51, 6, 1622);
			attr_dev(div, "class", "selectCitationsPrompt svelte-vhu3y1");
			add_location(div, file$n, 49, 4, 1442);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, p);
			append_dev(p, t0);
			append_dev(p, a);
			append_dev(p, t2);
			append_dev(div, t3);
			append_dev(div, button);

			if (!mounted) {
				dispose = listen_dev(button, "click", /*click_handler*/ ctx[7], false, false, false);
				mounted = true;
			}
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$2.name,
		type: "else",
		source: "(49:2) {:else}",
		ctx
	});

	return block;
}

// (46:2) {#if citations}
function create_if_block$b(ctx) {
	let searchfield;
	let updating_query;
	let t;
	let doclist;
	let current;

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[6].call(null, value);
	}

	let searchfield_props = {
		focused: true,
		placeholder: "Title or Key"
	};

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));

	doclist = new DocList({
			props: {
				listIds: /*data*/ ctx[3],
				component: Citation
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(searchfield.$$.fragment);
			t = space();
			create_component(doclist.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(searchfield, target, anchor);
			insert_dev(target, t, anchor);
			mount_component(doclist, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const searchfield_changes = {};

			if (!updating_query && dirty & /*query*/ 1) {
				updating_query = true;
				searchfield_changes.query = /*query*/ ctx[0];
				add_flush_callback(() => updating_query = false);
			}

			searchfield.$set(searchfield_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(searchfield.$$.fragment, local);
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(searchfield.$$.fragment, local);
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(searchfield, detaching);
			if (detaching) detach_dev(t);
			destroy_component(doclist, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$b.name,
		type: "if",
		source: "(46:2) {#if citations}",
		ctx
	});

	return block;
}

function create_fragment$q(ctx) {
	let div;
	let header;
	let t0;
	let separator;
	let t1;
	let current_block_type_index;
	let if_block;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[1].title,
				hoverToShowSlot: true
			},
			$$inline: true
		});

	separator = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	const if_block_creators = [create_if_block$b, create_else_block$2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*citations*/ ctx[2]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			div = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			if_block.c();
			attr_dev(div, "class", "section");
			add_location(div, file$n, 40, 0, 1123);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(header, div, null);
			append_dev(div, t0);
			mount_component(separator, div, null);
			append_dev(div, t1);
			if_blocks[current_block_type_index].m(div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope*/ 512) {
				header_changes.$$scope = { dirty, ctx };
			}

			header.$set(header_changes);
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index === previous_block_index) {
				if_blocks[current_block_type_index].p(ctx, dirty);
			} else {
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
				if_block.m(div, null);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(header);
			destroy_component(separator);
			if_blocks[current_block_type_index].d();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$q.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$q($$self, $$props, $$invalidate) {
	let $sidebar;
	let $project;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(4, $sidebar = $$value));
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(5, $project = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Citations", slots, []);
	let query = ""; // Bound to search field
	let tabId = "citations";
	setContext("tabId", tabId);

	// -------- DATA -------- //
	let data = [];

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Citations> was created with unknown prop '${key}'`);
	});

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	const click_handler = () => {
		window.api.send("dispatch", {
			type: "SELECT_CITATIONS_FILE_FROM_DIALOG"
		});
	};

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		Header,
		Separator,
		SearchField,
		DocList,
		Citation,
		setContext,
		query,
		tabId,
		data,
		tab,
		$sidebar,
		citations,
		$project
	});

	$$self.$inject_state = $$props => {
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("tabId" in $$props) $$invalidate(8, tabId = $$props.tabId);
		if ("data" in $$props) $$invalidate(3, data = $$props.data);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("citations" in $$props) $$invalidate(2, citations = $$props.citations);
	};

	let tab;
	let citations;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 16) {
			 $$invalidate(1, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*$project*/ 32) {
			 $$invalidate(2, citations = $project.citations);
		}
	};

	return [
		query,
		tab,
		citations,
		data,
		$sidebar,
		$project,
		searchfield_query_binding,
		click_handler
	];
}

class Citations extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-vhu3y1-style")) add_css$l();
		init(this, options, instance$q, create_fragment$q, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Citations",
			options,
			id: create_fragment$q.name
		});
	}
}

/* src/js/renderer/component/ui/Expandable.svelte generated by Svelte v3.30.1 */
const file$o = "src/js/renderer/component/ui/Expandable.svelte";

function add_css$m() {
	var style = element("style");
	style.id = "svelte-m6po2j-style";
	style.textContent = ".expandable.svelte-m6po2j.svelte-m6po2j{display:flex;flex-shrink:0;flex-direction:column;transition:flex 250ms ease-out;overflow:hidden}.expandable.isOpen.svelte-m6po2j.svelte-m6po2j{flex-basis:calc(var(--maxExpandedHeight) * 1px)}.expandable.svelte-m6po2j.svelte-m6po2j:not(.isOpen){flex-basis:20px}header.svelte-m6po2j.svelte-m6po2j{padding:0 10px;display:flex;position:relative;flex-direction:row;align-items:center;min-height:20px;user-select:none}header.svelte-m6po2j h1.svelte-m6po2j{font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px;color:var(--labelColor);font-weight:bold;flex-grow:1;margin:0;padding:0;position:absolute;left:22px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXhwYW5kYWJsZS5zdmVsdGUiLCJzb3VyY2VzIjpbIkV4cGFuZGFibGUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNzcyB9IGZyb20gJy4uL3VpL2FjdGlvbnMnXG4gIGltcG9ydCBEaXNjbG9zdXJlQnV0dG9uIGZyb20gJy4vRGlzY2xvc3VyZUJ1dHRvbi5zdmVsdGUnO1xuXG4gIGV4cG9ydCBsZXQgdGl0bGUgPSAnVGl0bGUnXG4gIGV4cG9ydCBsZXQgbWF4RXhwYW5kZWRIZWlnaHQgPSAxMDBcbiAgZXhwb3J0IGxldCBpc09wZW4gPSB0cnVlXG4gIFxuICBmdW5jdGlvbiB0b2RvKCkge1xuICAgIGlzT3BlbiA9ICFpc09wZW5cbiAgfVxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4uZXhwYW5kYWJsZSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtc2hyaW5rOiAwO1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICB0cmFuc2l0aW9uOiBmbGV4IDI1MG1zIGVhc2Utb3V0O1xuICBvdmVyZmxvdzogaGlkZGVuO1xufVxuLmV4cGFuZGFibGUuaXNPcGVuIHtcbiAgZmxleC1iYXNpczogY2FsYyh2YXIoLS1tYXhFeHBhbmRlZEhlaWdodCkgKiAxcHgpO1xufVxuLmV4cGFuZGFibGU6bm90KC5pc09wZW4pIHtcbiAgZmxleC1iYXNpczogMjBweDtcbn1cblxuaGVhZGVyIHtcbiAgcGFkZGluZzogMCAxMHB4O1xuICBkaXNwbGF5OiBmbGV4O1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1pbi1oZWlnaHQ6IDIwcHg7XG4gIHVzZXItc2VsZWN0OiBub25lO1xufVxuaGVhZGVyIGgxIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbGluZS1oZWlnaHQ6IDEzcHg7XG4gIGxldHRlci1zcGFjaW5nOiAwLjA3cHg7XG4gIGNvbG9yOiB2YXIoLS1sYWJlbENvbG9yKTtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZsZXgtZ3JvdzogMTtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiAwO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIGxlZnQ6IDIycHg7XG59PC9zdHlsZT5cblxuPHN2ZWx0ZTpvcHRpb25zIGltbXV0YWJsZT17dHJ1ZX0gLz5cblxuPGRpdiBjbGFzcz1cImV4cGFuZGFibGVcIiBjbGFzczppc09wZW4gdXNlOmNzcz17eyBtYXhFeHBhbmRlZEhlaWdodCB9fT5cbiAgPGhlYWRlcj5cbiAgICA8RGlzY2xvc3VyZUJ1dHRvblxuICAgICAgd2lkdGg9ezEyfVxuICAgICAgaGVpZ2h0PXsxMn1cbiAgICAgIHBhZGRpbmc9ezV9XG4gICAgICBsZWZ0PXs4fVxuICAgICAgcm90YXRpb249e2lzT3BlbiA/IDkwIDogMH1cbiAgICAgIHRvb2x0aXA9eydUb2dnbGUgRXhwYW5kZWQnfVxuICAgICAgb246dG9nZ2xlPXt0b2RvfSAvPlxuICAgIDxoMT57dGl0bGV9PC9oMT5cbiAgPC9oZWFkZXI+XG4gIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgPHNsb3QgLz5cbiAgPC9kaXY+XG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFrQkEsV0FBVyw0QkFBQyxDQUFDLEFBQ1gsT0FBTyxDQUFFLElBQUksQ0FDYixXQUFXLENBQUUsQ0FBQyxDQUNkLGNBQWMsQ0FBRSxNQUFNLENBQ3RCLFVBQVUsQ0FBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FDL0IsUUFBUSxDQUFFLE1BQU0sQUFDbEIsQ0FBQyxBQUNELFdBQVcsT0FBTyw0QkFBQyxDQUFDLEFBQ2xCLFVBQVUsQ0FBRSxLQUFLLElBQUksbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEFBQ2xELENBQUMsQUFDRCx1Q0FBVyxLQUFLLE9BQU8sQ0FBQyxBQUFDLENBQUMsQUFDeEIsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyxBQUVELE1BQU0sNEJBQUMsQ0FBQyxBQUNOLE9BQU8sQ0FBRSxDQUFDLENBQUMsSUFBSSxDQUNmLE9BQU8sQ0FBRSxJQUFJLENBQ2IsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsY0FBYyxDQUFFLEdBQUcsQ0FDbkIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsVUFBVSxDQUFFLElBQUksQ0FDaEIsV0FBVyxDQUFFLElBQUksQUFDbkIsQ0FBQyxBQUNELG9CQUFNLENBQUMsRUFBRSxjQUFDLENBQUMsQUFDVCxJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsS0FBSyxDQUFFLElBQUksWUFBWSxDQUFDLENBQ3hCLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFNBQVMsQ0FBRSxDQUFDLENBQ1osTUFBTSxDQUFFLENBQUMsQ0FDVCxPQUFPLENBQUUsQ0FBQyxDQUNWLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLElBQUksQ0FBRSxJQUFJLEFBQ1osQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$r(ctx) {
	let div1;
	let header;
	let disclosurebutton;
	let t0;
	let h1;
	let t1;
	let t2;
	let div0;
	let css_action;
	let current;
	let mounted;
	let dispose;

	disclosurebutton = new DisclosureButton({
			props: {
				width: 12,
				height: 12,
				padding: 5,
				left: 8,
				rotation: /*isOpen*/ ctx[0] ? 90 : 0,
				tooltip: "Toggle Expanded"
			},
			$$inline: true
		});

	disclosurebutton.$on("toggle", /*todo*/ ctx[3]);
	const default_slot_template = /*#slots*/ ctx[5].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

	const block = {
		c: function create() {
			div1 = element("div");
			header = element("header");
			create_component(disclosurebutton.$$.fragment);
			t0 = space();
			h1 = element("h1");
			t1 = text(/*title*/ ctx[1]);
			t2 = space();
			div0 = element("div");
			if (default_slot) default_slot.c();
			attr_dev(h1, "class", "svelte-m6po2j");
			add_location(h1, file$o, 68, 4, 1437);
			attr_dev(header, "class", "svelte-m6po2j");
			add_location(header, file$o, 59, 2, 1241);
			attr_dev(div0, "class", "content");
			add_location(div0, file$o, 70, 2, 1468);
			attr_dev(div1, "class", "expandable svelte-m6po2j");
			toggle_class(div1, "isOpen", /*isOpen*/ ctx[0]);
			add_location(div1, file$o, 58, 0, 1169);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, header);
			mount_component(disclosurebutton, header, null);
			append_dev(header, t0);
			append_dev(header, h1);
			append_dev(h1, t1);
			append_dev(div1, t2);
			append_dev(div1, div0);

			if (default_slot) {
				default_slot.m(div0, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, div1, {
					maxExpandedHeight: /*maxExpandedHeight*/ ctx[2]
				}));

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			const disclosurebutton_changes = {};
			if (dirty & /*isOpen*/ 1) disclosurebutton_changes.rotation = /*isOpen*/ ctx[0] ? 90 : 0;
			disclosurebutton.$set(disclosurebutton_changes);
			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 16) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
				}
			}

			if (css_action && is_function(css_action.update) && dirty & /*maxExpandedHeight*/ 4) css_action.update.call(null, {
				maxExpandedHeight: /*maxExpandedHeight*/ ctx[2]
			});

			if (dirty & /*isOpen*/ 1) {
				toggle_class(div1, "isOpen", /*isOpen*/ ctx[0]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(disclosurebutton.$$.fragment, local);
			transition_in(default_slot, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(disclosurebutton.$$.fragment, local);
			transition_out(default_slot, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(disclosurebutton);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$r.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$r($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Expandable", slots, ['default']);
	let { title = "Title" } = $$props;
	let { maxExpandedHeight = 100 } = $$props;
	let { isOpen = true } = $$props;

	function todo() {
		$$invalidate(0, isOpen = !isOpen);
	}

	const writable_props = ["title", "maxExpandedHeight", "isOpen"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Expandable> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("maxExpandedHeight" in $$props) $$invalidate(2, maxExpandedHeight = $$props.maxExpandedHeight);
		if ("isOpen" in $$props) $$invalidate(0, isOpen = $$props.isOpen);
		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => ({
		css,
		DisclosureButton,
		title,
		maxExpandedHeight,
		isOpen,
		todo
	});

	$$self.$inject_state = $$props => {
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("maxExpandedHeight" in $$props) $$invalidate(2, maxExpandedHeight = $$props.maxExpandedHeight);
		if ("isOpen" in $$props) $$invalidate(0, isOpen = $$props.isOpen);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [isOpen, title, maxExpandedHeight, todo, $$scope, slots];
}

class Expandable extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-m6po2j-style")) add_css$m();

		init(this, options, instance$r, create_fragment$r, not_equal, {
			title: 1,
			maxExpandedHeight: 2,
			isOpen: 0
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Expandable",
			options,
			id: create_fragment$r.name
		});
	}

	get title() {
		throw new Error("<Expandable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<Expandable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get maxExpandedHeight() {
		throw new Error("<Expandable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maxExpandedHeight(value) {
		throw new Error("<Expandable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isOpen() {
		throw new Error("<Expandable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isOpen(value) {
		throw new Error("<Expandable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/Checkbox.svelte generated by Svelte v3.30.1 */

const file$p = "src/js/renderer/component/ui/Checkbox.svelte";

function add_css$n() {
	var style = element("style");
	style.id = "svelte-uz3ifp-style";
	style.textContent = ".isCompact.svelte-uz3ifp .label.svelte-uz3ifp{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;margin-bottom:-1px}.isCompact.svelte-uz3ifp .box.svelte-uz3ifp{width:12px;height:12px;border-radius:2.5px}.isCompact.svelte-uz3ifp .box .img.svelte-uz3ifp{-webkit-mask-size:8px}.isChecked.svelte-uz3ifp .box.svelte-uz3ifp{background:linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)), linear-gradient(var(--controlAccentColor), var(--controlAccentColor));box-shadow:none}.isChecked.svelte-uz3ifp .box .img.svelte-uz3ifp{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:100%;height:100%;-webkit-mask-size:10px;-webkit-mask-image:var(--img-checkmark-heavy);background-color:white}.checkbox.svelte-uz3ifp.svelte-uz3ifp{display:inline-flex;align-items:center;max-height:14px;overflow:hidden}.checkbox.svelte-uz3ifp.svelte-uz3ifp:not(:first-of-type){padding-left:8px}.box.svelte-uz3ifp.svelte-uz3ifp{width:14px;height:14px;border-radius:3px;background:var(--controlColor);box-shadow:0 0 0 1px rgba(0, 0, 0, 0.15) inset, 0px 1.5px 1px 0.5px rgba(0, 0, 0, 0.07) inset}.label.svelte-uz3ifp.svelte-uz3ifp{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;display:flex;align-items:center;margin-left:5px;color:var(--labelColor);user-select:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hlY2tib3guc3ZlbHRlIiwic291cmNlcyI6WyJDaGVja2JveC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgZXhwb3J0IGxldCBpc0NoZWNrZWQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGlzQ29tcGFjdCA9IGZhbHNlXG4gIGV4cG9ydCBsZXQgbGFiZWwgPSAnJ1xuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLmlzQ29tcGFjdCAubGFiZWwge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMC4wN3B4O1xuICBtYXJnaW4tYm90dG9tOiAtMXB4O1xufVxuLmlzQ29tcGFjdCAuYm94IHtcbiAgd2lkdGg6IDEycHg7XG4gIGhlaWdodDogMTJweDtcbiAgYm9yZGVyLXJhZGl1czogMi41cHg7XG59XG4uaXNDb21wYWN0IC5ib3ggLmltZyB7XG4gIC13ZWJraXQtbWFzay1zaXplOiA4cHg7XG59XG5cbi5pc0NoZWNrZWQgLmJveCB7XG4gIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudChyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpLCByZ2JhKDI1NSwgMjU1LCAyNTUsIDApKSwgbGluZWFyLWdyYWRpZW50KHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvciksIHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvcikpO1xuICBib3gtc2hhZG93OiBub25lO1xufVxuLmlzQ2hlY2tlZCAuYm94IC5pbWcge1xuICAtd2Via2l0LW1hc2stc2l6ZTogY29udGFpbjtcbiAgLXdlYmtpdC1tYXNrLXBvc2l0aW9uOiBjZW50ZXI7XG4gIC13ZWJraXQtbWFzay1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgLXdlYmtpdC1tYXNrLXNpemU6IDEwcHg7XG4gIC13ZWJraXQtbWFzay1pbWFnZTogdmFyKC0taW1nLWNoZWNrbWFyay1oZWF2eSk7XG4gIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1xufVxuXG4uY2hlY2tib3gge1xuICBkaXNwbGF5OiBpbmxpbmUtZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgbWF4LWhlaWdodDogMTRweDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cbi5jaGVja2JveDpub3QoOmZpcnN0LW9mLXR5cGUpIHtcbiAgcGFkZGluZy1sZWZ0OiA4cHg7XG59XG5cbi5ib3gge1xuICB3aWR0aDogMTRweDtcbiAgaGVpZ2h0OiAxNHB4O1xuICBib3JkZXItcmFkaXVzOiAzcHg7XG4gIGJhY2tncm91bmQ6IHZhcigtLWNvbnRyb2xDb2xvcik7XG4gIGJveC1zaGFkb3c6IDAgMCAwIDFweCByZ2JhKDAsIDAsIDAsIDAuMTUpIGluc2V0LCAwcHggMS41cHggMXB4IDAuNXB4IHJnYmEoMCwgMCwgMCwgMC4wNykgaW5zZXQ7XG59XG5cbi5sYWJlbCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBtYXJnaW4tbGVmdDogNXB4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIHVzZXItc2VsZWN0OiBub25lO1xufTwvc3R5bGU+XG5cbjxkaXYgY2xhc3M9XCJjaGVja2JveFwiIGNsYXNzOmlzQ2hlY2tlZCBjbGFzczppc0NvbXBhY3Qgb246Y2xpY2s+XG4gIDxzcGFuIGNsYXNzPVwiYm94XCI+XG4gICAgPGRpdiBjbGFzcz1cImltZ1wiPjwvZGl2PlxuICA8L3NwYW4+XG4gIDxzcGFuIGNsYXNzPVwibGFiZWxcIj5cbiAgICB7bGFiZWx9XG4gIDwvc3Bhbj5cbjwvZGl2PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVQSx3QkFBVSxDQUFDLE1BQU0sY0FBQyxDQUFDLEFBQ2pCLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFBTSxDQUN0QixhQUFhLENBQUUsSUFBSSxBQUNyQixDQUFDLEFBQ0Qsd0JBQVUsQ0FBQyxJQUFJLGNBQUMsQ0FBQyxBQUNmLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixhQUFhLENBQUUsS0FBSyxBQUN0QixDQUFDLEFBQ0Qsd0JBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxjQUFDLENBQUMsQUFDcEIsaUJBQWlCLENBQUUsR0FBRyxBQUN4QixDQUFDLEFBRUQsd0JBQVUsQ0FBQyxJQUFJLGNBQUMsQ0FBQyxBQUNmLFVBQVUsQ0FBRSxnQkFBZ0IsS0FBSyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixJQUFJLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxJQUFJLG9CQUFvQixDQUFDLENBQUMsQ0FDckosVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyxBQUNELHdCQUFVLENBQUMsSUFBSSxDQUFDLElBQUksY0FBQyxDQUFDLEFBQ3BCLGlCQUFpQixDQUFFLE9BQU8sQ0FDMUIscUJBQXFCLENBQUUsTUFBTSxDQUM3QixtQkFBbUIsQ0FBRSxTQUFTLENBQzlCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixpQkFBaUIsQ0FBRSxJQUFJLENBQ3ZCLGtCQUFrQixDQUFFLElBQUkscUJBQXFCLENBQUMsQ0FDOUMsZ0JBQWdCLENBQUUsS0FBSyxBQUN6QixDQUFDLEFBRUQsU0FBUyw0QkFBQyxDQUFDLEFBQ1QsT0FBTyxDQUFFLFdBQVcsQ0FDcEIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsVUFBVSxDQUFFLElBQUksQ0FDaEIsUUFBUSxDQUFFLE1BQU0sQUFDbEIsQ0FBQyxBQUNELHFDQUFTLEtBQUssY0FBYyxDQUFDLEFBQUMsQ0FBQyxBQUM3QixZQUFZLENBQUUsR0FBRyxBQUNuQixDQUFDLEFBRUQsSUFBSSw0QkFBQyxDQUFDLEFBQ0osS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxDQUNaLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLFVBQVUsQ0FBRSxJQUFJLGNBQWMsQ0FBQyxDQUMvQixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxBQUNoRyxDQUFDLEFBRUQsTUFBTSw0QkFBQyxDQUFDLEFBQ04sSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsV0FBVyxDQUFFLEdBQUcsQ0FDaEIsS0FBSyxDQUFFLElBQUksWUFBWSxDQUFDLENBQ3hCLFdBQVcsQ0FBRSxJQUFJLEFBQ25CLENBQUMifQ== */";
	append_dev(document.head, style);
}

function create_fragment$s(ctx) {
	let div1;
	let span0;
	let div0;
	let t0;
	let span1;
	let t1;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div1 = element("div");
			span0 = element("span");
			div0 = element("div");
			t0 = space();
			span1 = element("span");
			t1 = text(/*label*/ ctx[2]);
			attr_dev(div0, "class", "img svelte-uz3ifp");
			add_location(div0, file$p, 75, 4, 1716);
			attr_dev(span0, "class", "box svelte-uz3ifp");
			add_location(span0, file$p, 74, 2, 1693);
			attr_dev(span1, "class", "label svelte-uz3ifp");
			add_location(span1, file$p, 77, 2, 1752);
			attr_dev(div1, "class", "checkbox svelte-uz3ifp");
			toggle_class(div1, "isChecked", /*isChecked*/ ctx[0]);
			toggle_class(div1, "isCompact", /*isCompact*/ ctx[1]);
			add_location(div1, file$p, 73, 0, 1627);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, span0);
			append_dev(span0, div0);
			append_dev(div1, t0);
			append_dev(div1, span1);
			append_dev(span1, t1);

			if (!mounted) {
				dispose = listen_dev(div1, "click", /*click_handler*/ ctx[3], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*label*/ 4) set_data_dev(t1, /*label*/ ctx[2]);

			if (dirty & /*isChecked*/ 1) {
				toggle_class(div1, "isChecked", /*isChecked*/ ctx[0]);
			}

			if (dirty & /*isCompact*/ 2) {
				toggle_class(div1, "isCompact", /*isCompact*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$s.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$s($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Checkbox", slots, []);
	let { isChecked = false } = $$props;
	let { isCompact = false } = $$props;
	let { label = "" } = $$props;
	const writable_props = ["isChecked", "isCompact", "label"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox> was created with unknown prop '${key}'`);
	});

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("isChecked" in $$props) $$invalidate(0, isChecked = $$props.isChecked);
		if ("isCompact" in $$props) $$invalidate(1, isCompact = $$props.isCompact);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
	};

	$$self.$capture_state = () => ({ isChecked, isCompact, label });

	$$self.$inject_state = $$props => {
		if ("isChecked" in $$props) $$invalidate(0, isChecked = $$props.isChecked);
		if ("isCompact" in $$props) $$invalidate(1, isCompact = $$props.isCompact);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [isChecked, isCompact, label, click_handler];
}

class Checkbox extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-uz3ifp-style")) add_css$n();
		init(this, options, instance$s, create_fragment$s, safe_not_equal, { isChecked: 0, isCompact: 1, label: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Checkbox",
			options,
			id: create_fragment$s.name
		});
	}

	get isChecked() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isChecked(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isCompact() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isCompact(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/sidebar/Search.svelte generated by Svelte v3.30.1 */

const { console: console_1 } = globals;
const file$q = "src/js/renderer/component/sidebar/Search.svelte";

function add_css$o() {
	var style = element("style");
	style.id = "svelte-1hk9sih-style";
	style.textContent = "#numberOfResults.svelte-1hk9sih.svelte-1hk9sih{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;color:var(--labelColor);min-height:25px;white-space:nowrap;overflow:hidden;display:flex;align-items:center;justify-content:center}.row.svelte-1hk9sih.svelte-1hk9sih{margin:8px 10px 0;display:flex;align-items:center}.row.svelte-1hk9sih .label.svelte-1hk9sih{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;user-select:none;text-align:right;flex-basis:46px;flex-shrink:0;margin-right:6px}.row.svelte-1hk9sih .items.svelte-1hk9sih{display:flex;align-items:center}.row.svelte-1hk9sih.svelte-1hk9sih:first-of-type{margin-top:5px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VhcmNoLnN2ZWx0ZSIsInNvdXJjZXMiOlsiU2VhcmNoLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBwcm9qZWN0LCBzaWRlYmFyLCBmaWxlcyB9IGZyb20gJy4uLy4uL1N0YXRlTWFuYWdlcidcbiAgaW1wb3J0IEhlYWRlciBmcm9tICcuL0hlYWRlci5zdmVsdGUnXG4gIGltcG9ydCBTb3J0TWVudSBmcm9tICcuL1NvcnRNZW51LnN2ZWx0ZSc7XG4gIGltcG9ydCBTZXBhcmF0b3IgZnJvbSAnLi4vdWkvU2VwYXJhdG9yLnN2ZWx0ZSdcbiAgaW1wb3J0IFNlYXJjaEZpZWxkIGZyb20gJy4uL3VpL1NlYXJjaEZpZWxkLnN2ZWx0ZSdcbiAgaW1wb3J0IERvY0xpc3QgZnJvbSAnLi9saXN0L0RvY0xpc3Quc3ZlbHRlJ1xuICBpbXBvcnQgRG9jIGZyb20gJy4vbGlzdC9Eb2Muc3ZlbHRlJ1xuICBpbXBvcnQgRGlzY2xvc3VyZUJ1dHRvbiBmcm9tICcuLi91aS9EaXNjbG9zdXJlQnV0dG9uLnN2ZWx0ZSc7XG4gIGltcG9ydCB7IHNldENvbnRleHQgfSBmcm9tICdzdmVsdGUnO1xuICBpbXBvcnQgRXhwYW5kYWJsZSBmcm9tICcuLi91aS9FeHBhbmRhYmxlLnN2ZWx0ZSc7XG4gIGltcG9ydCBNZW51QnV0dG9uIGZyb20gJy4uL3VpL01lbnVCdXR0b24uc3ZlbHRlJztcbiAgaW1wb3J0IFRva2VuIGZyb20gJy4uL3VpL1Rva2VuLnN2ZWx0ZSc7XG4gIGltcG9ydCBDaGVja2JveCBmcm9tICcuLi91aS9DaGVja2JveC5zdmVsdGUnO1xuICBcbiAgbGV0IHF1ZXJ5ID0gJycgLy8gQm91bmQgdG8gc2VhcmNoIGZpZWxkXG5cbiAgbGV0IHRhYklkID0gJ3NlYXJjaCdcbiAgc2V0Q29udGV4dCgndGFiSWQnLCB0YWJJZCk7XG4gICQ6IHRhYiA9ICRzaWRlYmFyLnRhYnNCeUlkW3RhYklkXVxuXG4gIC8vIC0tLS0tLS0tIFNPUlRJTkcgLS0tLS0tLS0gLy9cblxuICAkOiBzb3J0T3B0aW9ucyA9IFtcbiAgICB7IGxhYmVsOiAnQnkgVGl0bGUnLCBncm91cDogJ3NvcnRCeScsIGlzQ2hlY2tlZDogdGFiLnNvcnRCeSA9PSAnQnkgVGl0bGUnIH0sXG4gICAgeyBsYWJlbDogJ0J5IE1vZGlmaWVkJywgZ3JvdXA6ICdzb3J0QnknLCBpc0NoZWNrZWQ6IHRhYi5zb3J0QnkgPT0gJ0J5IE1vZGlmaWVkJyB9LFxuICAgIHsgbGFiZWw6ICdzZXBhcmF0b3InIH0sXG4gICAgeyBsYWJlbDogJ0FzY2VuZGluZycsIGdyb3VwOiAnc29ydE9yZGVyJywgaXNDaGVja2VkOiB0YWIuc29ydE9yZGVyID09ICdBc2NlbmRpbmcnIH0sXG4gICAgeyBsYWJlbDogJ0Rlc2NlbmRpbmcnLCBncm91cDogJ3NvcnRPcmRlcicsIGlzQ2hlY2tlZDogdGFiLnNvcnRPcmRlciA9PSAnRGVzY2VuZGluZycgfSxcbiAgXVxuXG4gIC8vIC0tLS0tLS0tIE9QVElPTlMgLS0tLS0tLS0gLy9cblxuICAkOiBvcHRpb25zID0gdGFiLm9wdGlvbnNcblxuICAvKipcbiAgICogVXBkYXRlIHN0YXRlIHdoZW4gdGhlIHVzZXIgbW9kaWZpZXMgdGhlIHBhcmFtcyBpbiB0aGUgJ09wdGlvbnMnIHNlY3Rpb24uXG4gICAqL1xuICBmdW5jdGlvbiB1cGRhdGVPcHRpb25zKGtleSwgdmFsdWUpIHtcbiAgICBsZXQgbmV3T3B0aW9ucyA9IHsuLi5vcHRpb25zfVxuICAgIG5ld09wdGlvbnNba2V5XSA9IHZhbHVlXG4gICAgd2luZG93LmFwaS5zZW5kKCdkaXNwYXRjaCcsIHtcbiAgICAgIHR5cGU6ICdTSURFQkFSX1NFVF9TRUFSQ0hfUEFSQU1TJyxcbiAgICAgIG9wdGlvbnM6IG5ld09wdGlvbnNcbiAgICB9KVxuICB9XG5cbiAgJDogJGZpbGVzLCB0YWIsIHNldExvb2tJbk1lbnVPcHRpb25zKCkgXG4gICAgXG4gIGxldCBsb29rSW5PcHRpb25zID0gW11cblxuICAvKipcbiAgICogQWRkIGVhY2ggZm9sZGVyIGluIHRoZSBwcm9qZWN0IGFzIGFuIG9wdGlvbiBpbiB0aGUgJ0xvb2sgSW46JyBtZW51LlxuICAgKiBGaXJzdCBvcHRpb24gaXMgXCJBbGwgRm9sZGVyc1wiLiBCZWxvdyB0aGF0LCB3ZSBsaXN0IHRoZSBmb2xkZXJzLlxuICAgKi9cbiAgZnVuY3Rpb24gc2V0TG9va0luTWVudU9wdGlvbnMoKSB7XG5cbiAgICAvLyBTdGFydGluZyBvcHRpb25zXG4gICAgbG9va0luT3B0aW9ucyA9IFtcbiAgICAgIHsgbGFiZWw6ICdBbGwgRm9sZGVycycsIGlzQ2hlY2tlZDogb3B0aW9ucy5sb29rSW4gPT0gJ0FsbCBGb2xkZXJzJyB9LFxuICAgICAgeyBsYWJlbDogJ3NlcGFyYXRvcicgfSxcbiAgICBdXG4gICAgXG4gICAgLy8gQWRkIGVhY2ggZm9sZGVyXG4gICAgJGZpbGVzLmFsbElkcy5mb3JFYWNoKChpZCkgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9ICRmaWxlcy5ieUlkW2lkXVxuICAgICAgaWYgKGZpbGUudHlwZSA9PSAnZm9sZGVyJykge1xuICAgICAgICBsb29rSW5PcHRpb25zLnB1c2goeyBsYWJlbDogZmlsZS5uYW1lLCBpc0NoZWNrZWQ6IG9wdGlvbnMubG9va0luID09IGZpbGUubmFtZSB9KVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuXG4gIC8vIC0tLS0tLS0tIFJFU1VMVFMgLS0tLS0tLS0gLy9cblxuICBsZXQgcmVzdWx0cyA9IFtdXG5cbiAgJDogJGZpbGVzLCBxdWVyeSwgb3B0aW9ucywgZ2V0UmVzdWx0cygpXG5cbiAgYXN5bmMgZnVuY3Rpb24gZ2V0UmVzdWx0cygpIHtcbiAgICBcbiAgICBpZiAoIXF1ZXJ5KSB7XG4gICAgICByZXN1bHRzID0gW11cbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgIHF1ZXJ5OiBvcHRpb25zLm1hdGNoRXhhY3RQaHJhc2UgPyBxdWVyeSA6IGAke3F1ZXJ5fSpgXG4gICAgfVxuXG4gICAgY29uc3QgZGJSZXN1bHRzID0gYXdhaXQgd2luZG93LmFwaS5pbnZva2UoJ3F1ZXJ5RGInLCBwYXJhbXMpXG5cbiAgICBpZiAoIWRiUmVzdWx0cykgcmV0dXJuXG5cbiAgICByZXN1bHRzID0gZGJSZXN1bHRzLm1hcCgocikgPT4ge1xuICAgICAgY29uc3QgZmlsZSA9IHsgLi4uJGZpbGVzLmJ5SWRbci5pZF0gfVxuICAgICAgaWYgKHIuYm9keSkgZmlsZS5leGNlcnB0ID0gci5ib2R5XG4gICAgICBpZiAoci50aXRsZSkgZmlsZS50aXRsZSA9IHIudGl0bGVcbiAgICAgIHJldHVybiByLmlkXG4gICAgfSlcbiAgICBjb25zb2xlLmxvZyhyZXN1bHRzKVxuICB9XG5cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbiNudW1iZXJPZlJlc3VsdHMge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMC4wN3B4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIG1pbi1oZWlnaHQ6IDI1cHg7XG4gIHdoaXRlLXNwYWNlOiBub3dyYXA7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xufVxuXG4ucm93IHtcbiAgbWFyZ2luOiA4cHggMTBweCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuLnJvdyAubGFiZWwge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMC4wN3B4O1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gIGZsZXgtYmFzaXM6IDQ2cHg7XG4gIGZsZXgtc2hyaW5rOiAwO1xuICBtYXJnaW4tcmlnaHQ6IDZweDtcbn1cbi5yb3cgLml0ZW1zIHtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbi5yb3c6Zmlyc3Qtb2YtdHlwZSB7XG4gIG1hcmdpbi10b3A6IDVweDtcbn08L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwic2VjdGlvblwiPlxuICA8SGVhZGVyIHRpdGxlPXt0YWIudGl0bGV9IGhvdmVyVG9TaG93U2xvdD17dHJ1ZX0+XG4gICAgPFNvcnRNZW51IG9wdGlvbnM9e3NvcnRPcHRpb25zfSAvPlxuICA8L0hlYWRlcj5cbiAgPFNlcGFyYXRvciBtYXJnaW5TaWRlcz17MTB9IC8+XG4gIDxTZWFyY2hGaWVsZCBmb2N1c2VkIGJpbmQ6cXVlcnkgcGxhY2Vob2xkZXI9eydOYW1lJ30gLz5cbiAgPFNlcGFyYXRvciBtYXJnaW5TaWRlcz17MTB9IG1hcmdpblRvcD17MTB9IC8+XG4gIDxFeHBhbmRhYmxlIHRpdGxlPXsnT3B0aW9uczonfSBtYXhFeHBhbmRlZEhlaWdodD17NzV9PlxuICAgIFxuICAgIDwhLS0gTWF0Y2ggLS0+XG4gICAgPGRpdiBjbGFzcz1cInJvd1wiPlxuICAgICAgPGRpdiBjbGFzcz1cImxhYmVsXCI+TWF0Y2g6PC9kaXY+XG4gICAgICA8ZGl2IGNsYXNzPVwiaXRlbXNcIj5cbiAgICAgICAgPENoZWNrYm94IGlzQ29tcGFjdD17dHJ1ZX0gaXNDaGVja2VkPXtvcHRpb25zLm1hdGNoQ2FzZX0gbGFiZWw9J0Nhc2UnIG9uOmNsaWNrPXsoZXZ0KSA9PiB1cGRhdGVPcHRpb25zKCdtYXRjaENhc2UnLCAhb3B0aW9ucy5tYXRjaENhc2UpfSAvPlxuICAgICAgICA8Q2hlY2tib3ggaXNDb21wYWN0PXt0cnVlfSBpc0NoZWNrZWQ9e29wdGlvbnMubWF0Y2hFeGFjdFBocmFzZX0gbGFiZWw9J0V4YWN0IFBocmFzZScgb246Y2xpY2s9eyhldnQpID0+IHVwZGF0ZU9wdGlvbnMoJ21hdGNoRXhhY3RQaHJhc2UnLCAhb3B0aW9ucy5tYXRjaEV4YWN0UGhyYXNlKX0gLz5cbiAgICAgICAgPCEtLSA8VG9rZW4gbGFiZWw9eydDYXNlJ30gLz48VG9rZW4gbGFiZWw9eydFeGFjdCBQaHJhc2UnfSAvPiAtLT5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuXG4gICAgPCEtLSBSZXBsYWNlIC0tPlxuICAgIDxkaXYgY2xhc3M9XCJyb3dcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJsYWJlbFwiPkxvb2sgSW46PC9kaXY+XG4gICAgPGRpdj5cbiAgICAgIDxNZW51QnV0dG9uIGlzQ29tcGFjdD17dHJ1ZX0gb3B0aW9ucz17bG9va0luT3B0aW9uc30gbWVudVR5cGU9eydwdWxsZG93bid9IGJ1dHRvblR5cGU9eyd0ZXh0J30gYnV0dG9uV2lkdGg9ezExMH0gb246c2VsZWN0PXsoZXZ0KSA9PiB1cGRhdGVPcHRpb25zKCdsb29rSW4nLCBldnQuZGV0YWlsLm9wdGlvbi5sYWJlbCl9Lz5cbiAgICA8L2Rpdj5cbiAgICA8L2Rpdj5cbiAgICBcbiAgICA8IS0tIFRhZ3MgLS0+XG4gICAgPCEtLSA8ZGl2IGNsYXNzPVwicm93XCI+XG4gICAgICA8ZGl2IGNsYXNzPVwibGFiZWxcIj5UYWdzOjwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PiAtLT5cblxuICA8L0V4cGFuZGFibGU+XG4gIDxTZXBhcmF0b3IgbWFyZ2luU2lkZXM9ezEwfSAvPlxuICA8RXhwYW5kYWJsZSB0aXRsZT17J1JlcGxhY2U6J30gaXNPcGVuPXtmYWxzZX0gLz5cbiAgPFNlcGFyYXRvciBtYXJnaW5TaWRlcz17MTB9IC8+XG5cbiAgPCEtLSA8SGVhZGVyIHRpdGxlPXsnT3B0aW9ucyd9PlxuICAgIDxEaXNjbG9zdXJlQnV0dG9uXG4gICAgICB3aWR0aD17MTR9XG4gICAgICBoZWlnaHQ9ezE0fVxuICAgICAgcGFkZGluZz17Nn1cbiAgICAgIGxlZnQ9eyRzaWRlYmFyLndpZHRoIC0gMjB9XG4gICAgICByb3RhdGlvbj17JHNpZGViYXIuaXNQcmV2aWV3T3BlbiA/IC05MCA6IDkwfVxuICAgICAgdG9vbHRpcD17J1RvZ2dsZSBFeHBhbmRlZCd9XG4gICAgICBvbjp0b2dnbGU9eygpID0+IHtcbiAgICAgICAgd2luZG93LmFwaS5zZW5kKCdkaXNwYXRjaCcsIHsgdHlwZTogJ1RPR0dMRV9TSURFQkFSX1BSRVZJRVcnIH0pXG4gICAgICB9fSAvPlxuICA8L0hlYWRlcj4gLS0+XG5cbiAgPCEtLSBSZXBsYWNlIC0tPlxuICBcbiAgPCEtLSBSZXN1bHRzIC0tPlxuICB7I2lmIHF1ZXJ5fVxuICAgIDxkaXYgaWQ9XCJudW1iZXJPZlJlc3VsdHNcIj5Gb3VuZCByZXN1bHRzIGluIHtyZXN1bHRzLmxlbmd0aH0gZG9jdW1lbnRzPC9kaXY+XG4gIHsvaWZ9XG4gIDxTZXBhcmF0b3IgbWFyZ2luU2lkZXM9ezEwfSAvPlxuICA8RG9jTGlzdCBsaXN0SWRzPXtyZXN1bHRzfSBjb21wb25lbnQ9e0RvY30gLz5cbjwvZGl2PlxuXG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBNkdBLGdCQUFnQiw4QkFBQyxDQUFDLEFBQ2hCLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsTUFBTSxDQUN0QixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsUUFBUSxDQUFFLE1BQU0sQ0FDaEIsT0FBTyxDQUFFLElBQUksQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixlQUFlLENBQUUsTUFBTSxBQUN6QixDQUFDLEFBRUQsSUFBSSw4QkFBQyxDQUFDLEFBQ0osTUFBTSxDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUNsQixPQUFPLENBQUUsSUFBSSxDQUNiLFdBQVcsQ0FBRSxNQUFNLEFBQ3JCLENBQUMsQUFDRCxtQkFBSSxDQUFDLE1BQU0sZUFBQyxDQUFDLEFBQ1gsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxNQUFNLENBQ3RCLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLFdBQVcsQ0FBRSxDQUFDLENBQ2QsWUFBWSxDQUFFLEdBQUcsQUFDbkIsQ0FBQyxBQUNELG1CQUFJLENBQUMsTUFBTSxlQUFDLENBQUMsQUFDWCxPQUFPLENBQUUsSUFBSSxDQUNiLFdBQVcsQ0FBRSxNQUFNLEFBQ3JCLENBQUMsQUFDRCxrQ0FBSSxjQUFjLEFBQUMsQ0FBQyxBQUNsQixVQUFVLENBQUUsR0FBRyxBQUNqQixDQUFDIn0= */";
	append_dev(document.head, style);
}

// (151:2) <Header title={tab.title} hoverToShowSlot={true}>
function create_default_slot_1(ctx) {
	let sortmenu;
	let current;

	sortmenu = new SortMenu({
			props: { options: /*sortOptions*/ ctx[5] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(sortmenu.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(sortmenu, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const sortmenu_changes = {};
			if (dirty & /*sortOptions*/ 32) sortmenu_changes.options = /*sortOptions*/ ctx[5];
			sortmenu.$set(sortmenu_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sortmenu.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sortmenu.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sortmenu, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1.name,
		type: "slot",
		source: "(151:2) <Header title={tab.title} hoverToShowSlot={true}>",
		ctx
	});

	return block;
}

// (157:2) <Expandable title={'Options:'} maxExpandedHeight={75}>
function create_default_slot$5(ctx) {
	let div2;
	let div0;
	let t1;
	let div1;
	let checkbox0;
	let t2;
	let checkbox1;
	let t3;
	let div5;
	let div3;
	let t5;
	let div4;
	let menubutton;
	let current;

	checkbox0 = new Checkbox({
			props: {
				isCompact: true,
				isChecked: /*options*/ ctx[2].matchCase,
				label: "Case"
			},
			$$inline: true
		});

	checkbox0.$on("click", /*click_handler*/ ctx[10]);

	checkbox1 = new Checkbox({
			props: {
				isCompact: true,
				isChecked: /*options*/ ctx[2].matchExactPhrase,
				label: "Exact Phrase"
			},
			$$inline: true
		});

	checkbox1.$on("click", /*click_handler_1*/ ctx[11]);

	menubutton = new MenuButton({
			props: {
				isCompact: true,
				options: /*lookInOptions*/ ctx[3],
				menuType: "pulldown",
				buttonType: "text",
				buttonWidth: 110
			},
			$$inline: true
		});

	menubutton.$on("select", /*select_handler*/ ctx[12]);

	const block = {
		c: function create() {
			div2 = element("div");
			div0 = element("div");
			div0.textContent = "Match:";
			t1 = space();
			div1 = element("div");
			create_component(checkbox0.$$.fragment);
			t2 = space();
			create_component(checkbox1.$$.fragment);
			t3 = space();
			div5 = element("div");
			div3 = element("div");
			div3.textContent = "Look In:";
			t5 = space();
			div4 = element("div");
			create_component(menubutton.$$.fragment);
			attr_dev(div0, "class", "label svelte-1hk9sih");
			add_location(div0, file$q, 160, 6, 4108);
			attr_dev(div1, "class", "items svelte-1hk9sih");
			add_location(div1, file$q, 161, 6, 4146);
			attr_dev(div2, "class", "row svelte-1hk9sih");
			add_location(div2, file$q, 159, 4, 4084);
			attr_dev(div3, "class", "label svelte-1hk9sih");
			add_location(div3, file$q, 170, 6, 4639);
			add_location(div4, file$q, 171, 4, 4677);
			attr_dev(div5, "class", "row svelte-1hk9sih");
			add_location(div5, file$q, 169, 4, 4615);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			append_dev(div2, div0);
			append_dev(div2, t1);
			append_dev(div2, div1);
			mount_component(checkbox0, div1, null);
			append_dev(div1, t2);
			mount_component(checkbox1, div1, null);
			insert_dev(target, t3, anchor);
			insert_dev(target, div5, anchor);
			append_dev(div5, div3);
			append_dev(div5, t5);
			append_dev(div5, div4);
			mount_component(menubutton, div4, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			const checkbox0_changes = {};
			if (dirty & /*options*/ 4) checkbox0_changes.isChecked = /*options*/ ctx[2].matchCase;
			checkbox0.$set(checkbox0_changes);
			const checkbox1_changes = {};
			if (dirty & /*options*/ 4) checkbox1_changes.isChecked = /*options*/ ctx[2].matchExactPhrase;
			checkbox1.$set(checkbox1_changes);
			const menubutton_changes = {};
			if (dirty & /*lookInOptions*/ 8) menubutton_changes.options = /*lookInOptions*/ ctx[3];
			menubutton.$set(menubutton_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(checkbox0.$$.fragment, local);
			transition_in(checkbox1.$$.fragment, local);
			transition_in(menubutton.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(checkbox0.$$.fragment, local);
			transition_out(checkbox1.$$.fragment, local);
			transition_out(menubutton.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
			destroy_component(checkbox0);
			destroy_component(checkbox1);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(div5);
			destroy_component(menubutton);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$5.name,
		type: "slot",
		source: "(157:2) <Expandable title={'Options:'} maxExpandedHeight={75}>",
		ctx
	});

	return block;
}

// (205:2) {#if query}
function create_if_block$c(ctx) {
	let div;
	let t0;
	let t1_value = /*results*/ ctx[4].length + "";
	let t1;
	let t2;

	const block = {
		c: function create() {
			div = element("div");
			t0 = text("Found results in ");
			t1 = text(t1_value);
			t2 = text(" documents");
			attr_dev(div, "id", "numberOfResults");
			attr_dev(div, "class", "svelte-1hk9sih");
			add_location(div, file$q, 205, 4, 5570);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t0);
			append_dev(div, t1);
			append_dev(div, t2);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*results*/ 16 && t1_value !== (t1_value = /*results*/ ctx[4].length + "")) set_data_dev(t1, t1_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$c.name,
		type: "if",
		source: "(205:2) {#if query}",
		ctx
	});

	return block;
}

function create_fragment$t(ctx) {
	let div;
	let header;
	let t0;
	let separator0;
	let t1;
	let searchfield;
	let updating_query;
	let t2;
	let separator1;
	let t3;
	let expandable0;
	let t4;
	let separator2;
	let t5;
	let expandable1;
	let t6;
	let separator3;
	let t7;
	let t8;
	let separator4;
	let t9;
	let doclist;
	let current;

	header = new Header({
			props: {
				title: /*tab*/ ctx[1].title,
				hoverToShowSlot: true,
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator0 = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[9].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[0] !== void 0) {
		searchfield_props.query = /*query*/ ctx[0];
	}

	searchfield = new SearchField({ props: searchfield_props, $$inline: true });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));

	separator1 = new Separator({
			props: { marginSides: 10, marginTop: 10 },
			$$inline: true
		});

	expandable0 = new Expandable({
			props: {
				title: "Options:",
				maxExpandedHeight: 75,
				$$slots: { default: [create_default_slot$5] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	separator2 = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	expandable1 = new Expandable({
			props: { title: "Replace:", isOpen: false },
			$$inline: true
		});

	separator3 = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	let if_block = /*query*/ ctx[0] && create_if_block$c(ctx);

	separator4 = new Separator({
			props: { marginSides: 10 },
			$$inline: true
		});

	doclist = new DocList({
			props: {
				listIds: /*results*/ ctx[4],
				component: Doc
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div = element("div");
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator0.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			create_component(separator1.$$.fragment);
			t3 = space();
			create_component(expandable0.$$.fragment);
			t4 = space();
			create_component(separator2.$$.fragment);
			t5 = space();
			create_component(expandable1.$$.fragment);
			t6 = space();
			create_component(separator3.$$.fragment);
			t7 = space();
			if (if_block) if_block.c();
			t8 = space();
			create_component(separator4.$$.fragment);
			t9 = space();
			create_component(doclist.$$.fragment);
			attr_dev(div, "class", "section");
			add_location(div, file$q, 149, 0, 3735);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(header, div, null);
			append_dev(div, t0);
			mount_component(separator0, div, null);
			append_dev(div, t1);
			mount_component(searchfield, div, null);
			append_dev(div, t2);
			mount_component(separator1, div, null);
			append_dev(div, t3);
			mount_component(expandable0, div, null);
			append_dev(div, t4);
			mount_component(separator2, div, null);
			append_dev(div, t5);
			mount_component(expandable1, div, null);
			append_dev(div, t6);
			mount_component(separator3, div, null);
			append_dev(div, t7);
			if (if_block) if_block.m(div, null);
			append_dev(div, t8);
			mount_component(separator4, div, null);
			append_dev(div, t9);
			mount_component(doclist, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope, sortOptions*/ 65568) {
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
			const expandable0_changes = {};

			if (dirty & /*$$scope, lookInOptions, options*/ 65548) {
				expandable0_changes.$$scope = { dirty, ctx };
			}

			expandable0.$set(expandable0_changes);

			if (/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$c(ctx);
					if_block.c();
					if_block.m(div, t8);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			const doclist_changes = {};
			if (dirty & /*results*/ 16) doclist_changes.listIds = /*results*/ ctx[4];
			doclist.$set(doclist_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(header.$$.fragment, local);
			transition_in(separator0.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);
			transition_in(separator1.$$.fragment, local);
			transition_in(expandable0.$$.fragment, local);
			transition_in(separator2.$$.fragment, local);
			transition_in(expandable1.$$.fragment, local);
			transition_in(separator3.$$.fragment, local);
			transition_in(separator4.$$.fragment, local);
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(header.$$.fragment, local);
			transition_out(separator0.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			transition_out(separator1.$$.fragment, local);
			transition_out(expandable0.$$.fragment, local);
			transition_out(separator2.$$.fragment, local);
			transition_out(expandable1.$$.fragment, local);
			transition_out(separator3.$$.fragment, local);
			transition_out(separator4.$$.fragment, local);
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(header);
			destroy_component(separator0);
			destroy_component(searchfield);
			destroy_component(separator1);
			destroy_component(expandable0);
			destroy_component(separator2);
			destroy_component(expandable1);
			destroy_component(separator3);
			if (if_block) if_block.d();
			destroy_component(separator4);
			destroy_component(doclist);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$t.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$t($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(7, $sidebar = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(8, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Search", slots, []);
	let query = ""; // Bound to search field
	let tabId = "search";
	setContext("tabId", tabId);

	/**
 * Update state when the user modifies the params in the 'Options' section.
 */
	function updateOptions(key, value) {
		let newOptions = { ...options };
		newOptions[key] = value;

		window.api.send("dispatch", {
			type: "SIDEBAR_SET_SEARCH_PARAMS",
			options: newOptions
		});
	}

	let lookInOptions = [];

	/**
 * Add each folder in the project as an option in the 'Look In:' menu.
 * First option is "All Folders". Below that, we list the folders.
 */
	function setLookInMenuOptions() {
		// Starting options
		$$invalidate(3, lookInOptions = [
			{
				label: "All Folders",
				isChecked: options.lookIn == "All Folders"
			},
			{ label: "separator" }
		]);

		// Add each folder
		$files.allIds.forEach(id => {
			const file = $files.byId[id];

			if (file.type == "folder") {
				lookInOptions.push({
					label: file.name,
					isChecked: options.lookIn == file.name
				});
			}
		});
	}

	// -------- RESULTS -------- //
	let results = [];

	async function getResults() {
		if (!query) {
			$$invalidate(4, results = []);
			return;
		}

		const params = {
			query: options.matchExactPhrase ? query : `${query}*`
		};

		const dbResults = await window.api.invoke("queryDb", params);
		if (!dbResults) return;

		$$invalidate(4, results = dbResults.map(r => {
			const file = { ...$files.byId[r.id] };
			if (r.body) file.excerpt = r.body;
			if (r.title) file.title = r.title;
			return r.id;
		}));

		console.log(results);
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Search> was created with unknown prop '${key}'`);
	});

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(0, query);
	}

	const click_handler = evt => updateOptions("matchCase", !options.matchCase);
	const click_handler_1 = evt => updateOptions("matchExactPhrase", !options.matchExactPhrase);
	const select_handler = evt => updateOptions("lookIn", evt.detail.option.label);

	$$self.$capture_state = () => ({
		project,
		sidebar,
		files,
		Header,
		SortMenu,
		Separator,
		SearchField,
		DocList,
		Doc,
		DisclosureButton,
		setContext,
		Expandable,
		MenuButton,
		Token,
		Checkbox,
		query,
		tabId,
		updateOptions,
		lookInOptions,
		setLookInMenuOptions,
		results,
		getResults,
		tab,
		$sidebar,
		sortOptions,
		options,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("tabId" in $$props) $$invalidate(13, tabId = $$props.tabId);
		if ("lookInOptions" in $$props) $$invalidate(3, lookInOptions = $$props.lookInOptions);
		if ("results" in $$props) $$invalidate(4, results = $$props.results);
		if ("tab" in $$props) $$invalidate(1, tab = $$props.tab);
		if ("sortOptions" in $$props) $$invalidate(5, sortOptions = $$props.sortOptions);
		if ("options" in $$props) $$invalidate(2, options = $$props.options);
	};

	let tab;
	let sortOptions;
	let options;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 128) {
			 $$invalidate(1, tab = $sidebar.tabsById[tabId]);
		}

		if ($$self.$$.dirty & /*tab*/ 2) {
			// -------- SORTING -------- //
			 $$invalidate(5, sortOptions = [
				{
					label: "By Title",
					group: "sortBy",
					isChecked: tab.sortBy == "By Title"
				},
				{
					label: "By Modified",
					group: "sortBy",
					isChecked: tab.sortBy == "By Modified"
				},
				{ label: "separator" },
				{
					label: "Ascending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Ascending"
				},
				{
					label: "Descending",
					group: "sortOrder",
					isChecked: tab.sortOrder == "Descending"
				}
			]);
		}

		if ($$self.$$.dirty & /*tab*/ 2) {
			// -------- OPTIONS -------- //
			 $$invalidate(2, options = tab.options);
		}

		if ($$self.$$.dirty & /*$files, tab*/ 258) {
			 (setLookInMenuOptions());
		}

		if ($$self.$$.dirty & /*$files, query, options*/ 261) {
			 (getResults());
		}
	};

	return [
		query,
		tab,
		options,
		lookInOptions,
		results,
		sortOptions,
		updateOptions,
		$sidebar,
		$files,
		searchfield_query_binding,
		click_handler,
		click_handler_1,
		select_handler
	];
}

class Search extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1hk9sih-style")) add_css$o();
		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Search",
			options,
			id: create_fragment$t.name
		});
	}
}

/* src/js/renderer/component/sidebar/Preview.svelte generated by Svelte v3.30.1 */

const { console: console_1$1 } = globals;
const file_1$2 = "src/js/renderer/component/sidebar/Preview.svelte";

function add_css$p() {
	var style = element("style");
	style.id = "svelte-1pg6r2b-style";
	style.textContent = "#preview.svelte-1pg6r2b.svelte-1pg6r2b{display:flex;flex-shrink:0;flex-direction:column;transition:flex 250ms ease-out;max-height:215px;overflow:hidden}#preview.isOpen.svelte-1pg6r2b.svelte-1pg6r2b{flex-basis:215px}#preview.svelte-1pg6r2b.svelte-1pg6r2b:not(.isOpen){flex-basis:30px}.content.svelte-1pg6r2b.svelte-1pg6r2b{flex-grow:1;margin:5px 10px 10px;display:flex;flex-direction:column}.doc-excerpt.svelte-1pg6r2b.svelte-1pg6r2b,.img-thumb.svelte-1pg6r2b.svelte-1pg6r2b{flex-grow:1;flex-basis:0;flex-shrink:0;overflow:hidden}.img-thumb.svelte-1pg6r2b.svelte-1pg6r2b{margin-bottom:10px}.doc-excerpt.svelte-1pg6r2b p.svelte-1pg6r2b{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:10;overflow:hidden;pointer-events:none;word-break:break-word;line-break:auto;line-height:16px;padding:0 0.75em;margin:0}.doc-excerpt.svelte-1pg6r2b p .title.svelte-1pg6r2b{font:caption;font-weight:bold;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor)}.metadata.svelte-1pg6r2b.svelte-1pg6r2b{flex-grow:0}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJldmlldy5zdmVsdGUiLCJzb3VyY2VzIjpbIlByZXZpZXcuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IHByZXR0eVNpemUgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMnXG4gIGltcG9ydCB7IHNpZGViYXIsIGZpbGVzIH0gZnJvbSAnLi4vLi4vU3RhdGVNYW5hZ2VyJ1xuXG4gIGltcG9ydCBEaXNjbG9zdXJlQnV0dG9uIGZyb20gJy4uL3VpL0Rpc2Nsb3N1cmVCdXR0b24uc3ZlbHRlJ1xuICBpbXBvcnQgSGVhZGVyIGZyb20gJy4vSGVhZGVyLnN2ZWx0ZSdcbiAgaW1wb3J0IExhYmVsIGZyb20gJy4uL3VpL0xhYmVsLnN2ZWx0ZSdcbiAgaW1wb3J0IFNlcGFyYXRvciBmcm9tICcuLi91aS9TZXBhcmF0b3Iuc3ZlbHRlJ1xuICBpbXBvcnQgVGh1bWJuYWlsIGZyb20gJy4uL3VpL1RodW1ibmFpbC5zdmVsdGUnXG5cbiAgJDogaXNPcGVuID0gJHNpZGViYXIuaXNQcmV2aWV3T3BlblxuICAkOiBhY3RpdmVUYWIgPSAkc2lkZWJhci50YWJzQnlJZFskc2lkZWJhci5hY3RpdmVUYWJJZF1cblxuICBsZXQgZmlsZSA9IHt9XG5cbiAgJDoge1xuICAgIGlmIChhY3RpdmVUYWIuc2VsZWN0ZWQubGVuZ3RoKSB7XG4gICAgICBjb25zdCBmaWxlSWQgPSBhY3RpdmVUYWIuc2VsZWN0ZWRbYWN0aXZlVGFiLnNlbGVjdGVkLmxlbmd0aCAtIDFdXG4gICAgICBmaWxlID0gJGZpbGVzLmJ5SWRbZmlsZUlkXVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBTaG9ydGVuIGZpbGVwYXRoIGJ5IG1ha2luZyBpdCByZWxhdGl2ZSB0byBwcm9qZWN0IGRpcmVjdG9yeSwgXG4gICAqIGluc3RlYWQgb2YgdGhlIGVudGlyZSBmaWxlIHN5c3RlbS5cbiAgICogQmVmb3JlOiAvVXNlcnMvam9zaC9EZXNrdG9wL0NsaW1hdGUgUmVzZWFyY2gvZ2VvdGhlcm1hbC5tZFxuICAgKiBBZnRlcjogQ2xpbWF0ZSBSZXNlYXJjaC9nZW90aGVybWFsLm1kXG4gICovXG4gIGZ1bmN0aW9uIHNob3J0ZW5QYXRoKCkge1xuXG4gIH1cblxuICBmdW5jdGlvbiBzaG93RmlsZU9uRHJpdmUoZmlsZXBhdGgpIHtcbiAgICBjb25zb2xlLmxvZyhmaWxlcGF0aClcbiAgfVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuI3ByZXZpZXcge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LXNocmluazogMDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgdHJhbnNpdGlvbjogZmxleCAyNTBtcyBlYXNlLW91dDtcbiAgbWF4LWhlaWdodDogMjE1cHg7XG4gIG92ZXJmbG93OiBoaWRkZW47XG59XG4jcHJldmlldy5pc09wZW4ge1xuICBmbGV4LWJhc2lzOiAyMTVweDtcbn1cbiNwcmV2aWV3Om5vdCguaXNPcGVuKSB7XG4gIGZsZXgtYmFzaXM6IDMwcHg7XG59XG5cbi5jb250ZW50IHtcbiAgZmxleC1ncm93OiAxO1xuICBtYXJnaW46IDVweCAxMHB4IDEwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG59XG5cbi5kb2MtZXhjZXJwdCxcbi5pbWctdGh1bWIge1xuICBmbGV4LWdyb3c6IDE7XG4gIGZsZXgtYmFzaXM6IDA7XG4gIGZsZXgtc2hyaW5rOiAwO1xuICBvdmVyZmxvdzogaGlkZGVuO1xufVxuXG4uaW1nLXRodW1iIHtcbiAgbWFyZ2luLWJvdHRvbTogMTBweDtcbn1cblxuLmRvYy1leGNlcnB0IHAge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMDhweDtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICBkaXNwbGF5OiAtd2Via2l0LWJveDtcbiAgLXdlYmtpdC1ib3gtb3JpZW50OiB2ZXJ0aWNhbDtcbiAgLXdlYmtpdC1saW5lLWNsYW1wOiAxMDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG4gIHdvcmQtYnJlYWs6IGJyZWFrLXdvcmQ7XG4gIGxpbmUtYnJlYWs6IGF1dG87XG4gIGxpbmUtaGVpZ2h0OiAxNnB4O1xuICBwYWRkaW5nOiAwIDAuNzVlbTtcbiAgbWFyZ2luOiAwO1xufVxuLmRvYy1leGNlcnB0IHAgLnRpdGxlIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IGJvbGQ7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG59XG5cbi5tZXRhZGF0YSB7XG4gIGZsZXgtZ3JvdzogMDtcbn1cbi5tZXRhZGF0YSAucGF0aCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbGluZS1oZWlnaHQ6IDEzcHg7XG4gIGxldHRlci1zcGFjaW5nOiAwLjA3cHg7XG4gIGNvbG9yOiB2YXIoLS1sYWJlbENvbG9yKTtcbiAgb3BhY2l0eTogMC43NTtcbiAgd2hpdGUtc3BhY2U6IG5vd3JhcDtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgdGV4dC1vdmVyZmxvdzogZWxsaXBzaXM7XG4gIGRpcmVjdGlvbjogcnRsO1xuICB0ZXh0LWFsaWduOiBsZWZ0O1xuICBsaW5lLWJyZWFrOiBhbnl3aGVyZTtcbn1cbi5tZXRhZGF0YSAucGF0aDpob3ZlciB7XG4gIHRleHQtZGVjb3JhdGlvbjogdW5kZXJsaW5lO1xuICBvcGFjaXR5OiAxO1xufTwvc3R5bGU+XG5cbjxkaXYgaWQ9XCJwcmV2aWV3XCIgY2xhc3M6aXNPcGVuPlxuXG4gIDxTZXBhcmF0b3IgLz5cbiAgXG4gIDxIZWFkZXIgdGl0bGU9eydEZXRhaWxzJ30+XG4gICAgPERpc2Nsb3N1cmVCdXR0b25cbiAgICAgIHdpZHRoPXsxNH1cbiAgICAgIGhlaWdodD17MTR9XG4gICAgICBwYWRkaW5nPXs2fVxuICAgICAgbGVmdD17JHNpZGViYXIud2lkdGggLSAyMH1cbiAgICAgIHJvdGF0aW9uPXskc2lkZWJhci5pc1ByZXZpZXdPcGVuID8gLTkwIDogOTB9XG4gICAgICB0b29sdGlwPXsnVG9nZ2xlIEV4cGFuZGVkJ31cbiAgICAgIG9uOnRvZ2dsZT17KCkgPT4ge1xuICAgICAgICB3aW5kb3cuYXBpLnNlbmQoJ2Rpc3BhdGNoJywgeyB0eXBlOiAnVE9HR0xFX1NJREVCQVJfUFJFVklFVycgfSlcbiAgICAgIH19IC8+XG4gIDwvSGVhZGVyPlxuXG4gIDxkaXYgY2xhc3M9XCJjb250ZW50XCI+XG4gICAgeyNpZiBmaWxlLnR5cGUgPT0gJ2RvYyd9XG5cbiAgICAgIDwhLS0gRE9DIC0tPlxuXG4gICAgICA8ZGl2IGNsYXNzPVwiZG9jLWV4Y2VycHRcIj5cbiAgICAgICAgPHA+XG4gICAgICAgICAgPHNwYW4gY2xhc3M9XCJ0aXRsZVwiPntmaWxlLnRpdGxlID8gZmlsZS50aXRsZSA6IGZpbGUubmFtZX0gLSA8L3NwYW4+XG4gICAgICAgICAge2ZpbGUuZXhjZXJwdH1cbiAgICAgICAgPC9wPlxuICAgICAgPC9kaXY+XG4gICAgICA8IS0tIDxkaXYgY2xhc3M9XCJtZXRhZGF0YVwiPlxuICAgICAgICA8TGFiZWwgY29sb3I9eydwcmltYXJ5J30gdHlwb2dyYXBoeT17J2xhYmVsLW5vcm1hbC1zbWFsbC1ib2xkJ30+XG4gICAgICAgICAge2ZpbGUudGl0bGV9XG4gICAgICAgIDwvTGFiZWw+XG4gICAgICAgIDxkaXYgY2xhc3M9XCJwYXRoXCIgb246Y2xpY2s9eygpID0+IHNob3dGaWxlT25Ecml2ZShmaWxlLnBhdGgpfT5cbiAgICAgICAgICB7ZmlsZS5wYXRofVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PiAtLT5cblxuICAgIHs6ZWxzZSBpZiBmaWxlLnR5cGUgPT0gJ2ltZyd9XG5cbiAgICAgIDwhLS0gSU1BR0UgLS0+XG5cbiAgICAgIDxkaXYgY2xhc3M9XCJpbWctdGh1bWJcIj5cbiAgICAgICAgPFRodW1ibmFpbCBzcmM9e2ZpbGUucGF0aH0gbWFyZ2luPXsnMCAwIDAgMCd9IC8+XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXYgY2xhc3M9XCJtZXRhZGF0YVwiPlxuICAgICAgICA8IS0tIDxMYWJlbCBjb2xvcj17J3ByaW1hcnknfSB0eXBvZ3JhcGh5PXsnbGFiZWwtbm9ybWFsLXNtYWxsLWJvbGQnfT5cbiAgICAgICAgICB7ZmlsZS5uYW1lfVxuICAgICAgICA8L0xhYmVsPiAtLT5cbiAgICAgICAgPExhYmVsIGFsaWduPVwiY2VudGVyXCIgY29sb3I9eydwcmltYXJ5J30gb3BhY2l0eT17MC43NX0gdHlwb2dyYXBoeT17J2xhYmVsLW5vcm1hbC1zbWFsbCd9PlxuICAgICAgICAgIDwhLS0ge2ZpbGUuZm9ybWF0LnRvVXBwZXJDYXNlKCl9IC0gIC0tPlxuICAgICAgICAgIHtwcmV0dHlTaXplKGZpbGUuc2l6ZUluQnl0ZXMsICcgJyl9IC0gXG4gICAgICAgICAge2ZpbGUuZGltZW5zaW9ucy53aWR0aH0geCB7ZmlsZS5kaW1lbnNpb25zLmhlaWdodH1cbiAgICAgICAgPC9MYWJlbD5cbiAgICAgICAgPCEtLSA8ZGl2IGNsYXNzPVwicGF0aFwiIG9uOmNsaWNrPXsoKSA9PiBzaG93RmlsZU9uRHJpdmUoZmlsZS5wYXRoKX0+XG4gICAgICAgICAge3Nob3J0ZW5QYXRoKGZpbGUucGF0aCl9XG4gICAgICAgIDwvZGl2PiAtLT5cbiAgICAgIDwvZGl2PlxuICAgIHs6ZWxzZSBpZiBmaWxlLnR5cGUgPT0gJ2F2J31BVnsvaWZ9XG4gIDwvZGl2PlxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBeUNBLFFBQVEsOEJBQUMsQ0FBQyxBQUNSLE9BQU8sQ0FBRSxJQUFJLENBQ2IsV0FBVyxDQUFFLENBQUMsQ0FDZCxjQUFjLENBQUUsTUFBTSxDQUN0QixVQUFVLENBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQy9CLFVBQVUsQ0FBRSxLQUFLLENBQ2pCLFFBQVEsQ0FBRSxNQUFNLEFBQ2xCLENBQUMsQUFDRCxRQUFRLE9BQU8sOEJBQUMsQ0FBQyxBQUNmLFVBQVUsQ0FBRSxLQUFLLEFBQ25CLENBQUMsQUFDRCxzQ0FBUSxLQUFLLE9BQU8sQ0FBQyxBQUFDLENBQUMsQUFDckIsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyxBQUVELFFBQVEsOEJBQUMsQ0FBQyxBQUNSLFNBQVMsQ0FBRSxDQUFDLENBQ1osTUFBTSxDQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUNyQixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxNQUFNLEFBQ3hCLENBQUMsQUFFRCwwQ0FBWSxDQUNaLFVBQVUsOEJBQUMsQ0FBQyxBQUNWLFNBQVMsQ0FBRSxDQUFDLENBQ1osVUFBVSxDQUFFLENBQUMsQ0FDYixXQUFXLENBQUUsQ0FBQyxDQUNkLFFBQVEsQ0FBRSxNQUFNLEFBQ2xCLENBQUMsQUFFRCxVQUFVLDhCQUFDLENBQUMsQUFDVixhQUFhLENBQUUsSUFBSSxBQUNyQixDQUFDLEFBRUQsMkJBQVksQ0FBQyxDQUFDLGVBQUMsQ0FBQyxBQUNkLElBQUksQ0FBRSxPQUFPLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxDQUN2QixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsT0FBTyxDQUFFLFdBQVcsQ0FDcEIsa0JBQWtCLENBQUUsUUFBUSxDQUM1QixrQkFBa0IsQ0FBRSxFQUFFLENBQ3RCLFFBQVEsQ0FBRSxNQUFNLENBQ2hCLGNBQWMsQ0FBRSxJQUFJLENBQ3BCLFVBQVUsQ0FBRSxVQUFVLENBQ3RCLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLE9BQU8sQ0FBRSxDQUFDLENBQUMsTUFBTSxDQUNqQixNQUFNLENBQUUsQ0FBQyxBQUNYLENBQUMsQUFDRCwyQkFBWSxDQUFDLENBQUMsQ0FBQyxNQUFNLGVBQUMsQ0FBQyxBQUNyQixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsS0FBSyxDQUFFLElBQUksWUFBWSxDQUFDLEFBQzFCLENBQUMsQUFFRCxTQUFTLDhCQUFDLENBQUMsQUFDVCxTQUFTLENBQUUsQ0FBQyxBQUNkLENBQUMifQ== */";
	append_dev(document.head, style);
}

// (130:2) <Header title={'Details'}>
function create_default_slot_1$1(ctx) {
	let disclosurebutton;
	let current;

	disclosurebutton = new DisclosureButton({
			props: {
				width: 14,
				height: 14,
				padding: 6,
				left: /*$sidebar*/ ctx[0].width - 20,
				rotation: /*$sidebar*/ ctx[0].isPreviewOpen ? -90 : 90,
				tooltip: "Toggle Expanded"
			},
			$$inline: true
		});

	disclosurebutton.$on("toggle", /*toggle_handler*/ ctx[5]);

	const block = {
		c: function create() {
			create_component(disclosurebutton.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(disclosurebutton, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const disclosurebutton_changes = {};
			if (dirty & /*$sidebar*/ 1) disclosurebutton_changes.left = /*$sidebar*/ ctx[0].width - 20;
			if (dirty & /*$sidebar*/ 1) disclosurebutton_changes.rotation = /*$sidebar*/ ctx[0].isPreviewOpen ? -90 : 90;
			disclosurebutton.$set(disclosurebutton_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(disclosurebutton.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(disclosurebutton.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(disclosurebutton, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1$1.name,
		type: "slot",
		source: "(130:2) <Header title={'Details'}>",
		ctx
	});

	return block;
}

// (183:32) 
function create_if_block_2$1(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("AV");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$1.name,
		type: "if",
		source: "(183:32) ",
		ctx
	});

	return block;
}

// (163:33) 
function create_if_block_1$5(ctx) {
	let div0;
	let thumbnail;
	let t;
	let div1;
	let label;
	let current;

	thumbnail = new Thumbnail({
			props: {
				src: /*file*/ ctx[1].path,
				margin: "0 0 0 0"
			},
			$$inline: true
		});

	label = new Label$1({
			props: {
				align: "center",
				color: "primary",
				opacity: 0.75,
				typography: "label-normal-small",
				$$slots: { default: [create_default_slot$6] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div0 = element("div");
			create_component(thumbnail.$$.fragment);
			t = space();
			div1 = element("div");
			create_component(label.$$.fragment);
			attr_dev(div0, "class", "img-thumb svelte-1pg6r2b");
			add_location(div0, file_1$2, 166, 6, 3579);
			attr_dev(div1, "class", "metadata svelte-1pg6r2b");
			add_location(div1, file_1$2, 169, 6, 3679);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div0, anchor);
			mount_component(thumbnail, div0, null);
			insert_dev(target, t, anchor);
			insert_dev(target, div1, anchor);
			mount_component(label, div1, null);
			current = true;
		},
		p: function update(ctx, dirty) {
			const thumbnail_changes = {};
			if (dirty & /*file*/ 2) thumbnail_changes.src = /*file*/ ctx[1].path;
			thumbnail.$set(thumbnail_changes);
			const label_changes = {};

			if (dirty & /*$$scope, file*/ 66) {
				label_changes.$$scope = { dirty, ctx };
			}

			label.$set(label_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(thumbnail.$$.fragment, local);
			transition_in(label.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(thumbnail.$$.fragment, local);
			transition_out(label.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div0);
			destroy_component(thumbnail);
			if (detaching) detach_dev(t);
			if (detaching) detach_dev(div1);
			destroy_component(label);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$5.name,
		type: "if",
		source: "(163:33) ",
		ctx
	});

	return block;
}

// (144:4) {#if file.type == 'doc'}
function create_if_block$d(ctx) {
	let div;
	let p;
	let span;

	let t0_value = (/*file*/ ctx[1].title
	? /*file*/ ctx[1].title
	: /*file*/ ctx[1].name) + "";

	let t0;
	let t1;
	let t2;
	let t3_value = /*file*/ ctx[1].excerpt + "";
	let t3;

	const block = {
		c: function create() {
			div = element("div");
			p = element("p");
			span = element("span");
			t0 = text(t0_value);
			t1 = text(" -");
			t2 = space();
			t3 = text(t3_value);
			attr_dev(span, "class", "title svelte-1pg6r2b");
			add_location(span, file_1$2, 149, 10, 3124);
			attr_dev(p, "class", "svelte-1pg6r2b");
			add_location(p, file_1$2, 148, 8, 3110);
			attr_dev(div, "class", "doc-excerpt svelte-1pg6r2b");
			add_location(div, file_1$2, 147, 6, 3076);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, p);
			append_dev(p, span);
			append_dev(span, t0);
			append_dev(span, t1);
			append_dev(p, t2);
			append_dev(p, t3);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*file*/ 2 && t0_value !== (t0_value = (/*file*/ ctx[1].title
			? /*file*/ ctx[1].title
			: /*file*/ ctx[1].name) + "")) set_data_dev(t0, t0_value);

			if (dirty & /*file*/ 2 && t3_value !== (t3_value = /*file*/ ctx[1].excerpt + "")) set_data_dev(t3, t3_value);
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$d.name,
		type: "if",
		source: "(144:4) {#if file.type == 'doc'}",
		ctx
	});

	return block;
}

// (174:8) <Label align="center" color={'primary'} opacity={0.75} typography={'label-normal-small'}>
function create_default_slot$6(ctx) {
	let t0_value = prettySize(/*file*/ ctx[1].sizeInBytes, " ") + "";
	let t0;
	let t1;
	let t2_value = /*file*/ ctx[1].dimensions.width + "";
	let t2;
	let t3;
	let t4_value = /*file*/ ctx[1].dimensions.height + "";
	let t4;

	const block = {
		c: function create() {
			t0 = text(t0_value);
			t1 = text(" - \n          ");
			t2 = text(t2_value);
			t3 = text(" x ");
			t4 = text(t4_value);
		},
		m: function mount(target, anchor) {
			insert_dev(target, t0, anchor);
			insert_dev(target, t1, anchor);
			insert_dev(target, t2, anchor);
			insert_dev(target, t3, anchor);
			insert_dev(target, t4, anchor);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*file*/ 2 && t0_value !== (t0_value = prettySize(/*file*/ ctx[1].sizeInBytes, " ") + "")) set_data_dev(t0, t0_value);
			if (dirty & /*file*/ 2 && t2_value !== (t2_value = /*file*/ ctx[1].dimensions.width + "")) set_data_dev(t2, t2_value);
			if (dirty & /*file*/ 2 && t4_value !== (t4_value = /*file*/ ctx[1].dimensions.height + "")) set_data_dev(t4, t4_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(t1);
			if (detaching) detach_dev(t2);
			if (detaching) detach_dev(t3);
			if (detaching) detach_dev(t4);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot$6.name,
		type: "slot",
		source: "(174:8) <Label align=\\\"center\\\" color={'primary'} opacity={0.75} typography={'label-normal-small'}>",
		ctx
	});

	return block;
}

function create_fragment$u(ctx) {
	let div1;
	let separator;
	let t0;
	let header;
	let t1;
	let div0;
	let current_block_type_index;
	let if_block;
	let current;
	separator = new Separator({ $$inline: true });

	header = new Header({
			props: {
				title: "Details",
				$$slots: { default: [create_default_slot_1$1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const if_block_creators = [create_if_block$d, create_if_block_1$5, create_if_block_2$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*file*/ ctx[1].type == "doc") return 0;
		if (/*file*/ ctx[1].type == "img") return 1;
		if (/*file*/ ctx[1].type == "av") return 2;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	const block = {
		c: function create() {
			div1 = element("div");
			create_component(separator.$$.fragment);
			t0 = space();
			create_component(header.$$.fragment);
			t1 = space();
			div0 = element("div");
			if (if_block) if_block.c();
			attr_dev(div0, "class", "content svelte-1pg6r2b");
			add_location(div0, file_1$2, 142, 2, 2998);
			attr_dev(div1, "id", "preview");
			attr_dev(div1, "class", "svelte-1pg6r2b");
			toggle_class(div1, "isOpen", /*isOpen*/ ctx[2]);
			add_location(div1, file_1$2, 125, 0, 2600);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			mount_component(separator, div1, null);
			append_dev(div1, t0);
			mount_component(header, div1, null);
			append_dev(div1, t1);
			append_dev(div1, div0);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div0, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			const header_changes = {};

			if (dirty & /*$$scope, $sidebar*/ 65) {
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

			if (dirty & /*isOpen*/ 4) {
				toggle_class(div1, "isOpen", /*isOpen*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(separator.$$.fragment, local);
			transition_in(header.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(separator.$$.fragment, local);
			transition_out(header.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(separator);
			destroy_component(header);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$u.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function shortenPath() {
	
}

function showFileOnDrive(filepath) {
	console.log(filepath);
}

function instance$u($$self, $$props, $$invalidate) {
	let $sidebar;
	let $files;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(0, $sidebar = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(4, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Preview", slots, []);
	let file = {};
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Preview> was created with unknown prop '${key}'`);
	});

	const toggle_handler = () => {
		window.api.send("dispatch", { type: "TOGGLE_SIDEBAR_PREVIEW" });
	};

	$$self.$capture_state = () => ({
		prettySize,
		sidebar,
		files,
		DisclosureButton,
		Header,
		Label: Label$1,
		Separator,
		Thumbnail,
		file,
		shortenPath,
		showFileOnDrive,
		isOpen,
		$sidebar,
		activeTab,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("file" in $$props) $$invalidate(1, file = $$props.file);
		if ("isOpen" in $$props) $$invalidate(2, isOpen = $$props.isOpen);
		if ("activeTab" in $$props) $$invalidate(3, activeTab = $$props.activeTab);
	};

	let isOpen;
	let activeTab;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$sidebar*/ 1) {
			 $$invalidate(2, isOpen = $sidebar.isPreviewOpen);
		}

		if ($$self.$$.dirty & /*$sidebar*/ 1) {
			 $$invalidate(3, activeTab = $sidebar.tabsById[$sidebar.activeTabId]);
		}

		if ($$self.$$.dirty & /*activeTab, $files*/ 24) {
			 {
				if (activeTab.selected.length) {
					const fileId = activeTab.selected[activeTab.selected.length - 1];
					$$invalidate(1, file = $files.byId[fileId]);
				}
			}
		}
	};

	return [$sidebar, file, isOpen, activeTab, $files, toggle_handler];
}

class Preview extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1pg6r2b-style")) add_css$p();
		init(this, options, instance$u, create_fragment$u, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Preview",
			options,
			id: create_fragment$u.name
		});
	}
}

/* src/js/renderer/component/sidebar/SideBar.svelte generated by Svelte v3.30.1 */
const file$r = "src/js/renderer/component/sidebar/SideBar.svelte";

function add_css$q() {
	var style = element("style");
	style.id = "svelte-1m5558u-style";
	style.textContent = "#sidebar.svelte-1m5558u.svelte-1m5558u{--state-sideBarWidth:100px;width:var(--state-sideBarWidth);height:100%;position:absolute;margin:0;padding:40px 0 0 0;display:flex;flex-direction:column;border-right:1px solid var(--separatorColor)}#sidebar.svelte-1m5558u>div.svelte-1m5558u{max-height:100%}#tabs.svelte-1m5558u.svelte-1m5558u{min-height:30px;display:flex;justify-content:center}#tabs.svelte-1m5558u ul.svelte-1m5558u{padding:0;margin:0;list-style-type:none;display:flex;flex-direction:row;align-items:center}#sidebar.svelte-1m5558u .section{display:flex;flex-direction:column;overflow-y:hidden;overflow-x:visible;flex-grow:1}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2lkZUJhci5zdmVsdGUiLCJzb3VyY2VzIjpbIlNpZGVCYXIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IHByb2plY3QsIHNpZGViYXIgfSBmcm9tICcuLi8uLi9TdGF0ZU1hbmFnZXInXG4gIGltcG9ydCBUYWIgZnJvbSAnLi9UYWIuc3ZlbHRlJ1xuICBpbXBvcnQgU2VwYXJhdG9yIGZyb20gJy4uL3VpL1NlcGFyYXRvci5zdmVsdGUnXG4gIGltcG9ydCBQcm9qZWN0IGZyb20gJy4vUHJvamVjdC5zdmVsdGUnXG4gIGltcG9ydCBBbGxEb2N1bWVudHMgZnJvbSAnLi9BbGxEb2N1bWVudHMuc3ZlbHRlJ1xuICBpbXBvcnQgTW9zdFJlY2VudCBmcm9tICcuL01vc3RSZWNlbnQuc3ZlbHRlJ1xuICBpbXBvcnQgVGFncyBmcm9tICcuL1RhZ3Muc3ZlbHRlJ1xuICBpbXBvcnQgTWVkaWEgZnJvbSAnLi9NZWRpYS5zdmVsdGUnXG4gIGltcG9ydCBDaXRhdGlvbnMgZnJvbSAnLi9DaXRhdGlvbnMuc3ZlbHRlJ1xuICBpbXBvcnQgU2VhcmNoIGZyb20gJy4vU2VhcmNoLnN2ZWx0ZSdcbiAgaW1wb3J0IFByZXZpZXcgZnJvbSAnLi9QcmV2aWV3LnN2ZWx0ZSdcbiAgXG4gIC8vICQ6IGlzU2lkZWJhckZvY3VzZWQgPSAkcHJvamVjdC5mb2N1c2VkTGF5b3V0U2VjdGlvbiA9PSAnc2lkZWJhcidcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuI3NpZGViYXIge1xuICAtLXN0YXRlLXNpZGVCYXJXaWR0aDogMTAwcHg7XG4gIHdpZHRoOiB2YXIoLS1zdGF0ZS1zaWRlQmFyV2lkdGgpO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbWFyZ2luOiAwO1xuICBwYWRkaW5nOiA0MHB4IDAgMCAwO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBib3JkZXItcmlnaHQ6IDFweCBzb2xpZCB2YXIoLS1zZXBhcmF0b3JDb2xvcik7XG59XG4jc2lkZWJhciA+IGRpdiB7XG4gIG1heC1oZWlnaHQ6IDEwMCU7XG59XG5cbiN0YWJzIHtcbiAgbWluLWhlaWdodDogMzBweDtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG59XG4jdGFicyB1bCB7XG4gIHBhZGRpbmc6IDA7XG4gIG1hcmdpbjogMDtcbiAgbGlzdC1zdHlsZS10eXBlOiBub25lO1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xufVxuXG4jc2lkZWJhciA6Z2xvYmFsKC5zZWN0aW9uKSB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIG92ZXJmbG93LXk6IGhpZGRlbjtcbiAgb3ZlcmZsb3cteDogdmlzaWJsZTtcbiAgZmxleC1ncm93OiAxO1xufTwvc3R5bGU+XG5cbjxkaXYgaWQ9XCJzaWRlYmFyXCIgc3R5bGU9XCItLXN0YXRlLXNpZGVCYXJXaWR0aDogMjUwcHhcIj5cbiAgXG4gIDwhLS0gVGFicyAtLT5cbiAgPGRpdiBpZD1cInRhYnNcIj5cbiAgICA8dWw+XG4gICAgICB7I2VhY2ggJHNpZGViYXIudGFic0FsbCBhcyBpZH1cbiAgICAgICAgPFRhYiB7aWR9IC8+XG4gICAgICB7L2VhY2h9XG4gICAgPC91bD5cbiAgPC9kaXY+XG5cbiAgPFNlcGFyYXRvciAvPlxuXG4gIDwhLS0gU2VjdGlvbnMgLS0+XG4gIHsjaWYgJHNpZGViYXIuYWN0aXZlVGFiSWQgPT0gJ3Byb2plY3QnfVxuICAgIDxQcm9qZWN0IC8+XG4gIHs6ZWxzZSBpZiAkc2lkZWJhci5hY3RpdmVUYWJJZCA9PSAnYWxsRG9jcyd9XG4gICAgPEFsbERvY3VtZW50cyAvPlxuICB7OmVsc2UgaWYgJHNpZGViYXIuYWN0aXZlVGFiSWQgPT0gJ21vc3RSZWNlbnQnfVxuICAgIDxNb3N0UmVjZW50IC8+XG4gIHs6ZWxzZSBpZiAkc2lkZWJhci5hY3RpdmVUYWJJZCA9PSAndGFncyd9XG4gICAgPFRhZ3MgLz5cbiAgezplbHNlIGlmICRzaWRlYmFyLmFjdGl2ZVRhYklkID09ICdtZWRpYSd9XG4gICAgPE1lZGlhIC8+XG4gIHs6ZWxzZSBpZiAkc2lkZWJhci5hY3RpdmVUYWJJZCA9PSAnY2l0YXRpb25zJ31cbiAgICA8Q2l0YXRpb25zIC8+XG4gIHs6ZWxzZSBpZiAkc2lkZWJhci5hY3RpdmVUYWJJZCA9PSAnc2VhcmNoJ31cbiAgICA8U2VhcmNoIC8+XG4gIHsvaWZ9XG5cbiAgPCEtLSA8UHJldmlldy8+IC0tPlxuXG48L2Rpdj5cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFxQkEsUUFBUSw4QkFBQyxDQUFDLEFBQ1Isb0JBQW9CLENBQUUsS0FBSyxDQUMzQixLQUFLLENBQUUsSUFBSSxvQkFBb0IsQ0FBQyxDQUNoQyxNQUFNLENBQUUsSUFBSSxDQUNaLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLE1BQU0sQ0FBRSxDQUFDLENBQ1QsT0FBTyxDQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDbkIsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsTUFBTSxDQUN0QixZQUFZLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLGdCQUFnQixDQUFDLEFBQy9DLENBQUMsQUFDRCx1QkFBUSxDQUFHLEdBQUcsZUFBQyxDQUFDLEFBQ2QsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyxBQUVELEtBQUssOEJBQUMsQ0FBQyxBQUNMLFVBQVUsQ0FBRSxJQUFJLENBQ2hCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsZUFBZSxDQUFFLE1BQU0sQUFDekIsQ0FBQyxBQUNELG9CQUFLLENBQUMsRUFBRSxlQUFDLENBQUMsQUFDUixPQUFPLENBQUUsQ0FBQyxDQUNWLE1BQU0sQ0FBRSxDQUFDLENBQ1QsZUFBZSxDQUFFLElBQUksQ0FDckIsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsR0FBRyxDQUNuQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBRUQsdUJBQVEsQ0FBQyxBQUFRLFFBQVEsQUFBRSxDQUFDLEFBQzFCLE9BQU8sQ0FBRSxJQUFJLENBQ2IsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsVUFBVSxDQUFFLE9BQU8sQ0FDbkIsU0FBUyxDQUFFLENBQUMsQUFDZCxDQUFDIn0= */";
	append_dev(document.head, style);
}

function get_each_context$4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[1] = list[i];
	return child_ctx;
}

// (64:6) {#each $sidebar.tabsAll as id}
function create_each_block$4(ctx) {
	let tab;
	let current;

	tab = new Tab({
			props: { id: /*id*/ ctx[1] },
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(tab.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(tab, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const tab_changes = {};
			if (dirty & /*$sidebar*/ 1) tab_changes.id = /*id*/ ctx[1];
			tab.$set(tab_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(tab.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(tab.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(tab, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$4.name,
		type: "each",
		source: "(64:6) {#each $sidebar.tabsAll as id}",
		ctx
	});

	return block;
}

// (85:45) 
function create_if_block_6(ctx) {
	let search;
	let current;
	search = new Search({ $$inline: true });

	const block = {
		c: function create() {
			create_component(search.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(search, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(search.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(search.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(search, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_6.name,
		type: "if",
		source: "(85:45) ",
		ctx
	});

	return block;
}

// (83:48) 
function create_if_block_5(ctx) {
	let citations;
	let current;
	citations = new Citations({ $$inline: true });

	const block = {
		c: function create() {
			create_component(citations.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(citations, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(citations.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(citations.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(citations, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_5.name,
		type: "if",
		source: "(83:48) ",
		ctx
	});

	return block;
}

// (81:44) 
function create_if_block_4(ctx) {
	let media;
	let current;
	media = new Media_1({ $$inline: true });

	const block = {
		c: function create() {
			create_component(media.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(media, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(media.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(media.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(media, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_4.name,
		type: "if",
		source: "(81:44) ",
		ctx
	});

	return block;
}

// (79:43) 
function create_if_block_3(ctx) {
	let tags;
	let current;
	tags = new Tags({ $$inline: true });

	const block = {
		c: function create() {
			create_component(tags.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(tags, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(tags.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(tags.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(tags, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_3.name,
		type: "if",
		source: "(79:43) ",
		ctx
	});

	return block;
}

// (77:49) 
function create_if_block_2$2(ctx) {
	let mostrecent;
	let current;
	mostrecent = new MostRecent({ $$inline: true });

	const block = {
		c: function create() {
			create_component(mostrecent.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(mostrecent, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(mostrecent.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(mostrecent.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(mostrecent, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_2$2.name,
		type: "if",
		source: "(77:49) ",
		ctx
	});

	return block;
}

// (75:46) 
function create_if_block_1$6(ctx) {
	let alldocuments;
	let current;
	alldocuments = new AllDocuments({ $$inline: true });

	const block = {
		c: function create() {
			create_component(alldocuments.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(alldocuments, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(alldocuments.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(alldocuments.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(alldocuments, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$6.name,
		type: "if",
		source: "(75:46) ",
		ctx
	});

	return block;
}

// (73:2) {#if $sidebar.activeTabId == 'project'}
function create_if_block$e(ctx) {
	let project_1;
	let current;
	project_1 = new Project({ $$inline: true });

	const block = {
		c: function create() {
			create_component(project_1.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(project_1, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(project_1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(project_1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(project_1, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$e.name,
		type: "if",
		source: "(73:2) {#if $sidebar.activeTabId == 'project'}",
		ctx
	});

	return block;
}

function create_fragment$v(ctx) {
	let div1;
	let div0;
	let ul;
	let t0;
	let separator;
	let t1;
	let current_block_type_index;
	let if_block;
	let current;
	let each_value = /*$sidebar*/ ctx[0].tabsAll;
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	separator = new Separator({ $$inline: true });

	const if_block_creators = [
		create_if_block$e,
		create_if_block_1$6,
		create_if_block_2$2,
		create_if_block_3,
		create_if_block_4,
		create_if_block_5,
		create_if_block_6
	];

	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*$sidebar*/ ctx[0].activeTabId == "project") return 0;
		if (/*$sidebar*/ ctx[0].activeTabId == "allDocs") return 1;
		if (/*$sidebar*/ ctx[0].activeTabId == "mostRecent") return 2;
		if (/*$sidebar*/ ctx[0].activeTabId == "tags") return 3;
		if (/*$sidebar*/ ctx[0].activeTabId == "media") return 4;
		if (/*$sidebar*/ ctx[0].activeTabId == "citations") return 5;
		if (/*$sidebar*/ ctx[0].activeTabId == "search") return 6;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			if (if_block) if_block.c();
			attr_dev(ul, "class", "svelte-1m5558u");
			add_location(ul, file$r, 62, 4, 1500);
			attr_dev(div0, "id", "tabs");
			attr_dev(div0, "class", "svelte-1m5558u");
			add_location(div0, file$r, 61, 2, 1480);
			attr_dev(div1, "id", "sidebar");
			set_style(div1, "--state-sideBarWidth", "250px");
			attr_dev(div1, "class", "svelte-1m5558u");
			add_location(div1, file$r, 58, 0, 1404);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div0, ul);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			append_dev(div1, t0);
			mount_component(separator, div1, null);
			append_dev(div1, t1);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div1, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*$sidebar*/ 1) {
				each_value = /*$sidebar*/ ctx[0].tabsAll;
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$4(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$4(child_ctx);
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

			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx);

			if (current_block_type_index !== previous_block_index) {
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
					if_block.m(div1, null);
				} else {
					if_block = null;
				}
			}
		},
		i: function intro(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			transition_in(separator.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			transition_out(separator.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_each(each_blocks, detaching);
			destroy_component(separator);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$v.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$v($$self, $$props, $$invalidate) {
	let $sidebar;
	validate_store(sidebar, "sidebar");
	component_subscribe($$self, sidebar, $$value => $$invalidate(0, $sidebar = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SideBar", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SideBar> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		project,
		sidebar,
		Tab,
		Separator,
		Project,
		AllDocuments,
		MostRecent,
		Tags,
		Media: Media_1,
		Citations,
		Search,
		Preview,
		$sidebar
	});

	return [$sidebar];
}

class SideBar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1m5558u-style")) add_css$q();
		init(this, options, instance$v, create_fragment$v, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SideBar",
			options,
			id: create_fragment$v.name
		});
	}
}

/* src/js/renderer/component/main/AddressBar.svelte generated by Svelte v3.30.1 */

const file$s = "src/js/renderer/component/main/AddressBar.svelte";

function add_css$r() {
	var style = element("style");
	style.id = "svelte-1aryddi-style";
	style.textContent = "#addressbar.svelte-1aryddi{margin:0 auto}.searchfield.svelte-1aryddi{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;position:relative;background-color:rgba(0, 0, 0, 0.04);border-radius:4px;min-height:20px;min-width:20rem;max-width:40rem;display:flex;flex-direction:row;align-items:center}.searchfield.svelte-1aryddi:focus-within{animation-fill-mode:forwards;animation-name:svelte-1aryddi-selectField;animation-duration:0.3s}@keyframes svelte-1aryddi-selectField{from{box-shadow:0 0 0 10px transparent}to{box-shadow:0 0 0 3.5px rgba(59, 153, 252, 0.5)}}.magnifying-glass.svelte-1aryddi{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlTextColor);-webkit-mask-image:var(--img-magnifyingglass);position:absolute;width:13px;height:13px;left:5px;opacity:0.5}.placeholder.svelte-1aryddi{position:absolute;top:50%;transform:translate(0, -50%);color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-1aryddi{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWRkcmVzc0Jhci5zdmVsdGUiLCJzb3VyY2VzIjpbIkFkZHJlc3NCYXIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGV4cG9ydCBsZXQgc3RhdGUgPSB7fVxuICBleHBvcnQgbGV0IHBsYWNlaG9sZGVyID0gJ1NlYXJjaCdcbiAgZXhwb3J0IGxldCBxdWVyeSA9ICcnXG4gIGV4cG9ydCBsZXQgZm9jdXNlZCA9IGZhbHNlXG5cbiAgbGV0IGlucHV0ID0gbnVsbFxuXG4gIC8vICQ6IGNvbnNvbGUubG9nKHN0YXRlLm9wZW5Eb2MpXG5cbiAgZnVuY3Rpb24gaGFuZGxlS2V5ZG93bihldnQpIHtcbiAgICBpZiAoIWZvY3VzZWQpIHJldHVyblxuICAgIGlmIChldnQua2V5ID09ICdmJyAmJiBldnQubWV0YUtleSkge1xuICAgICAgaW5wdXQuc2VsZWN0KClcbiAgICB9XG4gIH1cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbiNhZGRyZXNzYmFyIHtcbiAgbWFyZ2luOiAwIGF1dG87XG59XG5cbi5zZWFyY2hmaWVsZCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC4wNCk7XG4gIGJvcmRlci1yYWRpdXM6IDRweDtcbiAgbWluLWhlaWdodDogMjBweDtcbiAgbWluLXdpZHRoOiAyMHJlbTtcbiAgbWF4LXdpZHRoOiA0MHJlbTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IHJvdztcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cbi5zZWFyY2hmaWVsZDpmb2N1cy13aXRoaW4ge1xuICBhbmltYXRpb24tZmlsbC1tb2RlOiBmb3J3YXJkcztcbiAgYW5pbWF0aW9uLW5hbWU6IHNlbGVjdEZpZWxkO1xuICBhbmltYXRpb24tZHVyYXRpb246IDAuM3M7XG59XG5cbkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAxMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAzLjVweCByZ2JhKDU5LCAxNTMsIDI1MiwgMC41KTtcbiAgfVxufVxuLm1hZ25pZnlpbmctZ2xhc3Mge1xuICAtd2Via2l0LW1hc2stc2l6ZTogY29udGFpbjtcbiAgLXdlYmtpdC1tYXNrLXBvc2l0aW9uOiBjZW50ZXI7XG4gIC13ZWJraXQtbWFzay1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDUwJTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTUwJSk7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbnRyb2xUZXh0Q29sb3IpO1xuICAtd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLWltZy1tYWduaWZ5aW5nZ2xhc3MpO1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHdpZHRoOiAxM3B4O1xuICBoZWlnaHQ6IDEzcHg7XG4gIGxlZnQ6IDVweDtcbiAgb3BhY2l0eTogMC41O1xufVxuXG4ucGxhY2Vob2xkZXIge1xuICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gIHRvcDogNTAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtNTAlKTtcbiAgY29sb3I6IHZhcigtLXBsYWNlaG9sZGVyVGV4dENvbG9yKTtcbiAgbGVmdDogMjRweDtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG59XG5cbmlucHV0IHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIG1hcmdpbjogMXB4IDAgMCAyNHB4O1xuICB3aWR0aDogMTAwJTtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIG91dGxpbmU6IG5vbmU7XG4gIGJvcmRlcjogbm9uZTtcbn08L3N0eWxlPlxuXG48c3ZlbHRlOndpbmRvdyBvbjprZXlkb3duPXtoYW5kbGVLZXlkb3dufSAvPlxuXG48ZGl2IGlkPVwiYWRkcmVzc2JhclwiPlxuICA8ZGl2IGNsYXNzPVwic2VhcmNoZmllbGRcIj5cbiAgICA8ZGl2XG4gICAgICBvbjptb3VzZWRvd258cHJldmVudERlZmF1bHQ9eygpID0+IGlucHV0LnNlbGVjdCgpfVxuICAgICAgY2xhc3M9XCJtYWduaWZ5aW5nLWdsYXNzXCIgLz5cbiAgICB7I2lmICFxdWVyeX08c3BhbiBjbGFzcz1cInBsYWNlaG9sZGVyXCI+e3BsYWNlaG9sZGVyfTwvc3Bhbj57L2lmfVxuICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGJpbmQ6dGhpcz17aW5wdXR9IGJpbmQ6dmFsdWU9e3F1ZXJ5fSAvPlxuICA8L2Rpdj5cbjwvZGl2PlxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTBCQSxXQUFXLGVBQUMsQ0FBQyxBQUNYLE1BQU0sQ0FBRSxDQUFDLENBQUMsSUFBSSxBQUNoQixDQUFDLEFBRUQsWUFBWSxlQUFDLENBQUMsQUFDWixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsUUFBUSxDQUFFLFFBQVEsQ0FDbEIsZ0JBQWdCLENBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FDckMsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsU0FBUyxDQUFFLEtBQUssQ0FDaEIsU0FBUyxDQUFFLEtBQUssQ0FDaEIsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsR0FBRyxDQUNuQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBQ0QsMkJBQVksYUFBYSxBQUFDLENBQUMsQUFDekIsbUJBQW1CLENBQUUsUUFBUSxDQUM3QixjQUFjLENBQUUsMEJBQVcsQ0FDM0Isa0JBQWtCLENBQUUsSUFBSSxBQUMxQixDQUFDLEFBRUQsV0FBVywwQkFBWSxDQUFDLEFBQ3RCLElBQUksQUFBQyxDQUFDLEFBQ0osVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEFBQ3BDLENBQUMsQUFDRCxFQUFFLEFBQUMsQ0FBQyxBQUNGLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsQUFDakQsQ0FBQyxBQUNILENBQUMsQUFDRCxpQkFBaUIsZUFBQyxDQUFDLEFBQ2pCLGlCQUFpQixDQUFFLE9BQU8sQ0FDMUIscUJBQXFCLENBQUUsTUFBTSxDQUM3QixtQkFBbUIsQ0FBRSxTQUFTLENBQzlCLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxHQUFHLENBQ1IsU0FBUyxDQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQzdCLGdCQUFnQixDQUFFLElBQUksa0JBQWtCLENBQUMsQ0FDekMsa0JBQWtCLENBQUUsSUFBSSxxQkFBcUIsQ0FBQyxDQUM5QyxRQUFRLENBQUUsUUFBUSxDQUNsQixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osSUFBSSxDQUFFLEdBQUcsQ0FDVCxPQUFPLENBQUUsR0FBRyxBQUNkLENBQUMsQUFFRCxZQUFZLGVBQUMsQ0FBQyxBQUNaLFFBQVEsQ0FBRSxRQUFRLENBQ2xCLEdBQUcsQ0FBRSxHQUFHLENBQ1IsU0FBUyxDQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQzdCLEtBQUssQ0FBRSxJQUFJLHNCQUFzQixDQUFDLENBQ2xDLElBQUksQ0FBRSxJQUFJLENBQ1YsY0FBYyxDQUFFLElBQUksQUFDdEIsQ0FBQyxBQUVELEtBQUssZUFBQyxDQUFDLEFBQ0wsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQ3BCLEtBQUssQ0FBRSxJQUFJLENBQ1gsVUFBVSxDQUFFLFdBQVcsQ0FDdkIsT0FBTyxDQUFFLElBQUksQ0FDYixNQUFNLENBQUUsSUFBSSxBQUNkLENBQUMifQ== */";
	append_dev(document.head, style);
}

// (106:4) {#if !query}
function create_if_block$f(ctx) {
	let span;
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr_dev(span, "class", "placeholder svelte-1aryddi");
			add_location(span, file$s, 105, 16, 2297);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*placeholder*/ 2) set_data_dev(t, /*placeholder*/ ctx[1]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$f.name,
		type: "if",
		source: "(106:4) {#if !query}",
		ctx
	});

	return block;
}

function create_fragment$w(ctx) {
	let div2;
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let mounted;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block$f(ctx);

	const block = {
		c: function create() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr_dev(div0, "class", "magnifying-glass svelte-1aryddi");
			add_location(div0, file$s, 102, 4, 2185);
			attr_dev(input_1, "type", "text");
			attr_dev(input_1, "class", "svelte-1aryddi");
			add_location(input_1, file$s, 106, 4, 2353);
			attr_dev(div1, "class", "searchfield svelte-1aryddi");
			add_location(div1, file$s, 101, 2, 2155);
			attr_dev(div2, "id", "addressbar");
			attr_dev(div2, "class", "svelte-1aryddi");
			add_location(div2, file$s, 100, 0, 2131);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			append_dev(div2, div1);
			append_dev(div1, div0);
			append_dev(div1, t0);
			if (if_block) if_block.m(div1, null);
			append_dev(div1, t1);
			append_dev(div1, input_1);
			/*input_1_binding*/ ctx[7](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);

			if (!mounted) {
				dispose = [
					listen_dev(window, "keydown", /*handleKeydown*/ ctx[3], false, false, false),
					listen_dev(div0, "mousedown", prevent_default(/*mousedown_handler*/ ctx[6]), false, true, false),
					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[8])
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (!/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$f(ctx);
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
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
			if (if_block) if_block.d();
			/*input_1_binding*/ ctx[7](null);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$w.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$w($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("AddressBar", slots, []);
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

	const writable_props = ["state", "placeholder", "query", "focused"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<AddressBar> was created with unknown prop '${key}'`);
	});

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

	$$self.$capture_state = () => ({
		state,
		placeholder,
		query,
		focused,
		input,
		handleKeydown
	});

	$$self.$inject_state = $$props => {
		if ("state" in $$props) $$invalidate(4, state = $$props.state);
		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
		if ("focused" in $$props) $$invalidate(5, focused = $$props.focused);
		if ("input" in $$props) $$invalidate(2, input = $$props.input);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

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

class AddressBar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1aryddi-style")) add_css$r();

		init(this, options, instance$w, create_fragment$w, safe_not_equal, {
			state: 4,
			placeholder: 1,
			query: 0,
			focused: 5
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "AddressBar",
			options,
			id: create_fragment$w.name
		});
	}

	get state() {
		throw new Error("<AddressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set state(value) {
		throw new Error("<AddressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get placeholder() {
		throw new Error("<AddressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set placeholder(value) {
		throw new Error("<AddressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get query() {
		throw new Error("<AddressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set query(value) {
		throw new Error("<AddressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get focused() {
		throw new Error("<AddressBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set focused(value) {
		throw new Error("<AddressBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/main/Toolbar.svelte generated by Svelte v3.30.1 */

const { console: console_1$2 } = globals;
const file$t = "src/js/renderer/component/main/Toolbar.svelte";

function add_css$s() {
	var style = element("style");
	style.id = "svelte-1ypmug-style";
	style.textContent = "#address-bar.svelte-1ypmug{width:100%;height:40px;display:flex;flex-direction:row;align-items:center;padding:0 5px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbGJhci5zdmVsdGUiLCJzb3VyY2VzIjpbIlRvb2xiYXIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG5pbXBvcnQgSWNvbkJ1dHRvbiBmcm9tIFwiLi4vdWkvSWNvbkJ1dHRvbi5zdmVsdGVcIjtcbmltcG9ydCBBZGRyZXNzQmFyIGZyb20gXCIuL0FkZHJlc3NCYXIuc3ZlbHRlXCI7XG5cbmV4cG9ydCBsZXQgc3RhdGUgPSB7fVxuXG5mdW5jdGlvbiB0b2RvKCkge1xuICAgIGNvbnNvbGUubG9nKCdUb29sYmFyLnN2ZWx0ZTogVE9ETycpXG59XG5cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbiNhZGRyZXNzLWJhciB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDQwcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGZsZXgtZGlyZWN0aW9uOiByb3c7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHBhZGRpbmc6IDAgNXB4O1xufTwvc3R5bGU+XG5cbjxkaXYgaWQ9XCJhZGRyZXNzLWJhclwiPlxuICAgIDxJY29uQnV0dG9uIHRvb2x0aXA9eydTaG93IHNpZGViYXInfSBpY29uPXsnLS1pbWctc2lkZWJhci1sZWZ0J30gb246bW91c2Vkb3duPXt0b2RvfSAvPlxuICAgIDxBZGRyZXNzQmFyIHtzdGF0ZX0gLz5cbiAgICA8SWNvbkJ1dHRvbiBpY29uPXsnLS1pbWctcmVjdGFuZ2xlLWdyaWQtMngyJ30gb246bW91c2Vkb3duPXt0b2RvfSAvPlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWdCQSxZQUFZLGNBQUMsQ0FBQyxBQUNaLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxHQUFHLENBQ25CLFdBQVcsQ0FBRSxNQUFNLENBQ25CLE9BQU8sQ0FBRSxDQUFDLENBQUMsR0FBRyxBQUNoQixDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$x(ctx) {
	let div;
	let iconbutton0;
	let t0;
	let addressbar;
	let t1;
	let iconbutton1;
	let current;

	iconbutton0 = new IconButton({
			props: {
				tooltip: "Show sidebar",
				icon: "--img-sidebar-left"
			},
			$$inline: true
		});

	iconbutton0.$on("mousedown", todo);

	addressbar = new AddressBar({
			props: { state: /*state*/ ctx[0] },
			$$inline: true
		});

	iconbutton1 = new IconButton({
			props: { icon: "--img-rectangle-grid-2x2" },
			$$inline: true
		});

	iconbutton1.$on("mousedown", todo);

	const block = {
		c: function create() {
			div = element("div");
			create_component(iconbutton0.$$.fragment);
			t0 = space();
			create_component(addressbar.$$.fragment);
			t1 = space();
			create_component(iconbutton1.$$.fragment);
			attr_dev(div, "id", "address-bar");
			attr_dev(div, "class", "svelte-1ypmug");
			add_location(div, file$t, 25, 0, 542);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			mount_component(iconbutton0, div, null);
			append_dev(div, t0);
			mount_component(addressbar, div, null);
			append_dev(div, t1);
			mount_component(iconbutton1, div, null);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const addressbar_changes = {};
			if (dirty & /*state*/ 1) addressbar_changes.state = /*state*/ ctx[0];
			addressbar.$set(addressbar_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(iconbutton0.$$.fragment, local);
			transition_in(addressbar.$$.fragment, local);
			transition_in(iconbutton1.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(iconbutton0.$$.fragment, local);
			transition_out(addressbar.$$.fragment, local);
			transition_out(iconbutton1.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_component(iconbutton0);
			destroy_component(addressbar);
			destroy_component(iconbutton1);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$x.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function todo() {
	console.log("Toolbar.svelte: TODO");
}

function instance$x($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Toolbar", slots, []);
	let { state = {} } = $$props;
	const writable_props = ["state"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Toolbar> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
	};

	$$self.$capture_state = () => ({ IconButton, AddressBar, state, todo });

	$$self.$inject_state = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [state];
}

class Toolbar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1ypmug-style")) add_css$s();
		init(this, options, instance$x, create_fragment$x, safe_not_equal, { state: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Toolbar",
			options,
			id: create_fragment$x.name
		});
	}

	get state() {
		throw new Error("<Toolbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set state(value) {
		throw new Error("<Toolbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

function fade(node, { delay = 0, duration = 400, easing = identity }) {
    const o = +getComputedStyle(node).opacity;
    return {
        delay,
        duration,
        easing,
        css: t => `opacity: ${t * o}`
    };
}

/* src/js/renderer/component/ui/Menu.svelte generated by Svelte v3.30.1 */
const file$u = "src/js/renderer/component/ui/Menu.svelte";

function add_css$t() {
	var style = element("style");
	style.id = "svelte-1rfnnnk-style";
	style.textContent = ".menu.isCompact.svelte-1rfnnnk.svelte-1rfnnnk{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px}.menu.isCompact.svelte-1rfnnnk .checkmark.svelte-1rfnnnk{margin:0 5px 0 4px;width:7px;height:7px}.menu.svelte-1rfnnnk.svelte-1rfnnnk{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;user-select:none;width:calc(var(--width) * 1px);position:fixed;transform:translate(calc(var(--x) * 1px), calc(var(--y) * 1px));z-index:100}ul.svelte-1rfnnnk.svelte-1rfnnnk,li.svelte-1rfnnnk.svelte-1rfnnnk{margin:0;padding:0;text-indent:0;list-style-type:none}ul.svelte-1rfnnnk.svelte-1rfnnnk{backdrop-filter:blur(8px);background-color:var(--menuMaterialColor);border-radius:6px;padding:5px;transform:translate(0, 0);overflow:hidden;box-shadow:0 0 0 0.5px rgba(var(--foregroundColor), 0.15), 0 0 3px 0 rgba(var(--foregroundColor), 0.1), 0 5px 16px 0 rgba(var(--foregroundColor), 0.2)}li.svelte-1rfnnnk.svelte-1rfnnnk{cursor:default;white-space:nowrap;height:calc(var(--itemHeight) * 1px);display:flex;align-items:center;border-radius:4px;outline:none}li.svelte-1rfnnnk .svelte-1rfnnnk{pointer-events:none}.checkmark.svelte-1rfnnnk.svelte-1rfnnnk{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-image:var(--img-checkmark);background-color:var(--controlTextColor);display:inline-block;margin:0 7px 0 6px;padding:0;width:10px;height:10px;opacity:0}.label.svelte-1rfnnnk.svelte-1rfnnnk{color:var(--labelColor);opacity:1}li.hover.svelte-1rfnnnk.svelte-1rfnnnk{background-color:var(--controlAccentColor)}li.hover.svelte-1rfnnnk .checkmark.svelte-1rfnnnk{background-color:var(--controlColor)}li.hover.svelte-1rfnnnk .label.svelte-1rfnnnk{color:var(--controlColor);opacity:1}li.isChecked.svelte-1rfnnnk .checkmark.svelte-1rfnnnk{opacity:1}hr.svelte-1rfnnnk.svelte-1rfnnnk{border:none;border-bottom:1px solid var(--separatorColor);margin:4px 0}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWVudS5zdmVsdGUiLCJzb3VyY2VzIjpbIk1lbnUuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IG1lbnUsIGNsb3NlTWVudSwgc2VsZWN0TWVudU9wdGlvbiB9IGZyb20gJy4uLy4uL1N0YXRlTWFuYWdlcidcbiAgaW1wb3J0IHsgZmFkZSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJztcbiAgaW1wb3J0IHsgY3NzIH0gZnJvbSAnLi9hY3Rpb25zJztcbiAgaW1wb3J0IHsgd2FpdCB9IGZyb20gJy4uLy4uLy4uL3NoYXJlZC91dGlscyc7XG4gIGltcG9ydCB7IHRpY2sgfSBmcm9tICdzdmVsdGUnO1xuICBsZXQgdWwgLy8gYmluZHMgdG8gPHVsPiBlbGVtZW50XG5cbiAgbGV0IGlkID0gJydcbiAgbGV0IGlzT3BlbiA9IGZhbHNlXG4gIGxldCBpc0NvbXBhY3QgPSBmYWxzZVxuICBsZXQgb3B0aW9ucyA9IFtdXG4gIGxldCB3aWR0aCA9IDBcbiAgbGV0IGl0ZW1IZWlnaHQgPSAwXG4gIGxldCB4ID0gMFxuICBsZXQgeSA9IDBcbiAgbGV0IHcgPSAwXG4gIGxldCBoID0gMFxuXG4gIGxldCBpc0xpdmUgPSBmYWxzZVxuICBsZXQgaXNDbG9zaW5nID0gZmFsc2VcblxuICAvKipcbiAgICogV2hlbiBtZW51IHN0b3JlIGNoYW5nZXMsIHdlIG5lZWQgdG8gZGV0ZXJtaW5lIHdoYXQgdG8gZG8sIGJhc2VkIG9uIG1lbnUgc3RvcmUuIFxuICAgKiBQb3NzaWJsZSBzdGF0ZXM6IFxuICAgKiAtIFdhcyBjbG9zZWQsIGFuZCBpcyBub3cgb3BlblxuICAgKiAtIFdhcyBhbHJlYWR5IG9wZW4sIGFuZCBoYXMgYSBuZXcgdGFyZ2V0XG4gICAqIC0gV2FzIG9wZW4sIGFuZCBpcyBub3cgY2xvc2VkXG4gICAqL1xuXG4gICAkOiAkbWVudSwgZGV0ZXJtaW5lU3RhdGUoKVxuXG4gIGZ1bmN0aW9uIGRldGVybWluZVN0YXRlKCkge1xuXG4gICAgY29uc3Qgd2FzQ2xvc2VkSXNPcGVuID0gIWlzT3BlbiAmJiAkbWVudS5pc09wZW5cbiAgICBjb25zdCB3YXNPcGVuSGFzTmV3VGFyZ2V0ID0gaXNPcGVuICYmICRtZW51LmlzT3BlbiAmJiBpZCAhPT0gJG1lbnUuaWRcbiAgICBjb25zdCB3YXNPcGVuSXNDbG9zZWQgPSBpc09wZW4gJiYgISRtZW51LmlzT3BlblxuXG4gICAgaWYgKHdhc0Nsb3NlZElzT3Blbikge1xuICAgICAgdXBkYXRlVmFsdWVzKClcbiAgICAgIGlzTGl2ZSA9IGZhbHNlXG4gICAgICBvcGVuKClcbiAgICB9IGVsc2UgaWYgKHdhc09wZW5IYXNOZXdUYXJnZXQpIHtcbiAgICAgIHVwZGF0ZVZhbHVlcygpXG4gICAgfSBlbHNlIGlmICh3YXNPcGVuSXNDbG9zZWQpIHtcbiAgICAgIHVwZGF0ZVZhbHVlcygpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFVwYXRlIGxvY2FsIGNvcGllcyBvZiBzdG9yZSB2YWx1ZXMuIFRoZXNlIHZhbHVlcyBkcml2ZSBsb2NhbCByZWFjdGl2aXR5LCBhbmQgYXJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoYXQgY2hhbmdlZCBpbiBzdGF0ZS5cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVZhbHVlcygpIHtcbiAgICBpZCA9ICRtZW51LmlkXG4gICAgaXNPcGVuID0gJG1lbnUuaXNPcGVuXG4gICAgaXNDb21wYWN0ID0gJG1lbnUuaXNDb21wYWN0XG4gICAgb3B0aW9ucyA9ICRtZW51Lm9wdGlvbnNcbiAgICB3aWR0aCA9ICAkbWVudS53aWR0aFxuICAgIGl0ZW1IZWlnaHQgPSBpc0NvbXBhY3QgPyAxOCA6IDIxIC8vIElmIGlzQ29tcGFjdCwgdGlnaHRlbiBoZWlnaHRcbiAgICBhd2FpdCB0aWNrKCk7XG4gICAgeCA9IGdldFgoKVxuICAgIHkgPSBnZXRZKClcbiAgfVxuXG4gIC8qKlxuICAgKiBNZW51IHBvc2l0aW9uIGRlcGVuZHMgb24gc2V2ZXJhbCBmYWN0b3JzOlxuICAgKiAtIFR5cGUgb2YgbWVudSAoZS5nLiBwb3B1cCBvciBwdWxsZG93bilcbiAgICogLSBUeXBlIG9mIGJ1dHRvbiAoZS5nLiB0ZXh0IG9yIGljb24pXG4gICAqIC0gV2hldGhlciBpdCdzIGNvbXBhY3Qgb3Igbm90XG4gICAqL1xuICBmdW5jdGlvbiBnZXRYKCkge1xuICAgIGlmICgkbWVudS5tZW51VHlwZSA9PSAncG9wdXAnKSB7XG4gICAgICByZXR1cm4gJG1lbnUueCArIChpc0NvbXBhY3QgPyAtMTMgOiAtMjApXG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAkbWVudS54XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0WSgpIHtcblxuICAgIGNvbnN0IHNlbGVjdGVkSXRlbSA9IHVsLnF1ZXJ5U2VsZWN0b3IoJy5pc0NoZWNrZWQnKVxuXG4gICAgaWYgKCRtZW51Lm1lbnVUeXBlID09ICdwb3B1cCcpIHtcbiAgICAgIHJldHVybiAkbWVudS55IC0gc2VsZWN0ZWRJdGVtLm9mZnNldFRvcFxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJG1lbnUueSArIGl0ZW1IZWlnaHRcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogV2FpdCBhIGZldyBiZWF0cyBiZWZvcmUgXCJhcm1pbmdcIiB0aGUgYnV0dG9ucy4gV2UgZG8gdGhpcyBzbyB3ZSBjYW4gMSkgY2xpY2sgdGhlIG1lbnUgd2l0aG91dCB0aGUgbW91c2V1cCBldmVudCB0cmlnZ2VyaW5nIGEgc2VsZWN0aW9uICh3aXRoaW4gdGhlIGFybWluZyB0aW1lciB3aW5kb3cpLCBvciAyKSBwcmVzcy1ob2xkLXJlbGVhc2UgdG8gc2VsZWN0IGFuIGl0ZW0gKGFmdGVyIHRoZSBhcm1pbmcgdGltaW5nIHdpbmRvdyBpcyBmaW5pc2hlZCkuXG4gICovXG4gIGFzeW5jIGZ1bmN0aW9uIG9wZW4oKSB7XG4gICAgaXNDbG9zaW5nID0gZmFsc2VcbiAgICBhd2FpdCB3YWl0KDE1MClcbiAgICBpc0xpdmUgPSB0cnVlXG4gIH1cbiAgXG4gIC8qKiBcbiAgICogT24gb3B0aW9uIHNlbGVjdCwgcGxheSBmbGFzaCBhbmltYXRpb24sIHRoZW4gY2xvc2UgdGhlIG1lbnUuIHBvaW50ZXJFdmVudHMgbm9uZSBkaXNhYmxlcyB0aGUgaG92ZXIgc3RhdGVzLiBUaGVuIHdlIGFkZCB0aGUgaXNDbG9zaW5nIGNsYXNzLCB3aGljaCBoYXMgdGhlIHNhbWUgc3R5bGVzIGFzIHRoZSBob3ZlciBzdGF0ZS4gVGhpcyBjcmVhdGVzIHRoZSBhcHBlYXJhbmNlIG9mIHRoZSBpdGVtIGZsYXNoaW5nIG9uL29mZi5cbiAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gc2VsZWN0KGV2dCwgb3B0aW9uKSB7XG4gICAgaWYgKCFpc0xpdmUpIHJldHVyblxuICAgIGlzQ2xvc2luZyA9IHRydWVcbiAgICBldnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2hvdmVyJylcbiAgICBhd2FpdCB3YWl0KDUwKVxuICAgIGV2dC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnaG92ZXInKVxuICAgIHNlbGVjdE1lbnVPcHRpb24ob3B0aW9uKVxuICB9XG5cbiAgLyoqXG4gICAqIENsb3NlIHRoZSBtZW51IHdoZW4gdGhlIHVzZXIgY2xpY2tzIG91dHNpZGUgdGhlIG1lbnUuIE5PVEU6IElmIHRoZSB1c2VyIGNsaWNrcyB0aGUgYnV0dG9uIHRoYXQgb3BlbmVkIHRoZSBtZW51LCB0aGF0IHdpbGwgYWxzbyBjbG9zZSB0aGUgbWVudS4gVGhlIGJ1dHRvbiBsb2dpYyB3aWxsIGhhbmRsZSB0aGUgY2xvc2UgYWN0aW9uIGFuZCBzdG9wIGV2ZW50IHByb3BhZ2F0aW9uLCBhbmQgdGhpcyBjb2RlIHBhdGggd2lsbCBub3QgYmUgcmVhY2hlZC4gSWYgd2UgZG9uJ3QgdGFrZSB0aGlzIGFwcHJvYWNoLCB0aGlzIGNvZGUgd2lsbCBjbG9zZSB0aGUgbWVudSBhcyBzb29uIGFzIGl0J3Mgb3BlbmVkLlxuICAgKi9cbiAgZnVuY3Rpb24gY2hlY2tJZkNsaWNrZWRPdXRzaWRlVGhlTWVudShldnQpIHtcblxuICAgIGlmICghaXNPcGVuKSByZXR1cm5cbiAgICBcbiAgICBjb25zdCBjbGlja2VkSW5zaWRlID0gZXZ0LmNsaWVudFggPiB4ICYmIGV2dC5jbGllbnRYIDwgeCArIHcgJiYgZXZ0LmNsaWVudFkgPiB5ICYmIGV2dC5jbGllbnRZIDwgeSArIGhcbiAgICBcbiAgICBpZiAoIWNsaWNrZWRJbnNpZGUpIHtcbiAgICAgIGNsb3NlTWVudSgpXG4gICAgfVxuICB9XG5cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbi5tZW51LmlzQ29tcGFjdCB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbGluZS1oZWlnaHQ6IDEzcHg7XG4gIGxldHRlci1zcGFjaW5nOiAwLjA3cHg7XG59XG4ubWVudS5pc0NvbXBhY3QgLmNoZWNrbWFyayB7XG4gIG1hcmdpbjogMCA1cHggMCA0cHg7XG4gIHdpZHRoOiA3cHg7XG4gIGhlaWdodDogN3B4O1xufVxuXG4ubWVudSB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgd2lkdGg6IGNhbGModmFyKC0td2lkdGgpICogMXB4KTtcbiAgcG9zaXRpb246IGZpeGVkO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZShjYWxjKHZhcigtLXgpICogMXB4KSwgY2FsYyh2YXIoLS15KSAqIDFweCkpO1xuICB6LWluZGV4OiAxMDA7XG59XG5cbnVsLCBsaSB7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcbiAgdGV4dC1pbmRlbnQ6IDA7XG4gIGxpc3Qtc3R5bGUtdHlwZTogbm9uZTtcbn1cblxudWwge1xuICBiYWNrZHJvcC1maWx0ZXI6IGJsdXIoOHB4KTtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tbWVudU1hdGVyaWFsQ29sb3IpO1xuICBib3JkZXItcmFkaXVzOiA2cHg7XG4gIHBhZGRpbmc6IDVweDtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMCk7XG4gIG92ZXJmbG93OiBoaWRkZW47XG4gIGJveC1zaGFkb3c6IDAgMCAwIDAuNXB4IHJnYmEodmFyKC0tZm9yZWdyb3VuZENvbG9yKSwgMC4xNSksIDAgMCAzcHggMCByZ2JhKHZhcigtLWZvcmVncm91bmRDb2xvciksIDAuMSksIDAgNXB4IDE2cHggMCByZ2JhKHZhcigtLWZvcmVncm91bmRDb2xvciksIDAuMik7XG59XG5cbmxpIHtcbiAgY3Vyc29yOiBkZWZhdWx0O1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xuICBoZWlnaHQ6IGNhbGModmFyKC0taXRlbUhlaWdodCkgKiAxcHgpO1xuICBkaXNwbGF5OiBmbGV4O1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBib3JkZXItcmFkaXVzOiA0cHg7XG4gIG91dGxpbmU6IG5vbmU7XG59XG5saSAqIHtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG59XG5cbi5jaGVja21hcmsge1xuICAtd2Via2l0LW1hc2stc2l6ZTogY29udGFpbjtcbiAgLXdlYmtpdC1tYXNrLXBvc2l0aW9uOiBjZW50ZXI7XG4gIC13ZWJraXQtbWFzay1yZXBlYXQ6IG5vLXJlcGVhdDtcbiAgLXdlYmtpdC1tYXNrLWltYWdlOiB2YXIoLS1pbWctY2hlY2ttYXJrKTtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tY29udHJvbFRleHRDb2xvcik7XG4gIGRpc3BsYXk6IGlubGluZS1ibG9jaztcbiAgbWFyZ2luOiAwIDdweCAwIDZweDtcbiAgcGFkZGluZzogMDtcbiAgd2lkdGg6IDEwcHg7XG4gIGhlaWdodDogMTBweDtcbiAgb3BhY2l0eTogMDtcbn1cblxuLmxhYmVsIHtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICBvcGFjaXR5OiAxO1xufVxuXG5saS5ob3ZlciB7XG4gIGJhY2tncm91bmQtY29sb3I6IHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvcik7XG59XG5saS5ob3ZlciAuY2hlY2ttYXJrIHtcbiAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tY29udHJvbENvbG9yKTtcbn1cbmxpLmhvdmVyIC5sYWJlbCB7XG4gIGNvbG9yOiB2YXIoLS1jb250cm9sQ29sb3IpO1xuICBvcGFjaXR5OiAxO1xufVxuXG5saS5pc0NoZWNrZWQgLmNoZWNrbWFyayB7XG4gIG9wYWNpdHk6IDE7XG59XG5cbmhyIHtcbiAgYm9yZGVyOiBub25lO1xuICBib3JkZXItYm90dG9tOiAxcHggc29saWQgdmFyKC0tc2VwYXJhdG9yQ29sb3IpO1xuICBtYXJnaW46IDRweCAwO1xufTwvc3R5bGU+XG5cbjxzdmVsdGU6d2luZG93IG9uOm1vdXNlZG93bj17Y2hlY2tJZkNsaWNrZWRPdXRzaWRlVGhlTWVudX0gLz5cblxueyNpZiBpc09wZW59XG4gIDxkaXYgXG4gICAgY2xhc3M9XCJtZW51XCIgXG4gICAgY2xhc3M6aXNDb21wYWN0XG4gICAgYmluZDpjbGllbnRXaWR0aD17d30gYmluZDpjbGllbnRIZWlnaHQ9e2h9XG4gICAgdXNlOmNzcz17e3dpZHRoLCBpdGVtSGVpZ2h0LCB4LCB5fX1cbiAgICBvdXQ6ZmFkZT17eyBkdXJhdGlvbjogMjUwIH19IFxuICA+XG4gICAgPHVsIGJpbmQ6dGhpcz17dWx9PlxuICAgICAgeyNlYWNoIG9wdGlvbnMgYXMgb3B0aW9ufVxuICAgICAgICB7I2lmIG9wdGlvbi5sYWJlbCA9PSAnc2VwYXJhdG9yJ31cbiAgICAgICAgICA8aHIgLz5cbiAgICAgICAgezplbHNlfVxuICAgICAgICAgIDxsaSBcbiAgICAgICAgICAgIGNsYXNzOmhvdmVyPXtmYWxzZX1cbiAgICAgICAgICAgIGNsYXNzOmlzQ2hlY2tlZD17b3B0aW9uLmlzQ2hlY2tlZH0gXG4gICAgICAgICAgICBvbjptb3VzZWRvd258cHJldmVudERlZmF1bHRcbiAgICAgICAgICAgIG9uOm1vdXNlZW50ZXI9eyhldnQpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGlzQ2xvc2luZykgcmV0dXJuXG4gICAgICAgICAgICAgIGV2dC50YXJnZXQuY2xhc3NMaXN0LmFkZCgnaG92ZXInKVxuICAgICAgICAgICAgfX1cbiAgICAgICAgICAgIG9uOm1vdXNlb3V0PXsoZXZ0KSA9PiBldnQudGFyZ2V0LmNsYXNzTGlzdC5yZW1vdmUoJ2hvdmVyJyl9XG4gICAgICAgICAgICBvbjptb3VzZXVwPXsoZXZ0KSA9PiBzZWxlY3QoZXZ0LCBvcHRpb24pfVxuICAgICAgICAgICAgdGFiaW5kZXg9XCIwXCJcbiAgICAgICAgICA+XG4gICAgICAgICAgICA8c3BhbiBjbGFzcz1cImNoZWNrbWFya1wiPjwvc3Bhbj5cbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwibGFiZWxcIj57b3B0aW9uLmxhYmVsfTwvc3Bhbj5cbiAgICAgICAgICA8L2xpPlxuICAgICAgICB7L2lmfVxuICAgICAgey9lYWNofVxuICAgIDwvdWw+XG4gIDwvZGl2Plxuey9pZn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBa0lBLEtBQUssVUFBVSw4QkFBQyxDQUFDLEFBQ2YsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxNQUFNLEFBQ3hCLENBQUMsQUFDRCxLQUFLLHlCQUFVLENBQUMsVUFBVSxlQUFDLENBQUMsQUFDMUIsTUFBTSxDQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FDbkIsS0FBSyxDQUFFLEdBQUcsQ0FDVixNQUFNLENBQUUsR0FBRyxBQUNiLENBQUMsQUFFRCxLQUFLLDhCQUFDLENBQUMsQUFDTCxJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsV0FBVyxDQUFFLElBQUksQ0FDakIsS0FBSyxDQUFFLEtBQUssSUFBSSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQy9CLFFBQVEsQ0FBRSxLQUFLLENBQ2YsU0FBUyxDQUFFLFVBQVUsS0FBSyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDaEUsT0FBTyxDQUFFLEdBQUcsQUFDZCxDQUFDLEFBRUQsZ0NBQUUsQ0FBRSxFQUFFLDhCQUFDLENBQUMsQUFDTixNQUFNLENBQUUsQ0FBQyxDQUNULE9BQU8sQ0FBRSxDQUFDLENBQ1YsV0FBVyxDQUFFLENBQUMsQ0FDZCxlQUFlLENBQUUsSUFBSSxBQUN2QixDQUFDLEFBRUQsRUFBRSw4QkFBQyxDQUFDLEFBQ0YsZUFBZSxDQUFFLEtBQUssR0FBRyxDQUFDLENBQzFCLGdCQUFnQixDQUFFLElBQUksbUJBQW1CLENBQUMsQ0FDMUMsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLEdBQUcsQ0FDWixTQUFTLENBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FDMUIsUUFBUSxDQUFFLE1BQU0sQ0FDaEIsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLElBQUksaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQUFDekosQ0FBQyxBQUVELEVBQUUsOEJBQUMsQ0FBQyxBQUNGLE1BQU0sQ0FBRSxPQUFPLENBQ2YsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsTUFBTSxDQUFFLEtBQUssSUFBSSxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQ3JDLE9BQU8sQ0FBRSxJQUFJLENBQ2IsV0FBVyxDQUFFLE1BQU0sQ0FDbkIsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBQ0QsaUJBQUUsQ0FBQyxlQUFFLENBQUMsQUFDSixjQUFjLENBQUUsSUFBSSxBQUN0QixDQUFDLEFBRUQsVUFBVSw4QkFBQyxDQUFDLEFBQ1YsaUJBQWlCLENBQUUsT0FBTyxDQUMxQixxQkFBcUIsQ0FBRSxNQUFNLENBQzdCLG1CQUFtQixDQUFFLFNBQVMsQ0FDOUIsa0JBQWtCLENBQUUsSUFBSSxlQUFlLENBQUMsQ0FDeEMsZ0JBQWdCLENBQUUsSUFBSSxrQkFBa0IsQ0FBQyxDQUN6QyxPQUFPLENBQUUsWUFBWSxDQUNyQixNQUFNLENBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUNuQixPQUFPLENBQUUsQ0FBQyxDQUNWLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsQ0FBQyxBQUNaLENBQUMsQUFFRCxNQUFNLDhCQUFDLENBQUMsQUFDTixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDLEFBRUQsRUFBRSxNQUFNLDhCQUFDLENBQUMsQUFDUixnQkFBZ0IsQ0FBRSxJQUFJLG9CQUFvQixDQUFDLEFBQzdDLENBQUMsQUFDRCxFQUFFLHFCQUFNLENBQUMsVUFBVSxlQUFDLENBQUMsQUFDbkIsZ0JBQWdCLENBQUUsSUFBSSxjQUFjLENBQUMsQUFDdkMsQ0FBQyxBQUNELEVBQUUscUJBQU0sQ0FBQyxNQUFNLGVBQUMsQ0FBQyxBQUNmLEtBQUssQ0FBRSxJQUFJLGNBQWMsQ0FBQyxDQUMxQixPQUFPLENBQUUsQ0FBQyxBQUNaLENBQUMsQUFFRCxFQUFFLHlCQUFVLENBQUMsVUFBVSxlQUFDLENBQUMsQUFDdkIsT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDLEFBRUQsRUFBRSw4QkFBQyxDQUFDLEFBQ0YsTUFBTSxDQUFFLElBQUksQ0FDWixhQUFhLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLGdCQUFnQixDQUFDLENBQzlDLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxBQUNmLENBQUMifQ== */";
	append_dev(document.head, style);
}

function get_each_context$5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[26] = list[i];
	return child_ctx;
}

// (229:0) {#if isOpen}
function create_if_block$g(ctx) {
	let div;
	let ul_1;
	let div_resize_listener;
	let css_action;
	let div_outro;
	let current;
	let mounted;
	let dispose;
	let each_value = /*options*/ ctx[3];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			div = element("div");
			ul_1 = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(ul_1, "class", "svelte-1rfnnnk");
			add_location(ul_1, file$u, 236, 4, 5850);
			attr_dev(div, "class", "menu svelte-1rfnnnk");
			add_render_callback(() => /*div_elementresize_handler*/ ctx[18].call(div));
			toggle_class(div, "isCompact", /*isCompact*/ ctx[2]);
			add_location(div, file$u, 229, 2, 5677);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, ul_1);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul_1, null);
			}

			/*ul_1_binding*/ ctx[17](ul_1);
			div_resize_listener = add_resize_listener(div, /*div_elementresize_handler*/ ctx[18].bind(div));
			current = true;

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, div, {
					width: /*width*/ ctx[4],
					itemHeight: /*itemHeight*/ ctx[5],
					x: /*x*/ ctx[6],
					y: /*y*/ ctx[7]
				}));

				mounted = true;
			}
		},
		p: function update(ctx, dirty) {
			if (dirty & /*options, isClosing, select*/ 3080) {
				each_value = /*options*/ ctx[3];
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$5(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$5(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul_1, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (css_action && is_function(css_action.update) && dirty & /*width, itemHeight, x, y*/ 240) css_action.update.call(null, {
				width: /*width*/ ctx[4],
				itemHeight: /*itemHeight*/ ctx[5],
				x: /*x*/ ctx[6],
				y: /*y*/ ctx[7]
			});

			if (dirty & /*isCompact*/ 4) {
				toggle_class(div, "isCompact", /*isCompact*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;
			if (div_outro) div_outro.end(1);
			current = true;
		},
		o: function outro(local) {
			div_outro = create_out_transition(div, fade, { duration: 250 });
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
			/*ul_1_binding*/ ctx[17](null);
			div_resize_listener();
			if (detaching && div_outro) div_outro.end();
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$g.name,
		type: "if",
		source: "(229:0) {#if isOpen}",
		ctx
	});

	return block;
}

// (241:8) {:else}
function create_else_block$3(ctx) {
	let li;
	let span0;
	let t0;
	let span1;
	let t1_value = /*option*/ ctx[26].label + "";
	let t1;
	let t2;
	let mounted;
	let dispose;

	function mouseup_handler(...args) {
		return /*mouseup_handler*/ ctx[16](/*option*/ ctx[26], ...args);
	}

	const block = {
		c: function create() {
			li = element("li");
			span0 = element("span");
			t0 = space();
			span1 = element("span");
			t1 = text(t1_value);
			t2 = space();
			attr_dev(span0, "class", "checkmark svelte-1rfnnnk");
			add_location(span0, file$u, 253, 12, 6424);
			attr_dev(span1, "class", "label svelte-1rfnnnk");
			add_location(span1, file$u, 254, 12, 6468);
			attr_dev(li, "tabindex", "0");
			attr_dev(li, "class", "svelte-1rfnnnk");
			toggle_class(li, "hover", false);
			toggle_class(li, "isChecked", /*option*/ ctx[26].isChecked);
			add_location(li, file$u, 241, 10, 5987);
		},
		m: function mount(target, anchor) {
			insert_dev(target, li, anchor);
			append_dev(li, span0);
			append_dev(li, t0);
			append_dev(li, span1);
			append_dev(span1, t1);
			append_dev(li, t2);

			if (!mounted) {
				dispose = [
					listen_dev(li, "mousedown", prevent_default(/*mousedown_handler*/ ctx[14]), false, true, false),
					listen_dev(li, "mouseenter", /*mouseenter_handler*/ ctx[15], false, false, false),
					listen_dev(li, "mouseout", mouseout_handler, false, false, false),
					listen_dev(li, "mouseup", mouseup_handler, false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*options*/ 8 && t1_value !== (t1_value = /*option*/ ctx[26].label + "")) set_data_dev(t1, t1_value);

			if (dirty & /*options*/ 8) {
				toggle_class(li, "isChecked", /*option*/ ctx[26].isChecked);
			}
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(li);
			mounted = false;
			run_all(dispose);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$3.name,
		type: "else",
		source: "(241:8) {:else}",
		ctx
	});

	return block;
}

// (239:8) {#if option.label == 'separator'}
function create_if_block_1$7(ctx) {
	let hr;

	const block = {
		c: function create() {
			hr = element("hr");
			attr_dev(hr, "class", "svelte-1rfnnnk");
			add_location(hr, file$u, 239, 10, 5954);
		},
		m: function mount(target, anchor) {
			insert_dev(target, hr, anchor);
		},
		p: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(hr);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1$7.name,
		type: "if",
		source: "(239:8) {#if option.label == 'separator'}",
		ctx
	});

	return block;
}

// (238:6) {#each options as option}
function create_each_block$5(ctx) {
	let if_block_anchor;

	function select_block_type(ctx, dirty) {
		if (/*option*/ ctx[26].label == "separator") return create_if_block_1$7;
		return create_else_block$3;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	const block = {
		c: function create() {
			if_block.c();
			if_block_anchor = empty();
		},
		m: function mount(target, anchor) {
			if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
		},
		p: function update(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
				if_block.p(ctx, dirty);
			} else {
				if_block.d(1);
				if_block = current_block_type(ctx);

				if (if_block) {
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			}
		},
		d: function destroy(detaching) {
			if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$5.name,
		type: "each",
		source: "(238:6) {#each options as option}",
		ctx
	});

	return block;
}

function create_fragment$y(ctx) {
	let if_block_anchor;
	let current;
	let mounted;
	let dispose;
	let if_block = /*isOpen*/ ctx[1] && create_if_block$g(ctx);

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;

			if (!mounted) {
				dispose = listen_dev(window, "mousedown", /*checkIfClickedOutsideTheMenu*/ ctx[12], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (/*isOpen*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*isOpen*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$g(ctx);
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
		i: function intro(local) {
			if (current) return;
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(if_block_anchor);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$y.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

const mouseout_handler = evt => evt.target.classList.remove("hover");

function instance$y($$self, $$props, $$invalidate) {
	let $menu;
	validate_store(menu, "menu");
	component_subscribe($$self, menu, $$value => $$invalidate(13, $menu = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Menu", slots, []);
	let ul; // binds to <ul> element
	let id = "";
	let isOpen = false;
	let isCompact = false;
	let options = [];
	let width = 0;
	let itemHeight = 0;
	let x = 0;
	let y = 0;
	let w = 0;
	let h = 0;
	let isLive = false;
	let isClosing = false;

	function determineState() {
		const wasClosedIsOpen = !isOpen && $menu.isOpen;
		const wasOpenHasNewTarget = isOpen && $menu.isOpen && id !== $menu.id;
		const wasOpenIsClosed = isOpen && !$menu.isOpen;

		if (wasClosedIsOpen) {
			updateValues();
			isLive = false;
			open();
		} else if (wasOpenHasNewTarget) {
			updateValues();
		} else if (wasOpenIsClosed) {
			updateValues();
		}
	}

	/**
 * Upate local copies of store values. These values drive local reactivity, and are used to determine what changed in state.
 */
	async function updateValues() {
		id = $menu.id;
		$$invalidate(1, isOpen = $menu.isOpen);
		$$invalidate(2, isCompact = $menu.isCompact);
		$$invalidate(3, options = $menu.options);
		$$invalidate(4, width = $menu.width);
		$$invalidate(5, itemHeight = isCompact ? 18 : 21); // If isCompact, tighten height
		await tick();
		$$invalidate(6, x = getX());
		$$invalidate(7, y = getY());
	}

	/**
 * Menu position depends on several factors:
 * - Type of menu (e.g. popup or pulldown)
 * - Type of button (e.g. text or icon)
 * - Whether it's compact or not
 */
	function getX() {
		if ($menu.menuType == "popup") {
			return $menu.x + (isCompact ? -13 : -20);
		} else {
			return $menu.x;
		}
	}

	function getY() {
		const selectedItem = ul.querySelector(".isChecked");

		if ($menu.menuType == "popup") {
			return $menu.y - selectedItem.offsetTop;
		} else {
			return $menu.y + itemHeight;
		}
	}

	/**
 * Wait a few beats before "arming" the buttons. We do this so we can 1) click the menu without the mouseup event triggering a selection (within the arming timer window), or 2) press-hold-release to select an item (after the arming timing window is finished).
*/
	async function open() {
		$$invalidate(10, isClosing = false);
		await wait(150);
		isLive = true;
	}

	/** 
 * On option select, play flash animation, then close the menu. pointerEvents none disables the hover states. Then we add the isClosing class, which has the same styles as the hover state. This creates the appearance of the item flashing on/off.
*/
	async function select(evt, option) {
		if (!isLive) return;
		$$invalidate(10, isClosing = true);
		evt.target.classList.remove("hover");
		await wait(50);
		evt.target.classList.add("hover");
		selectMenuOption(option);
	}

	/**
 * Close the menu when the user clicks outside the menu. NOTE: If the user clicks the button that opened the menu, that will also close the menu. The button logic will handle the close action and stop event propagation, and this code path will not be reached. If we don't take this approach, this code will close the menu as soon as it's opened.
 */
	function checkIfClickedOutsideTheMenu(evt) {
		if (!isOpen) return;
		const clickedInside = evt.clientX > x && evt.clientX < x + w && evt.clientY > y && evt.clientY < y + h;

		if (!clickedInside) {
			closeMenu();
		}
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Menu> was created with unknown prop '${key}'`);
	});

	function mousedown_handler(event) {
		bubble($$self, event);
	}

	const mouseenter_handler = evt => {
		if (isClosing) return;
		evt.target.classList.add("hover");
	};

	const mouseup_handler = (option, evt) => select(evt, option);

	function ul_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			ul = $$value;
			$$invalidate(0, ul);
		});
	}

	function div_elementresize_handler() {
		w = this.clientWidth;
		h = this.clientHeight;
		$$invalidate(8, w);
		$$invalidate(9, h);
	}

	$$self.$capture_state = () => ({
		menu,
		closeMenu,
		selectMenuOption,
		fade,
		css,
		wait,
		tick,
		ul,
		id,
		isOpen,
		isCompact,
		options,
		width,
		itemHeight,
		x,
		y,
		w,
		h,
		isLive,
		isClosing,
		determineState,
		updateValues,
		getX,
		getY,
		open,
		select,
		checkIfClickedOutsideTheMenu,
		$menu
	});

	$$self.$inject_state = $$props => {
		if ("ul" in $$props) $$invalidate(0, ul = $$props.ul);
		if ("id" in $$props) id = $$props.id;
		if ("isOpen" in $$props) $$invalidate(1, isOpen = $$props.isOpen);
		if ("isCompact" in $$props) $$invalidate(2, isCompact = $$props.isCompact);
		if ("options" in $$props) $$invalidate(3, options = $$props.options);
		if ("width" in $$props) $$invalidate(4, width = $$props.width);
		if ("itemHeight" in $$props) $$invalidate(5, itemHeight = $$props.itemHeight);
		if ("x" in $$props) $$invalidate(6, x = $$props.x);
		if ("y" in $$props) $$invalidate(7, y = $$props.y);
		if ("w" in $$props) $$invalidate(8, w = $$props.w);
		if ("h" in $$props) $$invalidate(9, h = $$props.h);
		if ("isLive" in $$props) isLive = $$props.isLive;
		if ("isClosing" in $$props) $$invalidate(10, isClosing = $$props.isClosing);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$menu*/ 8192) {
			/**
 * When menu store changes, we need to determine what to do, based on menu store. 
 * Possible states: 
 * - Was closed, and is now open
 * - Was already open, and has a new target
 * - Was open, and is now closed
 */
			 (determineState());
		}
	};

	return [
		ul,
		isOpen,
		isCompact,
		options,
		width,
		itemHeight,
		x,
		y,
		w,
		h,
		isClosing,
		select,
		checkIfClickedOutsideTheMenu,
		$menu,
		mousedown_handler,
		mouseenter_handler,
		mouseup_handler,
		ul_1_binding,
		div_elementresize_handler
	];
}

class Menu extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1rfnnnk-style")) add_css$t();
		init(this, options, instance$y, create_fragment$y, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Menu",
			options,
			id: create_fragment$y.name
		});
	}
}

/* src/js/renderer/component/ui/Tooltip.svelte generated by Svelte v3.30.1 */
const file$v = "src/js/renderer/component/ui/Tooltip.svelte";

function add_css$u() {
	var style = element("style");
	style.id = "svelte-1s51lne-style";
	style.textContent = "#tooltip.svelte-1s51lne{pointer-events:none;font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;color:var(--secondaryLabelColor);background:var(--gridColor);position:fixed;max-width:264px;min-height:19px;padding:2px 5px;border:1px solid rgba(0, 0, 0, 0.05);box-shadow:0 3px 6px 0 rgba(0, 0, 0, 0.1);border-radius:3px;display:flex;align-items:center;z-index:1000;opacity:0;transform:translate(calc(var(--x) * 1px), calc(var(--y) * 1px));transition:opacity 500ms ease-in-out}#tooltip.isVisible.svelte-1s51lne{opacity:1;transition:opacity 1ms calc(var(--msDelayUntilShow) * 1ms)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbHRpcC5zdmVsdGUiLCJzb3VyY2VzIjpbIlRvb2x0aXAuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IHRvb2x0aXAgfSBmcm9tICcuLi8uLi9TdGF0ZU1hbmFnZXInXG4gIGltcG9ydCB7IGNzcyB9IGZyb20gJy4vYWN0aW9ucydcblxuICBsZXQgaXNWaXNpYmxlID0gZmFsc2VcbiAgbGV0IHRleHQgPSAnJ1xuICBsZXQgeCA9IDBcbiAgbGV0IHkgPSAwXG5cbiAgY29uc3QgbXNEZWxheVVudGlsU2hvdyA9IDE2MDBcbiAgY29uc3QgbXNEZWxheVVudGlsVXBkYXRlID0gMjUwXG4gIGNvbnN0IG1zRGVsYXlVbnRpbEhpZGUgPSA1MDBcblxuICBsZXQgb2xkU3RhdHVzLCBvbGRUZXh0XG4gIGxldCB1cGRhdGVEZWxheVRpbWVyXG4gIGxldCBoaWRlRGVsYXlUaW1lclxuXG4gIC8qXG4gIFRvb2x0aXAgZnVuY3Rpb25hbGl0eSBpcyBkcml2ZW4gZnJvbSB0cmVlIHBsYWNlczogXG4gICogVGhlIGBzZXRUb29sdGlwYCBhY3Rpb24sIHdoaWNoIGlzIGFwcGxpZWQgdG8gY29tcG9uZW50cyB0aGF0IG5lZWQgYSB0b29sdGlwLiBJdCBsaXN0ZW5zIGZvciBtb3VzZSBldmVudHMgb24gdGhlIGNvbXBvbmVudCwgYW5kIHVwZGF0ZXMuLi5cbiAgKiBUaGUgdG9vbHRpcCBzdG9yZSwgaW4gU3RhdGVNYW5hZ2VyLiBJdCBpcyB1cGRhdGVkIGJ5IHRoZSBjb21wb25lbnRzLCB3aGljaCB0ZWxsIGl0IHdoYXQgdGV4dCB0byBkaXNwbGF5LCBhbmQgY29vcmRpbmF0ZXMuXG4gICogVGhpcyBjb21wb25lbnQsIHdoaWNoIGxpc3RlbnMgZm9yIGNoYW5nZXMgdG8gdGhlIHRvb2x0aXAgc3RvcmUsIGFuZCB1cGRhdGVzIHRoZSBhcHBlYXJhbmNlIG9mIHRoZSB0b29sdGlwIGFjY29yZGluZ2x5LiBNb3N0IG9mIHRoZSBjb2RlIGluIHRoZSBzd2l0Y2ggc3RhdGVtZW50IGJlbG93IGlzIGNvbmNlcm5lZCB3aXRoIHRoZSB0aW1pbmcgb2Ygc2hvd2luZy9oaWRpbmcgdGhlIHRvb2x0aXAuIFxuICAqL1xuXG4gICQ6ICR0b29sdGlwLCB1cGRhdGUoKVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICBpZiAoIXZhbHVlc0hhdmVDaGFuZ2VkKSByZXR1cm5cbiAgICBcbiAgICBpZiAodXBkYXRlRGVsYXlUaW1lcikgY2xlYXJUaW1lb3V0KHVwZGF0ZURlbGF5VGltZXIpXG4gICAgaWYgKGhpZGVEZWxheVRpbWVyKSBjbGVhclRpbWVvdXQoaGlkZURlbGF5VGltZXIpXG4gICAgXG4gICAgc3dpdGNoICgkdG9vbHRpcC5zdGF0dXMpIHtcbiAgICAgIGNhc2UgJ3Nob3cnOlxuXG4gICAgICAgIGlmIChpc1Zpc2libGUpIHtcbiAgICAgICAgICAvLyBJZiB0b29sdGlwIGlzIGFscmVhZHkgdmlzaWJsZSwgYW5kIHdlJ3ZlIG1vdXNlZCBvdmVyIGEgbmV3IHRhcmdldCAod2hpY2ggd2Uga25vdyB3ZWUgaGF2ZSwgaWYgdmFsdWVzSGF2ZUNoYW5nZWQgYW5kIHN0YXR1cyA9PSAnc2hvdycpIHdhaXQgYSBtb21lbnQgYmVmb3JlIHVwZGF0aW5nLiBcbiAgICAgICAgICB1cGRhdGVEZWxheVRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICB0ZXh0ID0gJHRvb2x0aXAudGV4dFxuICAgICAgICAgICAgeCA9ICR0b29sdGlwLnhcbiAgICAgICAgICAgIHkgPSAkdG9vbHRpcC55XG4gICAgICAgICAgfSwgbXNEZWxheVVudGlsVXBkYXRlKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFNob3cgYWZ0ZXIgZGVsYXkuIElzIHRyaWdnZXJlZCBvbiBtb3VzZW92ZXIuIERlbGF5IGlzIGltcGxlbWVudGVkIGJ5IHRoZSBgaXNWaXNpYmxlYCBjbGFzcyB0cmFuc2l0aW9uLWRlbGF5LiBJZiBhIGhpZGUgdGltZXIgaXMgYWN0aXZlLCBjYW5jZWwgaXQuXG4gICAgICAgICAgaXNWaXNpYmxlID0gdHJ1ZVxuICAgICAgICAgIHRleHQgPSAkdG9vbHRpcC50ZXh0XG4gICAgICAgICAgeCA9ICR0b29sdGlwLnhcbiAgICAgICAgICB5ID0gJHRvb2x0aXAueVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrXG4gICAgICBjYXNlICdoaWRlJzpcbiAgICAgICAgLy8gSGlkZSBpbW1lZGlhdGVseS4gSXMgdHJpZ2dlcmVkIGJ5IGNsaWNraW5nLlxuICAgICAgICBpc1Zpc2libGUgPSBmYWxzZVxuICAgICAgICBicmVha1xuICAgICAgY2FzZSAnaGlkZUFmdGVyRGVsYXknOlxuICAgICAgICAvLyBIaWRlIGFmdGVyIGRlbGF5LiBJcyB0cmlnZ2VyZWQgd2hlbiBtb3VzaW5nIG91dC5cbiAgICAgICAgaGlkZURlbGF5VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICBpc1Zpc2libGUgPSBmYWxzZVxuICAgICAgICB9LCBtc0RlbGF5VW50aWxIaWRlKTtcbiAgICAgICAgYnJlYWtcbiAgICB9XG5cbiAgICBvbGRTdGF0dXMgPSAkdG9vbHRpcC5zdGF0dXNcbiAgICBvbGRUZXh0ID0gJHRvb2x0aXAudGV4dFxuICB9XG5cbiAgZnVuY3Rpb24gdmFsdWVzSGF2ZUNoYW5nZWQoKSB7XG4gICAgcmV0dXJuIG9sZFN0YXR1cyAhPT0gJHRvb2x0aXAuc3RhdHVzIHx8IG9sZFRleHQgIT09ICR0b29sdGlwLnRleHRcbiAgfVxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4jdG9vbHRpcCB7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMC4wN3B4O1xuICBjb2xvcjogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG4gIGJhY2tncm91bmQ6IHZhcigtLWdyaWRDb2xvcik7XG4gIHBvc2l0aW9uOiBmaXhlZDtcbiAgbWF4LXdpZHRoOiAyNjRweDtcbiAgbWluLWhlaWdodDogMTlweDtcbiAgcGFkZGluZzogMnB4IDVweDtcbiAgYm9yZGVyOiAxcHggc29saWQgcmdiYSgwLCAwLCAwLCAwLjA1KTtcbiAgYm94LXNoYWRvdzogMCAzcHggNnB4IDAgcmdiYSgwLCAwLCAwLCAwLjEpO1xuICBib3JkZXItcmFkaXVzOiAzcHg7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHotaW5kZXg6IDEwMDA7XG4gIG9wYWNpdHk6IDA7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKGNhbGModmFyKC0teCkgKiAxcHgpLCBjYWxjKHZhcigtLXkpICogMXB4KSk7XG4gIHRyYW5zaXRpb246IG9wYWNpdHkgNTAwbXMgZWFzZS1pbi1vdXQ7XG59XG4jdG9vbHRpcC5pc1Zpc2libGUge1xuICBvcGFjaXR5OiAxO1xuICB0cmFuc2l0aW9uOiBvcGFjaXR5IDFtcyBjYWxjKHZhcigtLW1zRGVsYXlVbnRpbFNob3cpICogMW1zKTtcbn08L3N0eWxlPlxuXG48ZGl2IGlkPVwidG9vbHRpcFwiIGNsYXNzOmlzVmlzaWJsZSB1c2U6Y3NzPXt7eCwgeSwgdGV4dCwgbXNEZWxheVVudGlsU2hvd319PlxuICB7dGV4dH1cbjwvZGl2PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFnRkEsUUFBUSxlQUFDLENBQUMsQUFDUixjQUFjLENBQUUsSUFBSSxDQUNwQixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsQ0FDakMsVUFBVSxDQUFFLElBQUksV0FBVyxDQUFDLENBQzVCLFFBQVEsQ0FBRSxLQUFLLENBQ2YsU0FBUyxDQUFFLEtBQUssQ0FDaEIsVUFBVSxDQUFFLElBQUksQ0FDaEIsT0FBTyxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQ2hCLE1BQU0sQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQ3JDLFVBQVUsQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FDMUMsYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLElBQUksQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixPQUFPLENBQUUsSUFBSSxDQUNiLE9BQU8sQ0FBRSxDQUFDLENBQ1YsU0FBUyxDQUFFLFVBQVUsS0FBSyxJQUFJLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDaEUsVUFBVSxDQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxBQUN2QyxDQUFDLEFBQ0QsUUFBUSxVQUFVLGVBQUMsQ0FBQyxBQUNsQixPQUFPLENBQUUsQ0FBQyxDQUNWLFVBQVUsQ0FBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssSUFBSSxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQUFDN0QsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$z(ctx) {
	let div;
	let t;
	let css_action;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div = element("div");
			t = text(/*text*/ ctx[1]);
			attr_dev(div, "id", "tooltip");
			attr_dev(div, "class", "svelte-1s51lne");
			toggle_class(div, "isVisible", /*isVisible*/ ctx[0]);
			add_location(div, file$v, 108, 0, 3401);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			append_dev(div, t);

			if (!mounted) {
				dispose = action_destroyer(css_action = css.call(null, div, {
					x: /*x*/ ctx[2],
					y: /*y*/ ctx[3],
					text: /*text*/ ctx[1],
					msDelayUntilShow
				}));

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);

			if (css_action && is_function(css_action.update) && dirty & /*x, y, text*/ 14) css_action.update.call(null, {
				x: /*x*/ ctx[2],
				y: /*y*/ ctx[3],
				text: /*text*/ ctx[1],
				msDelayUntilShow
			});

			if (dirty & /*isVisible*/ 1) {
				toggle_class(div, "isVisible", /*isVisible*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			mounted = false;
			dispose();
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$z.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

const msDelayUntilShow = 1600;
const msDelayUntilUpdate = 250;
const msDelayUntilHide = 500;

function instance$z($$self, $$props, $$invalidate) {
	let $tooltip;
	validate_store(tooltip, "tooltip");
	component_subscribe($$self, tooltip, $$value => $$invalidate(4, $tooltip = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Tooltip", slots, []);
	let isVisible = false;
	let text = "";
	let x = 0;
	let y = 0;
	let oldStatus, oldText;
	let updateDelayTimer;
	let hideDelayTimer;

	function update() {
		if (!valuesHaveChanged) return;
		if (updateDelayTimer) clearTimeout(updateDelayTimer);
		if (hideDelayTimer) clearTimeout(hideDelayTimer);

		switch ($tooltip.status) {
			case "show":
				if (isVisible) {
					// If tooltip is already visible, and we've moused over a new target (which we know wee have, if valuesHaveChanged and status == 'show') wait a moment before updating. 
					updateDelayTimer = setTimeout(
						() => {
							$$invalidate(1, text = $tooltip.text);
							$$invalidate(2, x = $tooltip.x);
							$$invalidate(3, y = $tooltip.y);
						},
						msDelayUntilUpdate
					);
				} else {
					// Show after delay. Is triggered on mouseover. Delay is implemented by the `isVisible` class transition-delay. If a hide timer is active, cancel it.
					$$invalidate(0, isVisible = true);

					$$invalidate(1, text = $tooltip.text);
					$$invalidate(2, x = $tooltip.x);
					$$invalidate(3, y = $tooltip.y);
				}
				break;
			case "hide":
				// Hide immediately. Is triggered by clicking.
				$$invalidate(0, isVisible = false);
				break;
			case "hideAfterDelay":
				// Hide after delay. Is triggered when mousing out.
				hideDelayTimer = setTimeout(
					() => {
						$$invalidate(0, isVisible = false);
					},
					msDelayUntilHide
				);
				break;
		}

		oldStatus = $tooltip.status;
		oldText = $tooltip.text;
	}

	function valuesHaveChanged() {
		return oldStatus !== $tooltip.status || oldText !== $tooltip.text;
	}

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		tooltip,
		css,
		isVisible,
		text,
		x,
		y,
		msDelayUntilShow,
		msDelayUntilUpdate,
		msDelayUntilHide,
		oldStatus,
		oldText,
		updateDelayTimer,
		hideDelayTimer,
		update,
		valuesHaveChanged,
		$tooltip
	});

	$$self.$inject_state = $$props => {
		if ("isVisible" in $$props) $$invalidate(0, isVisible = $$props.isVisible);
		if ("text" in $$props) $$invalidate(1, text = $$props.text);
		if ("x" in $$props) $$invalidate(2, x = $$props.x);
		if ("y" in $$props) $$invalidate(3, y = $$props.y);
		if ("oldStatus" in $$props) oldStatus = $$props.oldStatus;
		if ("oldText" in $$props) oldText = $$props.oldText;
		if ("updateDelayTimer" in $$props) updateDelayTimer = $$props.updateDelayTimer;
		if ("hideDelayTimer" in $$props) hideDelayTimer = $$props.hideDelayTimer;
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$tooltip*/ 16) {
			/*
Tooltip functionality is driven from tree places: 
* The `setTooltip` action, which is applied to components that need a tooltip. It listens for mouse events on the component, and updates...
* The tooltip store, in StateManager. It is updated by the components, which tell it what text to display, and coordinates.
* This component, which listens for changes to the tooltip store, and updates the appearance of the tooltip accordingly. Most of the code in the switch statement below is concerned with the timing of showing/hiding the tooltip. 
*/
			 (update());
		}
	};

	return [isVisible, text, x, y, $tooltip];
}

class Tooltip extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1s51lne-style")) add_css$u();
		init(this, options, instance$z, create_fragment$z, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Tooltip",
			options,
			id: create_fragment$z.name
		});
	}
}

/* src/js/renderer/component/dev/SwatchTable.svelte generated by Svelte v3.30.1 */

const { Object: Object_1$1 } = globals;
const file$w = "src/js/renderer/component/dev/SwatchTable.svelte";

function add_css$v() {
	var style = element("style");
	style.id = "svelte-tbnt6g-style";
	style.textContent = "h3.svelte-tbnt6g.svelte-tbnt6g{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;margin:1em 0;color:var(--labelColor);display:block;padding:0;border-top:1px solid var(--gridColor);padding-top:0.4em}.table.svelte-tbnt6g.svelte-tbnt6g{display:grid;grid-template-columns:repeat(3, calc(25% - 0.4em)) 25%;grid-gap:0.4em}.table.svelte-tbnt6g .color.svelte-tbnt6g{display:flex;gap:0.5em}.table.svelte-tbnt6g .color .data.svelte-tbnt6g{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;flex-grow:1;overflow:scroll}.table.svelte-tbnt6g .color .data .name.svelte-tbnt6g{color:var(--labelColor)}.table.svelte-tbnt6g .color .data .value.svelte-tbnt6g{color:var(--secondaryLabelColor)}.table.svelte-tbnt6g .color .swatch.svelte-tbnt6g{flex-basis:2em;flex-shrink:0;position:relative}.table.svelte-tbnt6g .color .swatch .color.svelte-tbnt6g,.table.svelte-tbnt6g .color .swatch .grid.svelte-tbnt6g{width:100%;height:100%;position:absolute;top:0;left:0}.table.svelte-tbnt6g .color .swatch .color.svelte-tbnt6g{z-index:2}.table.svelte-tbnt6g .color .swatch .grid.svelte-tbnt6g{background-image:linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(135deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(135deg, transparent 75%, #ccc 75%);background-size:10px 10px;background-position:0 0, 5px 0, 5px -5px, 0px 5px;z-index:1}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3dhdGNoVGFibGUuc3ZlbHRlIiwic291cmNlcyI6WyJTd2F0Y2hUYWJsZS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cblx0ZXhwb3J0IGxldCB0aXRsZSA9ICcnXG5cdGV4cG9ydCBsZXQgY29sb3JzID0ge31cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1pc2MgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbmgzIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBsaW5lLWhlaWdodDogMTNweDtcbiAgbGV0dGVyLXNwYWNpbmc6IDAuMDdweDtcbiAgbWFyZ2luOiAxZW0gMDtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICBkaXNwbGF5OiBibG9jaztcbiAgcGFkZGluZzogMDtcbiAgYm9yZGVyLXRvcDogMXB4IHNvbGlkIHZhcigtLWdyaWRDb2xvcik7XG4gIHBhZGRpbmctdG9wOiAwLjRlbTtcbn1cblxuLnRhYmxlIHtcbiAgZGlzcGxheTogZ3JpZDtcbiAgZ3JpZC10ZW1wbGF0ZS1jb2x1bW5zOiByZXBlYXQoMywgY2FsYygyNSUgLSAwLjRlbSkpIDI1JTtcbiAgZ3JpZC1nYXA6IDAuNGVtO1xufVxuLnRhYmxlIC5jb2xvciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGdhcDogMC41ZW07XG59XG4udGFibGUgLmNvbG9yIC5kYXRhIHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBsaW5lLWhlaWdodDogMTNweDtcbiAgbGV0dGVyLXNwYWNpbmc6IDAuMDdweDtcbiAgZmxleC1ncm93OiAxO1xuICBvdmVyZmxvdzogc2Nyb2xsO1xufVxuLnRhYmxlIC5jb2xvciAuZGF0YSAubmFtZSB7XG4gIGNvbG9yOiB2YXIoLS1sYWJlbENvbG9yKTtcbn1cbi50YWJsZSAuY29sb3IgLmRhdGEgLnZhbHVlIHtcbiAgY29sb3I6IHZhcigtLXNlY29uZGFyeUxhYmVsQ29sb3IpO1xufVxuLnRhYmxlIC5jb2xvciAuc3dhdGNoIHtcbiAgZmxleC1iYXNpczogMmVtO1xuICBmbGV4LXNocmluazogMDtcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xufVxuLnRhYmxlIC5jb2xvciAuc3dhdGNoIC5jb2xvciwgLnRhYmxlIC5jb2xvciAuc3dhdGNoIC5ncmlkIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG59XG4udGFibGUgLmNvbG9yIC5zd2F0Y2ggLmNvbG9yIHtcbiAgei1pbmRleDogMjtcbn1cbi50YWJsZSAuY29sb3IgLnN3YXRjaCAuZ3JpZCB7XG4gIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCg0NWRlZywgI2NjYyAyNSUsIHRyYW5zcGFyZW50IDI1JSksIGxpbmVhci1ncmFkaWVudCgxMzVkZWcsICNjY2MgMjUlLCB0cmFuc3BhcmVudCAyNSUpLCBsaW5lYXItZ3JhZGllbnQoNDVkZWcsIHRyYW5zcGFyZW50IDc1JSwgI2NjYyA3NSUpLCBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCB0cmFuc3BhcmVudCA3NSUsICNjY2MgNzUlKTtcbiAgYmFja2dyb3VuZC1zaXplOiAxMHB4IDEwcHg7XG4gIC8qIE11c3QgYmUgYSBzcXVhcmUgKi9cbiAgYmFja2dyb3VuZC1wb3NpdGlvbjogMCAwLCA1cHggMCwgNXB4IC01cHgsIDBweCA1cHg7XG4gIC8qIE11c3QgYmUgaGFsZiBvZiBvbmUgc2lkZSBvZiB0aGUgc3F1YXJlICovXG4gIHotaW5kZXg6IDE7XG59PC9zdHlsZT5cblxueyNpZiB0aXRsZX1cblx0PGgzPnt0aXRsZX08L2gzPlxuey9pZn1cbjxkaXYgY2xhc3M9XCJ0YWJsZVwiPlxuXHR7I2VhY2ggT2JqZWN0LmVudHJpZXMoY29sb3JzKSBhcyBbbmFtZSwgdmFsdWVdfVxuXHRcdDxkaXYgY2xhc3M9XCJjb2xvclwiPlxuXHRcdDxzcGFuIGNsYXNzPVwic3dhdGNoXCI+PHNwYW4gY2xhc3M9XCJjb2xvclwiIHN0eWxlPXtgYmFja2dyb3VuZC1jb2xvcjogJHt2YWx1ZX1gfT48L3NwYW4+PHNwYW4gY2xhc3M9XCJncmlkXCI+PC9zcGFuPjwvc3Bhbj5cblx0XHQ8c3BhbiBjbGFzcz1cImRhdGFcIj5cblx0XHRcdDxkaXYgY2xhc3M9XCJuYW1lXCI+e25hbWV9PC9kaXY+XG5cdFx0XHQ8ZGl2IGNsYXNzPVwidmFsdWVcIj57dmFsdWV9PC9kaXY+XG5cdFx0PC9zcGFuPlxuXHRcdDwvZGl2PlxuXHR7L2VhY2h9XG48L2Rpdj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBYUEsRUFBRSw0QkFBQyxDQUFDLEFBQ0YsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxNQUFNLENBQ3RCLE1BQU0sQ0FBRSxHQUFHLENBQUMsQ0FBQyxDQUNiLEtBQUssQ0FBRSxJQUFJLFlBQVksQ0FBQyxDQUN4QixPQUFPLENBQUUsS0FBSyxDQUNkLE9BQU8sQ0FBRSxDQUFDLENBQ1YsVUFBVSxDQUFFLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxXQUFXLENBQUMsQ0FDdEMsV0FBVyxDQUFFLEtBQUssQUFDcEIsQ0FBQyxBQUVELE1BQU0sNEJBQUMsQ0FBQyxBQUNOLE9BQU8sQ0FBRSxJQUFJLENBQ2IscUJBQXFCLENBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQ3ZELFFBQVEsQ0FBRSxLQUFLLEFBQ2pCLENBQUMsQUFDRCxvQkFBTSxDQUFDLE1BQU0sY0FBQyxDQUFDLEFBQ2IsT0FBTyxDQUFFLElBQUksQ0FDYixHQUFHLENBQUUsS0FBSyxBQUNaLENBQUMsQUFDRCxvQkFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLGNBQUMsQ0FBQyxBQUNuQixJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsU0FBUyxDQUFFLENBQUMsQ0FDWixRQUFRLENBQUUsTUFBTSxBQUNsQixDQUFDLEFBQ0Qsb0JBQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssY0FBQyxDQUFDLEFBQ3pCLEtBQUssQ0FBRSxJQUFJLFlBQVksQ0FBQyxBQUMxQixDQUFDLEFBQ0Qsb0JBQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLE1BQU0sY0FBQyxDQUFDLEFBQzFCLEtBQUssQ0FBRSxJQUFJLHFCQUFxQixDQUFDLEFBQ25DLENBQUMsQUFDRCxvQkFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLGNBQUMsQ0FBQyxBQUNyQixVQUFVLENBQUUsR0FBRyxDQUNmLFdBQVcsQ0FBRSxDQUFDLENBQ2QsUUFBUSxDQUFFLFFBQVEsQUFDcEIsQ0FBQyxBQUNELG9CQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxvQkFBTSxDQUFFLG9CQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLGNBQUMsQ0FBQyxBQUN6RCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osUUFBUSxDQUFFLFFBQVEsQ0FDbEIsR0FBRyxDQUFFLENBQUMsQ0FDTixJQUFJLENBQUUsQ0FBQyxBQUNULENBQUMsQUFDRCxvQkFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxjQUFDLENBQUMsQUFDNUIsT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDLEFBQ0Qsb0JBQU0sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssY0FBQyxDQUFDLEFBQzNCLGdCQUFnQixDQUFFLGdCQUFnQixLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsS0FBSyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixNQUFNLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUM5TixlQUFlLENBQUUsSUFBSSxDQUFDLElBQUksQ0FFMUIsbUJBQW1CLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FFbEQsT0FBTyxDQUFFLENBQUMsQUFDWixDQUFDIn0= */";
	append_dev(document.head, style);
}

function get_each_context$6(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i][0];
	child_ctx[3] = list[i][1];
	return child_ctx;
}

// (76:0) {#if title}
function create_if_block$h(ctx) {
	let h3;
	let t;

	const block = {
		c: function create() {
			h3 = element("h3");
			t = text(/*title*/ ctx[0]);
			attr_dev(h3, "class", "svelte-tbnt6g");
			add_location(h3, file$w, 76, 1, 1869);
		},
		m: function mount(target, anchor) {
			insert_dev(target, h3, anchor);
			append_dev(h3, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(h3);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$h.name,
		type: "if",
		source: "(76:0) {#if title}",
		ctx
	});

	return block;
}

// (80:1) {#each Object.entries(colors) as [name, value]}
function create_each_block$6(ctx) {
	let div2;
	let span2;
	let span0;
	let span0_style_value;
	let span1;
	let t0;
	let span3;
	let div0;
	let t1_value = /*name*/ ctx[2] + "";
	let t1;
	let t2;
	let div1;
	let t3_value = /*value*/ ctx[3] + "";
	let t3;
	let t4;

	const block = {
		c: function create() {
			div2 = element("div");
			span2 = element("span");
			span0 = element("span");
			span1 = element("span");
			t0 = space();
			span3 = element("span");
			div0 = element("div");
			t1 = text(t1_value);
			t2 = space();
			div1 = element("div");
			t3 = text(t3_value);
			t4 = space();
			attr_dev(span0, "class", "color svelte-tbnt6g");
			attr_dev(span0, "style", span0_style_value = `background-color: ${/*value*/ ctx[3]}`);
			add_location(span0, file$w, 81, 23, 2006);
			attr_dev(span1, "class", "grid svelte-tbnt6g");
			add_location(span1, file$w, 81, 87, 2070);
			attr_dev(span2, "class", "swatch svelte-tbnt6g");
			add_location(span2, file$w, 81, 2, 1985);
			attr_dev(div0, "class", "name svelte-tbnt6g");
			add_location(div0, file$w, 83, 3, 2129);
			attr_dev(div1, "class", "value svelte-tbnt6g");
			add_location(div1, file$w, 84, 3, 2163);
			attr_dev(span3, "class", "data svelte-tbnt6g");
			add_location(span3, file$w, 82, 2, 2106);
			attr_dev(div2, "class", "color svelte-tbnt6g");
			add_location(div2, file$w, 80, 2, 1963);
		},
		m: function mount(target, anchor) {
			insert_dev(target, div2, anchor);
			append_dev(div2, span2);
			append_dev(span2, span0);
			append_dev(span2, span1);
			append_dev(div2, t0);
			append_dev(div2, span3);
			append_dev(span3, div0);
			append_dev(div0, t1);
			append_dev(span3, t2);
			append_dev(span3, div1);
			append_dev(div1, t3);
			append_dev(div2, t4);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*colors*/ 2 && span0_style_value !== (span0_style_value = `background-color: ${/*value*/ ctx[3]}`)) {
				attr_dev(span0, "style", span0_style_value);
			}

			if (dirty & /*colors*/ 2 && t1_value !== (t1_value = /*name*/ ctx[2] + "")) set_data_dev(t1, t1_value);
			if (dirty & /*colors*/ 2 && t3_value !== (t3_value = /*value*/ ctx[3] + "")) set_data_dev(t3, t3_value);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div2);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block$6.name,
		type: "each",
		source: "(80:1) {#each Object.entries(colors) as [name, value]}",
		ctx
	});

	return block;
}

function create_fragment$A(ctx) {
	let t;
	let div;
	let if_block = /*title*/ ctx[0] && create_if_block$h(ctx);
	let each_value = Object.entries(/*colors*/ ctx[1]);
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
	}

	const block = {
		c: function create() {
			if (if_block) if_block.c();
			t = space();
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "table svelte-tbnt6g");
			add_location(div, file$w, 78, 0, 1892);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert_dev(target, t, anchor);
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}
		},
		p: function update(ctx, [dirty]) {
			if (/*title*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$h(ctx);
					if_block.c();
					if_block.m(t.parentNode, t);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*Object, colors*/ 2) {
				each_value = Object.entries(/*colors*/ ctx[1]);
				validate_each_argument(each_value);
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$6(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$6(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach_dev(t);
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$A.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$A($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("SwatchTable", slots, []);
	let { title = "" } = $$props;
	let { colors = {} } = $$props;
	const writable_props = ["title", "colors"];

	Object_1$1.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<SwatchTable> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("colors" in $$props) $$invalidate(1, colors = $$props.colors);
	};

	$$self.$capture_state = () => ({ title, colors });

	$$self.$inject_state = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("colors" in $$props) $$invalidate(1, colors = $$props.colors);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [title, colors];
}

class SwatchTable extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-tbnt6g-style")) add_css$v();
		init(this, options, instance$A, create_fragment$A, safe_not_equal, { title: 0, colors: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "SwatchTable",
			options,
			id: create_fragment$A.name
		});
	}

	get title() {
		throw new Error("<SwatchTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<SwatchTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get colors() {
		throw new Error("<SwatchTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set colors(value) {
		throw new Error("<SwatchTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/dev/StateDisplay.svelte generated by Svelte v3.30.1 */
const file$x = "src/js/renderer/component/dev/StateDisplay.svelte";

function add_css$w() {
	var style = element("style");
	style.id = "svelte-1vpl2n-style";
	style.textContent = "#stateDisplay.svelte-1vpl2n.svelte-1vpl2n{padding:0rem 1rem;overflow:scroll}h1.svelte-1vpl2n.svelte-1vpl2n{font-family:\"SF Pro Display\";font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px;color:var(--labelColor)}h2.svelte-1vpl2n.svelte-1vpl2n{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--secondaryLabelColor)}.stateTable.svelte-1vpl2n.svelte-1vpl2n{border:1px solid var(--tertiaryLabelColor);border-radius:4px;padding:0.4em 0.4em;margin-bottom:1em}.stateTable.svelte-1vpl2n h2.svelte-1vpl2n{color:var(--labelColor);display:block;padding:0;font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px;margin:0 0 1em}.property.svelte-1vpl2n.svelte-1vpl2n{display:flex;direction:column;padding:0.2em 0;border-bottom:1px solid rgba(0, 0, 0, 0.1)}.property.svelte-1vpl2n div.svelte-1vpl2n{display:inline-block;white-space:pre-wrap;overflow:scroll}.property.svelte-1vpl2n .key.svelte-1vpl2n{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;text-align:right;color:var(--labelColor);padding-right:1em}.property.svelte-1vpl2n .val.svelte-1vpl2n{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;flex:1 1 auto;color:var(--secondaryLabelColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhdGVEaXNwbGF5LnN2ZWx0ZSIsInNvdXJjZXMiOlsiU3RhdGVEaXNwbGF5LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBzdHJpbmdpZnkgfSBmcm9tICcuLi8uLi8uLi9zaGFyZWQvdXRpbHMnXG4gIGltcG9ydCB7IHN0YXRlLCBmaWxlcyB9IGZyb20gJy4uLy4uL1N0YXRlTWFuYWdlcidcbiAgaW1wb3J0IFN3YXRjaFRhYmxlIGZyb20gJy4vU3dhdGNoVGFibGUuc3ZlbHRlJ1xuXG4gICQ6IGNvbG9ycyA9ICRzdGF0ZS5hcHBlYXJhbmNlLm9zLmNvbG9yc1xuXG4gICQ6IHN5c3RlbUNvbG9ycyA9IHtcbiAgICBzeXN0ZW1CbHVlOiBjb2xvcnMuc3lzdGVtQmx1ZSxcbiAgICBzeXN0ZW1Ccm93bjogY29sb3JzLnN5c3RlbUJyb3duLFxuICAgIHN5c3RlbUdyYXk6IGNvbG9ycy5zeXN0ZW1HcmF5LFxuICAgIHN5c3RlbUdyZWVuOiBjb2xvcnMuc3lzdGVtR3JlZW4sXG4gICAgc3lzdGVtSW5kaWdvOiBjb2xvcnMuc3lzdGVtSW5kaWdvLFxuICAgIHN5c3RlbU9yYW5nZTogY29sb3JzLnN5c3RlbU9yYW5nZSxcbiAgICBzeXN0ZW1QaW5rOiBjb2xvcnMuc3lzdGVtUGluayxcbiAgICBzeXN0ZW1QdXJwbGU6IGNvbG9ycy5zeXN0ZW1QdXJwbGUsXG4gICAgc3lzdGVtUmVkOiBjb2xvcnMuc3lzdGVtUmVkLFxuICAgIHN5c3RlbVRlYWw6IGNvbG9ycy5zeXN0ZW1UZWFsLFxuICAgIHN5c3RlbVllbGxvdzogY29sb3JzLnN5c3RlbVllbGxvdyxcbiAgfVxuICBcbiAgJDogbGFiZWxDb2xvcnMgPSB7XG4gICAgbGFiZWxDb2xvcjogY29sb3JzLmxhYmVsQ29sb3IsXG4gICAgc2Vjb25kYXJ5TGFiZWxDb2xvcjogY29sb3JzLnNlY29uZGFyeUxhYmVsQ29sb3IsXG4gICAgdGVydGlhcnlMYWJlbENvbG9yOiBjb2xvcnMudGVydGlhcnlMYWJlbENvbG9yLFxuICAgIHF1YXRlcm5hcnlMYWJlbENvbG9yOiBjb2xvcnMucXVhdGVybmFyeUxhYmVsQ29sb3IsXG4gIH1cblxuICAkOiB0ZXh0Q29sb3JzID0ge1xuICAgIHRleHRDb2xvcjogY29sb3JzLnRleHRDb2xvcixcbiAgICBwbGFjZWhvbGRlclRleHRDb2xvcjogY29sb3JzLnBsYWNlaG9sZGVyVGV4dENvbG9yLFxuICAgIHNlbGVjdGVkVGV4dENvbG9yOiBjb2xvcnMuc2VsZWN0ZWRUZXh0Q29sb3IsXG4gICAgdGV4dEJhY2tncm91bmRDb2xvcjogY29sb3JzLnRleHRCYWNrZ3JvdW5kQ29sb3IsXG4gICAgc2VsZWN0ZWRUZXh0QmFja2dyb3VuZENvbG9yOiBjb2xvcnMuc2VsZWN0ZWRUZXh0QmFja2dyb3VuZENvbG9yLFxuICAgIGtleWJvYXJkRm9jdXNJbmRpY2F0b3JDb2xvcjogY29sb3JzLmtleWJvYXJkRm9jdXNJbmRpY2F0b3JDb2xvcixcbiAgICB1bmVtcGhhc2l6ZWRTZWxlY3RlZFRleHRDb2xvcjogY29sb3JzLnVuZW1waGFzaXplZFNlbGVjdGVkVGV4dENvbG9yLFxuICAgIHVuZW1waGFzaXplZFNlbGVjdGVkVGV4dEJhY2tncm91bmRDb2xvcjogY29sb3JzLnVuZW1waGFzaXplZFNlbGVjdGVkVGV4dEJhY2tncm91bmRDb2xvcixcbiAgfVxuXG4gICQ6IGNvbnRlbnRDb2xvcnMgPSB7XG4gICAgbGlua0NvbG9yOiBjb2xvcnMubGlua0NvbG9yLFxuICAgIHNlcGFyYXRvckNvbG9yOiBjb2xvcnMuc2VwYXJhdG9yQ29sb3IsXG4gICAgc2VsZWN0ZWRDb250ZW50QmFja2dyb3VuZENvbG9yOiBjb2xvcnMuc2VsZWN0ZWRDb250ZW50QmFja2dyb3VuZENvbG9yLFxuICAgIHVuZW1waGFzaXplZFNlbGVjdGVkQ29udGVudEJhY2tncm91bmRDb2xvcjogY29sb3JzLnVuZW1waGFzaXplZFNlbGVjdGVkQ29udGVudEJhY2tncm91bmRDb2xvcixcbiAgfVxuXG4gICQ6IG1lbnVDb2xvcnMgPSB7XG4gICAgc2VsZWN0ZWRNZW51SXRlbVRleHRDb2xvcjogY29sb3JzLnNlbGVjdGVkTWVudUl0ZW1UZXh0Q29sb3IsXG4gIH1cblxuICAkOiB0YWJsZUNvbG9ycyA9IHtcbiAgICBncmlkQ29sb3I6IGNvbG9ycy5ncmlkQ29sb3IsXG4gICAgaGVhZGVyVGV4dENvbG9yOiBjb2xvcnMuaGVhZGVyVGV4dENvbG9yXG4gIH1cblxuICAkOiBjb250cm9sQ29sb3JzID0ge1xuICAgIGNvbnRyb2xBY2NlbnRDb2xvcjogY29sb3JzLmNvbnRyb2xBY2NlbnRDb2xvcixcbiAgICBjb250cm9sQ29sb3I6IGNvbG9ycy5jb250cm9sQ29sb3IsXG4gICAgY29udHJvbEJhY2tncm91bmRDb2xvcjogY29sb3JzLmNvbnRyb2xCYWNrZ3JvdW5kQ29sb3IsXG4gICAgY29udHJvbFRleHRDb2xvcjogY29sb3JzLmNvbnRyb2xUZXh0Q29sb3IsXG4gICAgZGlzYWJsZWRDb250cm9sVGV4dENvbG9yOiBjb2xvcnMuZGlzYWJsZWRDb250cm9sVGV4dENvbG9yLFxuICAgIHNlbGVjdGVkQ29udHJvbENvbG9yOiBjb2xvcnMuc2VsZWN0ZWRDb250cm9sQ29sb3IsXG4gICAgc2VsZWN0ZWRDb250cm9sVGV4dENvbG9yOiBjb2xvcnMuc2VsZWN0ZWRDb250cm9sVGV4dENvbG9yLFxuICAgIGFsdGVybmF0ZVNlbGVjdGVkQ29udHJvbFRleHRDb2xvcjogY29sb3JzLmFsdGVybmF0ZVNlbGVjdGVkQ29udHJvbFRleHRDb2xvcixcbiAgfVxuXG4gICQ6IHdpbmRvd0NvbG9ycyA9IHtcbiAgICB3aW5kb3dCYWNrZ3JvdW5kQ29sb3I6IGNvbG9ycy53aW5kb3dCYWNrZ3JvdW5kQ29sb3IsXG4gICAgd2luZG93RnJhbWVUZXh0Q29sb3I6IGNvbG9ycy53aW5kb3dGcmFtZVRleHRDb2xvcixcbiAgfVxuXG4gICQ6IGhpZ2hsaWdodENvbG9ycyA9IHtcbiAgICBmaW5kSGlnaGxpZ2h0Q29sb3I6IGNvbG9ycy5maW5kSGlnaGxpZ2h0Q29sb3IsXG4gICAgaGlnaGxpZ2h0Q29sb3I6IGNvbG9ycy5oaWdobGlnaHRDb2xvcixcbiAgICBzaGFkb3dDb2xvcjogY29sb3JzLnNoYWRvd0NvbG9yLFxuICB9XG5cblxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBNaXNjIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4jc3RhdGVEaXNwbGF5IHtcbiAgcGFkZGluZzogMHJlbSAxcmVtO1xuICBvdmVyZmxvdzogc2Nyb2xsO1xufVxuXG5oMSB7XG4gIGZvbnQtZmFtaWx5OiBcIlNGIFBybyBEaXNwbGF5XCI7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IDIwcHg7XG4gIGxpbmUtaGVpZ2h0OiAyNHB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMTJweDtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xufVxuXG5oMiB7XG4gIGZvbnQ6IGNhcHRpb247XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG59XG5cbi5zdGF0ZVRhYmxlIHtcbiAgYm9yZGVyOiAxcHggc29saWQgdmFyKC0tdGVydGlhcnlMYWJlbENvbG9yKTtcbiAgYm9yZGVyLXJhZGl1czogNHB4O1xuICBwYWRkaW5nOiAwLjRlbSAwLjRlbTtcbiAgbWFyZ2luLWJvdHRvbTogMWVtO1xufVxuLnN0YXRlVGFibGUgaDIge1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICBwYWRkaW5nOiAwO1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogYm9sZDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBsaW5lLWhlaWdodDogMTNweDtcbiAgbGV0dGVyLXNwYWNpbmc6IDAuMDdweDtcbiAgbWFyZ2luOiAwIDAgMWVtO1xufVxuXG4ucHJvcGVydHkge1xuICBkaXNwbGF5OiBmbGV4O1xuICBkaXJlY3Rpb246IGNvbHVtbjtcbiAgcGFkZGluZzogMC4yZW0gMDtcbiAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkIHJnYmEoMCwgMCwgMCwgMC4xKTtcbn1cbi5wcm9wZXJ0eSBkaXYge1xuICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7XG4gIHdoaXRlLXNwYWNlOiBwcmUtd3JhcDtcbiAgb3ZlcmZsb3c6IHNjcm9sbDtcbn1cbi5wcm9wZXJ0eSAua2V5IHtcbiAgZm9udDogY2FwdGlvbjtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxMXB4O1xuICBsaW5lLWhlaWdodDogMTNweDtcbiAgbGV0dGVyLXNwYWNpbmc6IDAuMDdweDtcbiAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gIGNvbG9yOiB2YXIoLS1sYWJlbENvbG9yKTtcbiAgcGFkZGluZy1yaWdodDogMWVtO1xufVxuLnByb3BlcnR5IC52YWwge1xuICBmb250OiBjYXB0aW9uO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMC4wN3B4O1xuICBmbGV4OiAxIDEgYXV0bztcbiAgY29sb3I6IHZhcigtLXNlY29uZGFyeUxhYmVsQ29sb3IpO1xufTwvc3R5bGU+XG5cbjxkaXYgaWQ9XCJzdGF0ZURpc3BsYXlcIj5cbiAgPGgxPlN0YXRlPC9oMT5cblxuICA8ZGl2IGNsYXNzPVwic3RhdGVUYWJsZSBjb2xvcnNcIj5cbiAgICA8aDI+U3lzdGVtIENvbG9yczwvaDI+XG4gICAgPFN3YXRjaFRhYmxlIGNvbG9ycz17c3lzdGVtQ29sb3JzfSAvPiAgICBcbiAgPC9kaXY+XG4gIFxuICA8ZGl2IGNsYXNzPVwic3RhdGVUYWJsZSBjb2xvcnNcIj5cbiAgICA8aDI+RHluYW1pYyBTeXN0ZW0gQ29sb3JzPC9oMj5cbiAgICA8U3dhdGNoVGFibGUgdGl0bGU9eydMYWJlbHMnfSBjb2xvcnM9e2xhYmVsQ29sb3JzfSAvPiAgICBcbiAgICA8U3dhdGNoVGFibGUgdGl0bGU9eydUZXh0J30gY29sb3JzPXt0ZXh0Q29sb3JzfSAvPiAgICBcbiAgICA8U3dhdGNoVGFibGUgdGl0bGU9eydDb250ZW50J30gY29sb3JzPXtjb250ZW50Q29sb3JzfSAvPlxuICAgIDxTd2F0Y2hUYWJsZSB0aXRsZT17J01lbnVzJ30gY29sb3JzPXttZW51Q29sb3JzfSAvPlxuICAgIDxTd2F0Y2hUYWJsZSB0aXRsZT17J1RhYmxlcyd9IGNvbG9ycz17dGFibGVDb2xvcnN9IC8+XG4gICAgPFN3YXRjaFRhYmxlIHRpdGxlPXsnQ29udHJvbHMnfSBjb2xvcnM9e2NvbnRyb2xDb2xvcnN9IC8+XG4gICAgPFN3YXRjaFRhYmxlIHRpdGxlPXsnV2luZG93cyd9IGNvbG9ycz17d2luZG93Q29sb3JzfSAvPlxuICAgIDxTd2F0Y2hUYWJsZSB0aXRsZT17J0hpZ2hsaWdodHMgJiBTaGFkb3dzJ30gY29sb3JzPXtoaWdobGlnaHRDb2xvcnN9IC8+XG4gIDwvZGl2PlxuXG4gIDxkaXYgY2xhc3M9XCJzdGF0ZVRhYmxlXCI+XG4gICAgPCEtLSA8aGVhZGVyPlN0b3JlczwvaGVhZGVyPiAtLT5cbiAgICA8ZGl2IGNsYXNzPVwicHJvcGVydHlcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJrZXlcIj5zdGF0ZTwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZhbFwiPntzdHJpbmdpZnkoJHN0YXRlKX08L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG5cbiAgPGRpdiBjbGFzcz1cInN0YXRlVGFibGVcIj5cbiAgICA8ZGl2IGNsYXNzPVwicHJvcGVydHlcIj5cbiAgICAgIDxkaXYgY2xhc3M9XCJrZXlcIj5maWxlczwvZGl2PlxuICAgICAgPGRpdiBjbGFzcz1cInZhbFwiPntzdHJpbmdpZnkoJGZpbGVzKX08L2Rpdj5cbiAgICA8L2Rpdj5cbiAgPC9kaXY+XG4gIFxuPC9kaXY+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBcUZBLGFBQWEsNEJBQUMsQ0FBQyxBQUNiLE9BQU8sQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUNsQixRQUFRLENBQUUsTUFBTSxBQUNsQixDQUFDLEFBRUQsRUFBRSw0QkFBQyxDQUFDLEFBQ0YsV0FBVyxDQUFFLGdCQUFnQixDQUM3QixXQUFXLENBQUUsSUFBSSxDQUNqQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLEtBQUssQ0FBRSxJQUFJLFlBQVksQ0FBQyxBQUMxQixDQUFDLEFBRUQsRUFBRSw0QkFBQyxDQUFDLEFBQ0YsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLEtBQUssQ0FBRSxJQUFJLHFCQUFxQixDQUFDLEFBQ25DLENBQUMsQUFFRCxXQUFXLDRCQUFDLENBQUMsQUFDWCxNQUFNLENBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFvQixDQUFDLENBQzNDLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLE9BQU8sQ0FBRSxLQUFLLENBQUMsS0FBSyxDQUNwQixhQUFhLENBQUUsR0FBRyxBQUNwQixDQUFDLEFBQ0QseUJBQVcsQ0FBQyxFQUFFLGNBQUMsQ0FBQyxBQUNkLEtBQUssQ0FBRSxJQUFJLFlBQVksQ0FBQyxDQUN4QixPQUFPLENBQUUsS0FBSyxDQUNkLE9BQU8sQ0FBRSxDQUFDLENBQ1YsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsSUFBSSxDQUNqQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxNQUFNLENBQ3RCLE1BQU0sQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQUFDakIsQ0FBQyxBQUVELFNBQVMsNEJBQUMsQ0FBQyxBQUNULE9BQU8sQ0FBRSxJQUFJLENBQ2IsU0FBUyxDQUFFLE1BQU0sQ0FDakIsT0FBTyxDQUFFLEtBQUssQ0FBQyxDQUFDLENBQ2hCLGFBQWEsQ0FBRSxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEFBQzdDLENBQUMsQUFDRCx1QkFBUyxDQUFDLEdBQUcsY0FBQyxDQUFDLEFBQ2IsT0FBTyxDQUFFLFlBQVksQ0FDckIsV0FBVyxDQUFFLFFBQVEsQ0FDckIsUUFBUSxDQUFFLE1BQU0sQUFDbEIsQ0FBQyxBQUNELHVCQUFTLENBQUMsSUFBSSxjQUFDLENBQUMsQUFDZCxJQUFJLENBQUUsT0FBTyxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsVUFBVSxDQUFFLEtBQUssQ0FDakIsS0FBSyxDQUFFLElBQUksWUFBWSxDQUFDLENBQ3hCLGFBQWEsQ0FBRSxHQUFHLEFBQ3BCLENBQUMsQUFDRCx1QkFBUyxDQUFDLElBQUksY0FBQyxDQUFDLEFBQ2QsSUFBSSxDQUFFLE9BQU8sQ0FDYixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxNQUFNLENBQ3RCLElBQUksQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FDZCxLQUFLLENBQUUsSUFBSSxxQkFBcUIsQ0FBQyxBQUNuQyxDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$B(ctx) {
	let div10;
	let h1;
	let t1;
	let div0;
	let h20;
	let t3;
	let swatchtable0;
	let t4;
	let div1;
	let h21;
	let t6;
	let swatchtable1;
	let t7;
	let swatchtable2;
	let t8;
	let swatchtable3;
	let t9;
	let swatchtable4;
	let t10;
	let swatchtable5;
	let t11;
	let swatchtable6;
	let t12;
	let swatchtable7;
	let t13;
	let swatchtable8;
	let t14;
	let div5;
	let div4;
	let div2;
	let t16;
	let div3;
	let t17_value = stringify(/*$state*/ ctx[0]) + "";
	let t17;
	let t18;
	let div9;
	let div8;
	let div6;
	let t20;
	let div7;
	let t21_value = stringify(/*$files*/ ctx[10]) + "";
	let t21;
	let current;

	swatchtable0 = new SwatchTable({
			props: { colors: /*systemColors*/ ctx[1] },
			$$inline: true
		});

	swatchtable1 = new SwatchTable({
			props: {
				title: "Labels",
				colors: /*labelColors*/ ctx[2]
			},
			$$inline: true
		});

	swatchtable2 = new SwatchTable({
			props: {
				title: "Text",
				colors: /*textColors*/ ctx[3]
			},
			$$inline: true
		});

	swatchtable3 = new SwatchTable({
			props: {
				title: "Content",
				colors: /*contentColors*/ ctx[4]
			},
			$$inline: true
		});

	swatchtable4 = new SwatchTable({
			props: {
				title: "Menus",
				colors: /*menuColors*/ ctx[5]
			},
			$$inline: true
		});

	swatchtable5 = new SwatchTable({
			props: {
				title: "Tables",
				colors: /*tableColors*/ ctx[6]
			},
			$$inline: true
		});

	swatchtable6 = new SwatchTable({
			props: {
				title: "Controls",
				colors: /*controlColors*/ ctx[7]
			},
			$$inline: true
		});

	swatchtable7 = new SwatchTable({
			props: {
				title: "Windows",
				colors: /*windowColors*/ ctx[8]
			},
			$$inline: true
		});

	swatchtable8 = new SwatchTable({
			props: {
				title: "Highlights & Shadows",
				colors: /*highlightColors*/ ctx[9]
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div10 = element("div");
			h1 = element("h1");
			h1.textContent = "State";
			t1 = space();
			div0 = element("div");
			h20 = element("h2");
			h20.textContent = "System Colors";
			t3 = space();
			create_component(swatchtable0.$$.fragment);
			t4 = space();
			div1 = element("div");
			h21 = element("h2");
			h21.textContent = "Dynamic System Colors";
			t6 = space();
			create_component(swatchtable1.$$.fragment);
			t7 = space();
			create_component(swatchtable2.$$.fragment);
			t8 = space();
			create_component(swatchtable3.$$.fragment);
			t9 = space();
			create_component(swatchtable4.$$.fragment);
			t10 = space();
			create_component(swatchtable5.$$.fragment);
			t11 = space();
			create_component(swatchtable6.$$.fragment);
			t12 = space();
			create_component(swatchtable7.$$.fragment);
			t13 = space();
			create_component(swatchtable8.$$.fragment);
			t14 = space();
			div5 = element("div");
			div4 = element("div");
			div2 = element("div");
			div2.textContent = "state";
			t16 = space();
			div3 = element("div");
			t17 = text(t17_value);
			t18 = space();
			div9 = element("div");
			div8 = element("div");
			div6 = element("div");
			div6.textContent = "files";
			t20 = space();
			div7 = element("div");
			t21 = text(t21_value);
			attr_dev(h1, "class", "svelte-1vpl2n");
			add_location(h1, file$x, 158, 2, 4172);
			attr_dev(h20, "class", "svelte-1vpl2n");
			add_location(h20, file$x, 161, 4, 4226);
			attr_dev(div0, "class", "stateTable colors svelte-1vpl2n");
			add_location(div0, file$x, 160, 2, 4190);
			attr_dev(h21, "class", "svelte-1vpl2n");
			add_location(h21, file$x, 166, 4, 4345);
			attr_dev(div1, "class", "stateTable colors svelte-1vpl2n");
			add_location(div1, file$x, 165, 2, 4309);
			attr_dev(div2, "class", "key svelte-1vpl2n");
			add_location(div2, file$x, 180, 6, 4977);
			attr_dev(div3, "class", "val svelte-1vpl2n");
			add_location(div3, file$x, 181, 6, 5012);
			attr_dev(div4, "class", "property svelte-1vpl2n");
			add_location(div4, file$x, 179, 4, 4948);
			attr_dev(div5, "class", "stateTable svelte-1vpl2n");
			add_location(div5, file$x, 177, 2, 4882);
			attr_dev(div6, "class", "key svelte-1vpl2n");
			add_location(div6, file$x, 187, 6, 5136);
			attr_dev(div7, "class", "val svelte-1vpl2n");
			add_location(div7, file$x, 188, 6, 5171);
			attr_dev(div8, "class", "property svelte-1vpl2n");
			add_location(div8, file$x, 186, 4, 5107);
			attr_dev(div9, "class", "stateTable svelte-1vpl2n");
			add_location(div9, file$x, 185, 2, 5078);
			attr_dev(div10, "id", "stateDisplay");
			attr_dev(div10, "class", "svelte-1vpl2n");
			add_location(div10, file$x, 157, 0, 4146);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div10, anchor);
			append_dev(div10, h1);
			append_dev(div10, t1);
			append_dev(div10, div0);
			append_dev(div0, h20);
			append_dev(div0, t3);
			mount_component(swatchtable0, div0, null);
			append_dev(div10, t4);
			append_dev(div10, div1);
			append_dev(div1, h21);
			append_dev(div1, t6);
			mount_component(swatchtable1, div1, null);
			append_dev(div1, t7);
			mount_component(swatchtable2, div1, null);
			append_dev(div1, t8);
			mount_component(swatchtable3, div1, null);
			append_dev(div1, t9);
			mount_component(swatchtable4, div1, null);
			append_dev(div1, t10);
			mount_component(swatchtable5, div1, null);
			append_dev(div1, t11);
			mount_component(swatchtable6, div1, null);
			append_dev(div1, t12);
			mount_component(swatchtable7, div1, null);
			append_dev(div1, t13);
			mount_component(swatchtable8, div1, null);
			append_dev(div10, t14);
			append_dev(div10, div5);
			append_dev(div5, div4);
			append_dev(div4, div2);
			append_dev(div4, t16);
			append_dev(div4, div3);
			append_dev(div3, t17);
			append_dev(div10, t18);
			append_dev(div10, div9);
			append_dev(div9, div8);
			append_dev(div8, div6);
			append_dev(div8, t20);
			append_dev(div8, div7);
			append_dev(div7, t21);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const swatchtable0_changes = {};
			if (dirty & /*systemColors*/ 2) swatchtable0_changes.colors = /*systemColors*/ ctx[1];
			swatchtable0.$set(swatchtable0_changes);
			const swatchtable1_changes = {};
			if (dirty & /*labelColors*/ 4) swatchtable1_changes.colors = /*labelColors*/ ctx[2];
			swatchtable1.$set(swatchtable1_changes);
			const swatchtable2_changes = {};
			if (dirty & /*textColors*/ 8) swatchtable2_changes.colors = /*textColors*/ ctx[3];
			swatchtable2.$set(swatchtable2_changes);
			const swatchtable3_changes = {};
			if (dirty & /*contentColors*/ 16) swatchtable3_changes.colors = /*contentColors*/ ctx[4];
			swatchtable3.$set(swatchtable3_changes);
			const swatchtable4_changes = {};
			if (dirty & /*menuColors*/ 32) swatchtable4_changes.colors = /*menuColors*/ ctx[5];
			swatchtable4.$set(swatchtable4_changes);
			const swatchtable5_changes = {};
			if (dirty & /*tableColors*/ 64) swatchtable5_changes.colors = /*tableColors*/ ctx[6];
			swatchtable5.$set(swatchtable5_changes);
			const swatchtable6_changes = {};
			if (dirty & /*controlColors*/ 128) swatchtable6_changes.colors = /*controlColors*/ ctx[7];
			swatchtable6.$set(swatchtable6_changes);
			const swatchtable7_changes = {};
			if (dirty & /*windowColors*/ 256) swatchtable7_changes.colors = /*windowColors*/ ctx[8];
			swatchtable7.$set(swatchtable7_changes);
			const swatchtable8_changes = {};
			if (dirty & /*highlightColors*/ 512) swatchtable8_changes.colors = /*highlightColors*/ ctx[9];
			swatchtable8.$set(swatchtable8_changes);
			if ((!current || dirty & /*$state*/ 1) && t17_value !== (t17_value = stringify(/*$state*/ ctx[0]) + "")) set_data_dev(t17, t17_value);
			if ((!current || dirty & /*$files*/ 1024) && t21_value !== (t21_value = stringify(/*$files*/ ctx[10]) + "")) set_data_dev(t21, t21_value);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(swatchtable0.$$.fragment, local);
			transition_in(swatchtable1.$$.fragment, local);
			transition_in(swatchtable2.$$.fragment, local);
			transition_in(swatchtable3.$$.fragment, local);
			transition_in(swatchtable4.$$.fragment, local);
			transition_in(swatchtable5.$$.fragment, local);
			transition_in(swatchtable6.$$.fragment, local);
			transition_in(swatchtable7.$$.fragment, local);
			transition_in(swatchtable8.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(swatchtable0.$$.fragment, local);
			transition_out(swatchtable1.$$.fragment, local);
			transition_out(swatchtable2.$$.fragment, local);
			transition_out(swatchtable3.$$.fragment, local);
			transition_out(swatchtable4.$$.fragment, local);
			transition_out(swatchtable5.$$.fragment, local);
			transition_out(swatchtable6.$$.fragment, local);
			transition_out(swatchtable7.$$.fragment, local);
			transition_out(swatchtable8.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div10);
			destroy_component(swatchtable0);
			destroy_component(swatchtable1);
			destroy_component(swatchtable2);
			destroy_component(swatchtable3);
			destroy_component(swatchtable4);
			destroy_component(swatchtable5);
			destroy_component(swatchtable6);
			destroy_component(swatchtable7);
			destroy_component(swatchtable8);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$B.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$B($$self, $$props, $$invalidate) {
	let $state;
	let $files;
	validate_store(state, "state");
	component_subscribe($$self, state, $$value => $$invalidate(0, $state = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(10, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("StateDisplay", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<StateDisplay> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		stringify,
		state,
		files,
		SwatchTable,
		colors,
		$state,
		systemColors,
		labelColors,
		textColors,
		contentColors,
		menuColors,
		tableColors,
		controlColors,
		windowColors,
		highlightColors,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("colors" in $$props) $$invalidate(11, colors = $$props.colors);
		if ("systemColors" in $$props) $$invalidate(1, systemColors = $$props.systemColors);
		if ("labelColors" in $$props) $$invalidate(2, labelColors = $$props.labelColors);
		if ("textColors" in $$props) $$invalidate(3, textColors = $$props.textColors);
		if ("contentColors" in $$props) $$invalidate(4, contentColors = $$props.contentColors);
		if ("menuColors" in $$props) $$invalidate(5, menuColors = $$props.menuColors);
		if ("tableColors" in $$props) $$invalidate(6, tableColors = $$props.tableColors);
		if ("controlColors" in $$props) $$invalidate(7, controlColors = $$props.controlColors);
		if ("windowColors" in $$props) $$invalidate(8, windowColors = $$props.windowColors);
		if ("highlightColors" in $$props) $$invalidate(9, highlightColors = $$props.highlightColors);
	};

	let colors;
	let systemColors;
	let labelColors;
	let textColors;
	let contentColors;
	let menuColors;
	let tableColors;
	let controlColors;
	let windowColors;
	let highlightColors;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$state*/ 1) {
			 $$invalidate(11, colors = $state.appearance.os.colors);
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(1, systemColors = {
				systemBlue: colors.systemBlue,
				systemBrown: colors.systemBrown,
				systemGray: colors.systemGray,
				systemGreen: colors.systemGreen,
				systemIndigo: colors.systemIndigo,
				systemOrange: colors.systemOrange,
				systemPink: colors.systemPink,
				systemPurple: colors.systemPurple,
				systemRed: colors.systemRed,
				systemTeal: colors.systemTeal,
				systemYellow: colors.systemYellow
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(2, labelColors = {
				labelColor: colors.labelColor,
				secondaryLabelColor: colors.secondaryLabelColor,
				tertiaryLabelColor: colors.tertiaryLabelColor,
				quaternaryLabelColor: colors.quaternaryLabelColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(3, textColors = {
				textColor: colors.textColor,
				placeholderTextColor: colors.placeholderTextColor,
				selectedTextColor: colors.selectedTextColor,
				textBackgroundColor: colors.textBackgroundColor,
				selectedTextBackgroundColor: colors.selectedTextBackgroundColor,
				keyboardFocusIndicatorColor: colors.keyboardFocusIndicatorColor,
				unemphasizedSelectedTextColor: colors.unemphasizedSelectedTextColor,
				unemphasizedSelectedTextBackgroundColor: colors.unemphasizedSelectedTextBackgroundColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(4, contentColors = {
				linkColor: colors.linkColor,
				separatorColor: colors.separatorColor,
				selectedContentBackgroundColor: colors.selectedContentBackgroundColor,
				unemphasizedSelectedContentBackgroundColor: colors.unemphasizedSelectedContentBackgroundColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(5, menuColors = {
				selectedMenuItemTextColor: colors.selectedMenuItemTextColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(6, tableColors = {
				gridColor: colors.gridColor,
				headerTextColor: colors.headerTextColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(7, controlColors = {
				controlAccentColor: colors.controlAccentColor,
				controlColor: colors.controlColor,
				controlBackgroundColor: colors.controlBackgroundColor,
				controlTextColor: colors.controlTextColor,
				disabledControlTextColor: colors.disabledControlTextColor,
				selectedControlColor: colors.selectedControlColor,
				selectedControlTextColor: colors.selectedControlTextColor,
				alternateSelectedControlTextColor: colors.alternateSelectedControlTextColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(8, windowColors = {
				windowBackgroundColor: colors.windowBackgroundColor,
				windowFrameTextColor: colors.windowFrameTextColor
			});
		}

		if ($$self.$$.dirty & /*colors*/ 2048) {
			 $$invalidate(9, highlightColors = {
				findHighlightColor: colors.findHighlightColor,
				highlightColor: colors.highlightColor,
				shadowColor: colors.shadowColor
			});
		}
	};

	return [
		$state,
		systemColors,
		labelColors,
		textColors,
		contentColors,
		menuColors,
		tableColors,
		controlColors,
		windowColors,
		highlightColors,
		$files,
		colors
	];
}

class StateDisplay extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1vpl2n-style")) add_css$w();
		init(this, options, instance$B, create_fragment$B, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "StateDisplay",
			options,
			id: create_fragment$B.name
		});
	}
}

/* src/js/renderer/component/Layout.svelte generated by Svelte v3.30.1 */
const file$y = "src/js/renderer/component/Layout.svelte";

function add_css$x() {
	var style = element("style");
	style.id = "svelte-1akla7e-style";
	style.textContent = "#main.svelte-1akla7e{background-color:var(--windowBackgroundColor);transform:translate(250px, 0);overflow:scroll;position:absolute;display:flex;flex-direction:column;width:100%;height:100%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGF5b3V0LnN2ZWx0ZSIsInNvdXJjZXMiOlsiTGF5b3V0LnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBwcm9qZWN0LCBmaWxlcyB9IGZyb20gJy4uL1N0YXRlTWFuYWdlcidcbiAgaW1wb3J0IEZpcnN0UnVuIGZyb20gJy4vZmlyc3RydW4vRmlyc3RSdW4uc3ZlbHRlJ1xuICBpbXBvcnQgU2lkZUJhciBmcm9tICcuL3NpZGViYXIvU2lkZUJhci5zdmVsdGUnXG4gIGltcG9ydCBUb29sYmFyIGZyb20gJy4vbWFpbi9Ub29sYmFyLnN2ZWx0ZSdcbiAgaW1wb3J0IFNlcGFyYXRvciBmcm9tICcuL3VpL1NlcGFyYXRvci5zdmVsdGUnXG4gIGltcG9ydCBNZW51IGZyb20gJy4vdWkvTWVudS5zdmVsdGUnXG4gIGltcG9ydCBUb29sdGlwIGZyb20gJy4vdWkvVG9vbHRpcC5zdmVsdGUnXG4gIGltcG9ydCBTdGF0ZURpc3BsYXkgZnJvbSAnLi9kZXYvU3RhdGVEaXNwbGF5LnN2ZWx0ZSdcbiAgLy8gaW1wb3J0IEVkaXRvciBmcm9tICcuL21haW4vRWRpdG9yLnN2ZWx0ZSdcblxuICAkOiBkaXJlY3RvcnlJc1NldCA9ICRwcm9qZWN0LmRpcmVjdG9yeVxuICAkOiBmaWxlc1BvcHVsYXRlZCA9ICRmaWxlcy50cmVlXG5cbjwvc2NyaXB0PlxuXG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTWlzYyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuI21haW4ge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS13aW5kb3dCYWNrZ3JvdW5kQ29sb3IpO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgyNTBweCwgMCk7XG4gIG92ZXJmbG93OiBzY3JvbGw7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbn08L3N0eWxlPlxuXG5cbjxNZW51IC8+XG48VG9vbHRpcCAvPlxuXG57I2lmICFkaXJlY3RvcnlJc1NldCB8fCAhZmlsZXNQb3B1bGF0ZWR9XG4gIDxGaXJzdFJ1biAvPlxuezplbHNlfVxuICA8U2lkZUJhciAvPlxuICA8ZGl2IGlkPVwibWFpblwiPlxuICAgIDxUb29sYmFyIC8+XG4gICAgPFNlcGFyYXRvciAvPlxuICAgIDxTdGF0ZURpc3BsYXkgLz5cbiAgICA8IS0tIDxFZGl0b3IgLz4gLS0+XG4gIDwvZGl2Plxuey9pZn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFxQkEsS0FBSyxlQUFDLENBQUMsQUFDTCxnQkFBZ0IsQ0FBRSxJQUFJLHVCQUF1QixDQUFDLENBQzlDLFNBQVMsQ0FBRSxVQUFVLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUM5QixRQUFRLENBQUUsTUFBTSxDQUNoQixRQUFRLENBQUUsUUFBUSxDQUNsQixPQUFPLENBQUUsSUFBSSxDQUNiLGNBQWMsQ0FBRSxNQUFNLENBQ3RCLEtBQUssQ0FBRSxJQUFJLENBQ1gsTUFBTSxDQUFFLElBQUksQUFDZCxDQUFDIn0= */";
	append_dev(document.head, style);
}

// (39:0) {:else}
function create_else_block$4(ctx) {
	let sidebar;
	let t0;
	let div;
	let toolbar;
	let t1;
	let separator;
	let t2;
	let statedisplay;
	let current;
	sidebar = new SideBar({ $$inline: true });
	toolbar = new Toolbar({ $$inline: true });
	separator = new Separator({ $$inline: true });
	statedisplay = new StateDisplay({ $$inline: true });

	const block = {
		c: function create() {
			create_component(sidebar.$$.fragment);
			t0 = space();
			div = element("div");
			create_component(toolbar.$$.fragment);
			t1 = space();
			create_component(separator.$$.fragment);
			t2 = space();
			create_component(statedisplay.$$.fragment);
			attr_dev(div, "id", "main");
			attr_dev(div, "class", "svelte-1akla7e");
			add_location(div, file$y, 40, 2, 1053);
		},
		m: function mount(target, anchor) {
			mount_component(sidebar, target, anchor);
			insert_dev(target, t0, anchor);
			insert_dev(target, div, anchor);
			mount_component(toolbar, div, null);
			append_dev(div, t1);
			mount_component(separator, div, null);
			append_dev(div, t2);
			mount_component(statedisplay, div, null);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			transition_in(toolbar.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(statedisplay.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(sidebar.$$.fragment, local);
			transition_out(toolbar.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			transition_out(statedisplay.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(sidebar, detaching);
			if (detaching) detach_dev(t0);
			if (detaching) detach_dev(div);
			destroy_component(toolbar);
			destroy_component(separator);
			destroy_component(statedisplay);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_else_block$4.name,
		type: "else",
		source: "(39:0) {:else}",
		ctx
	});

	return block;
}

// (37:0) {#if !directoryIsSet || !filesPopulated}
function create_if_block$i(ctx) {
	let firstrun;
	let current;
	firstrun = new FirstRun({ $$inline: true });

	const block = {
		c: function create() {
			create_component(firstrun.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(firstrun, target, anchor);
			current = true;
		},
		i: function intro(local) {
			if (current) return;
			transition_in(firstrun.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(firstrun.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(firstrun, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$i.name,
		type: "if",
		source: "(37:0) {#if !directoryIsSet || !filesPopulated}",
		ctx
	});

	return block;
}

function create_fragment$C(ctx) {
	let menu;
	let t0;
	let tooltip;
	let t1;
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	menu = new Menu({ $$inline: true });
	tooltip = new Tooltip({ $$inline: true });
	const if_block_creators = [create_if_block$i, create_else_block$4];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (!/*directoryIsSet*/ ctx[0] || !/*filesPopulated*/ ctx[1]) return 0;
		return 1;
	}

	current_block_type_index = select_block_type(ctx);
	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

	const block = {
		c: function create() {
			create_component(menu.$$.fragment);
			t0 = space();
			create_component(tooltip.$$.fragment);
			t1 = space();
			if_block.c();
			if_block_anchor = empty();
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			mount_component(menu, target, anchor);
			insert_dev(target, t0, anchor);
			mount_component(tooltip, target, anchor);
			insert_dev(target, t1, anchor);
			if_blocks[current_block_type_index].m(target, anchor);
			insert_dev(target, if_block_anchor, anchor);
			current = true;
		},
		p: function update(ctx, [dirty]) {
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
		i: function intro(local) {
			if (current) return;
			transition_in(menu.$$.fragment, local);
			transition_in(tooltip.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(menu.$$.fragment, local);
			transition_out(tooltip.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(menu, detaching);
			if (detaching) detach_dev(t0);
			destroy_component(tooltip, detaching);
			if (detaching) detach_dev(t1);
			if_blocks[current_block_type_index].d(detaching);
			if (detaching) detach_dev(if_block_anchor);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_fragment$C.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$C($$self, $$props, $$invalidate) {
	let $project;
	let $files;
	validate_store(project, "project");
	component_subscribe($$self, project, $$value => $$invalidate(2, $project = $$value));
	validate_store(files, "files");
	component_subscribe($$self, files, $$value => $$invalidate(3, $files = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Layout", slots, []);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Layout> was created with unknown prop '${key}'`);
	});

	$$self.$capture_state = () => ({
		project,
		files,
		FirstRun,
		SideBar,
		Toolbar,
		Separator,
		Menu,
		Tooltip,
		StateDisplay,
		directoryIsSet,
		$project,
		filesPopulated,
		$files
	});

	$$self.$inject_state = $$props => {
		if ("directoryIsSet" in $$props) $$invalidate(0, directoryIsSet = $$props.directoryIsSet);
		if ("filesPopulated" in $$props) $$invalidate(1, filesPopulated = $$props.filesPopulated);
	};

	let directoryIsSet;
	let filesPopulated;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$project*/ 4) {
			// import Editor from './main/Editor.svelte'
			 $$invalidate(0, directoryIsSet = $project.directory);
		}

		if ($$self.$$.dirty & /*$files*/ 8) {
			 $$invalidate(1, filesPopulated = $files.tree);
		}
	};

	return [directoryIsSet, filesPopulated, $project, $files];
}

class Layout extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1akla7e-style")) add_css$x();
		init(this, options, instance$C, create_fragment$C, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Layout",
			options,
			id: create_fragment$C.name
		});
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


// Setup renderer
async function setup() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState');
  const initialFiles = await window.api.invoke('getFiles');

  // Create managers
  const stateManager = new StateManager(initialState, initialFiles);

  // Create layout
  const layout = new Layout({
    target: document.querySelector('#layout')
  });
  
  // Finish setup by showing window
  window.api.send('showWindow');
}


window.addEventListener('DOMContentLoaded', setup);
//# sourceMappingURL=renderer.js.map
