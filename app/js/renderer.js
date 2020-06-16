import TurndownService from './third-party/turndown/turndown.es.js';

function noop() { }
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
function toggle_class(element, name, toggle) {
    element.classList[toggle ? 'add' : 'remove'](name);
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

/* src/js/component/Folder.svelte generated by Svelte v3.22.3 */

function add_css() {
	var style = element("style");
	style.id = "svelte-2vwg3y-style";
	style.textContent = ".folder-icon.svelte-2vwg3y.svelte-2vwg3y{width:0.9em;box-sizing:content-box;padding-right:0.5em;flex-basis:0;opacity:0.3}[data-nested=\"1\"].svelte-2vwg3y .folder-icon.svelte-2vwg3y{padding-left:1em}[data-nested=\"2\"].svelte-2vwg3y .folder-icon.svelte-2vwg3y{padding-left:2em}[data-nested=\"3\"].svelte-2vwg3y .folder-icon.svelte-2vwg3y{padding-left:3em}[data-nested=\"4\"].svelte-2vwg3y .folder-icon.svelte-2vwg3y{padding-left:4em}ul.svelte-2vwg3y.svelte-2vwg3y{padding:0;margin:0;list-style:none;width:100%}li.svelte-2vwg3y.svelte-2vwg3y{align-items:center;display:flex;font-size:0.8rem;line-height:1.4em;padding:0.4em 1em}li.selected.svelte-2vwg3y.svelte-2vwg3y{background-color:rgba(0, 0, 0, 0.05)}li.childDirectory.svelte-2vwg3y.svelte-2vwg3y{padding:0}li.svelte-2vwg3y.svelte-2vwg3y:hover{cursor:default}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[7] = list[i];
	return child_ctx;
}

// (79:0) {#if expanded}
function create_if_block(ctx) {
	let ul;
	let t;
	let current;
	let if_block0 = !/*hidden*/ ctx[3] && create_if_block_2(ctx);
	let if_block1 = /*details*/ ctx[4].children && create_if_block_1(ctx);

	return {
		c() {
			ul = element("ul");
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			attr(ul, "class", "svelte-2vwg3y");
		},
		m(target, anchor) {
			insert(target, ul, anchor);
			if (if_block0) if_block0.m(ul, null);
			append(ul, t);
			if (if_block1) if_block1.m(ul, null);
			current = true;
		},
		p(ctx, dirty) {
			if (!/*hidden*/ ctx[3]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2(ctx);
					if_block0.c();
					if_block0.m(ul, t);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (/*details*/ ctx[4].children) {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty & /*details*/ 16) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(ul, null);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(ul);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
		}
	};
}

// (81:4) {#if !hidden}
function create_if_block_2(ctx) {
	let li;
	let img;
	let img_src_value;
	let t0;
	let t1_value = /*details*/ ctx[4].name + "";
	let t1;
	let dispose;

	return {
		c() {
			li = element("li");
			img = element("img");
			t0 = space();
			t1 = text(t1_value);
			if (img.src !== (img_src_value = "images/folder.svg")) attr(img, "src", img_src_value);
			attr(img, "class", "folder-icon svelte-2vwg3y");
			attr(img, "alt", "folder icon");
			attr(li, "data-nested", /*nestedDepth*/ ctx[1]);
			attr(li, "class", "svelte-2vwg3y");
			toggle_class(li, "selected", /*selected*/ ctx[0]);
		},
		m(target, anchor, remount) {
			insert(target, li, anchor);
			append(li, img);
			append(li, t0);
			append(li, t1);
			if (remount) dispose();
			dispose = listen(li, "click", /*openFolder*/ ctx[5]);
		},
		p(ctx, dirty) {
			if (dirty & /*details*/ 16 && t1_value !== (t1_value = /*details*/ ctx[4].name + "")) set_data(t1, t1_value);

			if (dirty & /*nestedDepth*/ 2) {
				attr(li, "data-nested", /*nestedDepth*/ ctx[1]);
			}

			if (dirty & /*selected*/ 1) {
				toggle_class(li, "selected", /*selected*/ ctx[0]);
			}
		},
		d(detaching) {
			if (detaching) detach(li);
			dispose();
		}
	};
}

// (87:4) {#if details.children}
function create_if_block_1(ctx) {
	let each_1_anchor;
	let current;
	let each_value = /*details*/ ctx[4].children;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
		},
		m(target, anchor) {
			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*details, nestedDepth*/ 18) {
				each_value = /*details*/ ctx[4].children;
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
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

// (88:6) {#each details.children as childDirectory}
function create_each_block(ctx) {
	let li;
	let t;
	let current;

	const folder = new Folder({
			props: {
				details: /*childDirectory*/ ctx[7],
				nestedDepth: /*nestedDepth*/ ctx[1] + 1,
				expanded: true
			}
		});

	return {
		c() {
			li = element("li");
			create_component(folder.$$.fragment);
			t = space();
			attr(li, "class", "childDirectory svelte-2vwg3y");
		},
		m(target, anchor) {
			insert(target, li, anchor);
			mount_component(folder, li, null);
			append(li, t);
			current = true;
		},
		p(ctx, dirty) {
			const folder_changes = {};
			if (dirty & /*details*/ 16) folder_changes.details = /*childDirectory*/ ctx[7];
			if (dirty & /*nestedDepth*/ 2) folder_changes.nestedDepth = /*nestedDepth*/ ctx[1] + 1;
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
			if (detaching) detach(li);
			destroy_component(folder);
		}
	};
}

function create_fragment(ctx) {
	let if_block_anchor;
	let current;
	let if_block = /*expanded*/ ctx[2] && create_if_block(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*expanded*/ ctx[2]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*expanded*/ 4) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block(ctx);
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
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (if_block) if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { nestedDepth = 0 } = $$props;
	let { expanded = true } = $$props;
	let { selected = false } = $$props;
	let { hidden = false } = $$props;
	let { details = {} } = $$props;

	function setSelected(state) {
		$$invalidate(0, selected = state.selectedFolderId === details.id);
	}

	window.api.receive("stateChanged", (state, oldState) => {
		if (state.changed.includes("selectedFolderId") || state.changed.includes("contents")) {
			setSelected(state);
		}
	});

	onMount(async () => {
		const state = await window.api.invoke("getState");
		setSelected(state);
	});

	function openFolder() {
		window.api.send("dispatch", { type: "OPEN_FOLDER", id: details.id });
	}

	$$self.$set = $$props => {
		if ("nestedDepth" in $$props) $$invalidate(1, nestedDepth = $$props.nestedDepth);
		if ("expanded" in $$props) $$invalidate(2, expanded = $$props.expanded);
		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
		if ("hidden" in $$props) $$invalidate(3, hidden = $$props.hidden);
		if ("details" in $$props) $$invalidate(4, details = $$props.details);
	};

	return [selected, nestedDepth, expanded, hidden, details, openFolder];
}

class Folder extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-2vwg3y-style")) add_css();

		init(this, options, instance, create_fragment, safe_not_equal, {
			nestedDepth: 1,
			expanded: 2,
			selected: 0,
			hidden: 3,
			details: 4
		});
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

/* src/js/component/NavFolders.svelte generated by Svelte v3.22.3 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-18qjmof-style";
	style.textContent = "#folders.svelte-18qjmof{height:100%;overflow-y:scroll;grid-column:folders;background:var(--clr-gray-lightest);padding:var(--grid-half) 0}h1.svelte-18qjmof{font-size:0.7em;color:rgba(0, 0, 0, 0.5);font-weight:normal;margin:0;padding:0 1em}";
	append(document.head, style);
}

// (68:2) {#if !isEmpty}
function create_if_block$1(ctx) {
	let current;

	const folder = new Folder({
			props: {
				details: /*rootDir*/ ctx[1],
				nestedDepth: 0
			}
		});

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
			if (dirty & /*rootDir*/ 2) folder_changes.details = /*rootDir*/ ctx[1];
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

