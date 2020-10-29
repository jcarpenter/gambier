function noop() { }
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
function null_to_empty(value) {
    return value == null ? '' : value;
}
function action_destroyer(action_result) {
    return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    if (text.data !== data)
        text.data = data;
}
function set_input_value(input, value) {
    if (value != null || input.value) {
        input.value = value;
    }
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

let current_component;
function set_current_component(component) {
    current_component = component;
}
function get_current_component() {
    if (!current_component)
        throw new Error(`Function called outside component initialization`);
    return current_component;
}
function onMount(fn) {
    get_current_component().$$.on_mount.push(fn);
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

const globals = (typeof window !== 'undefined'
    ? window
    : typeof globalThis !== 'undefined'
        ? globalThis
        : global);

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
        dirty
    };
    let ready = false;
    $$.ctx = instance
        ? instance(component, prop_values, (i, ret, ...rest) => {
            const value = rest.length ? rest[0] : ret;
            if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                if ($$.bound[i])
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
    $set() {
        // overridden by instance, if it has props
    }
}

/* src/js/renderer/component/FirstRun.svelte generated by Svelte v3.22.3 */

function create_fragment(ctx) {
	let div;
	let h1;
	let t1;
	let h2;
	let t3;
	let button;
	let dispose;

	return {
		c() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "Gambier";
			t1 = space();
			h2 = element("h2");
			h2.textContent = "Get started:";
			t3 = space();
			button = element("button");
			button.textContent = "Choose Project Folder...";
			attr(div, "id", "firstrun");
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			append(div, h1);
			append(div, t1);
			append(div, h2);
			append(div, t3);
			append(div, button);
			if (remount) dispose();
			dispose = listen(button, "click", /*click_handler*/ ctx[0]);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			dispose();
		}
	};
}

function instance($$self) {
	const click_handler = () => {
		window.api.send("dispatch", { type: "SET_PROJECT_PATH" });
	};

	return [click_handler];
}

class FirstRun extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

/**
 * Get a SideBar item object, based on id. 
 * NOTE: This is a copy of the same function in main/utils-main. If one changes, the other should also.
 */

// Copied from:
// https://github.com/Rich-Harris/yootils/blob/master/src/number/clamp.ts
function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num;
}

/* src/js/renderer/component/FlexPanel.svelte generated by Svelte v3.22.3 */

function create_fragment$1(ctx) {
	let div1;
	let t;
	let div0;
	let drag_action;
	let current;
	let dispose;
	const default_slot_template = /*$$slots*/ ctx[10].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

	return {
		c() {
			div1 = element("div");
			if (default_slot) default_slot.c();
			t = space();
			div0 = element("div");
			attr(div0, "class", "divider");
			attr(div1, "class", "flexPanel");
			set_style(div1, "flex", "0 0 " + /*width*/ ctx[2] + "px");
			toggle_class(div1, "visible", /*visible*/ ctx[0]);
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);

			if (default_slot) {
				default_slot.m(div1, null);
			}

			append(div1, t);
			append(div1, div0);
			/*div1_binding*/ ctx[12](div1);
			current = true;
			if (remount) run_all(dispose);

			dispose = [
				action_destroyer(drag_action = /*drag*/ ctx[4].call(null, div0, /*setPos*/ ctx[3])),
				listen(div1, "click", /*click_handler*/ ctx[11])
			];
		},
		p(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 512) {
					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[9], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null));
				}
			}

			if (!current || dirty & /*width*/ 4) {
				set_style(div1, "flex", "0 0 " + /*width*/ ctx[2] + "px");
			}

			if (dirty & /*visible*/ 1) {
				toggle_class(div1, "visible", /*visible*/ ctx[0]);
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
			if (detaching) detach(div1);
			if (default_slot) default_slot.d(detaching);
			/*div1_binding*/ ctx[12](null);
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let { min = 150 } = $$props;
	let { max = 300 } = $$props;
	let { start = 200 } = $$props;
	let { visible = true } = $$props;
	const refs = {};
	let width;
	let dragging = false;

	function setPos(event) {
		const { left } = refs.container.getBoundingClientRect();
		$$invalidate(2, width = clamp(event.clientX - left, min, max));
	}

	function drag(node, callback) {
		const mousedown = event => {
			if (event.which !== 1) return;
			event.preventDefault();
			dragging = true;

			const onmouseup = () => {
				dragging = false;
				window.removeEventListener("mousemove", callback, false);
				window.removeEventListener("mouseup", onmouseup, false);
			};

			window.addEventListener("mousemove", callback, false);
			window.addEventListener("mouseup", onmouseup, false);
		};

		node.addEventListener("mousedown", mousedown, false);

		return {
			destroy() {
				node.removeEventListener("mousedown", onmousedown, false);
			}
		};
	}

	onMount(async () => {
		$$invalidate(2, width = start);
	});

	let { $$slots = {}, $$scope } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	function div1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			refs.container = $$value;
			$$invalidate(1, refs);
		});
	}

	$$self.$set = $$props => {
		if ("min" in $$props) $$invalidate(5, min = $$props.min);
		if ("max" in $$props) $$invalidate(6, max = $$props.max);
		if ("start" in $$props) $$invalidate(7, start = $$props.start);
		if ("visible" in $$props) $$invalidate(0, visible = $$props.visible);
		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
	};

	return [
		visible,
		refs,
		width,
		setPos,
		drag,
		min,
		max,
		start,
		dragging,
		$$scope,
		$$slots,
		click_handler,
		div1_binding
	];
}

class FlexPanel extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { min: 5, max: 6, start: 7, visible: 0 });
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
var lib_1 = lib.createTreeHierarchy;
var lib_2 = lib.createFlatHierarchy;

/* src/js/renderer/component/UI/SearchField.svelte generated by Svelte v3.22.3 */

