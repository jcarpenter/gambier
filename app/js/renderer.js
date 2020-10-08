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
function set_style(node, key, value, important) {
    node.style.setProperty(key, value, important ? 'important' : '');
}
function select_option(select, value) {
    for (let i = 0; i < select.options.length; i += 1) {
        const option = select.options[i];
        if (option.__value === value) {
            option.selected = true;
            return;
        }
    }
}
function select_value(select) {
    const selected_option = select.querySelector(':checked') || select.options[0];
    return selected_option && selected_option.__value;
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
function tick() {
    schedule_update();
    return resolved_promise;
}
function add_render_callback(fn) {
    render_callbacks.push(fn);
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
function outro_and_destroy_block(block, lookup) {
    transition_out(block, 1, 1, () => {
        lookup.delete(block.key);
    });
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
        block.m(node, next, lookup.has(block.key));
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
function getSideBarItemById(state, id) {
  if (id.includes('folder')) {
    return state.sideBar.folders.find((f) => f.id == id)
  } else if (id.includes('docs')) {
    return state.sideBar.documents.find((d) => d.id == id)
  } else if (id.includes('media')) {
    return state.sideBar.media.find((m) => m.id == id)
  }
}

/**
 * Check if object is empty" {}
 */
// Taken from https://coderwall.com/p/_g3x9q/how-to-check-if-javascript-object-is-empty
function isEmpty(obj) {
  for(var key in obj) {
      if(obj.hasOwnProperty(key))
          return false
  }
  return true
}

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

/* src/js/renderer/component/SideBarItem.svelte generated by Svelte v3.22.3 */

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (46:2) {#if item.children.length > 0}
function create_if_block(ctx) {
	let div;
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
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "id", "children");
			toggle_class(div, "expanded", /*item*/ ctx[1].expanded);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*state, item, nestDepth*/ 7) {
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
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty & /*item*/ 2) {
				toggle_class(div, "expanded", /*item*/ ctx[1].expanded);
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
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (48:6) {#each item.children as childItem}
function create_each_block(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*childItem*/ ctx[6],
				nestDepth: /*nestDepth*/ ctx[2] + 1
			}
		});

	return {
		c() {
			create_component(sidebaritem.$$.fragment);
		},
		m(target, anchor) {
			mount_component(sidebaritem, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const sidebaritem_changes = {};
			if (dirty & /*state*/ 1) sidebaritem_changes.state = /*state*/ ctx[0];
			if (dirty & /*item*/ 2) sidebaritem_changes.item = /*childItem*/ ctx[6];
			if (dirty & /*nestDepth*/ 4) sidebaritem_changes.nestDepth = /*nestDepth*/ ctx[2] + 1;
			sidebaritem.$set(sidebaritem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(sidebaritem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebaritem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebaritem, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let div1;
	let div0;
	let button;
	let t0;
	let img1;
	let img1_src_value;
	let t1;
	let span;
	let t2_value = /*item*/ ctx[1].label + "";
	let t2;
	let t3;
	let current;
	let dispose;
	let if_block = /*item*/ ctx[1].children.length > 0 && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			button = element("button");
			button.innerHTML = `<img src="images/mac/disclosure-triangle.svg" alt="Collapse/Expand">`;
			t0 = space();
			img1 = element("img");
			t1 = space();
			span = element("span");
			t2 = text(t2_value);
			t3 = space();
			if (if_block) if_block.c();
			attr(button, "id", "disclosure-triangle");
			attr(button, "alt", "Expand");
			toggle_class(button, "expandable", /*item*/ ctx[1].children.length > 0);
			toggle_class(button, "expanded", /*item*/ ctx[1].expanded);
			if (img1.src !== (img1_src_value = /*item*/ ctx[1].icon)) attr(img1, "src", img1_src_value);
			attr(img1, "id", "icon");
			attr(img1, "alt", "Icon");
			attr(span, "id", "label");
			attr(div0, "id", "flex-row");
			attr(div1, "class", "sideBarItem");
			attr(div1, "data-nestdepth", /*nestDepth*/ ctx[2]);
			toggle_class(div1, "selected", /*selected*/ ctx[3]);
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div0, button);
			append(div0, t0);
			append(div0, img1);
			append(div0, t1);
			append(div0, span);
			append(span, t2);
			append(div1, t3);
			if (if_block) if_block.m(div1, null);
			current = true;
			if (remount) run_all(dispose);

			dispose = [
				listen(button, "click", stop_propagation(/*toggleExpanded*/ ctx[5])),
				listen(div0, "click", /*clicked*/ ctx[4])
			];
		},
		p(ctx, [dirty]) {
			if (dirty & /*item*/ 2) {
				toggle_class(button, "expandable", /*item*/ ctx[1].children.length > 0);
			}

			if (dirty & /*item*/ 2) {
				toggle_class(button, "expanded", /*item*/ ctx[1].expanded);
			}

			if (!current || dirty & /*item*/ 2 && img1.src !== (img1_src_value = /*item*/ ctx[1].icon)) {
				attr(img1, "src", img1_src_value);
			}

			if ((!current || dirty & /*item*/ 2) && t2_value !== (t2_value = /*item*/ ctx[1].label + "")) set_data(t2, t2_value);

			if (/*item*/ ctx[1].children.length > 0) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*item*/ 2) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div1, null);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (!current || dirty & /*nestDepth*/ 4) {
				attr(div1, "data-nestdepth", /*nestDepth*/ ctx[2]);
			}

			if (dirty & /*selected*/ 8) {
				toggle_class(div1, "selected", /*selected*/ ctx[3]);
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
			if (detaching) detach(div1);
			if (if_block) if_block.d();
			run_all(dispose);
		}
	};
}

function instance$2($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { item = {} } = $$props;
	let { nestDepth = 0 } = $$props;
	let selected = false;

	function clicked() {
		if (selected) return;
		window.api.send("dispatch", { type: "SELECT_SIDEBAR_ITEM", item });
	}

	function toggleExpanded() {
		window.api.send("dispatch", {
			type: "TOGGLE_SIDEBAR_ITEM_EXPANDED",
			item
		});
	}

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
		if ("item" in $$props) $$invalidate(1, item = $$props.item);
		if ("nestDepth" in $$props) $$invalidate(2, nestDepth = $$props.nestDepth);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state, item*/ 3) {
			 $$invalidate(3, selected = state.selectedSideBarItem.id == item.id);
		}
	};

	return [state, item, nestDepth, selected, clicked, toggleExpanded];
}

class SideBarItem extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { state: 0, item: 1, nestDepth: 2 });
	}
}

/* src/js/renderer/component/SideBar.svelte generated by Svelte v3.22.3 */

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (49:2) {#each folders as item}
function create_each_block_2(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*item*/ ctx[6]
			}
		});

	return {
		c() {
			create_component(sidebaritem.$$.fragment);
		},
		m(target, anchor) {
			mount_component(sidebaritem, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const sidebaritem_changes = {};
			if (dirty & /*state*/ 1) sidebaritem_changes.state = /*state*/ ctx[0];
			if (dirty & /*folders*/ 4) sidebaritem_changes.item = /*item*/ ctx[6];
			sidebaritem.$set(sidebaritem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(sidebaritem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebaritem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebaritem, detaching);
		}
	};
}

// (54:2) {#each documents as item}
function create_each_block_1(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*item*/ ctx[6]
			}
		});

	return {
		c() {
			create_component(sidebaritem.$$.fragment);
		},
		m(target, anchor) {
			mount_component(sidebaritem, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const sidebaritem_changes = {};
			if (dirty & /*state*/ 1) sidebaritem_changes.state = /*state*/ ctx[0];
			if (dirty & /*documents*/ 8) sidebaritem_changes.item = /*item*/ ctx[6];
			sidebaritem.$set(sidebaritem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(sidebaritem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebaritem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebaritem, detaching);
		}
	};
}

// (59:2) {#each media as item}
function create_each_block$1(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*item*/ ctx[6]
			}
		});

	return {
		c() {
			create_component(sidebaritem.$$.fragment);
		},
		m(target, anchor) {
			mount_component(sidebaritem, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const sidebaritem_changes = {};
			if (dirty & /*state*/ 1) sidebaritem_changes.state = /*state*/ ctx[0];
			if (dirty & /*media*/ 16) sidebaritem_changes.item = /*item*/ ctx[6];
			sidebaritem.$set(sidebaritem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(sidebaritem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(sidebaritem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(sidebaritem, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let div;
	let h10;
	let t1;
	let t2;
	let h11;
	let t4;
	let t5;
	let h12;
	let t7;
	let current;
	let each_value_2 = /*folders*/ ctx[2];
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const out = i => transition_out(each_blocks_2[i], 1, 1, () => {
		each_blocks_2[i] = null;
	});

	let each_value_1 = /*documents*/ ctx[3];
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out_1 = i => transition_out(each_blocks_1[i], 1, 1, () => {
		each_blocks_1[i] = null;
	});

	let each_value = /*media*/ ctx[4];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out_2 = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			div = element("div");
			h10 = element("h1");
			h10.textContent = "Folders";
			t1 = space();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t2 = space();
			h11 = element("h1");
			h11.textContent = "Documents";
			t4 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t5 = space();
			h12 = element("h1");
			h12.textContent = "Media";
			t7 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(h10, "class", "title");
			attr(h11, "class", "title");
			attr(h12, "class", "title");
			attr(div, "id", "sidebar");
			toggle_class(div, "focused", /*focused*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h10);
			append(div, t1);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].m(div, null);
			}

			append(div, t2);
			append(div, h11);
			append(div, t4);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].m(div, null);
			}

			append(div, t5);
			append(div, h12);
			append(div, t7);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*state, folders*/ 5) {
				each_value_2 = /*folders*/ ctx[2];
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
						transition_in(each_blocks_2[i], 1);
					} else {
						each_blocks_2[i] = create_each_block_2(child_ctx);
						each_blocks_2[i].c();
						transition_in(each_blocks_2[i], 1);
						each_blocks_2[i].m(div, t2);
					}
				}

				group_outros();

				for (i = each_value_2.length; i < each_blocks_2.length; i += 1) {
					out(i);
				}

				check_outros();
			}

			if (dirty & /*state, documents*/ 9) {
				each_value_1 = /*documents*/ ctx[3];
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
						transition_in(each_blocks_1[i], 1);
					} else {
						each_blocks_1[i] = create_each_block_1(child_ctx);
						each_blocks_1[i].c();
						transition_in(each_blocks_1[i], 1);
						each_blocks_1[i].m(div, t5);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks_1.length; i += 1) {
					out_1(i);
				}

				check_outros();
			}

			if (dirty & /*state, media*/ 17) {
				each_value = /*media*/ ctx[4];
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
						each_blocks[i].m(div, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out_2(i);
				}

				check_outros();
			}

			if (dirty & /*focused*/ 2) {
				toggle_class(div, "focused", /*focused*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_2.length; i += 1) {
				transition_in(each_blocks_2[i]);
			}

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks_1[i]);
			}

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks_2 = each_blocks_2.filter(Boolean);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				transition_out(each_blocks_2[i]);
			}

			each_blocks_1 = each_blocks_1.filter(Boolean);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				transition_out(each_blocks_1[i]);
			}

			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks_2, detaching);
			destroy_each(each_blocks_1, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { focused } = $$props;

	// $: {
	//   if (
	//     state.changed.includes("sideBar")
	//   ) {
	//     buildTree()
	//   }
	// }
	onMount(() => {
		// buildTree()
		// If no sideBar item is selected yet (ala on first run), select first folder
		if (isEmpty(state.selectedSideBarItem)) {
			window.api.send("dispatch", {
				type: "SELECT_SIDEBAR_ITEM",
				item: folders[0]
			});
		}
	});

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
		if ("focused" in $$props) $$invalidate(1, focused = $$props.focused);
	};

	let sideBarItem;
	let folders;
	let documents;
	let media;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 1) {
			 sideBarItem = getSideBarItemById(state, state.selectedSideBarItem.id);
		}

		if ($$self.$$.dirty & /*state*/ 1) {
			 $$invalidate(2, folders = lib_1(state.sideBar.folders));
		}

		if ($$self.$$.dirty & /*state*/ 1) {
			 $$invalidate(3, documents = lib_1(state.sideBar.documents));
		}

		if ($$self.$$.dirty & /*state*/ 1) {
			 $$invalidate(4, media = lib_1(state.sideBar.media));
		}
	};

	return [state, focused, folders, documents, media];
}

class SideBar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { state: 0, focused: 1 });
	}
}

/* src/js/renderer/component/DocListItem.svelte generated by Svelte v3.22.3 */

function add_css() {
	var style = element("style");
	style.id = "svelte-cke80v-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}.doc.svelte-cke80v.svelte-cke80v{padding:0.5em 1em 0.5em;overflow-y:hidden;border-bottom:1px solid gray;contain:content}.doc.svelte-cke80v.svelte-cke80v:focus{outline:none}h2.svelte-cke80v.svelte-cke80v,p.svelte-cke80v.svelte-cke80v{margin:0;padding:0;pointer-events:none;word-break:break-word}h2.svelte-cke80v.svelte-cke80v{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px}p.svelte-cke80v.svelte-cke80v{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px;color:gray;height:4em;overflow:hidden}.selected.svelte-cke80v.svelte-cke80v{background-color:var(--clr-gray-lightest)}.focused.selected.svelte-cke80v.svelte-cke80v{background-color:#2d67fa}.focused.selected.svelte-cke80v h2.svelte-cke80v{color:white}.focused.selected.svelte-cke80v p.svelte-cke80v{color:rgba(255, 255, 255, 0.8)}";
	append(document.head, style);
}