function create_fragment$1(ctx) {
	let div;
	let h1;
	let t1;
	let current;
	let if_block = !/*isEmpty*/ ctx[0] && create_if_block$1(ctx);

	return {
		c() {
			div = element("div");
			h1 = element("h1");
			h1.textContent = "Folders";
			t1 = space();
			if (if_block) if_block.c();
			attr(h1, "class", "svelte-18qjmof");
			attr(div, "id", "folders");
			attr(div, "class", "svelte-18qjmof");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h1);
			append(div, t1);
			if (if_block) if_block.m(div, null);
			current = true;
		},
		p(ctx, [dirty]) {
			if (!/*isEmpty*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*isEmpty*/ 1) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block$1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div, null);
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
			transition_in(if_block);
			current = true;
		},
		o(local) {
			transition_out(if_block);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			if (if_block) if_block.d();
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let isEmpty = true;
	let rootDir = {};

	function buildTree(state) {
		// If state.contents are empty, return
		if (state.contents.length == 0) {
			$$invalidate(0, isEmpty = true);
			$$invalidate(1, rootDir = {});
			return;
		}

		// Filter to only directories
		const flatArrayOfDirectories = state.contents.filter(c => c.type == "directory");

		// Convert to tree
		const tree = lib_1(flatArrayOfDirectories);

		// From tree, set variables
		$$invalidate(0, isEmpty = false);

		$$invalidate(1, rootDir = tree[0]);
	}

	window.api.receive("stateChanged", state => {
		if (state.changed.includes("selectedFolderId") || state.changed.includes("contents")) {
			buildTree(state);
		}
	});

	onMount(async () => {
		console.log("OnMount");
		const state = await window.api.invoke("getState");
		buildTree(state);
	});

	return [isEmpty, rootDir];
}

class NavFolders extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-18qjmof-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});
	}
}

const urlRE = new RegExp(/^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i);

/**
 * Check if string is URL. Uses regexp from GitHub Flavored Markdown:
 * https://github.com/codemirror/CodeMirror/blob/master/mode/gfm/gfm.js#L14
 */
function isUrl(string) {
  return urlRE.test(string)
}

/**
 * Replace targets, instead of appending to them (the default).
 * From: https://github.com/sveltejs/svelte/issues/1549#issuecomment-397819063
 * @param {*} Component - To be rendered
 * @param {*} options - For the component (e.g. target)
 */
function mountReplace(Component, options) {
  const frag = document.createDocumentFragment();
  const component = new Component({ ...options, target: frag });

  options.target.parentNode.replaceChild(frag, options.target);

  return component;
}

/* src/js/component/NavFiles.svelte generated by Svelte v3.22.3 */

const { window: window_1 } = globals;