function add_css() {
	var style = element("style");
	style.id = "svelte-72yapk-style";
	style.textContent = ".searchfield.svelte-72yapk{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:10px 10px 0;position:relative;background-color:rgba(0, 0, 0, 0.04);border-radius:4px;min-height:20px;display:flex;flex-direction:row;align-items:center}.searchfield.svelte-72yapk:focus-within{box-shadow:0 0 0 2pt #61a3eb}.magnifying-glass.svelte-72yapk{background-size:contain;background-position:center;background-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);position:absolute;width:13px;height:13px;left:5px;opacity:0.4;background-image:var(--img-magnifyingglass)}.placeholder.svelte-72yapk{position:absolute;top:50%;transform:translate(0, -50%);color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-72yapk{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}";
	append(document.head, style);
}

// (74:2) {#if !query}
function create_if_block(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr(span, "class", "placeholder svelte-72yapk");
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

function create_fragment$2(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr(div0, "class", "magnifying-glass svelte-72yapk");
			attr(input_1, "type", "text");
			attr(input_1, "class", "svelte-72yapk");
			attr(div1, "class", "searchfield svelte-72yapk");
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			if (if_block) if_block.m(div1, null);
			append(div1, t1);
			append(div1, input_1);
			/*input_1_binding*/ ctx[4](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);
			if (remount) run_all(dispose);

			dispose = [
				listen(div0, "mousedown", prevent_default(/*selectInput*/ ctx[3])),
				listen(input_1, "input", /*input_1_input_handler*/ ctx[5])
			];
		},
		p(ctx, [dirty]) {
			if (!/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
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
			/*input_1_binding*/ ctx[4](null);
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { placeholder = "Search" } = $$props;
	let { query = "" } = $$props;
	let input = null;
	window.api.receive("findInFiles", selectInput);

	function selectInput() {
		input.select();
	}

	function input_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, input = $$value);
		});
	}

	function input_1_input_handler() {
		query = this.value;
		$$invalidate(0, query);
	}

	$$self.$set = $$props => {
		if ("placeholder" in $$props) $$invalidate(1, placeholder = $$props.placeholder);
		if ("query" in $$props) $$invalidate(0, query = $$props.query);
	};

	return [query, placeholder, input, selectInput, input_1_binding, input_1_input_handler];
}

class SearchField extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-72yapk-style")) add_css();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { placeholder: 1, query: 0 });
	}
}

/* src/js/renderer/component/UI/Separator.svelte generated by Svelte v3.22.3 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-zmo4ke-style";
	style.textContent = "hr.svelte-zmo4ke{min-height:1px;padding:0;border:0;background-color:#ccc;margin:0}";
	append(document.head, style);
}

function create_fragment$3(ctx) {
	let hr;

	return {
		c() {
			hr = element("hr");
			attr(hr, "class", "svelte-zmo4ke");
		},
		m(target, anchor) {
			insert(target, hr, anchor);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(hr);
		}
	};
}

class Separator extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-zmo4ke-style")) add_css$1();
		init(this, options, null, create_fragment$3, safe_not_equal, {});
	}
}

/* src/js/renderer/component/SideBar/TreeListItem2.svelte generated by Svelte v3.22.3 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-44ks0f-style";
	style.textContent = ".item.folder.svelte-44ks0f .icon.svelte-44ks0f{background-image:var(--img-folder)}.item.doc.svelte-44ks0f .icon.svelte-44ks0f{background-image:var(--img-doc-text)}.item.image.svelte-44ks0f .icon.svelte-44ks0f{background-image:var(--img-photo)}.item.av.svelte-44ks0f .icon.svelte-44ks0f{background-image:var(--img-play-rectangle)}.item.svelte-44ks0f.svelte-44ks0f{position:relative;min-height:28px;overflow:hidden;user-select:none;--nestOffset:0px;margin-bottom:1px}.item.isSelected.svelte-44ks0f.svelte-44ks0f{border-radius:4px;background-color:rgba(0, 0, 0, 0.1)}.item.svelte-44ks0f .disclosure.svelte-44ks0f{background-color:transparent;border:none;outline:none;padding:0;margin:0;position:absolute;top:50%;transform:translate(0, -50%);left:calc(var(--nestOffset) + 5px);width:10px;height:10px}.item.svelte-44ks0f .disclosure [role='button'].svelte-44ks0f{background-size:contain;background-position:center;background-repeat:no-repeat;background-image:var(--img-chevron-right);position:absolute;display:inline-block;top:50%;left:50%;width:8px;height:8px;transform:translate(-50%, -50%) rotateZ(0deg)}.item.svelte-44ks0f .disclosure.isExpanded [role='button'].svelte-44ks0f{transform:translate(-50%, -50%) rotateZ(90deg)}.item.svelte-44ks0f .icon.svelte-44ks0f{background-size:contain;background-position:center;background-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);left:calc(var(--nestOffset) + 20px);width:14px;height:14px}.item.svelte-44ks0f .label.svelte-44ks0f{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);position:absolute;top:50%;transform:translate(0, -50%);left:calc(var(--nestOffset) + 42px);white-space:nowrap}.item.svelte-44ks0f .counter.svelte-44ks0f{position:absolute;top:50%;transform:translate(0, -50%);font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);color:var(--tertiaryLabelColor);position:absolute;right:7px}.children.svelte-44ks0f.svelte-44ks0f:not(.isExpanded){height:0;overflow:hidden}.children.svelte-44ks0f.svelte-44ks0f{transition:height 0.2s ease-out}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i];
	return child_ctx;
}

// (146:2) {#if isExpandable}
function create_if_block_2(ctx) {
	let div1;
	let div0;
	let dispose;

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			attr(div0, "role", "button");
			attr(div0, "alt", "Toggle Expanded");
			attr(div0, "class", "svelte-44ks0f");
			attr(div1, "class", "disclosure svelte-44ks0f");
			toggle_class(div1, "isExpanded", /*isExpanded*/ ctx[6]);
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, div0);
			if (remount) dispose();

			dispose = listen(div0, "mousedown", stop_propagation(function () {
				if (is_function(/*dispatch*/ ctx[7]("toggleExpanded", {
					item: /*item*/ ctx[1],
					isExpanded: /*isExpanded*/ ctx[6]
				}))) /*dispatch*/ ctx[7]("toggleExpanded", {
					item: /*item*/ ctx[1],
					isExpanded: /*isExpanded*/ ctx[6]
				}).apply(this, arguments);
			}));
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*isExpanded*/ 64) {
				toggle_class(div1, "isExpanded", /*isExpanded*/ ctx[6]);
			}
		},
		d(detaching) {
			if (detaching) detach(div1);
			dispose();
		}
	};
}