function create_fragment$4(ctx) {
	let div;
	let h2;
	let t0;
	let t1;
	let p;
	let t2;
	let dispose;

	return {
		c() {
			div = element("div");
			h2 = element("h2");
			t0 = text(/*title*/ ctx[1]);
			t1 = space();
			p = element("p");
			t2 = text(/*excerpt*/ ctx[2]);
			attr(h2, "class", "svelte-cke80v");
			attr(p, "class", "svelte-cke80v");
			attr(div, "class", "doc svelte-cke80v");
			attr(div, "tabindex", "0");
			toggle_class(div, "focused", /*focused*/ ctx[3]);
			toggle_class(div, "selected", /*selected*/ ctx[0]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			append(div, h2);
			append(h2, t0);
			append(div, t1);
			append(div, p);
			append(p, t2);
			if (remount) dispose();
			dispose = listen(div, "click", prevent_default(/*click_handler*/ ctx[5]));
		},
		p(ctx, [dirty]) {
			if (dirty & /*title*/ 2) set_data(t0, /*title*/ ctx[1]);
			if (dirty & /*excerpt*/ 4) set_data(t2, /*excerpt*/ ctx[2]);

			if (dirty & /*focused*/ 8) {
				toggle_class(div, "focused", /*focused*/ ctx[3]);
			}

			if (dirty & /*selected*/ 1) {
				toggle_class(div, "selected", /*selected*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			dispose();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { selected = false } = $$props;
	let { title = "" } = $$props;
	let { excerpt = "" } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(4, state = $$props.state);
		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
		if ("title" in $$props) $$invalidate(1, title = $$props.title);
		if ("excerpt" in $$props) $$invalidate(2, excerpt = $$props.excerpt);
	};

	let focused;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 16) {
			 $$invalidate(3, focused = state.focusedLayoutSection == "navigation");
		}
	};

	return [selected, title, excerpt, focused, state, click_handler];
}

class DocListItem extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-cke80v-style")) add_css();

		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
			state: 4,
			selected: 0,
			title: 1,
			excerpt: 2
		});
	}
}

/* src/js/renderer/component/DocList.svelte generated by Svelte v3.22.3 */

const { window: window_1 } = globals;

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[25] = list[i];
	child_ctx[27] = i;
	return child_ctx;
}

// (322:4) {#each docs as doc, index (doc.id)}
function create_each_block$2(key_1, ctx) {
	let first;
	let current;

	function click_handler(...args) {
		return /*click_handler*/ ctx[23](/*index*/ ctx[27], ...args);
	}

	const doclistitem = new DocListItem({
			props: {
				state: /*state*/ ctx[1],
				title: /*doc*/ ctx[25].title,
				excerpt: /*doc*/ ctx[25].excerpt,
				selected: /*doc*/ ctx[25].selected
			}
		});

	doclistitem.$on("click", click_handler);

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(doclistitem.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(doclistitem, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const doclistitem_changes = {};
			if (dirty & /*state*/ 2) doclistitem_changes.state = /*state*/ ctx[1];
			if (dirty & /*docs*/ 4) doclistitem_changes.title = /*doc*/ ctx[25].title;
			if (dirty & /*docs*/ 4) doclistitem_changes.excerpt = /*doc*/ ctx[25].excerpt;
			if (dirty & /*docs*/ 4) doclistitem_changes.selected = /*doc*/ ctx[25].selected;
			doclistitem.$set(doclistitem_changes);
		},
		i(local) {
			if (current) return;
			transition_in(doclistitem.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(doclistitem.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(first);
			destroy_component(doclistitem, detaching);
		}
	};
}

function create_fragment$5(ctx) {
	let div3;
	let div1;
	let h1;
	let t0_value = /*sideBarItem*/ ctx[4].label + "";
	let t0;
	let t1;
	let div0;
	let label;
	let t3;
	let select_1;
	let option0;
	let option1;
	let option2;
	let t7;
	let div2;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let current;
	let dispose;
	let each_value = /*docs*/ ctx[2];
	const get_key = ctx => /*doc*/ ctx[25].id;

	for (let i = 0; i < each_value.length; i += 1) {
		let child_ctx = get_each_context$2(ctx, each_value, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
	}

	return {
		c() {
			div3 = element("div");
			div1 = element("div");
			h1 = element("h1");
			t0 = text(t0_value);
			t1 = space();
			div0 = element("div");
			label = element("label");
			label.textContent = "Sort By:";
			t3 = space();
			select_1 = element("select");
			option0 = element("option");
			option0.textContent = "Title";
			option1 = element("option");
			option1.textContent = "Date modified";
			option2 = element("option");
			option2.textContent = "Date created";
			t7 = space();
			div2 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(label, "for", "sort-select");
			option0.__value = "title";
			option0.value = option0.__value;
			option1.__value = "date-modified";
			option1.value = option1.__value;
			option2.__value = "date-created";
			option2.value = option2.__value;
			attr(select_1, "name", "Sort By");
			attr(select_1, "id", "sort-select");
			if (/*sort*/ ctx[5].by === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[22].call(select_1));
			attr(div0, "id", "sorting-options");
			attr(div1, "id", "header");
			attr(div2, "id", "docs");
			toggle_class(div2, "focused", /*focused*/ ctx[0]);
			attr(div3, "id", "docList");
		},
		m(target, anchor, remount) {
			insert(target, div3, anchor);
			append(div3, div1);
			append(div1, h1);
			append(h1, t0);
			append(div1, t1);
			append(div1, div0);
			append(div0, label);
			append(div0, t3);
			append(div0, select_1);
			append(select_1, option0);
			append(select_1, option1);
			append(select_1, option2);
			select_option(select_1, /*sort*/ ctx[5].by);
			append(div3, t7);
			append(div3, div2);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div2, null);
			}

			/*div2_binding*/ ctx[24](div2);
			current = true;
			if (remount) run_all(dispose);

			dispose = [
				listen(window_1, "keydown", /*handleKeydown*/ ctx[6]),
				listen(select_1, "change", /*select_1_change_handler*/ ctx[22]),
				listen(select_1, "change", /*selectionMade*/ ctx[8])
			];
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*sideBarItem*/ 16) && t0_value !== (t0_value = /*sideBarItem*/ ctx[4].label + "")) set_data(t0, t0_value);

			if (dirty & /*sort*/ 32) {
				select_option(select_1, /*sort*/ ctx[5].by);
			}

			if (dirty & /*state, docs, handleClick*/ 134) {
				const each_value = /*docs*/ ctx[2];
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div2, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
				check_outros();
			}

			if (dirty & /*focused*/ 1) {
				toggle_class(div2, "focused", /*focused*/ ctx[0]);
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
			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) detach(div3);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}

			/*div2_binding*/ ctx[24](null);
			run_all(dispose);
		}
	};
}

function getFirstSelectedFileIndex(docs) {
	return docs.findIndex(f => f.selected);
}

function getLastSelectedFileIndex(docs) {
	let l = docs.length;

	while (l--) {
		if (docs[l].selected) {
			break;
		}
	}

	return l;
}

async function scrollElementIntoView(element, animate = true) {
	if (element) {
		element.scrollIntoView({
			block: "nearest",
			inline: "start",
			behavior: animate ? "smooth" : "auto"
		});
	}
}

function instance$5($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { oldState = {} } = $$props;
	let { focused } = $$props;

	// Files
	let docs = [];

	let fileEl;
	let mounted = false;

	function onStateChange(state) {
		if (!mounted) return;

		if (state.changed.includes("selectedSideBarItem")) {
			saveOutgoingSideBarItemScrollPosition();
			$$invalidate(2, docs = getDocs());
			setScrollPosition();
		} else if (state.changed.includes("sort") || state.changed.includes("sideBar") || state.changed.includes("folders") || state.changed.includes("documents")) {
			$$invalidate(2, docs = getDocs());
		}
	}

	onMount(async () => {
		$$invalidate(2, docs = getDocs());
		setScrollPosition();
		mounted = true;
	});

	// -------- UTILITY METHODS -------- //
	function getDocs() {
		let docs = [];

		sideBarItem.files.forEach(file => {
			let doc = state.documents.find(d => d.id == file.id);
			doc.selected = file.selected;
			docs.push(doc);
		});

		return docs;
	}

	function saveOutgoingSideBarItemScrollPosition() {
		if (!fileEl || isEmpty(oldState.selectedSideBarItem)) return;

		window.api.send("dispatch", {
			type: "SAVE_SIDEBAR_SCROLL_POSITION",
			item: oldState.selectedSideBarItem,
			lastScrollPosition: fileEl.scrollTop
		});
	}

	async function setScrollPosition() {
		await tick();
		$$invalidate(3, fileEl.scrollTop = sideBarItem.lastScrollPosition, fileEl);
	}

	// -------- INTERACTIONS -------- //
	/**
 * Handle key presses
 * User can press arrow keys to navigate up/down the list
 * TODO: SideBar + DocList should be one unified focus area. Pressing arrows while clicking inside SideBar should translate into up/down inside DocList.
 */
	function handleKeydown(event) {
		if (!focused) return;
		const key = event.key;

		switch (key) {
			case "Tab":
				event.preventDefault();
				break;
			case "ArrowUp":
				{
					event.preventDefault();
					const firstSelected = getFirstSelectedFileIndex(docs);

					if (firstSelected > 0) {
						select(firstSelected - 1, event.shiftKey);
					}

					break;
				}
			case "ArrowDown":
				{
					event.preventDefault();
					const lastSelected = getLastSelectedFileIndex(docs);

					if (lastSelected < docs.length - 1) {
						select(lastSelected + 1, event.shiftKey);
					}

					break;
				}
		}
	}

	/**
 * Handle click, shift-click, and command-click events
 * - Click: select file
 * - Meta-click: toggle selected
 * - Shift-click, select range
 */
	function handleClick(event, index) {
		if (!event.metaKey && !event.shiftKey) {
			select(index, false);
		} else if (event.metaKey) {
			toggleSelected(index);
		} else if (event.shiftKey) {
			// Is anything selected?
			const isAnythingSelected = docs.some(f => f.selected);

			// If no, simply mark from start of list to clicked file (index)
			// If yes, logic is more complicated
			if (!isAnythingSelected) {
				selectRange(0, index);
			} else {
				// Find first and last currently-selected docs
				const firstSelected = getFirstSelectedFileIndex(docs);

				const lastSelected = getLastSelectedFileIndex(docs);

				// Set start and end depending on where user is clicking, relative to
				// currently-selected docs.
				if (index < firstSelected) {
					selectRange(index, firstSelected);
				} else if (index > lastSelected) {
					selectRange(lastSelected, index);
				} else if (index > firstSelected && index < lastSelected) {
					selectRange(firstSelected, index);
				}
			}
		}
	}

	// -------- SELECT -------- //
	function select(index, addToExistingSelection) {
		if (addToExistingSelection) {
			$$invalidate(2, docs[index].selected = true, docs);
		} else {
			docs.forEach((f, i) => {
				f.selected = i == index;
			});
		}

		scrollElementIntoView(fileEl.children[index], true);
		$$invalidate(2, docs);
		dispatchSelectionChangesToStore(docs);
	}

	function toggleSelected(index) {
		$$invalidate(2, docs[index].selected = !docs[index].selected, docs);
		$$invalidate(2, docs);
		dispatchSelectionChangesToStore(docs);
	}

	function selectRange(start, end) {
		for (let i = start; i <= end; i++) {
			$$invalidate(2, docs[i].selected = true, docs);
		}

		$$invalidate(2, docs);
		dispatchSelectionChangesToStore(docs);
	}

	/**
 * Set document `selected` property. First try to restore the `lastSelected` docs for the selected sideBar item. If there were none selected, select the first doc. Or if the selected docs no longer exist (e.g. after a deletion), select the next adjacent doc.
 * @param {} docs - Array of docs, as originally created by `updateDocList`.
 * @param {*} lastSelection - Array of objects: `{ index: 0, id: 'file-3234376' }`
 */
	function restoreLastSelection(docsBefore, lastSelection = []) {
		if (docsBefore.length == 0) return [];
		let docs = docsBefore;

		// Else, try to restore the selections.
		// If none of the previously-selected items exist in the updated `docs`, (e.g. in the case of a selected file being deleted), try to pick the next file. If already at the end of the list,
		// If there was a previous selections, try to restore it
		if (lastSelection.length > 0) {
			let isAtLeastOneFileSelected = false;

			// If current docs match lastSelection docs, select them
			docs.forEach(f => {
				if (lastSelection.some(s => s.id == f.id)) {
					f.selected = true;
					isAtLeastOneFileSelected = true;
				}
			});

			// If the previously selected docs do NOT exist any more (most commonly, after a selected doc was deleted), then try to select the "next" doc (the new doc at the same index number as the previously selected doc). Or if the previously-selected doc was last in the list, select the new last doc.
			if (!isAtLeastOneFileSelected) {
				if (lastSelection[0].index <= docs.length - 1) {
					docs[lastSelection[0].index].selected = true;
				} else {
					docs[docs.length - 1].selected = true;
				}
			}
		} else {
			// Else, just select the first file
			docs[0].selected = true;
		}

		dispatchSelectionChangesToStore(docs);
		return docs;
	}

	function dispatchSelectionChangesToStore(docs) {
		let selectedDocs = [];

		docs.forEach((f, i) => {
			if (f.selected) {
				selectedDocs.push({ index: i, id: f.id });
			}
		});

		window.api.send("dispatch", {
			type: "SELECT_FILES",
			sideBarItem,
			selectedFiles: selectedDocs
		});
	}

	// -------- DELETE -------- //
	window.api.receive("mainRequestsDeleteFile", deleteFile);

	function deleteFile() {
		let selectedPaths = [];

		docs.forEach((f, index) => {
			if (f.selected) {
				selectedPaths.push(f.path);
			}
		});

		if (selectedPaths.length == 1) {
			window.api.send("dispatch", {
				type: "DELETE_FILE",
				path: selectedPaths[0]
			});
		} else if (selectedPaths.length > 1) {
			window.api.send("dispatch", {
				type: "DELETE_FILES",
				paths: selectedPaths
			});
		}
	}

	// -------- SORT -------- //
	// Bind displayed value to state
	// When user makes selection, dispatch that selection to store. Store will update, and state will update. But there will be a delay, waiting for IPC...
	// So need to basically hold the user's selection in the interim. And when the new value from state comes down, apply it.
	// Have internal state. Sync to state when state changes.
	function selectionMade() {
		window.api.send("dispatch", {
			type: "SET_SORT",
			item: sideBarItem,
			sort
		});
	}

	function select_1_change_handler() {
		sort.by = select_value(this);
		(($$invalidate(5, sort), $$invalidate(4, sideBarItem)), $$invalidate(1, state));
	}

	const click_handler = (index, event) => handleClick(event, index);

	function div2_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(3, fileEl = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(1, state = $$props.state);
		if ("oldState" in $$props) $$invalidate(9, oldState = $$props.oldState);
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
	};

	let sideBarItem;
	let filter;
	let sort;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 2) {
			 $$invalidate(4, sideBarItem = getSideBarItemById(state, state.selectedSideBarItem.id));
		}

		if ($$self.$$.dirty & /*sideBarItem*/ 16) {
			 filter = sideBarItem.filter;
		}

		if ($$self.$$.dirty & /*sideBarItem*/ 16) {
			 $$invalidate(5, sort = sideBarItem.sort);
		}

		if ($$self.$$.dirty & /*state*/ 2) {
			 $$invalidate(0, focused = state.focusedLayoutSection == "navigation");
		}

		if ($$self.$$.dirty & /*state*/ 2) {
			 onStateChange(state);
		}
	};

	return [
		focused,
		state,
		docs,
		fileEl,
		sideBarItem,
		sort,
		handleKeydown,
		handleClick,
		selectionMade,
		oldState,
		mounted,
		filter,
		onStateChange,
		getDocs,
		saveOutgoingSideBarItemScrollPosition,
		setScrollPosition,
		select,
		toggleSelected,
		selectRange,
		restoreLastSelection,
		dispatchSelectionChangesToStore,
		deleteFile,
		select_1_change_handler,
		click_handler,
		div2_binding
	];
}

class DocList extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { state: 1, oldState: 9, focused: 0 });
	}
}