function add_css$2() {
	var style = element("style");
	style.id = "svelte-16x96ii-style";
	style.textContent = ":root{--layout:[folders-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [folders-end files-start] minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#files.svelte-16x96ii.svelte-16x96ii{height:100%;overflow-y:scroll;grid-column:files;background-color:white;border-left:1px solid lightgray;border-right:1px solid lightgray;padding:0}.file.svelte-16x96ii.svelte-16x96ii{padding:0.5em 1em 0;cursor:default}.file.svelte-16x96ii.svelte-16x96ii:focus{outline:none}h2.svelte-16x96ii.svelte-16x96ii,p.svelte-16x96ii.svelte-16x96ii{font-size:0.8em;line-height:1.5em;margin:0;padding:0;pointer-events:none}p.svelte-16x96ii.svelte-16x96ii{font-size:0.8em;color:gray;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}hr.svelte-16x96ii.svelte-16x96ii{margin:0.5em 0 0;height:1px;background-color:rgba(0, 0, 0, 0.2);border:0}.selected.svelte-16x96ii.svelte-16x96ii{background:var(--clr-gray-lightest)}.selected.parentSectionFocused.svelte-16x96ii.svelte-16x96ii{background:#2d67fa}.selected.parentSectionFocused.svelte-16x96ii h2.svelte-16x96ii{color:white}.selected.parentSectionFocused.svelte-16x96ii p.svelte-16x96ii{color:rgba(255, 255, 255, 0.8)}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[14] = list[i];
	return child_ctx;
}