// (159:2) {#if isExpandable}
function create_if_block_1(ctx) {
	let div;
	let t_value = /*item*/ ctx[1].children.length + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "counter svelte-44ks0f");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*item*/ 2 && t_value !== (t_value = /*item*/ ctx[1].children.length + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (164:0) {#if isExpandable}
function create_if_block$1(ctx) {
	let ul;
	let current;
	let each_value = /*item*/ ctx[1].children;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ul, "class", "children svelte-44ks0f");
			toggle_class(ul, "isExpanded", /*isExpanded*/ ctx[6]);
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*parent, item, nestDepth*/ 7) {
				each_value = /*item*/ ctx[1].children;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block(child_ctx);
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

			if (dirty & /*isExpanded*/ 64) {
				toggle_class(ul, "isExpanded", /*isExpanded*/ ctx[6]);
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (166:4) {#each item.children as child}
function create_each_block(ctx) {
	let li;
	let t;
	let current;

	const treelistitem2 = new TreeListItem2({
			props: {
				parent: /*parent*/ ctx[0],
				item: /*child*/ ctx[11],
				nestDepth: /*nestDepth*/ ctx[2] + 1
			}
		});

	treelistitem2.$on("mousedown", /*mousedown_handler*/ ctx[9]);
	treelistitem2.$on("toggleExpanded", /*toggleExpanded_handler*/ ctx[10]);

	return {
		c() {
			li = element("li");
			create_component(treelistitem2.$$.fragment);
			t = space();
			attr(li, "class", "row");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(treelistitem2, li, null);
			append(li, t);
			current = true;
		},
		p(ctx, dirty) {
			const treelistitem2_changes = {};
			if (dirty & /*parent*/ 1) treelistitem2_changes.parent = /*parent*/ ctx[0];
			if (dirty & /*item*/ 2) treelistitem2_changes.item = /*child*/ ctx[11];
			if (dirty & /*nestDepth*/ 4) treelistitem2_changes.nestDepth = /*nestDepth*/ ctx[2] + 1;
			treelistitem2.$set(treelistitem2_changes);
		},
		i(local) {
			if (current) return;
			transition_in(treelistitem2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(treelistitem2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(li);
			destroy_component(treelistitem2);
		}
	};
}

function create_fragment$4(ctx) {
	let div2;
	let t0;
	let div0;
	let t1;
	let div1;
	let t2_value = /*item*/ ctx[1].name + "";
	let t2;
	let t3;
	let div2_style_value;
	let div2_class_value;
	let t4;
	let if_block2_anchor;
	let current;
	let dispose;
	let if_block0 = /*isExpandable*/ ctx[5] && create_if_block_2(ctx);
	let if_block1 = /*isExpandable*/ ctx[5] && create_if_block_1(ctx);
	let if_block2 = /*isExpandable*/ ctx[5] && create_if_block$1(ctx);

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
			t4 = space();
			if (if_block2) if_block2.c();
			if_block2_anchor = empty();
			attr(div0, "class", "icon svelte-44ks0f");
			attr(div1, "class", "label svelte-44ks0f");
			attr(div2, "style", div2_style_value = `--nestOffset: ${/*nestDepth*/ ctx[2] * 20}px`);
			attr(div2, "class", div2_class_value = "item " + /*type*/ ctx[3] + " svelte-44ks0f");
			toggle_class(div2, "isSelected", /*isSelected*/ ctx[4]);
			toggle_class(div2, "isExpandable", /*isExpandable*/ ctx[5]);
		},
		m(target, anchor, remount) {
			insert(target, div2, anchor);
			if (if_block0) if_block0.m(div2, null);
			append(div2, t0);
			append(div2, div0);
			append(div2, t1);
			append(div2, div1);
			append(div1, t2);
			append(div2, t3);
			if (if_block1) if_block1.m(div2, null);
			insert(target, t4, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, if_block2_anchor, anchor);
			current = true;
			if (remount) dispose();
			dispose = listen(div2, "mousedown", /*mousedown_handler_1*/ ctx[8]);
		},
		p(ctx, [dirty]) {
			if (/*isExpandable*/ ctx[5]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.m(div2, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if ((!current || dirty & /*item*/ 2) && t2_value !== (t2_value = /*item*/ ctx[1].name + "")) set_data(t2, t2_value);

			if (/*isExpandable*/ ctx[5]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!current || dirty & /*nestDepth*/ 4 && div2_style_value !== (div2_style_value = `--nestOffset: ${/*nestDepth*/ ctx[2] * 20}px`)) {
				attr(div2, "style", div2_style_value);
			}

			if (!current || dirty & /*type*/ 8 && div2_class_value !== (div2_class_value = "item " + /*type*/ ctx[3] + " svelte-44ks0f")) {
				attr(div2, "class", div2_class_value);
			}

			if (dirty & /*type, isSelected*/ 24) {
				toggle_class(div2, "isSelected", /*isSelected*/ ctx[4]);
			}

			if (dirty & /*type, isExpandable*/ 40) {
				toggle_class(div2, "isExpandable", /*isExpandable*/ ctx[5]);
			}

			if (/*isExpandable*/ ctx[5]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*isExpandable*/ 32) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$1(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(if_block2_anchor.parentNode, if_block2_anchor);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div2);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (detaching) detach(t4);
			if (if_block2) if_block2.d(detaching);
			if (detaching) detach(if_block2_anchor);
			dispose();
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { parent = {} } = $$props;
	let { item = {} } = $$props;
	let { nestDepth = 0 } = $$props;
	let type = null;
	const mousedown_handler_1 = domEvent => dispatch("mousedown", { item, isSelected, domEvent });

	function mousedown_handler(event) {
		bubble($$self, event);
	}

	function toggleExpanded_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("parent" in $$props) $$invalidate(0, parent = $$props.parent);
		if ("item" in $$props) $$invalidate(1, item = $$props.item);
		if ("nestDepth" in $$props) $$invalidate(2, nestDepth = $$props.nestDepth);
	};

	let isSelected;
	let isExpandable;
	let isExpanded;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*parent, item*/ 3) {
			 $$invalidate(4, isSelected = parent.selectedItems.find(id => id == item.id));
		}

		if ($$self.$$.dirty & /*item*/ 2) {
			 $$invalidate(5, isExpandable = item.type == "folder" && item.children.length > 0);
		}

		if ($$self.$$.dirty & /*isExpandable, parent, item*/ 35) {
			 $$invalidate(6, isExpanded = isExpandable && parent.expandedItems.some(id => id == item.id));
		}

		if ($$self.$$.dirty & /*item*/ 2) {
			// Set `type`
			 {
				switch (item.type) {
					case "folder":
					case "doc":
						$$invalidate(3, type = item.type);
						break;
					case "media":
						switch (item.filetype) {
							case ".png":
							case ".jpg":
							case ".gif":
								$$invalidate(3, type = "image");
								break;
							default:
								$$invalidate(3, type = "av");
								break;
						}
						break;
				}
			}
		}
	};

	return [
		parent,
		item,
		nestDepth,
		type,
		isSelected,
		isExpandable,
		isExpanded,
		dispatch,
		mousedown_handler_1,
		mousedown_handler,
		toggleExpanded_handler
	];
}

class TreeListItem2 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-44ks0f-style")) add_css$2();
		init(this, options, instance$3, create_fragment$4, safe_not_equal, { parent: 0, item: 1, nestDepth: 2 });
	}
}

/* src/js/renderer/component/SideBar/Project.svelte generated by Svelte v3.22.3 */

const { window: window_1 } = globals;

function add_css$3() {
	var style = element("style");
	style.id = "svelte-3x58dk-style";
	style.textContent = "@import '../../../../styles/_mixins.scss';.wrapper.svelte-3x58dk:not(.active){display:none}#results.svelte-3x58dk{margin:10px;max-height:100%;overflow:hidden}h1.svelte-3x58dk{user-select:none;color:var(--labelColor)}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[21] = list[i];
	return child_ctx;
}

// (326:4) {#each resultsTree as item}
function create_each_block$1(ctx) {
	let current;

	const treelistitem2 = new TreeListItem2({
			props: {
				parent: /*tab*/ ctx[1],
				item: /*item*/ ctx[21]
			}
		});

	treelistitem2.$on("mousedown", /*handleMouseDown*/ ctx[6]);
	treelistitem2.$on("toggleExpanded", /*toggleExpanded_handler*/ ctx[20]);

	return {
		c() {
			create_component(treelistitem2.$$.fragment);
		},
		m(target, anchor) {
			mount_component(treelistitem2, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const treelistitem2_changes = {};
			if (dirty & /*tab*/ 2) treelistitem2_changes.parent = /*tab*/ ctx[1];
			if (dirty & /*resultsTree*/ 16) treelistitem2_changes.item = /*item*/ ctx[21];
			treelistitem2.$set(treelistitem2_changes);
		},
		i(local) {
			if (current) return;
			transition_in(treelistitem2.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(treelistitem2.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(treelistitem2, detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let div1;
	let header;
	let h1;
	let t0_value = /*tab*/ ctx[1].title + "";
	let t0;
	let t1;
	let t2;
	let updating_query;
	let t3;
	let div0;
	let current;
	let dispose;
	const separator = new Separator({});

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[19].call(null, value);
	}

	let searchfield_props = { placeholder: "Name" };

	if (/*query*/ ctx[3] !== void 0) {
		searchfield_props.query = /*query*/ ctx[3];
	}

	const searchfield = new SearchField({ props: searchfield_props });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));
	let each_value = /*resultsTree*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div1 = element("div");
			header = element("header");
			h1 = element("h1");
			t0 = text(t0_value);
			t1 = space();
			create_component(separator.$$.fragment);
			t2 = space();
			create_component(searchfield.$$.fragment);
			t3 = space();
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(h1, "class", "svelte-3x58dk");
			attr(div0, "id", "results");
			attr(div0, "class", "svelte-3x58dk");
			attr(div1, "id", "project");
			attr(div1, "class", "wrapper svelte-3x58dk");
			toggle_class(div1, "focused", /*focused*/ ctx[0]);
			toggle_class(div1, "active", /*active*/ ctx[2]);
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, header);
			append(header, h1);
			append(h1, t0);
			append(div1, t1);
			mount_component(separator, div1, null);
			append(div1, t2);
			mount_component(searchfield, div1, null);
			append(div1, t3);
			append(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}

			current = true;
			if (remount) dispose();
			dispose = listen(window_1, "keydown", /*handleKeydown*/ ctx[5]);
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*tab*/ 2) && t0_value !== (t0_value = /*tab*/ ctx[1].title + "")) set_data(t0, t0_value);
			const searchfield_changes = {};

			if (!updating_query && dirty & /*query*/ 8) {
				updating_query = true;
				searchfield_changes.query = /*query*/ ctx[3];
				add_flush_callback(() => updating_query = false);
			}

			searchfield.$set(searchfield_changes);

			if (dirty & /*tab, resultsTree, handleMouseDown, toggleExpanded*/ 210) {
				each_value = /*resultsTree*/ ctx[4];
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
						each_blocks[i].m(div0, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty & /*focused*/ 1) {
				toggle_class(div1, "focused", /*focused*/ ctx[0]);
			}

			if (dirty & /*active*/ 4) {
				toggle_class(div1, "active", /*active*/ ctx[2]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(separator.$$.fragment, local);
			transition_out(searchfield.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(separator);
			destroy_component(searchfield);
			destroy_each(each_blocks, detaching);
			dispose();
		}
	};
}

function selectParentFolder(item) {
	window.api.send("dispatch", {
		type: "SELECT_SIDEBAR_ITEMS",
		tabName: "project",
		lastSelectedItem: item.parentId,
		selectedItems: [item.parentId]
	});
}

function instance$4($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { focused } = $$props;

	// State
	let tab = {};

	let folders = [];
	let files = [];

	// Local
	let firstRun = true;

	let active = false;
	let query = "";
	let resultsTree = [];
	let resultsFlat = [];
	let resultsVisible = [];

	// State changes
	function onStateChange(state) {
		if (firstRun) {
			$$invalidate(1, tab = state.sideBar2.tabs.find(t => t.name == "project"));
			$$invalidate(2, active = state.sideBar2.activeTab.name == "project");
			$$invalidate(9, folders = state.folders);
			$$invalidate(10, files = [].concat(...[state.documents, state.media]));
			firstRun = false;
		}

		if (state.changed.includes("sideBar.tabs.project")) {
			$$invalidate(1, tab = state.sideBar2.tabs.find(t => t.name == "project"));
		} else if (state.changed.includes("sideBar.activeTab")) {
			$$invalidate(2, active = state.sideBar2.activeTab.name == "project");
		} else if (state.changed.includes("folders") || state.changed.includes("documents") || state.changed.includes("media")) {
			$$invalidate(9, folders = state.folders);
			$$invalidate(10, files = [].concat(...[state.documents, state.media]));
		} else if (state.changed.includes("openDoc")) {
			console.log("openDoc changed");
		}
	}

	// -------- RESULTS -------- //
	let index = 0;

	// -------- KEY DOWN -------- //
	function handleKeydown(evt) {
		if (!focused) return;

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
		const item = resultsFlat.find(r => r.id == tab.lastSelectedItem);
		const isFolder = item.type == "folder";
		const isExpanded = isFolder && tab.expandedItems.some(id => id == item.id);

		if (isFolder) {
			// Toggle expanded
			if (!isExpanded && key == "ArrowRight") {
				toggleExpanded(item, isExpanded);
			} else if (isExpanded && key == "ArrowLeft") {
				toggleExpanded(item, isExpanded);
			}
		} else if (!isFolder && key == "ArrowLeft") {
			// Jump selection to parent folder
			selectParentFolder(item);
		}
	}

	function handleArrowUpDown(key, shiftPressed, altPressed) {
		let nextItem = {};
		let selectedItems = [];

		// Checks
		const indexOfLastSelectedItemInResultsVisible = resultsVisible.findIndex(item => item.id == tab.lastSelectedItem);

		const isStillVisible = indexOfLastSelectedItemInResultsVisible !== -1;
		const isAlreadyAtStartOfResultsVisible = indexOfLastSelectedItemInResultsVisible == 0;
		const isAlreadyAtEndOfResultsVisible = indexOfLastSelectedItemInResultsVisible + 1 == resultsVisible.length;

		// Determine next item
		if (!isStillVisible || altPressed) {
			// If last selected item is no longer visible (e.g. parent folder since toggled closed), OR alt is pressed: select first or last item in list.
			switch (key) {
				case "ArrowUp":
					nextItem = resultsVisible[0];
					break;
				case "ArrowDown":
					nextItem = resultsVisible[resultsVisible.length - 1];
					break;
			}
		} else if (key == "ArrowUp" && isAlreadyAtStartOfResultsVisible) {
			// If arrowing up, and already at start, (re)select first item in list
			nextItem = resultsVisible[0];
		} else if (key == "ArrowDown" && isAlreadyAtEndOfResultsVisible) {
			// If arrowing down, and already at end, (re)select last item in list
			nextItem = resultsVisible[resultsVisible.length - 1];
		} else {
			switch (key) {
				case "ArrowUp":
					nextItem = resultsVisible[indexOfLastSelectedItemInResultsVisible - 1];
					break;
				case "ArrowDown":
					nextItem = resultsVisible[indexOfLastSelectedItemInResultsVisible + 1];
					break;
			}
		}

		// Select it, or add it to existing selection, depending on whether shift is pressed
		if (shiftPressed) {
			selectedItems = tab.selectedItems.slice();
			selectedItems.push(nextItem.id);
		} else {
			selectedItems = [nextItem.id];
		}

		// Update selection
		window.api.send("dispatch", {
			type: "SELECT_SIDEBAR_ITEMS",
			tabName: "project",
			lastSelectedItem: nextItem.id,
			selectedItems
		});
	}

	// -------- MOUSE DOWN -------- //
	function handleMouseDown(evt) {
		const item = evt.detail.item;
		const isSelected = evt.detail.isSelected;
		const domEvent = evt.detail.domEvent;

		// Shift-click: Select range of items in list
		// Click while not selected: Make this the only selected item
		// Cmd-click while not selected: Add this to existing items
		// Cmd-click while selected: Remove this from existing items
		const shiftClicked = domEvent.shiftKey;

		const clickedWhileNotSelected = !domEvent.metaKey && !isSelected;
		const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected;
		const cmdClickedWhileSelected = domEvent.metaKey && isSelected;
		let selectedItems = [];

		if (shiftClicked) {
			const clickedIndex = resultsVisible.findIndex(r => r.id == item.id);
			const lastSelectedIndex = resultsVisible.findIndex(r => r.id == tab.lastSelectedItem);
			const lastSelectedIsStillVisible = lastSelectedIndex !== -1;
			selectedItems = tab.selectedItems.slice();

			if (!lastSelectedIsStillVisible) {
				selectedItems = [item.id];
			} else {
				const selectFromIndex = Math.min(clickedIndex, lastSelectedIndex);
				const selectToIndex = Math.max(clickedIndex, lastSelectedIndex);

				resultsVisible.forEach((r, index) => {
					if (index >= selectFromIndex && index <= selectToIndex) {
						selectedItems.push(r.id);
					}
				});
			}
		} else if (clickedWhileNotSelected) {
			selectedItems.push(item.id);
		} else if (cmdClickedWhileNotSelected) {
			selectedItems = tab.selectedItems.concat([item.id]);
		} else if (cmdClickedWhileSelected) {
			// Copy array and remove this item from it
			selectedItems = tab.selectedItems.slice();

			const indexToRemove = selectedItems.findIndex(id => id == item.id);
			selectedItems.splice(indexToRemove, 1);
		}

		window.api.send("dispatch", {
			type: "SELECT_SIDEBAR_ITEMS",
			tabName: "project",
			lastSelectedItem: item.id,
			selectedItems
		});
	}

	// -------- HELPERS -------- //
	/**
 * Sort array of child items by sorting criteria
 * // TODO: Criteria is currently hard coded to alphabetical and A-Z.
 */
	function sortChildren(children) {
		children.sort((a, b) => a.name.localeCompare(b.name));

		children.forEach(c => {
			c.index = index++;

			if (query == "" && c.type == "folder" && c.children.length > 0) {
				sortChildren(c.children);
			}
		});
	}

	function toggleExpanded(item, isExpanded) {
		let expandedItems = tab.expandedItems.slice();

		switch (isExpanded) {
			case true:
				const indexToRemove = expandedItems.findIndex(id => id == item.id);
				expandedItems.splice(indexToRemove, 1);
				break;
			case false:
				expandedItems.push(item.id);
				break;
		}

		window.api.send("dispatch", {
			type: "EXPAND_SIDEBAR_ITEMS",
			tabName: tab.name,
			expandedItems
		});
	}

	function searchfield_query_binding(value) {
		query = value;
		$$invalidate(3, query);
	}

	const toggleExpanded_handler = evt => {
		toggleExpanded(evt.detail.item, evt.detail.isExpanded);
	};

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(8, state = $$props.state);
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 256) {
			// -------- STATE -------- //
			 onStateChange(state);
		}

		if ($$self.$$.dirty & /*query, folders, files, resultsTree*/ 1560) {
			// Update `resultsTree` and `resultsFlat` when folders, files, or search query change.
			 {
				index = 0;

				if (query == "") {
					$$invalidate(4, resultsTree = lib_1([].concat(...[folders, files]))[0].children);
					sortChildren(resultsTree);
				} else {
					$$invalidate(4, resultsTree = files.filter(f => // Convert to uppercase so the search is case insensitive
					f.name.toUpperCase().includes(query.toUpperCase())));

					sortChildren(resultsTree);
				}

				$$invalidate(12, resultsFlat = resultsTree.length
				? lib_2(resultsTree)
				: []);
			}
		}

		if ($$self.$$.dirty & /*resultsFlat, resultsVisible, tab*/ 12290) {
			// Update `resultsVisible` when `resultsFlat` or `tab` changes
			 {
				$$invalidate(13, resultsVisible = []);

				if (resultsFlat.length) {
					for (let i = 0; i < resultsFlat.length; i++) {
						const result = resultsFlat[i];
						resultsVisible.push(result);

						if (result.type == "folder") {
							const isExpanded = tab.expandedItems.some(id => id == result.id);

							if (!isExpanded) {
								i += result.recursiveChildCount;
							}
						}
					}
				}
			}
		}
	};

	return [
		focused,
		tab,
		active,
		query,
		resultsTree,
		handleKeydown,
		handleMouseDown,
		toggleExpanded,
		state,
		folders,
		files,
		firstRun,
		resultsFlat,
		resultsVisible,
		index,
		onStateChange,
		handleArrowLeftRight,
		handleArrowUpDown,
		sortChildren,
		searchfield_query_binding,
		toggleExpanded_handler
	];
}

class Project extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-3x58dk-style")) add_css$3();
		init(this, options, instance$4, create_fragment$5, safe_not_equal, { state: 8, focused: 0 });
	}
}