const yamlOverlay = {
  startState: function () {
    return {
      frontMatter: false,
    }
  },
  token: function (stream, state) {
    state.combineTokens = true;

    // Mark lines as `frontmatter`

    if (stream.sol()) {

      if (stream.match(/---/, false)) {
        state.frontMatter = state.frontMatter ? false : true;
        stream.next();
        return "line-frontmatter"
      }

      if (state.frontMatter) {
        stream.next();
        return "line-frontmatter"
      }
    }

    while (stream.next() != null) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
};

const markdownOverlay = {

  // State object: Is always passed when reading a token, and which can be mutated by the tokenizer.
  // Modes that use a state must define a `startState` method on their mode object.

  startState: () => {
    return {
      fencedCodeBlock: false,
      texMathDisplay: false,
    }
  },

  // Tokenizer (lexer): All modes must define this method. Takes a character stream as input, reads one token from the stream, advances it past a token, optionally update its state, and return a style string, or null for tokens that do not have to be styled.

  // Multiple styles can be returned (separated by spaces), for example "string error" for a thing that looks like a string but is invalid somehow (say, missing its closing quote). When a style is prefixed by "line-" or "line-background-", the style will be applied to the whole line

  // The stream object that's passed to token encapsulates a line of code (tokens may never span lines) and our current position in that line. 

  token: (stream, state) => {

    state.combineTokens = true;

    /*
    Style lines: We apply line styles in our overlay when we cannot apply them in the underlying markdown.js mode. This happens when we delegate styling to another mode, as in the case of fenced code blocks, TeX math, etc. 
    */

    if (stream.sol()) {

      // ----- Fenced code block: Style line ----- //

      // NOTE: Regex taken from underlying markdown mode
      if (!state.fencedCodeBlock && stream.match(/^(~~~+|```+)[ \t]*([\w+#-]*)[^\n`]*$/)) {
        state.fencedCodeBlock = true;
        stream.skipToEnd();
        return 'line-fencedcodeblock'
      } else if (state.fencedCodeBlock) {
        // If we've reached the end, stop the state
        if (stream.match(/^(~~~+|```+)/)) state.fencedCodeBlock = false;
        // console.log(stream)
        stream.skipToEnd();
        return 'line-fencedcodeblock'
      }

      // ----- TeX math equation: Style line ----- //
      
      // NOTE: Regex taken from underlying markdown mode
      if (!state.texMathDisplay && stream.match(/^\$\$$/)) {
        state.texMathDisplay = true;
        stream.skipToEnd();
        return 'line-texmath-display'
      } else if (state.texMathDisplay) {
        // If we've reached the end, stop the state
        if (stream.match(/^\$\$$/)) {
          state.texMathDisplay = false;
          stream.skipToEnd();
          return 'line-texmath-display md'
        } else {
          stream.skipToEnd();
          return 'line-texmath-display'
        }
      }
    }

    // Advance 
    if (stream.next() != null) ;

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  },

  blankLine: function (state) {

    // Style blank lines for multi-line 
    if (state.fencedCodeBlock) {
      return 'line-fencedcodeblock'
    } else if (state.texMathEquation) {
      return `line-texmath-display`
    }

    return
  }
};


/**
 * Define custom mode to be used with CodeMirror.
 */
function defineGambierMode() {
  CodeMirror.defineMode("gambier", (config, parsegrConfig) => {

    const START = 0, FRONTMATTER = 1, BODY = 2;

    const yamlMode = CodeMirror.overlayMode(CodeMirror.getMode(config, {
      name: "yaml"
    }), yamlOverlay);

    const markdownMode = CodeMirror.overlayMode(CodeMirror.getMode(config, {
      name: 'markdown',
      taskLists: true,
      strikethrough: true,
      fencedCodeBlockHighlighting: true,
      fencedCodeBlockDefaultMode: 'javascript',
      // highlightFormatting: true,
    }), markdownOverlay);

    function curMode(state) {
      return state.state == BODY ? markdownMode : yamlMode
    }

    return {
      startState: function () {
        return {
          state: START,
          inner: CodeMirror.startState(yamlMode)
        }
      },
      copyState: function (state) {
        return {
          state: state.state,
          inner: CodeMirror.copyState(curMode(state), state.inner)
        }
      },
      token: function (stream, state) {
        if (state.state == START) {
          if (stream.match(/---/, false)) {
            state.state = FRONTMATTER;
            return yamlMode.token(stream, state.inner)
          } else {
            state.state = BODY;
            state.inner = CodeMirror.startState(markdownMode);
            return markdownMode.token(stream, state.inner)
          }
        } else if (state.state == FRONTMATTER) {
          var end = stream.sol() && stream.match(/(---|\.\.\.)/, false);
          var style = yamlMode.token(stream, state.inner);
          if (end) {
            state.state = BODY;
            state.inner = CodeMirror.startState(markdownMode);
          }
          return style
        } else {
          return markdownMode.token(stream, state.inner)
        }
      },
      innerMode: function (state) {
        return { mode: curMode(state), state: state.inner }
      },
      blankLine: function (state) {
        var mode = curMode(state);

        // if (state.inner.overlay.fencedCodeBlock) return 'line-fencedcodeblock'
        if (mode.blankLine) return mode.blankLine(state.inner)
      }
    }
  });
}

// -------- WIDGET INTERACTIONS -------- //

/**
 * Ensure we can arrow the cursor smoothly from editor text into editable widget. This is called by keymap for arrow key presses. Depending on `direction`, checks if next character is the `start` or `end` of an editable widget, and if yes, positions cursor inside that widget.
 * @param {} direction 
 */
function arrow(cm, direction) {

  const editorState = cm.getEditorState();
  const inlineElements = editorState.inlineElements;

  if (editorState.sourceMode) return CodeMirror.Pass

  const cursor = cm.getCursor();

  let adjacentInlineEl = null;

  if (direction == 'toLeft') {
    adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.end == cursor.ch);
  } else if (direction == 'toRight') {
    adjacentInlineEl = inlineElements.find((e) => e.line == cursor.line && e.start == cursor.ch);
  }

  if (adjacentInlineEl && adjacentInlineEl.widget && adjacentInlineEl.widget.editable) {

    const sideWeEnterFrom = direction == 'toLeft' ? 'right' : 'left';
    adjacentInlineEl.widget.arrowInto(sideWeEnterFrom);

  } else {
    return CodeMirror.Pass
  }
}


/**
 * Tab to the previous element in the document
 */
function tabToPrevElement(cm) {

  const cursor = cm.getCursor();
  const editorState = cm.getEditorState();
  const sourceMode = editorState.sourceMode;
  const inlineElements = editorState.inlineElements;

  // Create array of "tabbable" elements. These are widgets, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
  let tabbableElements = [];
  if (!sourceMode) {
    tabbableElements = inlineElements.filter((e) => e.widget);
  } else {
    inlineElements.forEach((e) => {
      e.children.forEach((c) => {
        if (!c.collapsed && !c.classes.includes('md')) tabbableElements.push(c);
      });
    });
  }

  const element = tabbableElements.slice().reverse().find((e) =>
    e.line <= cursor.line &&
    // If entity is on same line as cursor, look backwards from current cursor ch.
    // Else, look backwards from end of line.
    e.end < (e.line == cursor.line ? cursor.ch : cm.getLineHandle(e.line).text.length)
  );

  // Find the closest tabbable element before the cursor.
  if (element) {
    // cm.setSelection({ line: element.line, ch: element.start }, { line: element.line, ch: element.end }, { scroll: true })
    cm.setEditorState({ type: 'selectWidget', target: element });
  }
}

/**
 * Tab to the next element in the document.
 */
function tabToNextElement(cm) {

  const cursor = cm.getCursor();
  const editorState = cm.getEditorState();
  const sourceMode = editorState.sourceMode;
  const inlineElements = editorState.inlineElements;

  // Create array of "tabbable" elements. These are widgets, unless we're in sourceMode, in which case they're element children (e.g. text, url, title).
  let tabbableElements = [];
  if (!sourceMode) {
    tabbableElements = inlineElements.filter((e) => e.widget);
  } else {
    inlineElements.forEach((e) => {
      e.children.forEach((c) => {
        if (!c.collapsed && !c.classes.includes('md')) tabbableElements.push(c);
      });
    });
  }

  // Find the next tabbable element
  const element = tabbableElements.find((e) =>
    e.line >= cursor.line &&
    // If entity is on same line as cursor, look forward from current cursor ch.
    // Else, look forward from start of line (zero).
    e.start >= (e.line == cursor.line ? cursor.ch : 0)
  );

  // Select and focus the element
  if (element) {
    // cm.setSelection({ line: element.line, ch: element.start }, { line: element.line, ch: element.end }, { scroll: true })
    cm.setEditorState({ type: 'selectWidget', target: element });
  }
}

/**
 * Make it hard to accidentally delete widgets by selecting them first. User must press again to then actually delete the item.
 * @param {*} keyPressed 
 */
function backspaceOrDelete(cm, keyPressed = '') {

  const cursor = cm.getCursor();
  const selection = { string: cm.getSelection() };
  const editorState = cm.getEditorState();
  const inlineElements = editorState.inlineElements;

  if (selection.string == '') {

    const adjacentWidgetEl = inlineElements.find((e) => e.line == cursor.line && e.widget && cursor.ch >= e.start && cursor.ch <= e.end);

    // Set anchor/head values in `cm.setSelection` to either start/end or end/start, depending on whether the key pressed was backspace or delete (aka: whether the selection is moving backwards or forwards). First `cm.setSelection` argument is `anchor`, and second is `head`. Per: https://codemirror.net/doc/manual.html#setSelection
    
    if (adjacentWidgetEl) {

      const cursorIsOnRight = cursor.ch == adjacentWidgetEl.end;
      const cursorIsOnLeft = cursor.ch == adjacentWidgetEl.start;  

      if (cursorIsOnRight && keyPressed == 'backspace') {
        // Moving backwarsd: Anchor at end
        cm.setSelection(
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.end },
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.start }
        );
      } else if (cursorIsOnLeft && keyPressed == 'delete') {
        // Moving forwards: Anchor at start
        cm.setSelection(
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.start },
          { line: adjacentWidgetEl.line, ch: adjacentWidgetEl.end }
        );
      } else {
        return CodeMirror.Pass
      }
    } else {
      return CodeMirror.Pass
    }
  } else {
    return CodeMirror.Pass
  }
}

/**
 * Mark text and replace with specified element.
 * @param {*} cm - Instance
 * @param {*} element - To render where the marked text used to be
 * @param {*} line - Of text to mark
 * @param {*} start - Of text to mark
 * @param {*} end - Of text to mark
 */

/**
 * Return a single character at the specified position
 */
function getCharAt(cm, line, ch = 0) {
  return cm.getRange(
    { line: line, ch: ch }, // from
    { line: line, ch: ch + 1 } // to
  )
}

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
function getTextFromRange(doc, line, start, end) {
  return doc.getRange({ line: line, ch: start }, { line: line, ch: end })
}

function createEditor (element, theme) {

  // Define "gambier" CodeMirror mode
  defineGambierMode();

  // const cm = CodeMirror.fromTextArea(textarea, {
  const cm = CodeMirror(element, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    indentWithTabs: false,
    // We use closebracket.js for character-closing behaviour.
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: {
      pairs: '**__()[]{}\'\'""',
      closeBefore: ')]}\'":;>',
      triples: '',
      explode: '[]{}',
    },
    // cursorScrollMargin: 20,
    // Turning on `keyMap: 'sublime'` activates -all- sublime keymaps. We instead want to pick and choose, using `extraKeys`
    // keyMap: 'sublime',
    extraKeys: {
      'Shift-Cmd-K': 'deleteLine',
      'Cmd-L': 'selectLine',
      'Shift-Alt-Down': 'duplicateLine',
      'Cmd-D': 'selectNextOccurrence',
      'Alt-Up': 'swapLineUp',
      'Alt-Down': 'swapLineDown',
      'Shift-Ctrl-Up': 'addCursorToPrevLine',
      'Shift-Ctrl-Down': 'addCursorToNextLine',
      Enter: 'newlineAndIndentContinueMarkdownList',
      Tab: 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList',
      // 'LeftDoubleClick': doubleClick,
      // 'Cmd-LeftClick': cmdClick,
      Left: () => arrow(cm, 'toLeft'),
      Right: () => arrow(cm, 'toRight'),
      'Alt-Tab': () => tabToNextElement(cm),
      'Shift-Alt-Tab': () => tabToPrevElement(cm),
      Backspace: () => backspaceOrDelete(cm, 'backspace'),
      Delete: () => backspaceOrDelete(cm, 'delete'),
      '[': () => {
        // When left-bracket key is pressed, set `autocomplete` flag
        const cursor = cm.getCursor();
        const previousChar = getCharAt(cm, cursor.line, cursor.ch - 1);
        return CodeMirror.Pass
      },
      // "'_'": () => wrapTecxt('_')
    },
  });

  cm.setOption("theme", theme);

  return cm
}

/**
 * Map `lineHandle.styles` and return an array of objects containing information about each class instance, it's start/end characters, etc. 
 * 
 * `lineHandle.styles` is strangely-formatted (but very useful) array of classes (e.g. `link inline text`) and the token number they end on. The format is number-followed-by-string——e.g. `24, "link inline text", 35, "link inline url"`——where `24` is the ending character of `link inline text`, and the starting character of `link inline url`. This array can also contain empty strings (e.g. "") and multiple consecutive numbers, which we need to ignore when parsing (they seem to belong to empty tokens).
 */
function getLineStyles(doc, lineHandle) {

  let styles = [];

  const lineNo = lineHandle.lineNo();

  // Check if array has anything we care about
  if (lineHandle.styles.some((s) => typeof s === 'string' && s !== '')) {
    lineHandle.styles.forEach((s, index) => {

      // Check if style has anything we care about
      if (typeof s === 'string' && s !== '') {

        // Two numbers preceding a class string and seperated by null, are the class's `start` and `end` values. Given `4, null, 6, "md footnote reference"`, 4 = start and 6 = end of "md footnote reference". `end` = the most-immediately preceding number (not string) in the array, before the class (s). `start` = the second-most-immediately preceding number

        let start = null;
        let end = 0;
        let counter = index;

        while (start == null) {
          counter--;
          if (typeof lineHandle.styles[counter] == 'number') {
            if (end == 0) {
              end = lineHandle.styles[counter];
            } else {
              // Fix for very annoying `lineHandle.styles` quirk: If a style starts at the first character of a line (0), the sequence of numbers looks like: `N, 3, "inline footnote malformed md"`, where `N` is the number of times the document has been loaded (very weird). In that case, we just set the first number to zero.
              start = counter == 0 ? 0 : lineHandle.styles[counter];
              // start = (counter == 0 && (lineHandle.styles[counter] == 1 || lineHandle.styles[counter] == 2)) ? 0 : lineHandle.styles[counter]
            }
          }
        }

        // Get line classes
        const lineClasses = lineHandle.styleClasses ? lineHandle.styleClasses.textClass : "";

        // Create the style object
        styles.push({
          text: getTextFromRange(doc, lineNo, start, end),
          classes: s.split(' '),
          lineClasses: lineClasses,
          start: start,
          end: end,
          collapsed: false,
          line: lineNo,
        });
      }
    });
  }

  return styles
}

/**
 * Return an array of the block elements in the doc. First, parse `lineHandle.styleClasses.textClass`
 * @param {*} cm 
 */
function getBlockElements(cm) {

  let blockElements = [];

  let doc = cm.getDoc();

  cm.operation(() => {
    cm.eachLine((lineHandle) => {

      // If line has no block element, return
      const lineHasBlockStyles = lineHandle.styleClasses !== undefined;
      if (!lineHasBlockStyles) {
        return
      }

      // Stub out element. This is what we populate below, then return.
      let el = {
        line: lineHandle.lineNo(),
      };

      // lineHandles contain a list of block-level classes in the (confusingly-named) `stylesClasses.textClass` property.
      const blockStyles = lineHandle.styleClasses.textClass;

      // Parse styles
      if (blockStyles.includes('header')) {

        // Header
        el.type = 'header';
        el.level = blockStyles.match(/h\d/)[0].substring(1);

      } else if (blockStyles.includes('link-reference-definition')) {

        const lineStyles = getLineStyles(cm, lineHandle);

        // Link reference definition
        el.type = 'link-reference-definition';

        const labelClass = lineStyles.find((l) => l.classes.some((c) => c.includes('label')));

        el.label = {
          string: labelClass.text,
          start: labelClass.start,
          end: labelClass.end
        };

        const urlClass = lineStyles.find((l) => l.classes.some((c) => c.includes('url')));

        el.url = {
          string: urlClass.text,
          start: urlClass.start,
          end: urlClass.end
        };

        const titleClass = lineStyles.find((l) => l.classes.some((c) => c.includes('title')));

        el.title = {
          string: titleClass ? titleClass.text : '',
          start: titleClass ? titleClass.start : el.url.end + 1,
          end: titleClass ? titleClass.end : el.url.end + 1
        };
        // }

      } else if (blockStyles == 'footnote-reference-definition') {

        const lineStyles = getLineStyles(cm, lineHandle);

        // Footnote reference definition
        el.type = 'footnote-reference-definition';

        const labelClass = lineStyles.find((l) => l.classes.some((c) => c.includes('label')));

        el.label = {
          string: labelClass.text,
          start: labelClass.start,
          end: labelClass.end
        };

        const regex = lineHandle.text.match(/^(\[\^.*?\]:\s)(.*?)$/m);
        const footnoteContent = regex[2];
        const labelEnd = regex[1].length;
        const footnoteEnd = lineHandle.text.length;

        // Get text content of the block (everything after `[^id]: `)
        el.content = {
          string: footnoteContent,
          start: labelEnd,
          end: footnoteEnd
        };

        // Footnote reference definitions can span multiple lines: "Subsequent paragraphs are indented to show that they belong to the previous footnote." — https://pandoc.org/MANUAL.html#footnotes. So we check if the next line has style `footnote-reference-definition-continued`. If yes, we set `multiline: true` flag.

        const definitionSpansMultipleLines = () => {
          const nextLineHandle = doc.getLineHandle(el.line + 1);
          return nextLineHandle.styleClasses && nextLineHandle.styleClasses.textClass == 'footnote-reference-definition-continued' ? true : false
        };

        el.multiline = definitionSpansMultipleLines();

      } else if (blockStyles.includes('quote')) {

        // Block quote
        el.type = 'blockquote';

      }

      // Push the element (as long as it's not `footnote-reference-definition-continued`)
      if (blockStyles !== 'footnote-reference-definition-continued') {
        blockElements.push(el);
      }
    });
  });

  return blockElements
}

/**
 * Return an array of the inline elements on the line. First, parse `lineHandle.styles`, to create an array of the style objects on the line, and their start/stop points. Then pass this array to parsers for each element (citations, links, etc). These parsers create an object for each element, with it's details (e.g. string, start and end characters, url (in case of link)). We return an array of all the elements we find on the line.
 */
function getInlineElementsForLine(cm, lineHandle) {

  const doc = cm.getDoc();
  const blockElements = cm.getEditorState().blockElements;
  const lineNo = lineHandle.lineNo();


  // ---------- 0. Check if line has entities ---------- //

  let elements = [];

  // If line is blank, or has no styles, return empty array

  const blockStyles = lineHandle.styleClasses ? lineHandle.styleClasses.textClass : '';
  const lineHasInlineStyles = lineHandle.styles && lineHandle.styles.some((s) => typeof s === 'string' && s !== '');

  const lineIsBlank = !lineHasInlineStyles;

  if (lineIsBlank) return []


  // ---------- 1. Create array of styles ---------- //

  let styles = getLineStyles(doc, lineHandle);

  // console.log(styles)

  // If styles are empty, return empty array
  if (styles === []) return []


  // ---------- 2. Find entities ---------- //

  let element;

  // Citations
  styles.forEach((s) => {
    if (s.classes.includes('citation')) {
      if (s.classes.includes('md') && s.text == '[') {
        element = {
          line: s.line,
          type: 'citation',
          string: '',
          start: s.start,
          end: 0,
          children: []
        };
        elements.push(element);
        // entities.citations.push(newEntity)
      } else if (s.classes.includes('md') && s.text == ']') {
        element.end = s.end;
      }
      element.children.push(s);
      element.string = getTextFromRange(doc, lineNo, element.start, element.end);
    }
  });

  // Fenced code blocks
  // styles.forEach((s) => {
  //   if (s.classes.includes('fenc')) {
  //     if (s.classes.includes('md') && s.text == '[') {
  //       newEntity = {
  //         start: s.start,
  //         end: 0,
  //         children: []
  //       }
  //       entities.citations.push(newEntity)
  //     } else if (s.classes.includes('md') && s.text == ']') {
  //       newEntity.end = s.end
  //     }
  //     newEntity.children.push(s)
  //     newEntity.text = getTextFromRange(doc, lineNo, newEntity.start, newEntity.end)
  //   }
  // })

  // Footnotes
  styles.forEach((s) => {
    if (s.classes.includes('footnote') && s.classes.includes('inline')) {

      // console.log(s)

      // Footnote: Inline

      if (s.text == '^[]' && s.classes.includes('malformed')) {
        element = {
          line: s.line,
          type: 'footnote-inline',
          string: '',
          start: s.start,
          end: s.end,
          children: [],
          error: 'empty'
        };
        elements.push(element);
      } else {
        if (s.text == '^[') {
          element = {
            line: s.line,
            type: 'footnote-inline',
            string: '',
            start: s.start,
            end: 0,
            children: [],
            error: false
          };
          elements.push(element);
        } else if (s.classes.includes('content')) {
          element.content = {
            string: getTextFromRange(doc, lineNo, s.start, s.end),
            start: s.start,
            end: s.end
          };
        } else if (s.text == ']') {
          element.end = s.end;
          element.string = getTextFromRange(doc, lineNo, element.start, element.end);
        }
      }
      element.children.push(s);

    } else if (s.classes.includes('footnote') && s.classes.includes('reference') && !s.classes.includes('anchor')) {

      // Footnote: Reference

      // If the footnote is at the start of a footnote reference definition line, we skip it. We determine this by the presence of the `anchor` style.

      if (s.text == '[^') {
        element = {
          line: s.line,
          type: 'footnote-reference',
          string: '',
          start: s.start,
          end: 0,
          children: [],
          error: false
        };
        elements.push(element);
      } else if (s.classes.includes('label')) {
        element.label = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        };

        // Get definition
        const definition = blockElements.find((e) => e.type.includes('footnote-reference-definition') && e.label.string == element.label.string
        );

        if (definition) {
          element.definition = {
            exists: true,
            line: definition.line,
            start: definition.content.start,
            end: definition.content.end,
            string: definition.content.string,
          };
        } else {
          element.error = 'missing-definition';
        }

      } else if (s.text == ']') {
        element.end = s.end;
        element.string = getTextFromRange(doc, lineNo, element.start, element.end);
      }
      element.children.push(s);

    }
  });

  // Links & Images
  styles.forEach((s) => {
    if (s.classes.includes('image') || s.classes.includes('link')) {

      // if (!s.classes.includes('link') || blockStyles.includes('link-reference-definition')) return
      if (blockStyles.includes('link-reference-definition')) return

      // Create element when we find link opening character.
      // `!` for images, and `[` for non-images
      if ((s.classes.includes('image') && s.text == '!') || s.classes.includes('link') && s.text == '[') {

        element = {
          line: s.line,
          type: '',
          string: '',
          start: s.start,
          end: 0,
          children: [],
          error: false
        };

        elements.push(element);
      }

      if (s.classes.includes('text')) {

        // Text
        element.text = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        };
      } else if (s.classes.includes('url')) {

        // URL
        element.url = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        };
      } else if (s.classes.includes('title')) {

        // Title
        element.title = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        };
      } else if (s.classes.includes('label')) {

        // Label
        element.label = {
          string: getTextFromRange(doc, lineNo, s.start, s.end),
          start: s.start,
          end: s.end
        };

        // If it has a label, it's a reference link.
        // Get definition
        const definition = blockElements.find((e) => e.type.includes('reference-definition') && e.label.string == element.label.string
        );

        if (definition) {
          element.definitionLine = definition.line;
          element.url = definition.url;
          element.title = definition.title;
        } else {
          element.error = 'missing-definition';
        }

      } else if (s.classes.includes('md') && (s.text.slice(-1) == ')' || s.text == ']' || s.text == '][]')) {

        // Close link, and flag errors

        element.end = s.end;

        // Set type
        const imageOrLink = s.classes.includes('image') ? 'image' : 'link';
        const inlineOrRef = s.classes.includes('inline') ? 'inline' : 'reference';
        let refStyle = '';
        if (s.classes.includes('full')) {
          refStyle = '-full';
        } else if (s.classes.includes('collapsed')) {
          refStyle = '-collapsed';
        } else if (s.classes.includes('shortcut')) {
          refStyle = '-shortcut';
        }
        element.type = `${imageOrLink}-${inlineOrRef}${refStyle}`;

        // Set string
        element.string = getTextFromRange(doc, lineNo, element.start, element.end);

        // Set text (if it wasn't set above). Only applies to inline and full reference links/images. 
        if (!element.text && refStyle !== '-collapsed' && refStyle !== '-shortcut') {
          // Text should be inserted right after the opening `[` character.
          const start = imageOrLink == 'image' ? element.start + 2 : element.start + 1;
          element.text = { string: '', start: start, end: start };
        }

        // Set URL (if it wasn't set above). Only applies to inline links/images. Starts two characters after end of `text`.
        if (!element.url && element.type.includes('inline')) {
          const start = element.text.end + 2;
          element.url = { string: '', start: start, end: start };
          element.error = 'missing-url';
        }

        // Set title (if it wasn't set above). Only applies to inline link/images. Starts right before ending `]` character.
        if (!element.title && element.type.includes('inline')) {
          element.title = { string: '', start: element.end - 1, end: element.end - 1 };
        }
      }

      element.children.push(s);

    }
  });

  // console.log(elements)

  // Sort entites by start value
  elements.sort((a, b) => a.start - b.start);

  return elements
}

/**
 * Create TextMarkers for links. 
 */
function markText(cm, lineNo, elements, type) {

  const cursor = cm.getCursor();
  const editorState = cm.getEditorState();
  const sourceMode = editorState.sourceMode;

  if (sourceMode) return

  elements.forEach((e) => {


    // -------- PROPERTIES -------- //

    // if (type == 'links') console.log(e)

    // Shared
    e.widget = {
      editable: false,
      displayedString: '',
      element: undefined,
      classes: []
    };

    // Set `editable`
    switch (type) {
      case 'links':
        e.widget.editable = true;
        e.widget.arrowInto = arrowedInto; // Method
        break
      case 'images':
      case 'footnotes':
      case 'citations':
        e.widget.editable = false;
        break
    }

    // Set `content` and `displayedString`
    if (!e.widget.editable) {

      switch (type) {
        case 'images':
          e.widget.displayedString = 'i';
          break
        case 'footnotes':
          e.widget.displayedString = '';
          break
        case 'citations':
          e.widget.displayedString = 'c';
          break
      }

    } else {

      // The `e.widget.content` property is a reference to the property from the original link that we display and edit. In the case of inline and full reference links, it is the `text` property. For collapsed and shortcut reference links, it is the `label`.
      if (e.type.includes('inline') || e.type.includes('reference-full')) {
        e.widget.content = e.text;
      } else if (e.type.includes('reference-collapsed') || e.type.includes('reference-shortcut')) {
        e.widget.content = e.label;
      }

      e.widget.displayedString = e.widget.content.string;

    }

    // Set classes
    switch (type) {
      case 'links':
        e.widget.classes.push('cm-link', 'widget');
        e.widget.classes.push(e.type.includes('inline') ? 'inline' : 'reference');
        break
      case 'images':
        e.widget.classes.push('cm-image', 'widget');
        e.widget.classes.push(e.type.includes('inline') ? 'inline' : 'reference');
        break
      case 'footnotes':
        e.widget.classes.push('cm-footnote', 'widget');
        e.widget.classes.push(e.type.includes('inline') ? 'inline' : 'reference');
        break
      case 'citations':
        e.widget.classes.push('cm-citation', 'widget');
        break
    }

    if (e.widget.editable) e.widget.classes.push('editable');
    if (e.error) e.widget.classes.push('error');


    // -------- CREATE TEXTMARKER -------- //

    const frag = document.createDocumentFragment();
    const wrapper = e.widget.element = document.createElement('span');
    e.widget.classes.forEach((c) => wrapper.classList.add(c));
    wrapper.innerText = `${e.widget.displayedString}`;
    wrapper.setAttribute('tabindex', -1);
    frag.append(wrapper);

    if (e.widget.editable) {
      wrapper.setAttribute('contenteditable', true);
    }

    if (e.type.includes('reference')) {
      const arrow = document.createElement('span');
      // arrow.className = wrapper.className
      arrow.classList.add('select');
      wrapper.append(arrow);
    }

    // Mark text
    cm.markText({ line: lineNo, ch: e.start }, { line: lineNo, ch: e.end }, {
      replacedWith: frag,
      handleMouseEvents: false,
    });


    // -------- POSITION CURSOR -------- //

    // Position cursor inside `contenteditable` at same position, if the widget is editable, and cursor was inside the new widget's start/stop values.
    if (e.widget.editable) {
      const cursorPosWasInsideNewInputRange = cursor.line == lineNo && cursor.ch > e.start && cursor.ch < (e.start + wrapper.innerText.length + 2);

      if (cursorPosWasInsideNewInputRange) {
        setTimeout(() => {
          const range = document.createRange();
          const sel = window.getSelection();
          range.setStart(wrapper.childNodes[0], cursor.ch - e.start - 1);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          wrapper.focus();
        }, 0);
      }
    }


    // -------- STATE CHANGES -------- //

    cm.on('editorStateChanged', (changed) => {
      if (changed.includes('widget')) {
        if (editorState.widget.target == e && editorState.widget.isSelected) {
          highlight();
        }
      } else if (changed.includes('selections')) {
        editorState.selections.forEach((s) => {

          let from, to;

          // Each selection gives a head and anchor objects, with `line` and `ch`. We need to figure out which is `from`, and which is `to`. From is whichever is on the earlier line. Or, if anchor and head are on same line, from is whichever has the earlier character.
          if (s.anchor.line < s.head.line) {
            from = s.anchor;
            to = s.head;
          } else if (s.anchor.line > s.head.line) {
            from = s.head;
            to = s.anchor;
          } else if (s.anchor.line == s.head.line) {
            from = s.anchor.ch <= s.head.ch ? s.anchor : s.head;
            to = s.anchor.ch >= s.head.ch ? s.anchor : s.head;
          }

          let isInsideSelection = false;

          const isSingleLineSelection = from.line == to.line;
          if (isSingleLineSelection) {
            isInsideSelection = e.line == from.line && e.start >= from.ch && e.end <= to.ch;
          } else {
            if (e.line > from.line && e.line < to.line) {
              isInsideSelection = true;
            } else if (e.line == from.line && e.start >= from.ch) {
              isInsideSelection = true;
            } else if (e.line == to.line && e.end <= to.ch) {
              isInsideSelection = true;
            }
          }

          if (isInsideSelection) {
            highlight();
          } else {
            deHighlight();
          }
        });
      }
    });


    // -------- UTILITY FUNCTIONS -------- //

    function openURL() {
      const url = e.type.includes('inline') ? e.url.string : e.definition.url.string;
      if (url && url !== '') {
        // console.log(`Open URL: ${url}`)
        window.api.send('openUrlInDefaultBrowser', url);
      }
    }

    function highlight() {
      wrapper.classList.add('highlight');
    }

    function deHighlight() {
      wrapper.classList.remove('highlight');
    }

    function deleteSelf() {
      cm.replaceRange('', { line: e.line, ch: e.start }, { line: e.line, ch: e.end });
      cm.focus();
    }

    // Editable-only:

    // Focus contenteditable and place cursor at start or end.
    // Called by editor.js
    function arrowedInto(sideWeEnterFrom) {
      const placeCursorAt = sideWeEnterFrom == 'right' ? wrapper.innerText.length : 0;
      const range = document.createRange();
      const sel = window.getSelection();
      range.setStart(wrapper.childNodes[0], placeCursorAt);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      wrapper.focus();
    }

    function exitAndWriteChanges(evt) {
      if (wrapper.innerText !== e.widget.content.string) {
        cm.replaceRange(
          wrapper.innerText,
          { line: e.line, ch: e.widget.content.start },
          { line: e.line, ch: e.widget.content.end }
        );
      }
    }

    // -------- EVENT LISTENERS: SHARED -------- //

    wrapper.addEventListener('mouseenter', (evt) => {
      cm.setEditorState({ type: 'hoverWidget', target: e });
    });

    wrapper.addEventListener('mouseleave', (evt) => {
      cm.setEditorState({ type: 'hoverWidget', target: null });
    });

    // Double click: prevent double-clicks from triggering a second mouse down action.
    wrapper.addEventListener('mousedown', (evt) => {
      if (evt.detail > 1 || evt.metaKey) evt.preventDefault();
    });


    // -------- EVENT LISTENERS: NON-EDITABLE -------- //

    if (!e.widget.editable) {

      // Click
      wrapper.addEventListener('click', (evt) => {
        if (evt.metaKey) {
          evt.preventDefault();
          if (e.type.includes('link') || e.type.includes('image')) {
            openURL();
          }
        } else {
          cm.setEditorState({ type: 'selectWidget', target: e });
        }
      });
    }


    // -------- EVENT LISTENERS: EDITABLE -------- //

    if (e.widget.editable) {

      // Click
      wrapper.addEventListener('click', (evt) => {
        if (evt.metaKey) {
          evt.preventDefault();
          if (e.type.includes('link') || e.type.includes('image')) {
            openURL();
          }
        } else {
          // Clear existing editor text selection, otherwise it will remain visible while the cursor is inside the contenteditable.
          cm.setCursor(e.line, e.end);
          // contenteditable will focus automatically
        }
      });

      // Double-click
      wrapper.addEventListener('dblclick', (evt) => {
        if (!evt.metaKey) {
          cm.setEditorState({ type: 'selectWidget', target: e });
        }
      });

      // Keydown
      wrapper.addEventListener('keydown', (evt) => {

        if (evt.key == 'Backspace' || evt.key == 'Delete') {
          // Delete self on backspace or delete keydown, if focused
          if (document.activeElement == wrapper) {
            deleteSelf();
          }
        } else if (evt.key == 'ArrowLeft') {
          const atLeftEdge = window.getSelection().getRangeAt(0).endOffset == 0;
          if (atLeftEdge) {
            cm.setCursor(e.line, e.start);
            cm.focus();
          }
        } else if (evt.key == 'ArrowRight') {
          const atRightEdge = window.getSelection().getRangeAt(0).endOffset == wrapper.innerText.length;
          if (atRightEdge) {
            cm.setCursor(e.line, e.end);
            cm.focus();
          }
        } else if (evt.key == 'Tab' && evt.altKey) {
          // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
          evt.preventDefault();
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 9, altKey: true, shiftKey: evt.shiftKey });
        }
      });


      // Add `{ once: true }` to prevent errors when clicking outside the edited field.
      wrapper.addEventListener('blur', (evt) => {
        exitAndWriteChanges();
      }, { once: true });
    }
  });
}

// -------- LOAD, FOCUS, TOGGLE -------- //

/**
 * Save editor contents to filepath
 */
function saveFile(cm, filePath) {
  window.api.send('dispatch', {
    type: 'SAVE_FILE',
    path: filePath,
    data: cm.getValue(),
  });
}

/**
 * Load file at `filePath` from disk, and load it's value into editor.
 */
async function loadFileByPath(cm, filePath) {
  if (filePath == '') {

    // Clear editor content and history
    cm.swapDoc(CodeMirror.Doc(''));

  } else {

    // Load file into editor
    const file = await window.api.invoke('getFileByPath', filePath, 'utf8');

    // "Each editor is associated with an instance of CodeMirror.Doc, its document. A document represents the editor content, plus a selection, an undo history, and a mode. A document can only be associated with a single editor at a time. You can create new documents by calling the CodeMirror.Doc(text: string, mode: Object, firstLineNumber: ?number, lineSeparator: ?string) constructor" — https://codemirror.net/doc/manual.html#Doc

    cm.swapDoc(CodeMirror.Doc(file, 'gambier'));

    // Map, mark and focus the editor
    cm.focus();
    mapDoc(cm);
    markDoc(cm);
    focusEditor(cm);

    // TODO 10/29: Been disabled for a while.
    // Update media path
    // mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'))
    // console.log(`mediaBasePath is ${mediaBasePath}`)
  }
}

/**
 * TODO 10/1: Restore cursor position in document. As is we're just setting it to the end of the document.
 * @param {*} cm 
 */
function focusEditor(cm) {
  setTimeout(() => {
    cm.focus();
    cm.setCursor({
      line: cm.lastLine(),
      ch: cm.getLine(cm.lastLine()).length,
    });
  }, 0);
}

/**
 * Called when `sourceMode` state changes. Re-runs the doc marking logic.
 * If `sourceMode` is true, we render plain markup, without widgets.
 */
function toggleSource(cm) {

  // Focus the editor first. If we don't do this, and the cursor is inside an editable widget when the toggle is flipped, we get an error.
  clearDocMarks(cm);
  markDoc(cm);
}

/**
 * Find each element in the loaded document, and save their information into block and inline element arrays, in editorState. We use these arrays to then mark the document, help drive interactions, etc.
 * 
 */
function mapDoc(cm) {

  const editorState = cm.getEditorState();

  // Map block elements
  editorState.blockElements = getBlockElements(cm);

  // Map inline elements
  editorState.inlineElements = [];
  cm.operation(() => {
    cm.eachLine((lineHandle) => {
      // Find elements in line
      const lineElements = getInlineElementsForLine(cm, lineHandle);
      // Add them (concat) to `editorState.inlineElements`
      if (lineElements.length) {
        editorState.inlineElements = editorState.inlineElements.concat(lineElements);
      }
    });
  });
}


/**
 * Remap inline elements for a single line.
 */
function remapInlineElementsForLine(cm, lineHandle) {

  const editorState = cm.getEditorState();
  const inlineElements = editorState.inlineElements;
  const lineNo = lineHandle.lineNo();

  let fromIndex = null;
  let toIndex = null;

  // Find the `from` and `to` index values of existing elements (in `editorState.inlineElements`) of the same line. We use these index values to remove them, below.
  inlineElements.forEach((il, index) => {
    if (il.line == lineNo) {
      if (fromIndex == null) {
        fromIndex = index;
      } else {
        toIndex = index;
      }
    }
  });
  if (toIndex == null) toIndex = fromIndex;

  // Get new line elements
  const lineElements = getInlineElementsForLine(cm, lineHandle);

  // Update inlineElements array by 1) deleting existing same-line elements, and 2) inserting new line elements
  inlineElements.splice(fromIndex, toIndex - fromIndex + 1, ...lineElements);
}

/**
 * Mark all lines in the document
 */
function markDoc(cm) {
  cm.getAllMarks().forEach((mark) => mark.clear());
  cm.operation(() => {
    cm.eachLine((lineHandle) => markLine(cm, lineHandle));
  });
}

/**
 * Mark selected line
 */
function markLine(cm, lineHandle) {

  const editorState = cm.getEditorState();
  const lineNo = lineHandle.lineNo();

  let links = [];
  let images = [];
  let footnotes = [];

  editorState.inlineElements.forEach((e) => {
    if (e.line !== lineNo) return
    if (e.type.includes('link') && !e.type.includes('image')) {
      links.push(e);
    } else if (e.type.includes('image')) {
      images.push(e);
    } else if (e.type.includes('footnote')) {
      footnotes.push(e);
    }
  });

  if (links.length) {
    markText(cm, lineNo, links, 'links');
  }

  if (images.length) {
    markText(cm, lineNo, images, 'images');
  }

  if (footnotes.length) {
    markText(cm, lineNo, footnotes, 'footnotes');
  }
}

/**
 * Clear marks from a line
 */
function clearLineMarks(cm, lineHandle) {
  const lineNo = lineHandle.lineNo();
  const lineLength = lineHandle.text.length;
  const lineMarks = cm.findMarks({ line: lineNo, ch: 0 }, { line: lineNo, ch: lineLength });
  lineMarks.forEach((m) => m.clear());
}

/**
 * Clear all marks from the document
 */
function clearDocMarks(cm) {
  cm.getAllMarks().forEach((m) => m.clear());
}

/* src/js/renderer/component/wizard/ReferenceLabelSelect.svelte generated by Svelte v3.22.3 */

function create_fragment$6(ctx) {
	let label_1;
	let t0;
	let t1;
	let input;
	let input_value_value;
	let dispose;

	return {
		c() {
			label_1 = element("label");
			t0 = text(/*label*/ ctx[1]);
			t1 = space();
			input = element("input");
			attr(label_1, "for", "id");
			attr(label_1, "required", "");
			attr(input, "type", "text");
			attr(input, "name", "label");
			attr(input, "id", "label");
			input.required = true;
			input.value = input_value_value = /*target*/ ctx[0].label.string;
		},
		m(target, anchor, remount) {
			insert(target, label_1, anchor);
			append(label_1, t0);
			insert(target, t1, anchor);
			insert(target, input, anchor);
			if (remount) dispose();
			dispose = listen(input, "input", /*input_handler*/ ctx[2]);
		},
		p(ctx, [dirty]) {
			if (dirty & /*label*/ 2) set_data(t0, /*label*/ ctx[1]);

			if (dirty & /*target*/ 1 && input_value_value !== (input_value_value = /*target*/ ctx[0].label.string) && input.value !== input_value_value) {
				input.value = input_value_value;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(label_1);
			if (detaching) detach(t1);
			if (detaching) detach(input);
			dispose();
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let { target } = $$props;
	let { label } = $$props;
	const input_handler = e => handleInput(e.target.value, target.label.start, target.label.end);

	$$self.$set = $$props => {
		if ("target" in $$props) $$invalidate(0, target = $$props.target);
		if ("label" in $$props) $$invalidate(1, label = $$props.label);
	};

	return [target, label, input_handler];
}

class ReferenceLabelSelect extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { target: 0, label: 1 });
	}
}

/* src/js/renderer/component/wizard/ImagePreview.svelte generated by Svelte v3.22.3 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-157703x-style";
	style.textContent = "img.svelte-157703x{width:6em;height:6em;background-color:red}";
	append(document.head, style);
}

function create_fragment$7(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (img.src !== (img_src_value = /*url*/ ctx[0])) attr(img, "src", img_src_value);
			attr(img, "class", "svelte-157703x");
		},
		m(target, anchor) {
			insert(target, img, anchor);
		},
		p(ctx, [dirty]) {
			if (dirty & /*url*/ 1 && img.src !== (img_src_value = /*url*/ ctx[0])) {
				attr(img, "src", img_src_value);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(img);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { url = null } = $$props;

	$$self.$set = $$props => {
		if ("url" in $$props) $$invalidate(0, url = $$props.url);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*url*/ 1) ;
	};

	return [url];
}

class ImagePreview extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-157703x-style")) add_css$1();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { url: 0 });
	}
}

/* src/js/renderer/component/wizard/Link.svelte generated by Svelte v3.22.3 */

function create_if_block_5(ctx) {
	let textarea;
	let textarea_value_value;
	let dispose;

	return {
		c() {
			textarea = element("textarea");
			attr(textarea, "type", "text");
			attr(textarea, "name", "text");
			attr(textarea, "id", "text");
			textarea.required = true;
			textarea.value = textarea_value_value = /*target*/ ctx[0].content.string;
		},
		m(target, anchor, remount) {
			insert(target, textarea, anchor);
			if (remount) dispose();
			dispose = listen(textarea, "input", /*input_handler_5*/ ctx[11]);
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && textarea_value_value !== (textarea_value_value = /*target*/ ctx[0].content.string)) {
				textarea.value = textarea_value_value;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(textarea);
			dispose();
		}
	};
}

// (140:42) 
function create_if_block_4(ctx) {
	let label0;
	let t1;
	let input0;
	let input0_value_value;
	let t2;
	let label1;
	let t4;
	let input1;
	let input1_value_value;
	let t5;
	let label2;
	let t7;
	let input2;
	let input2_value_value;
	let t8;
	let current;
	let dispose;

	const imagepreview = new ImagePreview({
			props: { url: /*target*/ ctx[0].url.string }
		});

	return {
		c() {
			label0 = element("label");
			label0.textContent = "URL";
			t1 = space();
			input0 = element("input");
			t2 = space();
			label1 = element("label");
			label1.textContent = "Alt";
			t4 = space();
			input1 = element("input");
			t5 = space();
			label2 = element("label");
			label2.textContent = "Title";
			t7 = space();
			input2 = element("input");
			t8 = space();
			create_component(imagepreview.$$.fragment);
			attr(label0, "for", "url");
			attr(label0, "required", "");
			attr(input0, "type", "text");
			attr(input0, "name", "url");
			attr(input0, "id", "url");
			input0.required = true;
			input0.value = input0_value_value = /*target*/ ctx[0].url.string;
			attr(label1, "for", "text");
			attr(label1, "required", "");
			attr(input1, "type", "text");
			attr(input1, "name", "text");
			attr(input1, "id", "text");
			input1.value = input1_value_value = /*target*/ ctx[0].text.string;
			attr(label2, "for", "title");
			attr(input2, "type", "text");
			attr(input2, "name", "title");
			attr(input2, "id", "title");
			input2.value = input2_value_value = stripTitleWrappers(/*target*/ ctx[0].title.string);
		},
		m(target, anchor, remount) {
			insert(target, label0, anchor);
			insert(target, t1, anchor);
			insert(target, input0, anchor);
			insert(target, t2, anchor);
			insert(target, label1, anchor);
			insert(target, t4, anchor);
			insert(target, input1, anchor);
			insert(target, t5, anchor);
			insert(target, label2, anchor);
			insert(target, t7, anchor);
			insert(target, input2, anchor);
			insert(target, t8, anchor);
			mount_component(imagepreview, target, anchor);
			current = true;
			if (remount) run_all(dispose);

			dispose = [
				listen(input0, "input", /*input_handler_2*/ ctx[8]),
				listen(input1, "input", /*input_handler_3*/ ctx[9]),
				listen(input2, "input", /*input_handler_4*/ ctx[10])
			];
		},
		p(ctx, dirty) {
			if (!current || dirty & /*target*/ 1 && input0_value_value !== (input0_value_value = /*target*/ ctx[0].url.string) && input0.value !== input0_value_value) {
				input0.value = input0_value_value;
			}

			if (!current || dirty & /*target*/ 1 && input1_value_value !== (input1_value_value = /*target*/ ctx[0].text.string) && input1.value !== input1_value_value) {
				input1.value = input1_value_value;
			}

			if (!current || dirty & /*target*/ 1 && input2_value_value !== (input2_value_value = stripTitleWrappers(/*target*/ ctx[0].title.string)) && input2.value !== input2_value_value) {
				input2.value = input2_value_value;
			}

			const imagepreview_changes = {};
			if (dirty & /*target*/ 1) imagepreview_changes.url = /*target*/ ctx[0].url.string;
			imagepreview.$set(imagepreview_changes);
		},
		i(local) {
			if (current) return;
			transition_in(imagepreview.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(imagepreview.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(label0);
			if (detaching) detach(t1);
			if (detaching) detach(input0);
			if (detaching) detach(t2);
			if (detaching) detach(label1);
			if (detaching) detach(t4);
			if (detaching) detach(input1);
			if (detaching) detach(t5);
			if (detaching) detach(label2);
			if (detaching) detach(t7);
			if (detaching) detach(input2);
			if (detaching) detach(t8);
			destroy_component(imagepreview, detaching);
			run_all(dispose);
		}
	};
}

// (120:41) 
function create_if_block_3(ctx) {
	let label0;
	let t1;
	let input0;
	let input0_disabled_value;
	let input0_value_value;
	let t2;
	let label1;
	let t4;
	let input1;
	let input1_value_value;
	let dispose;

	return {
		c() {
			label0 = element("label");
			label0.textContent = "URL";
			t1 = space();
			input0 = element("input");
			t2 = space();
			label1 = element("label");
			label1.textContent = "Title";
			t4 = space();
			input1 = element("input");
			attr(label0, "for", "url");
			attr(label0, "required", "");
			attr(input0, "type", "text");
			attr(input0, "name", "url");
			attr(input0, "id", "url");
			input0.disabled = input0_disabled_value = /*target*/ ctx[0].type.includes("reference");
			input0.required = true;
			input0.value = input0_value_value = /*target*/ ctx[0].url.string;
			attr(label1, "for", "title");
			attr(input1, "type", "text");
			attr(input1, "name", "title");
			attr(input1, "id", "title");
			input1.value = input1_value_value = stripTitleWrappers(/*target*/ ctx[0].title.string);
		},
		m(target, anchor, remount) {
			insert(target, label0, anchor);
			insert(target, t1, anchor);
			insert(target, input0, anchor);
			insert(target, t2, anchor);
			insert(target, label1, anchor);
			insert(target, t4, anchor);
			insert(target, input1, anchor);
			if (remount) run_all(dispose);

			dispose = [
				listen(input0, "input", /*input_handler*/ ctx[6]),
				listen(input1, "input", /*input_handler_1*/ ctx[7])
			];
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && input0_disabled_value !== (input0_disabled_value = /*target*/ ctx[0].type.includes("reference"))) {
				input0.disabled = input0_disabled_value;
			}

			if (dirty & /*target*/ 1 && input0_value_value !== (input0_value_value = /*target*/ ctx[0].url.string) && input0.value !== input0_value_value) {
				input0.value = input0_value_value;
			}

			if (dirty & /*target*/ 1 && input1_value_value !== (input1_value_value = stripTitleWrappers(/*target*/ ctx[0].title.string)) && input1.value !== input1_value_value) {
				input1.value = input1_value_value;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(label0);
			if (detaching) detach(t1);
			if (detaching) detach(input0);
			if (detaching) detach(t2);
			if (detaching) detach(label1);
			if (detaching) detach(t4);
			if (detaching) detach(input1);
			run_all(dispose);
		}
	};
}

// (116:2) {#if target.error == 'missing-definition'}
function create_if_block_2(ctx) {
	let t;

	return {
		c() {
			t = text("Missing definition");
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

// (179:0) {#if target.type.includes('reference') && target.error !== 'missing-definition'}
function create_if_block_1(ctx) {
	let a;
	let dispose;

	return {
		c() {
			a = element("a");
			a.textContent = "Jump to definition";
			attr(a, "id", "jumpToDef");
		},
		m(target, anchor, remount) {
			insert(target, a, anchor);
			if (remount) dispose();
			dispose = listen(a, "click", /*click_handler*/ ctx[12]);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(a);
			dispose();
		}
	};
}

// (185:0) {#if target.type.includes('reference')}
function create_if_block$1(ctx) {
	let div;
	let current;

	const referencelabelselect = new ReferenceLabelSelect({
			props: {
				target: /*target*/ ctx[0],
				label: "Reference ID"
			}
		});

	return {
		c() {
			div = element("div");
			create_component(referencelabelselect.$$.fragment);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(referencelabelselect, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const referencelabelselect_changes = {};
			if (dirty & /*target*/ 1) referencelabelselect_changes.target = /*target*/ ctx[0];
			referencelabelselect.$set(referencelabelselect_changes);
		},
		i(local) {
			if (current) return;
			transition_in(referencelabelselect.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(referencelabelselect.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(referencelabelselect);
		}
	};
}

function create_fragment$8(ctx) {
	let div;
	let show_if_2;
	let show_if_3;
	let show_if_4;
	let current_block_type_index;
	let if_block0;
	let t0;
	let show_if_1 = /*target*/ ctx[0].type.includes("reference") && /*target*/ ctx[0].error !== "missing-definition";
	let t1;
	let show_if = /*target*/ ctx[0].type.includes("reference");
	let t2;
	let header;
	let h1;
	let t3;
	let t4;
	let select;
	let option0;
	let t5;
	let option0_selected_value;
	let option1;
	let t6;
	let option1_selected_value;
	let current;
	let dispose;
	const if_block_creators = [create_if_block_2, create_if_block_3, create_if_block_4, create_if_block_5];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*target*/ ctx[0].error == "missing-definition") return 0;
		if (dirty & /*target*/ 1) show_if_2 = !!/*target*/ ctx[0].type.includes("link");
		if (show_if_2) return 1;
		if (dirty & /*target*/ 1) show_if_3 = !!/*target*/ ctx[0].type.includes("image");
		if (show_if_3) return 2;
		if (dirty & /*target*/ 1) show_if_4 = !!/*target*/ ctx[0].type.includes("footnote");
		if (show_if_4) return 3;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx, -1))) {
		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	let if_block1 = show_if_1 && create_if_block_1(ctx);
	let if_block2 = show_if && create_if_block$1(ctx);

	return {
		c() {
			div = element("div");
			if (if_block0) if_block0.c();
			t0 = space();
			if (if_block1) if_block1.c();
			t1 = space();
			if (if_block2) if_block2.c();
			t2 = space();
			header = element("header");
			h1 = element("h1");
			t3 = text(/*headerText*/ ctx[1]);
			t4 = space();
			select = element("select");
			option0 = element("option");
			t5 = text("Inline\n    ");
			option1 = element("option");
			t6 = text("Reference");
			attr(div, "id", "contents");
			toggle_class(div, "reference", /*target*/ ctx[0].type.includes("reference"));
			option0.selected = option0_selected_value = /*target*/ ctx[0].type.includes("inline");
			option0.__value = "inline";
			option0.value = option0.__value;
			option1.selected = option1_selected_value = /*target*/ ctx[0].type.includes("reference");
			option1.__value = "reference";
			option1.value = option1.__value;
			attr(select, "name", "type");
			attr(select, "id", "type");
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div, null);
			}

			insert(target, t0, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, t1, anchor);
			if (if_block2) if_block2.m(target, anchor);
			insert(target, t2, anchor);
			insert(target, header, anchor);
			append(header, h1);
			append(h1, t3);
			append(header, t4);
			append(header, select);
			append(select, option0);
			append(option0, t5);
			append(select, option1);
			append(option1, t6);
			current = true;
			if (remount) dispose();
			dispose = listen(select, "input", /*input_handler_6*/ ctx[13]);
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx, dirty);

			if (current_block_type_index === previous_block_index) {
				if (~current_block_type_index) {
					if_blocks[current_block_type_index].p(ctx, dirty);
				}
			} else {
				if (if_block0) {
					group_outros();

					transition_out(if_blocks[previous_block_index], 1, 1, () => {
						if_blocks[previous_block_index] = null;
					});

					check_outros();
				}

				if (~current_block_type_index) {
					if_block0 = if_blocks[current_block_type_index];

					if (!if_block0) {
						if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
						if_block0.c();
					}

					transition_in(if_block0, 1);
					if_block0.m(div, null);
				} else {
					if_block0 = null;
				}
			}

			if (dirty & /*target*/ 1) {
				toggle_class(div, "reference", /*target*/ ctx[0].type.includes("reference"));
			}

			if (dirty & /*target*/ 1) show_if_1 = /*target*/ ctx[0].type.includes("reference") && /*target*/ ctx[0].error !== "missing-definition";

			if (show_if_1) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					if_block1.m(t1.parentNode, t1);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty & /*target*/ 1) show_if = /*target*/ ctx[0].type.includes("reference");

			if (show_if) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*target*/ 1) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$1(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(t2.parentNode, t2);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (!current || dirty & /*headerText*/ 2) set_data(t3, /*headerText*/ ctx[1]);

			if (!current || dirty & /*target*/ 1 && option0_selected_value !== (option0_selected_value = /*target*/ ctx[0].type.includes("inline"))) {
				option0.selected = option0_selected_value;
			}

			if (!current || dirty & /*target*/ 1 && option1_selected_value !== (option1_selected_value = /*target*/ ctx[0].type.includes("reference"))) {
				option1.selected = option1_selected_value;
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}

			if (detaching) detach(t0);
			if (if_block1) if_block1.d(detaching);
			if (detaching) detach(t1);
			if (if_block2) if_block2.d(detaching);
			if (detaching) detach(t2);
			if (detaching) detach(header);
			dispose();
		}
	};
}

function stripTitleWrappers(title) {
	const titleStringIsEmpty = title == "";

	if (titleStringIsEmpty) {
		return ""; // Keep it empty
	} else {
		const titleWithoutWrappers = title.match(/\s("|'|\()(.*?)\1/)[2];

		// console.log(title)
		// console.log(titleWithoutWrappers)
		return titleWithoutWrappers;
	}
}

/**
 * Add "wrapping characters" to input title value strings before we insert them into the document. If these characters are not in place, the markdown parser will not recognize the string as a link. See `stripTitleWrappers` explaination. If the title string was previously empty, and now has a value, add a preceding space and wrapping double-quotes ` "..."`. Else, if we're updating an existing title, preserve the existing wrappers (single-quotes, double-quotes, and parentheses are all allowed, per the CommonMark spec: https://spec.commonmark.org/0.28/#link-title )
 * @param {*} value - The new value of the title field
 */
function addTitleWrappers(oldTitle, newTitle) {
	if (newTitle) {
		const titleStringWasEmpty = oldTitle == "";

		if (titleStringWasEmpty) {
			return ` "${newTitle}"`;
		} else {
			const wrapper = oldTitle.match(/(\s("|'|\()).*?\2/);
			const string = `${wrapper[1]}${newTitle}${wrapper[2]}`;
			return string;
		}
	} else {
		return "";
	}
}

function instance$8($$self, $$props, $$invalidate) {
	let { cm = null } = $$props;
	let { target = null } = $$props;
	let headerText;

	/**
 * Write input value to cm.
 */
	function handleInput(value, line, start, end) {
		cm.replaceRange(value, { line, ch: start }, { line, ch: end }, "+input");
	}

	function switchInlineReferenceType(newType) {
		// Strings depend on whether we're dealing with link, image or footnote
		if (newType == "reference") {
			cm.replaceRange(`[${target.text.string}][]`, { line: target.line, ch: target.start }, { line: target.line, ch: target.end });
		} else if (newType == "inline") {
			const text = target.type == "link-reference-full"
			? target.text.string
			: target.label.string;

			const url = target.definition.url.string;
			const title = target.definition.title.string;
			cm.replaceRange(`[${text}](${url}${title})`, { line: target.line, ch: target.start }, { line: target.line, ch: target.end });
		}
	}

	function jumpToLine(line, ch = 0) {
		cm.setCursor(line, ch);
		cm.focus();
	}

	const input_handler = e => handleInput(e.target.value, target.line, target.url.start, target.url.end);
	const input_handler_1 = e => handleInput(addTitleWrappers(target.title.string, e.target.value), target.line, target.title.start, target.title.end);
	const input_handler_2 = e => handleInput(e.target.value, target.line, target.url.start, target.url.end);
	const input_handler_3 = e => handleInput(e.target.value, target.line, target.text.start, target.text.end);
	const input_handler_4 = e => handleInput(addTitleWrappers(target.title.string, e.target.value), target.line, target.title.start, target.title.end);
	const input_handler_5 = e => handleInput(e.target.value, target.line, target.content.start, target.content.end);
	const click_handler = () => jumpToLine(target.definitionLine);
	const input_handler_6 = e => switchInlineReferenceType(e.target.value);

	$$self.$set = $$props => {
		if ("cm" in $$props) $$invalidate(5, cm = $$props.cm);
		if ("target" in $$props) $$invalidate(0, target = $$props.target);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*target*/ 1) {
			 {
				if (target !== null) {
					if (target.type == "link-inline") ; else if (target.type == "link-reference") ;

					if (target.type.includes("link")) {
						$$invalidate(1, headerText = "Link");
					} else if (target.type.includes("image")) {
						$$invalidate(1, headerText = "Image");
					} else if (target.type.includes("footnote")) {
						$$invalidate(1, headerText = "Footnote");
					}
				}
			}
		}
	};

	return [
		target,
		headerText,
		handleInput,
		switchInlineReferenceType,
		jumpToLine,
		cm,
		input_handler,
		input_handler_1,
		input_handler_2,
		input_handler_3,
		input_handler_4,
		input_handler_5,
		click_handler,
		input_handler_6
	];
}

class Link extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { cm: 5, target: 0 });
	}
}

/* src/js/renderer/component/wizard/Wizard.svelte generated by Svelte v3.22.3 */

function create_if_block_1$1(ctx) {
	let current;

	const link = new Link({
			props: {
				cm: /*cm*/ ctx[2],
				target: /*target*/ ctx[0]
			}
		});

	return {
		c() {
			create_component(link.$$.fragment);
		},
		m(target, anchor) {
			mount_component(link, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const link_changes = {};
			if (dirty & /*cm*/ 4) link_changes.cm = /*cm*/ ctx[2];
			if (dirty & /*target*/ 1) link_changes.target = /*target*/ ctx[0];
			link.$set(link_changes);
		},
		i(local) {
			if (current) return;
			transition_in(link.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(link.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(link, detaching);
		}
	};
}

// (194:2) {#if !target}
function create_if_block$2(ctx) {
	let t;

	return {
		c() {
			t = text("Empty!");
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

function create_fragment$9(ctx) {
	let div;
	let show_if;
	let current_block_type_index;
	let if_block;
	let current;
	let dispose;
	const if_block_creators = [create_if_block$2, create_if_block_1$1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (!/*target*/ ctx[0]) return 0;
		if (dirty & /*target*/ 1) show_if = !!(/*target*/ ctx[0].type.includes("link") || /*target*/ ctx[0].type.includes("image") || /*target*/ ctx[0].type.includes("footnote"));
		if (show_if) return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx, -1))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "id", "wizard");
			set_style(div, "left", /*leftPos*/ ctx[5]);
			set_style(div, "top", /*topPos*/ ctx[6]);
			attr(div, "class", "below");
			attr(div, "tabindex", "-1");
			toggle_class(div, "error", /*isError*/ ctx[4]);
			toggle_class(div, "visible", /*isVisible*/ ctx[3]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div, null);
			}

			/*div_binding*/ ctx[15](div);
			current = true;
			if (remount) run_all(dispose);

			dispose = [
				listen(div, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[14])),
				listen(div, "keydown", /*onKeydown*/ ctx[8]),
				listen(div, "keyup", /*onKeyup*/ ctx[9]),
				listen(div, "focusout", /*onFocusout*/ ctx[7])
			];
		},
		p(ctx, [dirty]) {
			let previous_block_index = current_block_type_index;
			current_block_type_index = select_block_type(ctx, dirty);

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
					}

					transition_in(if_block, 1);
					if_block.m(div, null);
				} else {
					if_block = null;
				}
			}

			if (!current || dirty & /*leftPos*/ 32) {
				set_style(div, "left", /*leftPos*/ ctx[5]);
			}

			if (!current || dirty & /*topPos*/ 64) {
				set_style(div, "top", /*topPos*/ ctx[6]);
			}

			if (dirty & /*isError*/ 16) {
				toggle_class(div, "error", /*isError*/ ctx[4]);
			}

			if (dirty & /*isVisible*/ 8) {
				toggle_class(div, "visible", /*isVisible*/ ctx[3]);
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
			if (detaching) detach(div);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}

			/*div_binding*/ ctx[15](null);
			run_all(dispose);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let { cm = null } = $$props;
	let { target = null } = $$props; // An inlineElement
	let { element = null } = $$props; // DOM element, set with bind:this
	let { editorState = {} } = $$props;
	let isVisible = false;
	let isError = false;
	let leftPos = "-5000px"; // Default value
	let topPos = "0px";

	// ------- EVENT HANDLERS ------ //
	/*
Wizard changes write immediately, per keystroke. On every input, `replaceRanges` writes the change`. This triggers the `onChanges` function in Editor.svelte. We: save changes object to `editorWidget.lastChanges` via `cm.setEditorState(...)` and fire `editorStateChanged` event. Wizard gets event and changes. If it’s open, if checks if the span it’s editing is affected. If yes, it gets the new inline element, and sets it as target.
*/
	/**
 * Respond to editorState changes. Update visibility, position, target object, etc.
 */
	function onEditorStateChange(changes) {
		if (changes.includes("widget") && changes.includes("selected")) {
			// Show/Hide wizard, based on `editorState.widget.target`
			if (editorState.widget.selected !== null) {
				$$invalidate(0, target = editorState.widget.selected);
				show();
			} else {
				hide();
			}
		} else if (changes.includes("lastChanges")) {
			// Update wizard target to new version _if_ we detect that the latest changes affected the characters that the wizard is currently targeting.
			if (isVisible) {
				const change = editorState.lastChanges.find(c => c.from.line == target.line && c.to.line == target.line && target.start <= c.from.ch && target.end >= c.to.ch);
				const targetWasAffected = change !== undefined;

				if (targetWasAffected) {
					$$invalidate(0, target = editorState.inlineElements.find(e => e.line == target.line && e.start == target.start));
				}
			}
		}
	}

	function onFocusout(evt) {
		if (!element.contains(evt.relatedTarget)) {
			cm.setEditorState({ type: "deSelectWidget" });
		}
	}

	function onKeydown(evt) {
		const parentElIsFocused = document.activeElement == element;

		if (evt.key == "Tab" && !evt.altKey) {
			// Tab between inputs
			const tabbables = Array.from(element.querySelectorAll("a, button, input, textarea, select, [tabindex]:not([tabindex=\"-1\"])"));

			const index = tabbables.indexOf(document.activeElement);

			if (!evt.shiftKey) {
				if (index > -1) {
					var next = tabbables[index + 1] || tabbables[0];
				} else {
					var next = tabbables[0];
				}
			}

			next.focus();
		} else if (parentElIsFocused && (evt.key == "Backspace" || evt.key == "Delete")) {
			// Delete widget
			cm.focus();

			cm.replaceRange("", { line: target.line, ch: target.start }, { line: target.line, ch: target.end });
		} else if (evt.altKey && evt.key == "Tab") {
			// Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
			evt.preventDefault();

			cm.focus();

			cm.triggerOnKeyDown({
				type: "keydown",
				keyCode: 9,
				altKey: true,
				shiftKey: evt.shiftKey
			});
		}
	}

	/**
 * Handle closing the editor on key presses
 */
	function onKeyup(evt) {
		switch (evt.key) {
			case "Enter":
			case "Escape":
				cm.focus();
				break;
		}
	}

	async function show() {
		if (target == null) return;

		// Update position
		// Docs: https://codemirror.net/doc/manual.html#charCoords
		const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft;

		$$invalidate(5, leftPos = `${cm.cursorCoords(true, "local").left + paddingOnLeftSideOfEditor}px`);
		$$invalidate(6, topPos = `${cm.cursorCoords(true, "local").bottom}px`);

		// Autoscroll to ensure wizard is visible. We need to call this manually, AFTER the wizard has repositioned itself (using `tick`), so autoscroll takes the wizard element into account. Otherwise it either doesn't fire, or fires too early (e.g. when the selection was set that triggered the wizard opening)
		await tick();

		cm.scrollIntoView(null);

		// Error
		$$invalidate(4, isError = target.error);

		// Make visible
		$$invalidate(3, isVisible = true);

		// Focus
		element.focus();
	}

	/**
 * Hide wizard by toggling `isVisible` class and setting position back to off-screen defaults.
 */
	function hide() {
		$$invalidate(3, isVisible = false);

		// Reset to default values
		$$invalidate(5, leftPos = "-5000px");

		$$invalidate(6, topPos = "0px");
	}

	function mousedown_handler(event) {
		bubble($$self, event);
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(1, element = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("cm" in $$props) $$invalidate(2, cm = $$props.cm);
		if ("target" in $$props) $$invalidate(0, target = $$props.target);
		if ("element" in $$props) $$invalidate(1, element = $$props.element);
		if ("editorState" in $$props) $$invalidate(10, editorState = $$props.editorState);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*cm*/ 4) {
			// Setup event listeners once `cm` is populated.
			 {
				if (cm !== null) {
					cm.on("editorStateChanged", onEditorStateChange);
				}
			}
		}
	};

	return [
		target,
		element,
		cm,
		isVisible,
		isError,
		leftPos,
		topPos,
		onFocusout,
		onKeydown,
		onKeyup,
		editorState,
		show,
		onEditorStateChange,
		hide,
		mousedown_handler,
		div_binding
	];
}

class Wizard extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
			cm: 2,
			target: 0,
			element: 1,
			editorState: 10,
			show: 11
		});
	}

	get cm() {
		return this.$$.ctx[2];
	}

	set cm(cm) {
		this.$set({ cm });
		flush();
	}

	get target() {
		return this.$$.ctx[0];
	}

	set target(target) {
		this.$set({ target });
		flush();
	}

	get element() {
		return this.$$.ctx[1];
	}

	set element(element) {
		this.$set({ element });
		flush();
	}

	get editorState() {
		return this.$$.ctx[10];
	}

	set editorState(editorState) {
		this.$set({ editorState });
		flush();
	}

	get show() {
		return this.$$.ctx[11];
	}
}

/* src/js/renderer/component/Autocomplete.svelte generated by Svelte v3.22.3 */

function get_each_context$3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i].label;
	child_ctx[8] = list[i].preview;
	child_ctx[10] = i;
	return child_ctx;
}

// (27:2) {#if menuItems}
function create_if_block$3(ctx) {
	let ul;
	let each_value = /*menuItems*/ ctx[2].list;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
	}

	return {
		c() {
			ul = element("ul");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(ul, "id", "menu");
		},
		m(target, anchor) {
			insert(target, ul, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(ul, null);
			}
		},
		p(ctx, dirty) {
			if (dirty & /*menuItems*/ 4) {
				each_value = /*menuItems*/ ctx[2].list;
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$3(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$3(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(ul, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}
		},
		d(detaching) {
			if (detaching) detach(ul);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (29:6) {#each menuItems.list as { label, preview }
function create_each_block$3(ctx) {
	let li;
	let span0;
	let t0_value = /*label*/ ctx[7] + "";
	let t0;
	let t1;
	let span1;
	let t2_value = /*preview*/ ctx[8] + "";
	let t2;
	let t3;

	return {
		c() {
			li = element("li");
			span0 = element("span");
			t0 = text(t0_value);
			t1 = space();
			span1 = element("span");
			t2 = text(t2_value);
			t3 = space();
			attr(span0, "class", "label");
			attr(span1, "class", "preview");
			attr(li, "class", "option");
			toggle_class(li, "selected", /*index*/ ctx[10] == /*menuItems*/ ctx[2].selectedIndex);
		},
		m(target, anchor) {
			insert(target, li, anchor);
			append(li, span0);
			append(span0, t0);
			append(li, t1);
			append(li, span1);
			append(span1, t2);
			append(li, t3);
		},
		p(ctx, dirty) {
			if (dirty & /*menuItems*/ 4 && t0_value !== (t0_value = /*label*/ ctx[7] + "")) set_data(t0, t0_value);
			if (dirty & /*menuItems*/ 4 && t2_value !== (t2_value = /*preview*/ ctx[8] + "")) set_data(t2, t2_value);

			if (dirty & /*menuItems*/ 4) {
				toggle_class(li, "selected", /*index*/ ctx[10] == /*menuItems*/ ctx[2].selectedIndex);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
		}
	};
}

function create_fragment$a(ctx) {
	let div;
	let dispose;
	let if_block = /*menuItems*/ ctx[2] && create_if_block$3(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "id", "autocompleteMenu");
			attr(div, "tabindex", "0");
			toggle_class(div, "visible", /*visible*/ ctx[1]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			/*div_binding*/ ctx[6](div);
			if (remount) dispose();
			dispose = listen(div, "click", /*forwardClick*/ ctx[3]);
		},
		p(ctx, [dirty]) {
			if (/*menuItems*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*visible*/ 2) {
				toggle_class(div, "visible", /*visible*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			/*div_binding*/ ctx[6](null);
			dispose();
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { element } = $$props;
	let { visible = false } = $$props;
	let { selectedOptionIndex = 0 } = $$props;
	let { menuItems = null } = $$props;

	function forwardClick(evt) {
		dispatch("click", evt);
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(0, element = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("element" in $$props) $$invalidate(0, element = $$props.element);
		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
		if ("selectedOptionIndex" in $$props) $$invalidate(4, selectedOptionIndex = $$props.selectedOptionIndex);
		if ("menuItems" in $$props) $$invalidate(2, menuItems = $$props.menuItems);
	};

	return [
		element,
		visible,
		menuItems,
		forwardClick,
		selectedOptionIndex,
		dispatch,
		div_binding
	];
}

class Autocomplete extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
			element: 0,
			visible: 1,
			selectedOptionIndex: 4,
			menuItems: 2
		});
	}

	get element() {
		return this.$$.ctx[0];
	}

	set element(element) {
		this.$set({ element });
		flush();
	}

	get visible() {
		return this.$$.ctx[1];
	}

	set visible(visible) {
		this.$set({ visible });
		flush();
	}

	get selectedOptionIndex() {
		return this.$$.ctx[4];
	}

	set selectedOptionIndex(selectedOptionIndex) {
		this.$set({ selectedOptionIndex });
		flush();
	}

	get menuItems() {
		return this.$$.ctx[2];
	}

	set menuItems(menuItems) {
		this.$set({ menuItems });
		flush();
	}
}

/* src/js/renderer/component/Preview.svelte generated by Svelte v3.22.3 */

function create_if_block$4(ctx) {
	let div;

	function select_block_type(ctx, dirty) {
		if (/*target*/ ctx[0].error == "missing-definition") return create_if_block_1$2;
		if (/*target*/ ctx[0].error == "missing-url") return create_if_block_2$1;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if_block.m(div, null);
		},
		p(ctx, dirty) {
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
		},
		d(detaching) {
			if (detaching) detach(div);
			if_block.d();
		}
	};
}

// (179:6) {:else}
function create_else_block(ctx) {
	let show_if_2;
	let show_if_3;
	let show_if_4;
	let show_if_5;
	let show_if_6;
	let t;
	let div;
	let show_if;
	let show_if_1;

	function select_block_type_1(ctx, dirty) {
		if (show_if_2 == null || dirty & /*target*/ 1) show_if_2 = !!(/*target*/ ctx[0].type.includes("link") && /*target*/ ctx[0].url);
		if (show_if_2) return create_if_block_5$1;
		if (show_if_3 == null || dirty & /*target*/ 1) show_if_3 = !!(/*target*/ ctx[0].type.includes("image") && /*target*/ ctx[0].url);
		if (show_if_3) return create_if_block_6;
		if (show_if_4 == null || dirty & /*target*/ 1) show_if_4 = !!((/*target*/ ctx[0].type.includes("link") || /*target*/ ctx[0].type.includes("image")) && !/*target*/ ctx[0].url);
		if (show_if_4) return create_if_block_7;
		if (show_if_5 == null || dirty & /*target*/ 1) show_if_5 = !!(/*target*/ ctx[0].type.includes("footnote-inline") && /*target*/ ctx[0].content.string);
		if (show_if_5) return create_if_block_8;
		if (show_if_6 == null || dirty & /*target*/ 1) show_if_6 = !!(/*target*/ ctx[0].type.includes("footnote-reference") && /*target*/ ctx[0].definition.string);
		if (show_if_6) return create_if_block_9;
	}

	let current_block_type = select_block_type_1(ctx, -1);
	let if_block0 = current_block_type && current_block_type(ctx);

	function select_block_type_2(ctx, dirty) {
		if (show_if == null || dirty & /*editorState, target*/ 5) show_if = !!(/*editorState*/ ctx[2].isMetaKeyDown && (/*target*/ ctx[0].type.includes("link") || /*target*/ ctx[0].type.includes("image")) && /*target*/ ctx[0].url);
		if (show_if) return create_if_block_3$1;
		if (show_if_1 == null || dirty & /*editorState, target*/ 5) show_if_1 = !!(/*editorState*/ ctx[2].isMetaKeyDown && /*target*/ ctx[0].type.includes("footnote-reference"));
		if (show_if_1) return create_if_block_4$1;
	}

	let current_block_type_1 = select_block_type_2(ctx, -1);
	let if_block1 = current_block_type_1 && current_block_type_1(ctx);

	return {
		c() {
			if (if_block0) if_block0.c();
			t = space();
			div = element("div");
			if (if_block1) if_block1.c();
			attr(div, "id", "tip");
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t, anchor);
			insert(target, div, anchor);
			if (if_block1) if_block1.m(div, null);
		},
		p(ctx, dirty) {
			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block0) {
				if_block0.p(ctx, dirty);
			} else {
				if (if_block0) if_block0.d(1);
				if_block0 = current_block_type && current_block_type(ctx);

				if (if_block0) {
					if_block0.c();
					if_block0.m(t.parentNode, t);
				}
			}

			if (current_block_type_1 !== (current_block_type_1 = select_block_type_2(ctx, dirty))) {
				if (if_block1) if_block1.d(1);
				if_block1 = current_block_type_1 && current_block_type_1(ctx);

				if (if_block1) {
					if_block1.c();
					if_block1.m(div, null);
				}
			}
		},
		d(detaching) {
			if (if_block0) {
				if_block0.d(detaching);
			}

			if (detaching) detach(t);
			if (detaching) detach(div);

			if (if_block1) {
				if_block1.d();
			}
		}
	};
}

// (177:46) 
function create_if_block_2$1(ctx) {
	let t;

	return {
		c() {
			t = text("Missing URL");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (175:6) {#if target.error == 'missing-definition'}
function create_if_block_1$2(ctx) {
	let t;

	return {
		c() {
			t = text("Missing definition");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (195:89) 
function create_if_block_9(ctx) {
	let t_value = /*target*/ ctx[0].definition.string + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && t_value !== (t_value = /*target*/ ctx[0].definition.string + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (193:83) 
function create_if_block_8(ctx) {
	let t_value = /*target*/ ctx[0].content.string + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && t_value !== (t_value = /*target*/ ctx[0].content.string + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (191:97) 
function create_if_block_7(ctx) {
	let t;

	return {
		c() {
			t = text("URL not entered");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (183:62) 
function create_if_block_6(ctx) {
	let div0;
	let t0_value = /*target*/ ctx[0].url.string + "";
	let t0;
	let t1;
	let div1;
	let img;
	let img_src_value;

	return {
		c() {
			div0 = element("div");
			t0 = text(t0_value);
			t1 = space();
			div1 = element("div");
			img = element("img");
			attr(div0, "id", "url");
			if (img.src !== (img_src_value = /*target*/ ctx[0].url.string)) attr(img, "src", img_src_value);
			attr(div1, "id", "image-preview");
		},
		m(target, anchor) {
			insert(target, div0, anchor);
			append(div0, t0);
			insert(target, t1, anchor);
			insert(target, div1, anchor);
			append(div1, img);
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && t0_value !== (t0_value = /*target*/ ctx[0].url.string + "")) set_data(t0, t0_value);

			if (dirty & /*target*/ 1 && img.src !== (img_src_value = /*target*/ ctx[0].url.string)) {
				attr(img, "src", img_src_value);
			}
		},
		d(detaching) {
			if (detaching) detach(div0);
			if (detaching) detach(t1);
			if (detaching) detach(div1);
		}
	};
}

// (181:8) {#if target.type.includes('link') && target.url}
function create_if_block_5$1(ctx) {
	let t_value = /*target*/ ctx[0].url.string + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*target*/ 1 && t_value !== (t_value = /*target*/ ctx[0].url.string + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (203:92) 
function create_if_block_4$1(ctx) {
	let t;

	return {
		c() {
			t = text("Click to jump to definition");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (201:10) {#if editorState.isMetaKeyDown && (target.type.includes('link') || target.type.includes('image')) && target.url}
function create_if_block_3$1(ctx) {
	let t;

	return {
		c() {
			t = text("Click to open URL");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$b(ctx) {
	let div;
	let if_block = /*target*/ ctx[0] !== null && create_if_block$4(ctx);

	return {
		c() {
			div = element("div");
			if (if_block) if_block.c();
			attr(div, "id", "preview");
			set_style(div, "left", /*leftPos*/ ctx[5]);
			set_style(div, "top", /*topPos*/ ctx[6]);
			attr(div, "class", "below");
			attr(div, "tabindex", "-1");
			toggle_class(div, "error", /*isError*/ ctx[4]);
			toggle_class(div, "show", /*isVisible*/ ctx[3]);
			toggle_class(div, "hide", !/*isVisible*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			if (if_block) if_block.m(div, null);
			/*div_binding*/ ctx[14](div);
		},
		p(ctx, [dirty]) {
			if (/*target*/ ctx[0] !== null) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$4(ctx);
					if_block.c();
					if_block.m(div, null);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (dirty & /*leftPos*/ 32) {
				set_style(div, "left", /*leftPos*/ ctx[5]);
			}

			if (dirty & /*topPos*/ 64) {
				set_style(div, "top", /*topPos*/ ctx[6]);
			}

			if (dirty & /*isError*/ 16) {
				toggle_class(div, "error", /*isError*/ ctx[4]);
			}

			if (dirty & /*isVisible*/ 8) {
				toggle_class(div, "show", /*isVisible*/ ctx[3]);
			}

			if (dirty & /*isVisible*/ 8) {
				toggle_class(div, "hide", !/*isVisible*/ ctx[3]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
			/*div_binding*/ ctx[14](null);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let { cm = null } = $$props;
	let { target = null } = $$props; // An inlineElement
	let { element = null } = $$props; // DOM element, set with bind:this
	let { editorState = {} } = $$props;

	// Per: https://developer.mozilla.org/en-US/docs/Web/API/URL
	let parsedLinkUrl = {}; // origin: '', // `https://joshcarpenter.ca/img/`
	// restOfHref: '', // `ice-sheet.jpg`

	// Per: https://nodejs.org/api/path.html#path_path_parse_path
	let parsedImageUrl = {}; // dir: '', // `/home/user/dir`
	// base: '', // `file.txt`

	let isVisible = false;
	let isError = false;
	let leftPos = "-5000px"; // Default value
	let topPos = "0px";

	async function validateURL() {
		const test1 = await window.api.invoke("getValidatedPathOrURL", editorState.openDoc.path, "/Users/josh/Desktop/curme-south.png");
		const test2 = await window.api.invoke("getValidatedPathOrURL", editorState.openDoc.path, "../Images/josh.png");
	} // getValidatedPathOrURL
	// 1. Determine whether URL is local or remote

	// 2. Test URL validity
	// Determine if path is local or remote
	// console.log(editorState.openDoc.path)
	// const test1 = await window.api.invoke(
	//   'getResolvedPath',
	//   editorState.openDoc.path,
	//   '../Images/josh.png'
	// )
	// console.log(test)
	// Update parsedPath
	// if (target.type.includes('link') && target.url) {
	//   // parsedLinkUrl = new URL(target.url.string)
	//   parsedLinkUrl = new URL('https://joshcarpenter.ca/img/marine-ice-sheet-instability-diagram-lg.jpg')
	//   console.log(parsedLinkUrl)
	//   try {console.log(new URL('google.com'))} catch { console.log(err) }
	//   console.log(new URL('../Images/josh.png'))
	// } else if (target.type.includes('image') && target.url) {
	//   parsedImageUrl = await window.api.invoke(
	//     'getParsedPath',
	//     target.url.string
	//   )
	// }Î
	// ------- EVENT HANDLERS ------ //
	async function onEditorStateChange(changes) {
		if (changes.includes("widget") && changes.includes("hovered")) {
			// Show/Hide wizard, based on `editorState.widget.target`
			if (editorState.widget.hovered !== null && editorState.widget.hovered !== editorState.widget.selected) {
				// Update target
				$$invalidate(0, target = editorState.widget.hovered);

				// TEMP
				// validateURL()
				// Show
				show();
			} else {
				hide();
			}
		} else if (changes.includes("widget") && changes.includes("selected")) {
			if (editorState.widget.hovered == editorState.widget.selected) {
				hide();
			}
		} else if (changes.includes("lastChanges")) {
			// Update wizard target to new version, if we detect that the latest changes affected the characters that the wizard is currently targeting.
			if (isVisible) {
				const change = editorState.lastChanges.find(c => c.from.line == target.line && c.to.line == target.line && target.start <= c.from.ch && target.end >= c.to.ch);
				const targetWasAffected = change !== undefined;

				if (targetWasAffected) {
					$$invalidate(0, target = editorState.inlineElements.find(e => e.line == target.line && e.start == target.start));
				}
			}
		} else if (changes.includes("sourceMode") && editorState.sourceMode) {
			hide();
		}
	}

	async function show() {
		if (target == null) return;

		// Position
		const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft;

		$$invalidate(5, leftPos = `${cm.charCoords({ line: target.line, ch: target.start }, "local").left + paddingOnLeftSideOfEditor}px`);
		$$invalidate(6, topPos = `${cm.charCoords({ line: target.line, ch: target.start }, "local").bottom}px`);

		// Error
		$$invalidate(4, isError = target.error);

		// Make visible
		$$invalidate(3, isVisible = true);
	}

	/**
 * Hide wizard by toggling `visible` class and setting position back to off-screen defaults.
 */
	function hide() {
		$$invalidate(3, isVisible = false);

		// Reset to default values
		$$invalidate(5, leftPos = "-5000px");

		$$invalidate(6, topPos = "0px");
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(1, element = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("cm" in $$props) $$invalidate(7, cm = $$props.cm);
		if ("target" in $$props) $$invalidate(0, target = $$props.target);
		if ("element" in $$props) $$invalidate(1, element = $$props.element);
		if ("editorState" in $$props) $$invalidate(2, editorState = $$props.editorState);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*cm*/ 128) {
			// Setup event listeners once `cm` is populated.
			 {
				if (cm !== null) {
					cm.on("editorStateChanged", onEditorStateChange);
					validateURL();
				}
			}
		}
	};

	return [
		target,
		element,
		editorState,
		isVisible,
		isError,
		leftPos,
		topPos,
		cm,
		show,
		parsedLinkUrl,
		parsedImageUrl,
		validateURL,
		onEditorStateChange,
		hide,
		div_binding
	];
}

class Preview extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$b, create_fragment$b, safe_not_equal, {
			cm: 7,
			target: 0,
			element: 1,
			editorState: 2,
			show: 8
		});
	}

	get cm() {
		return this.$$.ctx[7];
	}

	set cm(cm) {
		this.$set({ cm });
		flush();
	}

	get target() {
		return this.$$.ctx[0];
	}

	set target(target) {
		this.$set({ target });
		flush();
	}

	get element() {
		return this.$$.ctx[1];
	}

	set element(element) {
		this.$set({ element });
		flush();
	}

	get editorState() {
		return this.$$.ctx[2];
	}

	set editorState(editorState) {
		this.$set({ editorState });
		flush();
	}

	get show() {
		return this.$$.ctx[8];
	}
}

/* src/js/renderer/component/Editor.svelte generated by Svelte v3.22.3 */

function create_fragment$c(ctx) {
	let div;
	let t0;
	let t1;
	let current;
	let dispose;
	let wizard_1_props = { editorState: /*editorState*/ ctx[6] };
	const wizard_1 = new Wizard({ props: wizard_1_props });
	/*wizard_1_binding*/ ctx[16](wizard_1);
	let autocomplete_1_props = {};
	const autocomplete_1 = new Autocomplete({ props: autocomplete_1_props });
	/*autocomplete_1_binding*/ ctx[17](autocomplete_1);
	let preview_1_props = { editorState: /*editorState*/ ctx[6] };
	const preview_1 = new Preview({ props: preview_1_props });
	/*preview_1_binding*/ ctx[18](preview_1);

	return {
		c() {
			div = element("div");
			create_component(wizard_1.$$.fragment);
			t0 = space();
			create_component(autocomplete_1.$$.fragment);
			t1 = space();
			create_component(preview_1.$$.fragment);
			attr(div, "id", "editor");
			toggle_class(div, "focused", /*focused*/ ctx[0]);
			toggle_class(div, "visible", /*visible*/ ctx[1]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			mount_component(wizard_1, div, null);
			append(div, t0);
			mount_component(autocomplete_1, div, null);
			append(div, t1);
			mount_component(preview_1, div, null);
			/*div_binding*/ ctx[19](div);
			current = true;
			if (remount) dispose();
			dispose = listen(div, "click", /*forwardClick*/ ctx[7]);
		},
		p(ctx, [dirty]) {
			const wizard_1_changes = {};
			if (dirty & /*editorState*/ 64) wizard_1_changes.editorState = /*editorState*/ ctx[6];
			wizard_1.$set(wizard_1_changes);
			const autocomplete_1_changes = {};
			autocomplete_1.$set(autocomplete_1_changes);
			const preview_1_changes = {};
			if (dirty & /*editorState*/ 64) preview_1_changes.editorState = /*editorState*/ ctx[6];
			preview_1.$set(preview_1_changes);

			if (dirty & /*focused*/ 1) {
				toggle_class(div, "focused", /*focused*/ ctx[0]);
			}

			if (dirty & /*visible*/ 2) {
				toggle_class(div, "visible", /*visible*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(wizard_1.$$.fragment, local);
			transition_in(autocomplete_1.$$.fragment, local);
			transition_in(preview_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(wizard_1.$$.fragment, local);
			transition_out(autocomplete_1.$$.fragment, local);
			transition_out(preview_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			/*wizard_1_binding*/ ctx[16](null);
			destroy_component(wizard_1);
			/*autocomplete_1_binding*/ ctx[17](null);
			destroy_component(autocomplete_1);
			/*preview_1_binding*/ ctx[18](null);
			destroy_component(preview_1);
			/*div_binding*/ ctx[19](null);
			dispose();
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let { focused } = $$props;
	let { visible } = $$props;
	let { state = {} } = $$props;
	let { oldState = {} } = $$props;
	let cm = null;
	let showAutocomplete = false; // TODO

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Bindings
	let editor;

	let wizard;
	let autocomplete;
	let preview;

	// ------------ STATE ------------ //
	// Define `editorState` properties
	let editorState = {
		isMetaKeyDown: false,
		sourceMode: false,
		lastChanges: {},
		openDoc: {},
		widget: {
			hovered: null,
			selected: null,
			target: null,
			isHovered: false,
			isSelected: false
		},
		selections: [],
		blockElements: [],
		inlineElements: []
	};

	// Set state
	function setEditorState(action) {
		// console.log('setEditorState', action)
		switch (action.type) {
			case "loadDoc":
				// Save outgoing file
				if (editorState.openDoc.path) {
					saveFile(cm, editorState.openDoc.path);
				}
				// Update editorState
				$$invalidate(6, editorState.openDoc = state.openDoc, editorState);
				// Load new file
				loadFileByPath(cm, state.openDoc.path);
				break;
			case "setMetaKey":
				$$invalidate(6, editorState.isMetaKeyDown = action.isMetaKeyDown, editorState);
				cm.getScrollerElement().setAttribute("data-metakeydown", action.isMetaKeyDown);
				CodeMirror.signal(this, "editorStateChanged", "metaKey");
				break;
			case "changes":
				$$invalidate(6, editorState.lastChanges = action.changes, editorState);
				CodeMirror.signal(this, "editorStateChanged", "lastChanges");
				break;
			case "setSourceMode":
				$$invalidate(6, editorState.sourceMode = action.boolean, editorState);
				CodeMirror.signal(this, "editorStateChanged", "sourceMode");
				break;
			case "setSelections":
				$$invalidate(6, editorState.selections = cm.getDoc().listSelections(), editorState);
				CodeMirror.signal(this, "editorStateChanged", "selections");
				break;
			case "hoverWidget":
				$$invalidate(6, editorState.widget.hovered = action.target, editorState);
				CodeMirror.signal(this, "editorStateChanged", ["widget", "hovered"]);
				break;
			case "selectWidget":
				cm.setSelection(
					{
						line: action.target.line,
						ch: action.target.start
					},
					{
						line: action.target.line,
						ch: action.target.end
					}
				);
				$$invalidate(6, editorState.selections = cm.getDoc().listSelections(), editorState);
				$$invalidate(6, editorState.widget.selected = action.target, editorState);
				CodeMirror.signal(this, "editorStateChanged", ["widget", "selected"]);
				break;
			case "deSelectWidget":
				$$invalidate(6, editorState.widget.selected = null, editorState);
				CodeMirror.signal(this, "editorStateChanged", ["widget", "selected"]);
				break;
		}
	} // console.log(editorState)

	/**
 * "Fires every time the content of the editor is changed. This event is fired before the end of an operation, before the DOM updates happen." — https://codemirror.net/doc/manual.html#event_change
 */
	// function onChange(cm, change) {
	//   console.log('onChange: ', change)
	// }
	/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 * @param {*} cm
 * @param {*} changes
 */
	// function onChanges(cm, changes) {
	//   editorState.blockElements = mapBlockElements(cm)
	//   editorState.inlineElements = mapInlineElements(cm, editorState)
	//   markDoc(cm, editorState)
	// }
	/**
 * "Will be fired when the cursor or selection moves, or any change is made to the editor content." - https://codemirror.net/doc/manual.html#event_cursorActivity
 */
	function onCursorActivity(e) {
		// Update editorState.selections
		cm.setEditorState({ type: "setSelections" });
	}

	/**
 * "Like the 'change' event, but batched per operation, passing an array containing all the changes that happened in the operation. This event is fired after the operation finished, and display changes it makes will trigger a new operation." — https://codemirror.net/doc/manual.html#event_changes
 */
	function onChanges(cm, changes) {
		// console.trace('onChanges()', changes)
		// Checks
		const hasMultipleLinesChanged = changes.some(change => {
			return change.from.line !== change.to.line || change.origin === "+swapLine";
		});

		const isSingleEdit = changes.length == 1;
		const isUndo = changes.some(change => change.origin == "undo");

		// Set cursor, if `cm.setCursorAfterChanges` !== null. We use this when want to place the cursor at a specific position _after_ we've changed the text.
		// if (cm.setCursorAfterChanges !== null) {
		//   cm.setCursor(cm.setCursorAfterChanges)
		//   // Reset
		//   cm.setCursorAfterChanges = null
		// }
		// Remap elements and re-mark:
		// * Everything, if multiple lines have changed.
		// * Else, one line only
		if (hasMultipleLinesChanged) {
			mapDoc(cm);
			markDoc(cm);
		} else {
			// We assume only one line has changed...
			const lineNo = changes[0].from.line;

			const lineHandle = cm.getLineHandle(lineNo);

			// Autocomplete: Determine if we need to open it or not
			{
				// Remap everything if line changed had block styles. We do this because blockElements can contain reference definitions. And if reference definitions change, lineElements also need to be remapped (because they incorporate data from reference definitions).
				const hasBlockElementChanged = lineHandle.styleClasses !== undefined;

				if (hasBlockElementChanged) {
					mapDoc(cm);
					markDoc(cm);
				} else {
					// Remap lineElements, redo line marks, and finish
					remapInlineElementsForLine(cm, lineHandle);

					clearLineMarks(cm, lineHandle);
					markLine(cm, lineHandle);
				}
			}
		}

		cm.setEditorState({ type: "changes", changes });
	} // Focus widget, if `cm.focusWidgetAfterChanges` !== null. We use this when we want to focus a widget after making changes (e.g. creating it in Autocomplete).
	// if (cm.focusWidgetAfterChanges !== null) {

	//   const from = cm.focusWidgetAfterChanges.from
	//   const to = cm.focusWidgetAfterChanges.to
	//   const element = editorState.inlineElements.find(
	//     (e) =>
	//       from.line == e.line &&
	//       from.ch <= e.start &&
	//       to.ch >= e.end &&
	//       e.widget &&
	//       e.widget.editable
	//   )
	//   if (element) element.widget.tabInto()
	//   // Reset
	//   cm.focusWidgetAfterChanges = null
	// }
	// isChangesPending = false
	/**
 * Forward click events to parent `Layout` component. It dispatches focus changes to main, to help track which section of the UI is focused.
 */
	function forwardClick(evt) {
		dispatch("click", evt);
	}

	/**
 * TODO
 */
	// function onFocus() {
	//   // console.log('onFocus')
	//   if (cm.setCursorAfterChanges !== null) {
	//     cm.setCursor(cm.setCursorAfterChanges)
	//     cm.setCursorAfterChanges = null
	//   }
	// }
	// ------------ SETUP ------------ //
	onMount(async () => {
		// Set initial values
		$$invalidate(6, editorState.sourceMode = state.sourceMode, editorState);

		// Create the editor
		cm = createEditor(editor, state.theme);

		// Setup listeners
		// cm.on('beforeChange', onBeforeChange)
		// cm.on('change', onChange)
		cm.on("changes", onChanges);

		// cm.on('blur', () => { console.log("onBlur") })
		// cm.on('scrollCursorIntoView', (cm, evt) => {
		//   console.log('scrollCursorIntoView', evt)
		// })
		// cm.on('cursorActivity', () => {
		//   console.log('cursorActivity')
		// })
		// cm.on('scroll', () => {
		//   console.log('scroll')
		// })
		cm.on("cursorActivity", onCursorActivity);

		// cm.on("focus", onFocus)
		// Setup method properties on `cm`
		cm.setEditorState = setEditorState;

		cm.getEditorState = () => {
			return editorState;
		};

		// Move wizard and autocomplete menus inside CodeMirror's scroller element. If we do not, and leave them as defined below in the markup, they will be siblings of the editor (which is added to the #editor div), and therefore NOT scroll when the CodeMirror editor scrolls.
		cm.getScrollerElement().append(wizard.element);

		cm.getScrollerElement().append(autocomplete.element);
		cm.getScrollerElement().append(preview.element);

		// Pass `cm` to components
		$$invalidate(3, wizard.cm = cm, wizard);

		$$invalidate(4, autocomplete.cm = cm, autocomplete);
		$$invalidate(5, preview.cm = cm, preview);

		// Add `data-metakeydown` attribute to `sizer` element while meta key is pressed. We use this in various CSS :hover styles to cue to user that clicking will trigger a different action (e.g. jump to reference definition) than normal clicking.
		window.addEventListener("keydown", evt => {
			if (evt.key == "Meta") {
				cm.setEditorState({ type: "setMetaKey", isMetaKeyDown: true });
			}
		});

		window.addEventListener("keyup", evt => {
			if (evt.key == "Meta") {
				cm.setEditorState({ type: "setMetaKey", isMetaKeyDown: false });
			}
		});

		// Reset to false when window is focused. This prevents a bug wherein the value can get stuck on `true` when we switch away from the app window while holding down the metaKey (which is easy to do, when we MetaKey-Tab to invoke the app switcher).
		window.addEventListener("focus", evt => {
			cm.getScrollerElement().setAttribute("data-metakeydown", false);
		});

		// Set initial value
		cm.getScrollerElement().setAttribute("data-metakeydown", false);

		// Setup app `stateChanged` listeners
		window.api.receive("stateChanged", async (newState, oldState) => {
			$$invalidate(8, state = newState);

			if (state.changed.includes("openDoc")) {
				if (state.openDoc.path) {
					cm.setEditorState({ type: "loadDoc", target: state.openDoc });
				}
			}

			if (state.changed.includes("focusedLayoutSection")) {
				if (state.focusedLayoutSection == "editor") {
					focusEditor(cm);
				}
			}

			if (state.changed.includes("sourceMode")) {
				cm.setEditorState({
					type: "setSourceMode",
					boolean: state.sourceMode
				});

				toggleSource(cm);
			}

			if (state.changed.includes("theme")) {
				cm.setOption("theme", newState.theme);
			}
		});

		// Save open doc when main requests (e.g. user clicks File > Save.)
		window.api.receive("mainRequestsSaveFile", () => {
			saveFile(cm, editorState.openDoc.path);
		});

		// Save open doc when app quits
		window.api.receive("mainWantsToCloseWindow", async () => {
			window.api.send("saveFileThenCloseWindow", editorState.openDoc.path, cm.getValue());
		});

		// Save open doc when app quits
		window.api.receive("mainWantsToQuitApp", async () => {
			window.api.send("saveFileThenQuitApp", editorState.openDoc.path, cm.getValue());
		});

		// Load the openDoc
		if (state.openDoc.path) {
			cm.setEditorState({ type: "loadDoc", target: state.openDoc });
		}
	}); // ------- TEMP ------- //
	// Fire event (TEMP: Testing handlers)
	// setTimeout(() => {
	//   cm.setState({ type: 'selectWidget', id: 'timothy' })

	function wizard_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(3, wizard = $$value);
		});
	}

	function autocomplete_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(4, autocomplete = $$value);
		});
	}

	function preview_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(5, preview = $$value);
		});
	}

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, editor = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
		if ("state" in $$props) $$invalidate(8, state = $$props.state);
		if ("oldState" in $$props) $$invalidate(9, oldState = $$props.oldState);
	};

	return [
		focused,
		visible,
		editor,
		wizard,
		autocomplete,
		preview,
		editorState,
		forwardClick,
		state,
		oldState,
		cm,
		showAutocomplete,
		dispatch,
		setEditorState,
		onCursorActivity,
		onChanges,
		wizard_1_binding,
		autocomplete_1_binding,
		preview_1_binding,
		div_binding
	];
}

class Editor extends SvelteComponent {
	constructor(options) {
		super();

		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
			focused: 0,
			visible: 1,
			state: 8,
			oldState: 9
		});
	}
}

/* src/js/renderer/component/Layout.svelte generated by Svelte v3.22.3 */

function create_else_block$1(ctx) {
	let div;
	let t0;
	let t1;
	let current;

	const flexpanel = new FlexPanel({
			props: {
				visible: /*state*/ ctx[0].sideBar.show,
				min: 160,
				max: 220,
				start: 180,
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	flexpanel.$on("click", /*click_handler*/ ctx[5]);
	let if_block = /*state*/ ctx[0].showFilesList && create_if_block_1$3(ctx);

	const editor = new Editor({
			props: {
				state: /*state*/ ctx[0],
				visible: /*isEditorVisible*/ ctx[2]
			}
		});

	editor.$on("click", /*click_handler_2*/ ctx[7]);

	return {
		c() {
			div = element("div");
			create_component(flexpanel.$$.fragment);
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			create_component(editor.$$.fragment);
			attr(div, "id", "flexLayout");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(flexpanel, div, null);
			append(div, t0);
			if (if_block) if_block.m(div, null);
			append(div, t1);
			mount_component(editor, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const flexpanel_changes = {};
			if (dirty & /*state*/ 1) flexpanel_changes.visible = /*state*/ ctx[0].sideBar.show;

			if (dirty & /*$$scope, state*/ 257) {
				flexpanel_changes.$$scope = { dirty, ctx };
			}

			flexpanel.$set(flexpanel_changes);

			if (/*state*/ ctx[0].showFilesList) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*state*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_1$3(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, t1);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			const editor_changes = {};
			if (dirty & /*state*/ 1) editor_changes.state = /*state*/ ctx[0];
			if (dirty & /*isEditorVisible*/ 4) editor_changes.visible = /*isEditorVisible*/ ctx[2];
			editor.$set(editor_changes);
		},
		i(local) {
			if (current) return;
			transition_in(flexpanel.$$.fragment, local);
			transition_in(if_block);
			transition_in(editor.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(flexpanel.$$.fragment, local);
			transition_out(if_block);
			transition_out(editor.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(flexpanel);
			if (if_block) if_block.d();
			destroy_component(editor);
		}
	};
}

// (30:0) {#if state.projectPath == ''}
function create_if_block$5(ctx) {
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

// (34:4) <FlexPanel       visible={state.sideBar.show}       min={160}       max={220}       start={180}       on:click={() => setLayoutFocus('navigation')}>
function create_default_slot_1(ctx) {
	let current;
	const sidebar = new SideBar({ props: { state: /*state*/ ctx[0] } });

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

// (42:4) {#if state.showFilesList}
function create_if_block_1$3(ctx) {
	let current;

	const flexpanel = new FlexPanel({
			props: {
				min: 260,
				max: 360,
				start: 280,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	flexpanel.$on("click", /*click_handler_1*/ ctx[6]);

	return {
		c() {
			create_component(flexpanel.$$.fragment);
		},
		m(target, anchor) {
			mount_component(flexpanel, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const flexpanel_changes = {};

			if (dirty & /*$$scope, state, oldState*/ 259) {
				flexpanel_changes.$$scope = { dirty, ctx };
			}

			flexpanel.$set(flexpanel_changes);
		},
		i(local) {
			if (current) return;
			transition_in(flexpanel.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(flexpanel.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(flexpanel, detaching);
		}
	};
}

// (43:6) <FlexPanel         min={260}         max={360}         start={280}         on:click={() => setLayoutFocus('navigation')}>
function create_default_slot(ctx) {
	let current;

	const doclist = new DocList({
			props: {
				state: /*state*/ ctx[0],
				oldState: /*oldState*/ ctx[1]
			}
		});

	return {
		c() {
			create_component(doclist.$$.fragment);
		},
		m(target, anchor) {
			mount_component(doclist, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const doclist_changes = {};
			if (dirty & /*state*/ 1) doclist_changes.state = /*state*/ ctx[0];
			if (dirty & /*oldState*/ 2) doclist_changes.oldState = /*oldState*/ ctx[1];
			doclist.$set(doclist_changes);
		},
		i(local) {
			if (current) return;
			transition_in(doclist.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(doclist.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(doclist, detaching);
		}
	};
}

function create_fragment$d(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$5, create_else_block$1];
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

function instance$d($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { oldState = {} } = $$props;
	let focusedSection;

	function setLayoutFocus(section) {
		if (state.focusedLayoutSection == section) return;
		window.api.send("dispatch", { type: "SET_LAYOUT_FOCUS", section });
	}

	const click_handler = () => setLayoutFocus("navigation");
	const click_handler_1 = () => setLayoutFocus("navigation");
	const click_handler_2 = () => setLayoutFocus("editor");

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
		if ("oldState" in $$props) $$invalidate(1, oldState = $$props.oldState);
	};

	let isEditorVisible;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 1) {
			 $$invalidate(2, isEditorVisible = state.openDoc.id);
		}
	};

	return [
		state,
		oldState,
		isEditorVisible,
		setLayoutFocus,
		focusedSection,
		click_handler,
		click_handler_1,
		click_handler_2
	];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { state: 0, oldState: 1 });
	}

	get state() {
		return this.$$.ctx[0];
	}

	set state(state) {
		this.$set({ state });
		flush();
	}

	get oldState() {
		return this.$$.ctx[1];
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

    // Update theme
    if (newState.changed.includes("theme")) {
      setTheme(newState.theme);
    }
  });

  // Set theme on initial load
  setTheme(initialState.theme);

  // Show the window once setup is done.
  window.api.send('showWindow');

}

function setTheme(themeName) {
  const stylesheet = document.getElementById('theme-stylesheet');
  const href = `./styles/themes/${themeName}/${themeName}.css`;
  stylesheet.setAttribute('href', href);
}

window.addEventListener('DOMContentLoaded', setup);

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)
//# sourceMappingURL=renderer.js.map