// (259:4) {:else}
function create_else_block(ctx) {
	let div;
	let h2;
	let t0_value = /*file*/ ctx[14].title + "";
	let t0;
	let t1;
	let p;
	let t2_value = /*file*/ ctx[14].excerpt + "";
	let t2;
	let t3;
	let hr;
	let t4;
	let dispose;

	function click_handler_1(...args) {
		return /*click_handler_1*/ ctx[12](/*file*/ ctx[14], ...args);
	}

	return {
		c() {
			div = element("div");
			h2 = element("h2");
			t0 = text(t0_value);
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
			t3 = space();
			hr = element("hr");
			t4 = space();
			attr(h2, "class", "svelte-16x96ii");
			attr(p, "class", "svelte-16x96ii");
			attr(hr, "class", "svelte-16x96ii");
			attr(div, "class", "file svelte-16x96ii");
			attr(div, "tabindex", "0");
			toggle_class(div, "parentSectionFocused", /*sectionIsFocused*/ ctx[3]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			append(div, h2);
			append(h2, t0);
			append(div, t1);
			append(div, p);
			append(p, t2);
			append(div, t3);
			append(div, hr);
			append(div, t4);
			if (remount) dispose();
			dispose = listen(div, "click", prevent_default(click_handler_1));
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*files*/ 1 && t0_value !== (t0_value = /*file*/ ctx[14].title + "")) set_data(t0, t0_value);
			if (dirty & /*files*/ 1 && t2_value !== (t2_value = /*file*/ ctx[14].excerpt + "")) set_data(t2, t2_value);

			if (dirty & /*sectionIsFocused*/ 8) {
				toggle_class(div, "parentSectionFocused", /*sectionIsFocused*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			dispose();
		}
	};
}

// (249:4) {#if file.selected}
function create_if_block$2(ctx) {
	let div;
	let h2;
	let t0_value = /*file*/ ctx[14].title + "";
	let t0;
	let t1;
	let p;
	let t2_value = /*file*/ ctx[14].excerpt + "";
	let t2;
	let t3;
	let hr;
	let t4;

	return {
		c() {
			div = element("div");
			h2 = element("h2");
			t0 = text(t0_value);
			t1 = space();
			p = element("p");
			t2 = text(t2_value);
			t3 = space();
			hr = element("hr");
			t4 = space();
			attr(h2, "class", "svelte-16x96ii");
			attr(p, "class", "svelte-16x96ii");
			attr(hr, "class", "svelte-16x96ii");
			attr(div, "class", "file selected svelte-16x96ii");
			attr(div, "tabindex", "0");
			toggle_class(div, "parentSectionFocused", /*sectionIsFocused*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, h2);
			append(h2, t0);
			append(div, t1);
			append(div, p);
			append(p, t2);
			append(div, t3);
			append(div, hr);
			append(div, t4);
			/*div_binding*/ ctx[11](div);
		},
		p(ctx, dirty) {
			if (dirty & /*files*/ 1 && t0_value !== (t0_value = /*file*/ ctx[14].title + "")) set_data(t0, t0_value);
			if (dirty & /*files*/ 1 && t2_value !== (t2_value = /*file*/ ctx[14].excerpt + "")) set_data(t2, t2_value);

			if (dirty & /*sectionIsFocused*/ 8) {
				toggle_class(div, "parentSectionFocused", /*sectionIsFocused*/ ctx[3]);
			}
		},
		d(detaching) {
			if (detaching) detach(div);
			/*div_binding*/ ctx[11](null);
		}
	};
}

// (248:2) {#each files as file}
function create_each_block$1(ctx) {
	let if_block_anchor;

	function select_block_type(ctx, dirty) {
		if (/*file*/ ctx[14].selected) return create_if_block$2;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, dirty) {
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
		d(detaching) {
			if_block.d(detaching);
			if (detaching) detach(if_block_anchor);
		}
	};
}

function create_fragment$2(ctx) {
	let section_1;
	let dispose;
	let each_value = /*files*/ ctx[0];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	return {
		c() {
			section_1 = element("section");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(section_1, "data-elastic", "");
			attr(section_1, "id", "files");
			attr(section_1, "class", "svelte-16x96ii");
		},
		m(target, anchor, remount) {
			insert(target, section_1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(section_1, null);
			}

			/*section_1_binding*/ ctx[13](section_1);
			if (remount) run_all(dispose);

			dispose = [
				listen(window_1, "click", /*click_handler*/ ctx[10]),
				listen(window_1, "keydown", /*handleKeydown*/ ctx[4])
			];
		},
		p(ctx, [dirty]) {
			if (dirty & /*selectedEl, sectionIsFocused, files, openFile*/ 43) {
				each_value = /*files*/ ctx[0];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(section_1, null);
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
		d(detaching) {
			if (detaching) detach(section_1);
			destroy_each(each_blocks, detaching);
			/*section_1_binding*/ ctx[13](null);
			run_all(dispose);
		}
	};
}

function scrollFileIntoView(element, animate = true) {
	const behavior = animate ? "smooth" : "auto";

	if (element) {
		element.scrollIntoView({
			block: "nearest",
			inline: "nearest",
			behavior
		});
	}
}

function instance$2($$self, $$props, $$invalidate) {
	let files = [];
	let selectedDirectoryId = 0;
	let selectedFileIndex = 0;
	let selectedEl = undefined;
	let section;
	let sectionIsFocused = false;

	function handleKeydown(event) {
		if (!sectionIsFocused) return;
		const key = event.key;

		switch (key) {
			case "Tab":
				event.preventDefault();
				break;
			case "ArrowUp":
				event.preventDefault();
				if (selectedFileIndex > 0) {
					const prevFileId = files[selectedFileIndex - 1].id;
					window.api.send("dispatch", { type: "OPEN_FILE", id: prevFileId });
				}
				break;
			case "ArrowDown":
				event.preventDefault();
				if (selectedFileIndex < files.length - 1) {
					const nextFileId = files[selectedFileIndex + 1].id;
					window.api.send("dispatch", { type: "OPEN_FILE", id: nextFileId });
				}
				break;
		}
	}

	/**
 * Rebuild files array, for new selected folder
 * Filter to files with matching parentId, and type 'file'
 */
	function populateFiles(state) {
		$$invalidate(0, files = state.contents.filter((obj, index) => {
			return obj.type == "file" && obj.parentId == selectedDirectoryId;
		}));
	}

	/**
 * Set `selected` property of each entry in files array.
 * Set all to false, except the one whose id == state.lastOpenedFileId.
 * Then make sure the selected file is scrolled into view.
 */
	async function setSelectedFile(state) {
		if (files.length == 0) return;

		// Get selectedFileId for selectedFolder
		let selectedFileId = state.contents.find(d => d.type == "directory" && d.id == state.selectedFolderId).selectedFileId;

		// If it's 0 (the default, meaning "nothing"), set selectFileId to first of files
		if (selectedFileId == 0) {
			selectedFileId = files[0].id;
		}

		// Find the file whose id == selectedFileId,
		// and set selected true, and `selectedFileIndex = index`
		// Set all other files unselected
		files.forEach((f, index) => {
			f.selected = f.id == selectedFileId;
			if (f.selected) selectedFileIndex = index;
		});

		// Tell Svelte that variable has changed. Makes view update.
		$$invalidate(0, files);

		// Await tick, then scroll file into view
		await tick();

		scrollFileIntoView(selectedEl, true);
	}

	window.api.receive("stateChanged", async (state, oldState) => {
		if (state.changed.includes("selectedFolderId") || state.changed.includes("selectedFileId")) {
			selectedDirectoryId = state.selectedFolderId;
			populateFiles(state);
			setSelectedFile(state);
		}
	});

	onMount(async () => {
		const state = await window.api.invoke("getState");
		selectedDirectoryId = state.selectedFolderId;
		populateFiles(state);
		setSelectedFile(state);
	});

	function openFile(id) {
		window.api.send("dispatch", {
			type: "OPEN_FILE",
			parentId: selectedDirectoryId,
			fileId: id
		});
	}

	const click_handler = e => $$invalidate(3, sectionIsFocused = section.contains(e.target));

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(1, selectedEl = $$value);
		});
	}

	const click_handler_1 = file => openFile(file.id);

	function section_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, section = $$value);
		});
	}

	return [
		files,
		selectedEl,
		section,
		sectionIsFocused,
		handleKeydown,
		openFile,
		selectedDirectoryId,
		selectedFileIndex,
		populateFiles,
		setSelectedFile,
		click_handler,
		div_binding,
		click_handler_1,
		section_1_binding
	];
}

class NavFiles extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-16x96ii-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});
	}
}