/* src/js/renderer/component/SideBar/AllDocuments.svelte generated by Svelte v3.22.3 */

function add_css$4() {
	var style = element("style");
	style.id = "svelte-667fxh-style";
	style.textContent = ".wrapper.svelte-667fxh:not(.active){display:none}";
	append(document.head, style);
}

function create_fragment$6(ctx) {
	let div;
	let header;
	let t1;
	let current;
	const separator = new Separator({});

	return {
		c() {
			div = element("div");
			header = element("header");
			header.innerHTML = `<h1>All Documents</h1>`;
			t1 = space();
			create_component(separator.$$.fragment);
			attr(div, "id", "all-documents");
			attr(div, "class", "wrapper svelte-667fxh");
			toggle_class(div, "focused", /*focused*/ ctx[0]);
			toggle_class(div, "active", /*active*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, header);
			append(div, t1);
			mount_component(separator, div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*focused*/ 1) {
				toggle_class(div, "focused", /*focused*/ ctx[0]);
			}

			if (dirty & /*active*/ 2) {
				toggle_class(div, "active", /*active*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(separator.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(separator.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(separator);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { focused = false } = $$props;

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(2, state = $$props.state);
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
	};

	let active;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 4) {
			 $$invalidate(1, active = state.sideBar2.activeTab.name == "all-documents");
		}
	};

	return [focused, active, state];
}

class AllDocuments extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-667fxh-style")) add_css$4();
		init(this, options, instance$5, create_fragment$6, safe_not_equal, { state: 2, focused: 0 });
	}
}

/* src/js/renderer/component/SideBar/SideBar.svelte generated by Svelte v3.22.3 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-ycbt9u-style";
	style.textContent = "#tabs.svelte-ycbt9u.svelte-ycbt9u{min-height:30px;display:flex;justify-content:center}#tabs.svelte-ycbt9u ul.svelte-ycbt9u{padding:0;margin:0;list-style-type:none;display:flex}#tabs.svelte-ycbt9u ul li.svelte-ycbt9u{background-size:contain;background-position:center;background-repeat:no-repeat;list-style-type:none;margin:0 12px 0 0;padding:0;width:15px;height:15px;opacity:60%}#tabs.svelte-ycbt9u ul li.active.svelte-ycbt9u{opacity:100%}#tabs.svelte-ycbt9u ul li.svelte-ycbt9u:last-of-type{margin:0}.project.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-folder)}.project.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-folder-fill)}.all-documents.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-doc-on-doc)}.all-documents.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-doc-on-doc-fill)}.most-recent.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-clock)}.most-recent.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-clock-fill)}.tags.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-tag)}.tags.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-tag-fill)}.media.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-photo)}.media.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-photo-fill)}.citations.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-quote-bubble)}.citations.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-quote-bubble-fill)}.search.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-magnifyingglass)}.search.active.svelte-ycbt9u.svelte-ycbt9u{background-image:var(--img-magnifyingglass)}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	child_ctx[6] = i;
	return child_ctx;
}

// (98:6) {#each tabs as tab, index}
function create_each_block$2(ctx) {
	let li;
	let li_class_value;
	let dispose;

	function click_handler(...args) {
		return /*click_handler*/ ctx[3](/*index*/ ctx[6], ...args);
	}

	return {
		c() {
			li = element("li");
			attr(li, "class", li_class_value = "" + (null_to_empty(/*tab*/ ctx[4].name) + " svelte-ycbt9u"));
			toggle_class(li, "active", /*index*/ ctx[6] == /*state*/ ctx[0].sideBar2.activeTab.index);
		},
		m(target, anchor, remount) {
			insert(target, li, anchor);
			if (remount) dispose();
			dispose = listen(li, "click", click_handler);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*tabs*/ 4 && li_class_value !== (li_class_value = "" + (null_to_empty(/*tab*/ ctx[4].name) + " svelte-ycbt9u"))) {
				attr(li, "class", li_class_value);
			}

			if (dirty & /*tabs, state*/ 5) {
				toggle_class(li, "active", /*index*/ ctx[6] == /*state*/ ctx[0].sideBar2.activeTab.index);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			dispose();
		}
	};
}

function create_fragment$7(ctx) {
	let div1;
	let div0;
	let ul;
	let t0;
	let t1;
	let t2;
	let current;
	let each_value = /*tabs*/ ctx[2];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	const separator = new Separator({});

	const project = new Project({
			props: {
				state: /*state*/ ctx[0],
				focused: /*focused*/ ctx[1]
			}
		});

	const alldocuments = new AllDocuments({
			props: {
				state: /*state*/ ctx[0],
				focused: /*focused*/ ctx[1]
			}
		});

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
			create_component(project.$$.fragment);
			t2 = space();
			create_component(alldocuments.$$.fragment);
			attr(ul, "class", "svelte-ycbt9u");
			attr(div0, "id", "tabs");
			attr(div0, "class", "svelte-ycbt9u");
			attr(div1, "id", "sidebar2");
			toggle_class(div1, "focused", /*focused*/ ctx[1]);
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
			mount_component(project, div1, null);
			append(div1, t2);
			mount_component(alldocuments, div1, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*tabs, state, clickTab*/ 5) {
				each_value = /*tabs*/ ctx[2];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			const project_changes = {};
			if (dirty & /*state*/ 1) project_changes.state = /*state*/ ctx[0];
			if (dirty & /*focused*/ 2) project_changes.focused = /*focused*/ ctx[1];
			project.$set(project_changes);
			const alldocuments_changes = {};
			if (dirty & /*state*/ 1) alldocuments_changes.state = /*state*/ ctx[0];
			if (dirty & /*focused*/ 2) alldocuments_changes.focused = /*focused*/ ctx[1];
			alldocuments.$set(alldocuments_changes);

			if (dirty & /*focused*/ 2) {
				toggle_class(div1, "focused", /*focused*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(separator.$$.fragment, local);
			transition_in(project.$$.fragment, local);
			transition_in(alldocuments.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(separator.$$.fragment, local);
			transition_out(project.$$.fragment, local);
			transition_out(alldocuments.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_each(each_blocks, detaching);
			destroy_component(separator);
			destroy_component(project);
			destroy_component(alldocuments);
		}
	};
}

function clickTab(evt, index) {
	window.api.send("dispatch", {
		type: "SELECT_SIDEBAR_TAB_BY_INDEX",
		index
	});
}

function instance$6($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { focused } = $$props;
	const click_handler = (index, evt) => clickTab(evt, index);

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
		if ("focused" in $$props) $$invalidate(1, focused = $$props.focused);
	};

	let tabs;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 1) {
			 $$invalidate(2, tabs = state.sideBar2.tabs);
		}
	};

	return [state, focused, tabs, click_handler];
}

class SideBar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-ycbt9u-style")) add_css$5();
		init(this, options, instance$6, create_fragment$7, safe_not_equal, { state: 0, focused: 1 });
	}
}

/* src/js/renderer/component/UITests.svelte generated by Svelte v3.22.3 */

function create_fragment$8(ctx) {
	let div;
	let t;
	let current;
	const searchfield = new SearchField({});
	const separator = new Separator({});

	return {
		c() {
			div = element("div");
			create_component(searchfield.$$.fragment);
			t = space();
			create_component(separator.$$.fragment);
			attr(div, "id", "ui-test");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(searchfield, div, null);
			append(div, t);
			mount_component(separator, div, null);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(searchfield.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(searchfield.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(searchfield);
			destroy_component(separator);
		}
	};
}

class UITests extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, null, create_fragment$8, safe_not_equal, {});
	}
}

/* src/js/renderer/component/Layout.svelte generated by Svelte v3.22.3 */

function create_else_block(ctx) {
	let div;
	let t;
	let current;

	const flexpanel = new FlexPanel({
			props: {
				visible: /*state*/ ctx[0].sideBar.show,
				min: 250,
				max: 300,
				start: 250,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	flexpanel.$on("click", /*click_handler*/ ctx[5]);
	const uitests = new UITests({});

	return {
		c() {
			div = element("div");
			create_component(flexpanel.$$.fragment);
			t = space();
			create_component(uitests.$$.fragment);
			attr(div, "id", "flexLayout");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(flexpanel, div, null);
			append(div, t);
			mount_component(uitests, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const flexpanel_changes = {};
			if (dirty & /*state*/ 1) flexpanel_changes.visible = /*state*/ ctx[0].sideBar.show;

			if (dirty & /*$$scope, state*/ 65) {
				flexpanel_changes.$$scope = { dirty, ctx };
			}

			flexpanel.$set(flexpanel_changes);
		},
		i(local) {
			if (current) return;
			transition_in(flexpanel.$$.fragment, local);
			transition_in(uitests.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(flexpanel.$$.fragment, local);
			transition_out(uitests.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(flexpanel);
			destroy_component(uitests);
		}
	};
}

// (31:0) {#if state.projectPath == ''}
function create_if_block$2(ctx) {
	let current;
	const firstrun = new FirstRun({});

	return {
		c() {
			create_component(firstrun.$$.fragment);
		},
		m(target, anchor) {
			mount_component(firstrun, target, anchor);
			current = true;
		},
		p: noop,
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

// (35:4) <FlexPanel       visible={state.sideBar.show}       min={250}       max={300}       start={250}       on:click={() => setLayoutFocus('navigation')}>
function create_default_slot(ctx) {
	let current;

	const sidebar = new SideBar({
			props: {
				state: /*state*/ ctx[0],
				focused: /*state*/ ctx[0].focusedLayoutSection == "navigation"
			}
		});

	return {
		c() {
			create_component(sidebar.$$.fragment);
		},
		m(target, anchor) {
			mount_component(sidebar, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const sidebar_changes = {};
			if (dirty & /*state*/ 1) sidebar_changes.state = /*state*/ ctx[0];
			if (dirty & /*state*/ 1) sidebar_changes.focused = /*state*/ ctx[0].focusedLayoutSection == "navigation";
			sidebar.$set(sidebar_changes);
		},
		i(local) {
			if (current) return;
			transition_in(sidebar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebar, detaching);
		}
	};
}

function create_fragment$9(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$2, create_else_block];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*state*/ ctx[0].projectPath == "") return 0;
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

function instance$7($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { oldState = {} } = $$props;
	let focusedSection;

	function setLayoutFocus(section) {
		if (state.focusedLayoutSection == section) return;
		window.api.send("dispatch", { type: "SET_LAYOUT_FOCUS", section });
	}

	const click_handler = () => setLayoutFocus("navigation");

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
		if ("oldState" in $$props) $$invalidate(2, oldState = $$props.oldState);
	};

	let isEditorVisible;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 1) {
			 isEditorVisible = state.openDoc.id;
		}
	};

	return [
		state,
		setLayoutFocus,
		oldState,
		isEditorVisible,
		focusedSection,
		click_handler
	];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$9, safe_not_equal, { state: 0, oldState: 2 });
	}

	get state() {
		return this.$$.ctx[0];
	}

	set state(state) {
		this.$set({ state });
		flush();
	}

	get oldState() {
		return this.$$.ctx[2];
	}

	set oldState(oldState) {
		this.$set({ oldState });
		flush();
	}
}

// import { mountReplace } from './utils'
// import Fuse from './third-party/fuse/fuse.esm.js'

async function setup() {

  const initialState = await window.api.invoke('getState');

  // Apply `Layout` svelte component
  const layout = new Layout({
    target: document.querySelector('#layout'),
    props: {
      state: initialState,
      oldState: initialState,
    }
  });

  window.api.receive("stateChanged", (newState, oldState) => {

    // Update Layout component `state` assignments. This then ripples throughout the rest of the app, as each component passes the update state on to it's children, successively.
    layout.state = newState;
    layout.oldState = oldState;

    // Update appearance
    if (newState.changed.includes("appearance")) {
      setTheme(newState.appearance.theme);
      setSystemColors();
    }
  });

  // Set theme on initial load
  setTheme(initialState.appearance.theme);


  // Set system colors. 
  // NOTE: This is turned off for now because of problems with Electron: returned values do not match what we expect from macOS, based on developer documentation and tests with Xcode apps. In part (although not entirely) because Electron returns values without alphas.
  // setSystemColors()

  // Show the window once setup is done.
  window.api.send('showWindow');

}

function setTheme(themeName) {
  // console.log('setTheme!', themeName);
  const stylesheet = document.getElementById('theme-stylesheet');
  const href = `./styles/themes/${themeName}/${themeName}.css`;
  // console.log(stylesheet)
  // console.log(href)
  stylesheet.setAttribute('href', href);
  // console.log(stylesheet)
}

/**
 * Get system colors from main, and write them to html element.
 */
async function setSystemColors() {

  const systemColors = await window.api.invoke('getSystemColors');
  systemColors.forEach((c) => {
    const property = `--${c.name}`;
    const value = `${c.color}`;
    // console.log(property, value)
    // const rgb = hexToRgb(value)
    // root.style.setProperty(property, value)
  });
}

window.addEventListener('DOMContentLoaded', setup);

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)
//# sourceMappingURL=renderer.js.map