const yamlOverlay = {
  startState: function () {
    return {
      // frontMatter: false,
    }
  },
  token: function (stream, state) {
    state.combineTokens = true;

    if (stream.sol()) {
      stream.next();
      return "line-frontmatter"
    }

    while (stream.next() != null) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
};

const markdownOverlay = {
  startState: function () {
    return {
      frontMatter: false,
    }
  },
  token: function (stream, state) {

    state.combineTokens = null;

    let ch;

    // Demo: https://regex101.com/r/1MR7Tg/1
    if (stream.sol()) {
      if (stream.match(/^(-|\*|\+)\s/)) {
        // console.log("L1")
        state.combineTokens = true;
        return "line-list1"
      } else if (stream.match(/^\s{2,3}(-|\*|\+)\s/)) {
        // console.log("L2")
        state.combineTokens = true;
        return "line-list2"
      } else if (stream.match(/^\s{4,5}(-|\*|\+)\s/)) {
        // console.log("L3")
        state.combineTokens = true;
        return "line-list3"
      } else if (stream.match(/^\s{6,7}(-|\*|\+)\s/)) {
        state.combineTokens = true;
        return "line-list4"
      }
    }

    // Blockquote 
    if (stream.sol() && stream.match(/^>\s/)) {
      // stream.skipToEnd()
      stream.next();
      return "line-blockquote"
    }

    // Strong - Flanking ** characters
    if (stream.match('**')) {
      state.combineTokens = true;
      return 'flank'
    }

    // Emphasis - Flanking _ characters
    if (stream.match(' _') || stream.match('_ ')) {
      state.combineTokens = true;
      return 'flank'
    }

    // Code - Flanking ` characters
    if (stream.match('`')) {
      state.combineTokens = true;
      return 'flank'
    }

    // Header (hash tags)
    if (stream.sol() && stream.match(/^#{1,5}/)) {
      state.combineTokens = true;
      return "header-hash"
    }

    // Cite keys
    if (stream.match("[@")) {
      // console.log("Citation found")
      while ((ch = stream.next()) != null)
        if (ch == "]") {
          state.combineTokens = false;
          return "citation"
        }
    }

    // Wiki links
    if (stream.match("[[")) {
      while ((ch = stream.next()) != null)
        if (ch == "]" && stream.next() == "]") {
          stream.eat("]");
          state.combineTokens = true;
          return "wikilink"
        }
    }

    // Figures
    if (stream.match("![")) {
      stream.skipToEnd();
      return "figure"
    }

    // Links
    // if (stream.match("[")) {
    //   while ((ch = stream.next()) != null)
    //     console.log(stream.baseToken())
    //   if (ch == ")") {
    //     // state.combineTokens = true
    //     return "linkwrapper "
    //   }
    // }

    while (
      stream.next() != null
      // Line
      && !stream.match(">", false)
      && !stream.match("#", false)
      // Inline
      && !stream.match("**", false)
      && !stream.match(" _", false)
      && !stream.match("_ ", false)
      && !stream.match("`", false)
      && !stream.match("[@", false)
      && !stream.match("![", false)
      && !stream.match("[[", false)
      // && !stream.match("[", false)
    ) { }

    // If we don't do any of the above, return null (token does not need to be styled)
    return null
  }
};

/**
 * Define custom mode to be used with CodeMirror.
 */
function defineGambierMode() {
  CodeMirror.defineMode("gambier", (config, parserConfig) => {

    const START = 0, FRONTMATTER = 1, BODY = 2;

    const yamlMode = CodeMirror.overlayMode(CodeMirror.getMode(config, { name: "yaml" }), yamlOverlay);
    const innerMode = CodeMirror.overlayMode(CodeMirror.getMode(config, { name: "markdown", highlightFormatting: false, tokenTypeOverrides: { code: 'code', list1: 'list', list2: 'list', list3: 'list' } }), markdownOverlay);

    function curMode(state) {
      return state.state == BODY ? innerMode : yamlMode
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
            state.inner = CodeMirror.startState(innerMode);
            return innerMode.token(stream, state.inner)
          }
        } else if (state.state == FRONTMATTER) {
          var end = stream.sol() && stream.match(/(---|\.\.\.)/, false);
          var style = yamlMode.token(stream, state.inner);
          if (end) {
            state.state = BODY;
            state.inner = CodeMirror.startState(innerMode);
          }
          return style
        } else {
          return innerMode.token(stream, state.inner)
        }
      },
      innerMode: function (state) {
        return { mode: curMode(state), state: state.inner }
      },
      blankLine: function (state) {
        var mode = curMode(state);
        if (mode.blankLine) return mode.blankLine(state.inner)
      }
    }
  });
}

/**
 * Mark text and replace with specified element.
 * @param {*} editor - Instance
 * @param {*} element - To render where the marked text used to be
 * @param {*} line - Of text to mark
 * @param {*} start - Of text to mark
 * @param {*} end - Of text to mark
 */
function replaceMarkWithElement(editor, element, line, start, end) {
  editor.markText({ line: line, ch: start }, { line: line, ch: end }, {
    replacedWith: element,
    clearOnEnter: false,
    inclusiveLeft: false,
    inclusiveRight: false,
    handleMouseEvents: false
  });
}

/**
 * Return a single character at the specified position
 */
function getCharAt(editor, line, ch = 0) {
  return editor.getRange(
    {line: line, ch: ch}, // from
    {line: line, ch: ch + 1} // to
  ) 
}

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
function getTextFromRange(editor, line, start, end) {
  return editor.getRange({ line: line, ch: start }, { line: line, ch: end })
}

/* src/js/component/Link.svelte generated by Svelte v3.22.3 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-1l4rmf8-style";
	style.textContent = ":root{--layout:[folders-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [folders-end files-start] minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}.link.svelte-1l4rmf8{box-sizing:border-box;color:var(--clr-blue);background-color:var(--clr-blue-lighter);padding:0 0.2em 0 0.15em;border-radius:0.15em;border:1px solid var(--clr-blue-light)}";
	append(document.head, style);
}

function create_fragment$3(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*text*/ ctx[0]);
			attr(span, "class", "link svelte-1l4rmf8");
		},
		m(target, anchor) {
			insert(target, span, anchor);
			append(span, t);
		},
		p(ctx, [dirty]) {
			if (dirty & /*text*/ 1) set_data(t, /*text*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(span);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let { text } = $$props;

	$$self.$set = $$props => {
		if ("text" in $$props) $$invalidate(0, text = $$props.text);
	};

	return [text];
}

class Link extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1l4rmf8-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { text: 0 });
	}
}

function Details() {
  this.start;
  this.end;
  this.textStart;
  this.textEnd;
  this.text;
  this.urlStart;
  this.urlEnd;
  this.url;
}

/**
 * For the specified line, find links, and for each found, create a new object with their details, push it into an array, and return the array.
 * See Link object (above) for what is included.
 */
function find(editor, lineNo, tokens) {

  let hit;
  let hits = [];

  // Find open and closing tokens
  for (const token of tokens) {
    if (token.type !== null) {
      if (token.type.includes('link')) {
        switch (token.string) {
          case "[":
            // TODO: Get token at (token.end + 1). If it's '@', then don't create link.
            hit = new Details();
            hit.start = token.start;
            hit.textStart = token.start;
            hits.push(hit);
            break
          case "]":
            hit.textEnd = token.end;
            hit.text = getTextFromRange(editor, lineNo, hit.textStart + 1, hit.textEnd - 1);
            break
        }
      } else if (token.type.includes('url')) {
        switch (token.string) {
          case "(":
            hit.urlStart = token.start;
            break
          case ")":
            hit.urlEnd = token.end;
            hit.end = token.end;
            hit.url = getTextFromRange(editor, lineNo, hit.urlStart + 1, hit.urlEnd - 1);
            break
        }
      }
    }
  }

  // Remove "links" that don't have urls. 
  // Otherwise we can get false positives with `[Hi there]` sections
  // (which I) shouldn't be using in my markdown, to begin with
  hits = hits.filter((h) => h.url !== undefined);

  return hits
}


/**
 * Find and mark links for the given line
 */
function markInlineLinks(editor, lineHandle, tokens) {
  const line = lineHandle.lineNo();
  const links = find(editor, line, tokens);
  if (links.length > 0) {
    links.map((l) => {

      const frag = document.createDocumentFragment();

      const component = new Link({
        target: frag,
        props: {
          text: l.text,
          url: l.url
        }
      });

      editor.markText({ line: line, ch: l.start }, { line: line, ch: l.end }, {
        replacedWith: frag,
        // addToHistory: true, // Doesn't do anything?
        clearOnEnter: false,
        inclusiveLeft: false,
        inclusiveRight: false,
        handleMouseEvents: false
      });
    });
  }
}

/* src/js/component/Figure.svelte generated by Svelte v3.22.3 */

function add_css$4() {
	var style = element("style");
	style.id = "svelte-1jw57r3-style";
	style.textContent = "@charset \"UTF-8\";figure.svelte-1jw57r3.svelte-1jw57r3{width:100%;margin:0;padding:0;display:inline-block;white-space:normal}figure.svelte-1jw57r3 img.svelte-1jw57r3{max-width:10em;display:inline-block;height:auto;border-radius:3px;text-indent:100%;white-space:nowrap;overflow:hidden;position:relative}figure.svelte-1jw57r3 img.svelte-1jw57r3:after{text-indent:0%;content:\"\" \" \" attr(src);color:#646464;background-color:#f0f0f0;white-space:normal;display:block;position:absolute;z-index:2;top:0;left:0;width:100%;height:100%}figure.svelte-1jw57r3 figcaption.svelte-1jw57r3{font-style:italic;color:gray}";
	append(document.head, style);
}

function create_fragment$4(ctx) {
	let figure;
	let img;
	let img_src_value;
	let t0;
	let figcaption;
	let t1;

	return {
		c() {
			figure = element("figure");
			img = element("img");
			t0 = space();
			figcaption = element("figcaption");
			t1 = text(/*caption*/ ctx[0]);
			if (img.src !== (img_src_value = /*url*/ ctx[1])) attr(img, "src", img_src_value);
			attr(img, "alt", /*alt*/ ctx[2]);
			attr(img, "class", "svelte-1jw57r3");
			attr(figcaption, "class", "svelte-1jw57r3");
			attr(figure, "class", "svelte-1jw57r3");
		},
		m(target, anchor) {
			insert(target, figure, anchor);
			append(figure, img);
			append(figure, t0);
			append(figure, figcaption);
			append(figcaption, t1);
		},
		p(ctx, [dirty]) {
			if (dirty & /*url*/ 2 && img.src !== (img_src_value = /*url*/ ctx[1])) {
				attr(img, "src", img_src_value);
			}

			if (dirty & /*alt*/ 4) {
				attr(img, "alt", /*alt*/ ctx[2]);
			}

			if (dirty & /*caption*/ 1) set_data(t1, /*caption*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(figure);
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let { caption } = $$props;
	let { url } = $$props;
	let { alt } = $$props;

	$$self.$set = $$props => {
		if ("caption" in $$props) $$invalidate(0, caption = $$props.caption);
		if ("url" in $$props) $$invalidate(1, url = $$props.url);
		if ("alt" in $$props) $$invalidate(2, alt = $$props.alt);
	};

	return [caption, url, alt];
}

class Figure extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1jw57r3-style")) add_css$4();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { caption: 0, url: 1, alt: 2 });
	}
}

/**
 * Find and mark links for the given line
 */
async function markFigures(editor, lineHandle, tokens, filePath) {

  const text = lineHandle.text;
  const line = lineHandle.lineNo();
  const start = 0;
  const end = tokens[tokens.length - 1].end;
  
  const caption = text.substring(2, text.lastIndexOf(']'));
  let srcPath = text.substring(text.lastIndexOf('(') + 1, text.lastIndexOf('.') + 4);
  srcPath = await window.api.invoke('pathJoin', filePath, srcPath);
  let alt = text.substring(text.lastIndexOf('('), text.lastIndexOf(')'));
  alt = alt.substring(alt.indexOf('"') + 1, alt.lastIndexOf('"'));

  const frag = document.createDocumentFragment();

  const component = new Figure({
    target: frag,
    props: {
      caption: caption,
      url: srcPath,
      alt: alt
    }
  });

  replaceMarkWithElement(editor, frag, line, start, end);
}

/**
 * Find and mark list items
 */
async function markList(editor, lineHandle, tokens) {

  const listMarker = lineHandle.text.trim().charAt(0);
  const line = lineHandle.lineNo();
  const start = 0;
  const end = lineHandle.text.indexOf(listMarker) + 2;

  const frag = document.createDocumentFragment();
  const span = document.createElement('span');
  span.setAttribute('data-marker', listMarker);
  span.classList.add('list-marker');
  frag.appendChild(span);

  editor.markText({ line: line, ch: start }, { line: line, ch: end }, {
    replacedWith: frag,
    clearOnEnter: false,
    selectLeft: false,
    selectRight: true,
    handleMouseEvents: false
  });
}

/* src/js/component/BracketsWidget.svelte generated by Svelte v3.22.3 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-u5l30k-style";
	style.textContent = ":root{--layout:[folders-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [folders-end files-start] minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}.link.svelte-u5l30k{position:absolute;box-sizing:border-box;color:var(--clr-blue);background-color:var(--clr-blue-lighter);padding:0 0.2em 0 0.15em;border-radius:0.15em;border:1px solid var(--clr-blue-light);z-index:10;transform:translate(50%, 0%)}";
	append(document.head, style);
}

function create_fragment$5(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*input*/ ctx[1]);
			attr(div, "class", "link svelte-u5l30k");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
			/*div_binding*/ ctx[4](div);
		},
		p(ctx, [dirty]) {
			if (dirty & /*input*/ 2) set_data(t, /*input*/ ctx[1]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			/*div_binding*/ ctx[4](null);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let { element } = $$props;
	let { input } = $$props;
	let { visible = false } = $$props;

	const show = () => {
		$$invalidate(1, input = "");
		$$invalidate(2, visible = true);
	};

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(0, element = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("element" in $$props) $$invalidate(0, element = $$props.element);
		if ("input" in $$props) $$invalidate(1, input = $$props.input);
		if ("visible" in $$props) $$invalidate(2, visible = $$props.visible);
	};

	return [element, input, visible, show, div_binding];
}

class BracketsWidget extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-u5l30k-style")) add_css$5();

		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
			element: 0,
			input: 1,
			visible: 2,
			show: 3
		});
	}

	get element() {
		return this.$$.ctx[0];
	}

	set element(element) {
		this.$set({ element });
		flush();
	}

	get input() {
		return this.$$.ctx[1];
	}

	set input(input) {
		this.$set({ input });
		flush();
	}

	get visible() {
		return this.$$.ctx[2];
	}

	set visible(visible) {
		this.$set({ visible });
		flush();
	}

	get show() {
		return this.$$.ctx[3];
	}
}

// -------- SHARED VARIABLES -------- //

let editor;
let fileId;
let filePath;
let bracketsWidget;

let lastCursorLine = 0;

const turndownService = new TurndownService();

// -------- SETUP -------- //

/**
 * Load file contents into CodeMirror
 */
function loadFile(file) {
  editor.setValue(file);
  editor.clearHistory();
  // findAndMark()
}

/**
 * Find each citation in the specified line, and collape + replace them.
 */
function findAndMark() {
  editor.operation(() => {
    editor.eachLine((lineHandle) => {
      const tokens = editor.getLineTokens(lineHandle.lineNo());
      const isFigure = tokens.some((t) => t.type !== null && t.type.includes('figure'));
      // const isFigure = tokens[0] !== undefined && tokens[0].type.includes('figure')
      const isList = tokens[0] !== undefined && tokens[0].type !== null && tokens[0].type.includes('list');

      if (isFigure) {
        markFigures(editor, lineHandle, tokens, filePath);
      } else {
        if (isList) {
          markList(editor, lineHandle);
        }
        markInlineLinks(editor, lineHandle, tokens);
        // markCitations(editor, lineHandle, tokens)
      }
    });
  });
}


// -------- EVENT HANDLERS -------- //

/**
 * Every time cursor updates, check last line it was in for citations. We have to do this, because TODO... (along lines of: citations open/close when they're clicked into and out-of)
 */
function onCursorActivity() {
  lastCursorLine = editor.getCursor().line;
  // editor.addWidget(editor.getCursor(), el)
  findAndMark();
}

function onChange(cm, change) {
  const text = change.text[0];
  // const from = { line: change.from.line, ch: change.from.ch }
  // const to = { line: change.to.line, ch: change.to.ch }
  // console.log(from.ch, to.ch)

  // const isBracketsCreated = text.charAt(0) == '[' && text.slice(text.length - 1) == ']'
  // if (isBracketsCreated) {
  //   const insideLeftBracket = { line: change.from.line, ch: change.from.ch + 1}
  //   cm.addWidget(insideLeftBracket , bracketsWidget.element)
  //   bracketsWidget.show()
  //   bracketsWidget.from = insideLeftBracket
  // }

  const typedAmpersand = change.text[0] == '@';
  const insideBracket = getCharAt(cm, change.from.line, change.from.ch - 1) == '[';
  const startedCitation = typedAmpersand && insideBracket;
  if (startedCitation) {
    const currentPos = editor.getCursor();
    cm.addWidget(currentPos, bracketsWidget.element);
    bracketsWidget.from = currentPos;
    bracketsWidget.show();
  }

  if (bracketsWidget.visible) {
    let insideRightBracket = { line: change.to.line, ch: 0 };
    insideRightBracket.ch = change.origin == '+delete' ? change.from.ch : change.to.ch + 1;
    bracketsWidget.input = editor.getRange(bracketsWidget.from, insideRightBracket);
  }
}

async function onBeforeChange(cm, change) {
  if (change.origin === 'paste') {
    const selection = editor.getSelection();
    const isURL = isUrl(change.text);

    if (isURL) {
      if (selection) {
        const text = selection;
        const url = change.text;
        const newText = change.text.map((line) => line = `[${text}](${url})`);
        change.update(null, null, newText);
      }
    } else {
      change.cancel();
      const formats = await window.api.invoke('getFormatOfClipboard');
      if (formats.length === 1 && formats[0] === 'text/plain') {
        cm.replaceSelection(change.text.join('\n'));
      } else if (formats.includes('text/html')) {
        const html = await window.api.invoke('getHTMLFromClipboard');
        const markdown = turndownService.turndown(html);
        cm.replaceSelection(markdown);
      }
    }
  }
}

// function onInputRead(cm, change) {
//   console.log(change)
// }

// -------- SETUP -------- //

function makeEditor() {

  // Brackets widget
  bracketsWidget = mountReplace(BracketsWidget, {
    target: document.querySelector('#bracketsWidget'),
    // props: {  }
  });

  // Define "gambier" CodeMirror mode
  defineGambierMode();

  // Create CodeMirror instance from `<textarea>` (which is replaced).
  const textarea = document.querySelector('#editor textarea');
  editor = CodeMirror.fromTextArea(textarea, {
    mode: 'gambier',
    lineWrapping: true,
    lineNumbers: false,
    theme: 'gambier',
    indentWithTabs: false,
    autoCloseBrackets: true,
    extraKeys: {
      'Enter': 'newlineAndIndentContinueMarkdownList',
      'Tab': 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList'
    }
  });

  // Setup event listeners
  editor.on("cursorActivity", onCursorActivity);
  editor.on("change", onChange);
  editor.on('beforeChange', onBeforeChange);
  // editor.on("inputRead", onInputRead)
}

async function setup(initialState) {

  // Make editor
  makeEditor();

  // Setup change listeners
  window.api.receive('stateChanged', async (state, oldState) => {

    if (state.changed.includes('selectedFileId')) {
      console.log(state.selectedFileId);
      fileId = state.selectedFileId;
      const file = await window.api.invoke('getFileById', fileId, 'utf8');
      loadFile(file);
    }
  });

  // Check if projectDirectory defined. If no, exit.
  if (
    initialState.projectDirectory == 'undefined' ||
    initialState.selectedFileId == 0
  ) {
    console.log("No project directory defined");
    return
  }

  // Get file to load, and load
  fileId = initialState.selectedFileId;
  filePath = initialState.contents.find((f) => f.id == fileId).path;
  filePath = filePath.substring(0, filePath.lastIndexOf('/'));
  const file = await window.api.invoke('getFileById', fileId, 'utf8');
  loadFile(file);
}

let el;
let selectProjectDirectory;

function setVisibility(projectDirectory) {
  if (projectDirectory == 'undefined') {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
    }
  } else {
    if (!el.classList.contains('hidden')) {
      el.classList.add('hidden');
      console.log("hiding firstRun");
    }
  }
}

async function setup$1(initialState) {
  
  el = document.querySelector('#firstrun');
  selectProjectDirectory = el.querySelector('button');
  
  // Create button click event handler
  selectProjectDirectory.onclick = () => {
    window.api.send('selectProjectDirectory');
  };

  // Setup change listeners
  window.api.receive('stateChanged', async (state, oldState) => {
    if (state.changed.includes('projectDirectory')) {
      setVisibility(state.projectDirectory);
    }
  });

  // Set initial visibility
  setVisibility(initialState.projectDirectory);
}

// Bundled imports
// import Fuse from './third-party/fuse/fuse.esm.js'

async function setup$2() {
  
  const initialState = await window.api.invoke('getState', 'utf8');
  
  setup$1(initialState);

  mountReplace(NavFolders, {
    target: document.querySelector('#folders'),
    // props: { name: 'world' }
  });
  
  mountReplace(NavFiles, {
    target: document.querySelector('#files'),
    // props: { name: 'world' }
  });
  
  setup(initialState);
  
  window.api.send('showWindow'); 

}
window.addEventListener('DOMContentLoaded', setup$2);

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)
//# sourceMappingURL=renderer.js.map
