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

/* src/js/renderer/component/UI/ToolbarButton.svelte generated by Svelte v3.22.3 */

function add_css() {
	var style = element("style");
	style.id = "svelte-141xp47-style";
	style.textContent = ".button.svelte-141xp47{position:relative}.button.svelte-141xp47:hover{background-color:var(--disabledControlTextColor)}.icon.svelte-141xp47{position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:18px;height:18px}";
	append(document.head, style);
}

// (48:2) {#if label}
function create_if_block_1(ctx) {
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

// (51:2) {#if tooltip}
function create_if_block(ctx) {
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

function create_fragment$2(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let if_block0 = /*label*/ ctx[0] && create_if_block_1(ctx);
	let if_block1 = /*tooltip*/ ctx[1] && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "icon svelte-141xp47");
			attr(div0, "style", /*iconStyles*/ ctx[3]);
			attr(div1, "class", "button svelte-141xp47");
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
					if_block0 = create_if_block_1(ctx);
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
					if_block1 = create_if_block(ctx);
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

function instance$2($$self, $$props, $$invalidate) {
	let { width = 34 } = $$props;
	let { height = 28 } = $$props;
	let { borderRadius = 6 } = $$props;
	let { iconImage = null } = $$props;
	let { iconColor = "--controlTextColor" } = $$props;
	let { label = null } = $$props;
	let { tooltip = null } = $$props;
	let buttonStyles = "";
	let iconStyles = "";

	$$self.$set = $$props => {
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
		if (!document.getElementById("svelte-141xp47-style")) add_css();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
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

/* src/js/renderer/component/AddressBar.svelte generated by Svelte v3.22.3 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1qn5t4o-style";
	style.textContent = "#addressbar.svelte-1qn5t4o{margin:0 auto}.searchfield.svelte-1qn5t4o{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);position:relative;background-color:rgba(0, 0, 0, 0.04);border-radius:4px;min-height:20px;min-width:20rem;max-width:40rem;display:flex;flex-direction:row;align-items:center}.searchfield.svelte-1qn5t4o:focus-within{animation-fill-mode:forwards;animation-name:svelte-1qn5t4o-selectField;animation-duration:0.3s}@keyframes svelte-1qn5t4o-selectField{from{box-shadow:0 0 0 10px transparent}to{box-shadow:0 0 0 3.5px rgba(59, 153, 252, 0.5)}}.magnifying-glass.svelte-1qn5t4o{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlTextColor);-webkit-mask-image:var(--img-magnifyingglass);position:absolute;width:13px;height:13px;left:5px;opacity:0.5}.placeholder.svelte-1qn5t4o{position:absolute;top:50%;transform:translate(0, -50%);color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-1qn5t4o{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}";
	append(document.head, style);
}

// (96:4) {#if !query}
function create_if_block$1(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr(span, "class", "placeholder svelte-1qn5t4o");
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

function create_fragment$3(ctx) {
	let div2;
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block$1(ctx);

	return {
		c() {
			div2 = element("div");
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr(div0, "class", "magnifying-glass svelte-1qn5t4o");
			attr(input_1, "type", "text");
			attr(input_1, "class", "svelte-1qn5t4o");
			attr(div1, "class", "searchfield svelte-1qn5t4o");
			attr(div2, "id", "addressbar");
			attr(div2, "class", "svelte-1qn5t4o");
		},
		m(target, anchor, remount) {
			insert(target, div2, anchor);
			append(div2, div1);
			append(div1, div0);
			append(div1, t0);
			if (if_block) if_block.m(div1, null);
			append(div1, t1);
			append(div1, input_1);
			/*input_1_binding*/ ctx[7](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);
			if (remount) run_all(dispose);

			dispose = [
				listen(window, "keydown", /*handleKeydown*/ ctx[3]),
				listen(div0, "mousedown", prevent_default(/*mousedown_handler*/ ctx[6])),
				listen(input_1, "input", /*input_1_input_handler*/ ctx[8])
			];
		},
		p(ctx, [dirty]) {
			if (!/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$1(ctx);
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
			run_all(dispose);
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
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
			$$invalidate(2, input = $$value);
		});
	}

	function input_1_input_handler() {
		query = this.value;
		$$invalidate(0, query);
	}

	$$self.$set = $$props => {
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
		if (!document.getElementById("svelte-1qn5t4o-style")) add_css$1();

		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
			state: 4,
			placeholder: 1,
			query: 0,
			focused: 5
		});
	}
}

/* src/js/renderer/component/ToolBar.svelte generated by Svelte v3.22.3 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-9lw767-style";
	style.textContent = "#address-bar.svelte-9lw767{width:100%;height:40px;display:flex;flex-direction:row;align-items:center;padding:0 5px}";
	append(document.head, style);
}

function create_fragment$4(ctx) {
	let div;
	let t0;
	let t1;
	let current;

	const toolbarbutton0 = new ToolbarButton({
			props: {
				class: "sidebarBtn",
				iconImage: "--img-sidebar-left"
			}
		});

	const addressbar = new AddressBar({ props: { state: /*state*/ ctx[0] } });

	const toolbarbutton1 = new ToolbarButton({
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
			attr(div, "class", "svelte-9lw767");
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

function instance$4($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
	};

	return [state];
}

class ToolBar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-9lw767-style")) add_css$2();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { state: 0 });
	}
}

/* src/js/renderer/component/SideBar/Header.svelte generated by Svelte v3.22.3 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-blyvv3-style";
	style.textContent = "header.svelte-blyvv3.svelte-blyvv3{padding:0 10px;display:flex;flex-direction:row;align-items:center;min-height:30px}header.svelte-blyvv3 h1.svelte-blyvv3{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);color:var(--labelColor);user-select:none;font-weight:bold;font-size:13px;flex-grow:1;margin:0;padding:0}";
	append(document.head, style);
}

function create_fragment$5(ctx) {
	let header;
	let h1;
	let t0;
	let t1;
	let div;
	let current;
	const default_slot_template = /*$$slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	return {
		c() {
			header = element("header");
			h1 = element("h1");
			t0 = text(/*title*/ ctx[0]);
			t1 = space();
			div = element("div");
			if (default_slot) default_slot.c();
			attr(h1, "class", "svelte-blyvv3");
			attr(div, "class", "right");
			attr(header, "class", "svelte-blyvv3");
		},
		m(target, anchor) {
			insert(target, header, anchor);
			append(header, h1);
			append(h1, t0);
			append(header, t1);
			append(header, div);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*title*/ 1) set_data(t0, /*title*/ ctx[0]);

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
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

function instance$5($$self, $$props, $$invalidate) {
	let { title = "Title" } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	return [title, $$scope, $$slots];
}

class Header extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-blyvv3-style")) add_css$3();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { title: 0 });
	}
}

/* src/js/renderer/component/UI/DisclosureButton.svelte generated by Svelte v3.22.3 */

function add_css$4() {
	var style = element("style");
	style.id = "svelte-1nfzmnc-style";
	style.textContent = ".button.svelte-1nfzmnc{position:relative}.icon.svelte-1nfzmnc{position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat}";
	append(document.head, style);
}

// (52:2) {#if label}
function create_if_block_1$1(ctx) {
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

// (55:2) {#if tooltip}
function create_if_block$2(ctx) {
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

function create_fragment$6(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let dispose;
	let if_block0 = /*label*/ ctx[0] && create_if_block_1$1(ctx);
	let if_block1 = /*tooltip*/ ctx[1] && create_if_block$2(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			attr(div0, "class", "icon svelte-1nfzmnc");
			attr(div0, "style", /*iconStyles*/ ctx[3]);
			attr(div1, "class", "button svelte-1nfzmnc");
			attr(div1, "style", /*buttonStyles*/ ctx[2]);
			attr(div1, "role", "button");
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);
			if (remount) dispose();
			dispose = listen(div1, "mousedown", stop_propagation(/*mousedown_handler*/ ctx[11]));
		},
		p(ctx, [dirty]) {
			if (dirty & /*iconStyles*/ 8) {
				attr(div0, "style", /*iconStyles*/ ctx[3]);
			}

			if (/*label*/ ctx[0]) {
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

			if (/*tooltip*/ ctx[1]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block$2(ctx);
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
			dispose();
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { width = 34 } = $$props;
	let { height = 28 } = $$props;
	let { borderRadius = 2 } = $$props;
	let { iconImage = "img-chevron-right" } = $$props;
	let { iconColor = "controlTextColor" } = $$props;
	let { iconInset = 4 } = $$props;
	let { label = null } = $$props;
	let { tooltip = null } = $$props;
	let buttonStyles = "";
	let iconStyles = "";
	const mousedown_handler = () => dispatch("toggle");

	$$self.$set = $$props => {
		if ("width" in $$props) $$invalidate(5, width = $$props.width);
		if ("height" in $$props) $$invalidate(6, height = $$props.height);
		if ("borderRadius" in $$props) $$invalidate(7, borderRadius = $$props.borderRadius);
		if ("iconImage" in $$props) $$invalidate(8, iconImage = $$props.iconImage);
		if ("iconColor" in $$props) $$invalidate(9, iconColor = $$props.iconColor);
		if ("iconInset" in $$props) $$invalidate(10, iconInset = $$props.iconInset);
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("tooltip" in $$props) $$invalidate(1, tooltip = $$props.tooltip);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*width, height, borderRadius*/ 224) {
			// Button styles
			 {
				$$invalidate(2, buttonStyles = `width: ${width}px; height: ${height}px; border-radius: ${borderRadius}px;`);
			}
		}

		if ($$self.$$.dirty & /*iconImage, iconColor, iconInset*/ 1792) {
			// Icon styles
			 {
				if (iconImage) {
					$$invalidate(3, iconStyles = `-webkit-mask-image: var(--${iconImage}); background-color: var(--${iconColor}); width: calc(100% - ${iconInset}px); height: calc(100% - ${iconInset}px);`);
				}
			}
		}
	};

	return [
		label,
		tooltip,
		buttonStyles,
		iconStyles,
		dispatch,
		width,
		height,
		borderRadius,
		iconImage,
		iconColor,
		iconInset,
		mousedown_handler
	];
}

class DisclosureButton extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1nfzmnc-style")) add_css$4();

		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
			width: 5,
			height: 6,
			borderRadius: 7,
			iconImage: 8,
			iconColor: 9,
			iconInset: 10,
			label: 0,
			tooltip: 1
		});
	}
}

/* src/js/renderer/component/UI/Label.svelte generated by Svelte v3.22.3 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-1c9xd1n-style";
	style.textContent = "div.svelte-1c9xd1n{flex-grow:1}.primary.svelte-1c9xd1n{color:var(--labelColor)}.secondary.svelte-1c9xd1n{color:var(--secondaryLabelColor)}.tertiary.svelte-1c9xd1n{color:var(--tertiaryLabelColor)}.quaternary.svelte-1c9xd1n{color:var(--quaternaryLabelColor)}.label-normal.svelte-1c9xd1n{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor)}.label-normal-small.svelte-1c9xd1n{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px}.label-normal-small-bold.svelte-1c9xd1n{font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px}.label-large-bold.svelte-1c9xd1n{font-family:'SF Pro Display';font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px}.column.svelte-1c9xd1n{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px}";
	append(document.head, style);
}

function create_fragment$7(ctx) {
	let div;
	let div_class_value;
	let current;
	const default_slot_template = /*$$slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	return {
		c() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr(div, "class", div_class_value = "label " + /*color*/ ctx[0] + " " + /*typography*/ ctx[1] + " svelte-1c9xd1n");
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
					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[2], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[2], dirty, null));
				}
			}

			if (!current || dirty & /*color, typography*/ 3 && div_class_value !== (div_class_value = "label " + /*color*/ ctx[0] + " " + /*typography*/ ctx[1] + " svelte-1c9xd1n")) {
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

function instance$7($$self, $$props, $$invalidate) {
	let { color = "primary" } = $$props;
	let { typography = "label-normal" } = $$props;
	let { $$slots = {}, $$scope } = $$props;

	$$self.$set = $$props => {
		if ("color" in $$props) $$invalidate(0, color = $$props.color);
		if ("typography" in $$props) $$invalidate(1, typography = $$props.typography);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	return [color, typography, $$scope, $$slots];
}

class Label extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1c9xd1n-style")) add_css$5();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { color: 0, typography: 1 });
	}
}

/* src/js/renderer/component/UI/Separator.svelte generated by Svelte v3.22.3 */

function add_css$6() {
	var style = element("style");
	style.id = "svelte-1q6lmmr-style";
	style.textContent = "hr.svelte-1q6lmmr{min-height:1px;border:0;background-color:var(--separatorColor)}";
	append(document.head, style);
}

function create_fragment$8(ctx) {
	let hr;

	return {
		c() {
			hr = element("hr");
			set_style(hr, "margin", "0 " + /*marginSides*/ ctx[0] + "px");
			attr(hr, "class", "svelte-1q6lmmr");
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

function instance$8($$self, $$props, $$invalidate) {
	let { marginSides = "0" } = $$props;

	$$self.$set = $$props => {
		if ("marginSides" in $$props) $$invalidate(0, marginSides = $$props.marginSides);
	};

	return [marginSides];
}

class Separator extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1q6lmmr-style")) add_css$6();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { marginSides: 0 });
	}
}

/* src/js/renderer/component/UI/Thumbnail.svelte generated by Svelte v3.22.3 */

function add_css$7() {
	var style = element("style");
	style.id = "svelte-1rm7o7i-style";
	style.textContent = ".thumbnail.svelte-1rm7o7i{flex-grow:1;overflow:hidden;width:100%;height:100%}img.svelte-1rm7o7i{width:100%;height:100%;object-fit:contain;object-position:center}";
	append(document.head, style);
}

// (24:2) {:else}
function create_else_block(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (img.src !== (img_src_value = "placeholder")) attr(img, "src", img_src_value);
			attr(img, "class", "svelte-1rm7o7i");
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

// (22:2) {#if src}
function create_if_block$3(ctx) {
	let img;
	let img_src_value;

	return {
		c() {
			img = element("img");
			if (img.src !== (img_src_value = /*src*/ ctx[0])) attr(img, "src", img_src_value);
			attr(img, "class", "svelte-1rm7o7i");
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

function create_fragment$9(ctx) {
	let div;

	function select_block_type(ctx, dirty) {
		if (/*src*/ ctx[0]) return create_if_block$3;
		return create_else_block;
	}

	let current_block_type = select_block_type(ctx);
	let if_block = current_block_type(ctx);

	return {
		c() {
			div = element("div");
			if_block.c();
			attr(div, "class", "thumbnail svelte-1rm7o7i");
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

function instance$9($$self, $$props, $$invalidate) {
	let { src } = $$props;
	let { margin = "0 0 0 0" } = $$props;

	$$self.$set = $$props => {
		if ("src" in $$props) $$invalidate(0, src = $$props.src);
		if ("margin" in $$props) $$invalidate(1, margin = $$props.margin);
	};

	return [src, margin];
}

class Thumbnail extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1rm7o7i-style")) add_css$7();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, { src: 0, margin: 1 });
	}
}

/* src/js/renderer/component/SideBar/Preview.svelte generated by Svelte v3.22.3 */

function add_css$8() {
	var style = element("style");
	style.id = "svelte-1uqtl3v-style";
	style.textContent = "#preview.svelte-1uqtl3v{flex-shrink:0;display:flex;flex-direction:column;height:255px;position:absolute;transform:translate(0, 100%)}#preview.svelte-1uqtl3v:not(.isOpen){bottom:30px}#preview.isOpen.svelte-1uqtl3v{bottom:255px}.media.svelte-1uqtl3v{padding:5px 10px 10px;display:flex;flex-direction:column;flex-grow:1;overflow:hidden}";
	append(document.head, style);
}

// (91:2) <Header title={'Preview'}>
function create_default_slot_3(ctx) {
	let current;

	const disclosurebutton = new DisclosureButton({
			props: { width: 16, height: 16, iconInset: 4 }
		});

	disclosurebutton.$on("toggle", toggleOpenClose);

	return {
		c() {
			create_component(disclosurebutton.$$.fragment);
		},
		m(target, anchor) {
			mount_component(disclosurebutton, target, anchor);
			current = true;
		},
		p: noop,
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

// (102:33) 
function create_if_block_2(ctx) {
	let div;
	let t0;
	let t1;
	let t2;
	let current;

	const thumbnail = new Thumbnail({
			props: {
				src: /*item*/ ctx[0].path,
				margin: "0 0 10px 0"
			}
		});

	const label0 = new Label({
			props: {
				color: "primary",
				typography: "label-normal-small-bold",
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			}
		});

	const label1 = new Label({
			props: {
				color: "secondary",
				typography: "label-normal-small",
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	const label2 = new Label({
			props: {
				color: "secondary",
				typography: "label-normal-small",
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	return {
		c() {
			div = element("div");
			create_component(thumbnail.$$.fragment);
			t0 = space();
			create_component(label0.$$.fragment);
			t1 = space();
			create_component(label1.$$.fragment);
			t2 = space();
			create_component(label2.$$.fragment);
			attr(div, "class", "media svelte-1uqtl3v");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(thumbnail, div, null);
			append(div, t0);
			mount_component(label0, div, null);
			append(div, t1);
			mount_component(label1, div, null);
			append(div, t2);
			mount_component(label2, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const thumbnail_changes = {};
			if (dirty & /*item*/ 1) thumbnail_changes.src = /*item*/ ctx[0].path;
			thumbnail.$set(thumbnail_changes);
			const label0_changes = {};

			if (dirty & /*$$scope, item*/ 513) {
				label0_changes.$$scope = { dirty, ctx };
			}

			label0.$set(label0_changes);
			const label1_changes = {};

			if (dirty & /*$$scope, item*/ 513) {
				label1_changes.$$scope = { dirty, ctx };
			}

			label1.$set(label1_changes);
			const label2_changes = {};

			if (dirty & /*$$scope*/ 512) {
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
			if (detaching) detach(div);
			destroy_component(thumbnail);
			destroy_component(label0);
			destroy_component(label1);
			destroy_component(label2);
		}
	};
}

// (100:31) 
function create_if_block_1$2(ctx) {
	let t;

	return {
		c() {
			t = text("Doc");
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

// (98:2) {#if item.type == 'folder'}
function create_if_block$4(ctx) {
	let t;

	return {
		c() {
			t = text("Folder");
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

// (105:6) <Label color={'primary'} typography={'label-normal-small-bold'}>
function create_default_slot_2(ctx) {
	let t_value = /*item*/ ctx[0].name + "";
	let t;

	return {
		c() {
			t = text(t_value);
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].name + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

// (108:6) <Label color={'secondary'} typography={'label-normal-small'}>
function create_default_slot_1(ctx) {
	let t0_value = /*item*/ ctx[0].filetype.substring(1).toUpperCase() + "";
	let t0;
	let t1;

	return {
		c() {
			t0 = text(t0_value);
			t1 = text("\n        image - 1.25 MB");
		},
		m(target, anchor) {
			insert(target, t0, anchor);
			insert(target, t1, anchor);
		},
		p(ctx, dirty) {
			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*item*/ ctx[0].filetype.substring(1).toUpperCase() + "")) set_data(t0, t0_value);
		},
		d(detaching) {
			if (detaching) detach(t0);
			if (detaching) detach(t1);
		}
	};
}

// (112:6) <Label color={'secondary'} typography={'label-normal-small'}>
function create_default_slot(ctx) {
	let t;

	return {
		c() {
			t = text("945 x 1.25");
		},
		m(target, anchor) {
			insert(target, t, anchor);
		},
		d(detaching) {
			if (detaching) detach(t);
		}
	};
}

function create_fragment$a(ctx) {
	let div;
	let t0;
	let t1;
	let current_block_type_index;
	let if_block;
	let current;
	const separator = new Separator({});

	const header = new Header({
			props: {
				title: "Preview",
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			}
		});

	const if_block_creators = [create_if_block$4, create_if_block_1$2, create_if_block_2];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*item*/ ctx[0].type == "folder") return 0;
		if (/*item*/ ctx[0].type == "doc") return 1;
		if (/*item*/ ctx[0].type == "media") return 2;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	return {
		c() {
			div = element("div");
			create_component(separator.$$.fragment);
			t0 = space();
			create_component(header.$$.fragment);
			t1 = space();
			if (if_block) if_block.c();
			attr(div, "id", "preview");
			attr(div, "class", "svelte-1uqtl3v");
			toggle_class(div, "isOpen", /*isOpen*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(separator, div, null);
			append(div, t0);
			mount_component(header, div, null);
			append(div, t1);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			const header_changes = {};

			if (dirty & /*$$scope*/ 512) {
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
					}

					transition_in(if_block, 1);
					if_block.m(div, null);
				} else {
					if_block = null;
				}
			}

			if (dirty & /*isOpen*/ 2) {
				toggle_class(div, "isOpen", /*isOpen*/ ctx[1]);
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
			if (detaching) detach(div);
			destroy_component(separator);
			destroy_component(header);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}
		}
	};
}

function toggleOpenClose() {
	window.api.send("dispatch", { type: "TOGGLE_SIDEBAR_PREVIEW" });
}

function instance$a($$self, $$props, $$invalidate) {
	let { state } = $$props;
	let firstRun = true;
	let activeTab = {};
	let quantitySelected = 0;
	let item = {};
	let isOpen = true;

	// -------- STATE -------- //
	function onStateChange(state) {
		if (state.changed.includes("sideBar.activeTab") || firstRun) {
			activeTab = getActiveTab();
			quantitySelected = activeTab.selectedItems.length;
			$$invalidate(0, item = getLastSelectedItem());
		}

		if (state.changed.includes("sideBar.preview") || firstRun) {
			$$invalidate(1, isOpen = state.sideBar2.preview.isOpen);
		}

		firstRun = false;
	}

	// -------- HELPERS -------- //
	function getActiveTab() {
		return state.sideBar2.tabs.find(t => t.name == state.sideBar2.activeTab.name);
	}

	function getLastSelectedItem() {
		const type = activeTab.lastSelectedItem.type;
		const id = activeTab.lastSelectedItem.id;
		let arrayToLookIn;

		switch (type) {
			case "folder":
				arrayToLookIn = state.folders;
				break;
			case "doc":
				arrayToLookIn = state.documents;
				break;
			case "media":
				arrayToLookIn = state.media;
				break;
		}

		return arrayToLookIn.find(i => i.id == id);
	}

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(2, state = $$props.state);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 4) {
			 onStateChange(state);
		}
	};

	return [item, isOpen, state];
}

class Preview extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1uqtl3v-style")) add_css$8();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, { state: 2 });
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

/* src/js/renderer/component/UI/SearchField.svelte generated by Svelte v3.22.3 */

function add_css$9() {
	var style = element("style");
	style.id = "svelte-jww59a-style";
	style.textContent = ".searchfield.svelte-jww59a{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:10px 10px 0;position:relative;background-color:rgba(0, 0, 0, 0.04);border-radius:4px;min-height:20px;display:flex;flex-direction:row;align-items:center}.searchfield.svelte-jww59a:focus-within{animation-fill-mode:forwards;animation-name:svelte-jww59a-selectField;animation-duration:0.3s}@keyframes svelte-jww59a-selectField{from{box-shadow:0 0 0 10px transparent}to{box-shadow:0 0 0 3.5px rgba(59, 153, 252, 0.5)}}.magnifying-glass.svelte-jww59a{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlTextColor);-webkit-mask-image:var(--img-magnifyingglass);position:absolute;width:13px;height:13px;left:5px;opacity:0.5}.placeholder.svelte-jww59a{position:absolute;top:50%;transform:translate(0, -50%);color:var(--placeholderTextColor);left:24px;pointer-events:none}input.svelte-jww59a{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);margin:1px 0 0 24px;width:100%;background:transparent;outline:none;border:none}";
	append(document.head, style);
}

// (88:2) {#if !query}
function create_if_block$5(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*placeholder*/ ctx[1]);
			attr(span, "class", "placeholder svelte-jww59a");
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

function create_fragment$b(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let input_1;
	let dispose;
	let if_block = !/*query*/ ctx[0] && create_if_block$5(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			input_1 = element("input");
			attr(div0, "class", "magnifying-glass svelte-jww59a");
			attr(input_1, "type", "text");
			attr(input_1, "class", "svelte-jww59a");
			attr(div1, "class", "searchfield svelte-jww59a");
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, div0);
			append(div1, t0);
			if (if_block) if_block.m(div1, null);
			append(div1, t1);
			append(div1, input_1);
			/*input_1_binding*/ ctx[6](input_1);
			set_input_value(input_1, /*query*/ ctx[0]);
			if (remount) run_all(dispose);

			dispose = [
				listen(window, "keydown", /*handleKeydown*/ ctx[3]),
				listen(div0, "mousedown", prevent_default(/*mousedown_handler*/ ctx[5])),
				listen(input_1, "input", /*input_1_input_handler*/ ctx[7])
			];
		},
		p(ctx, [dirty]) {
			if (!/*query*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$5(ctx);
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
			run_all(dispose);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-jww59a-style")) add_css$9();
		init(this, options, instance$b, create_fragment$b, safe_not_equal, { placeholder: 1, query: 0, focused: 4 });
	}
}

/* src/js/renderer/component/SideBar/TreeListItem2.svelte generated by Svelte v3.22.3 */

function add_css$a() {
	var style = element("style");
	style.id = "svelte-1vpnxlv-style";
	style.textContent = ".wrapper.svelte-1vpnxlv.svelte-1vpnxlv{--indexInLocalVisibleItems:0;--itemWidth:230px;--itemHeight:28px;--sidesPadding:10px;--transitionSpeed:600ms;position:absolute;transform:translate(0, calc(var(--indexInLocalVisibleItems) * var(--itemHeight)));left:0;transition:transform var(--transitionSpeed)}.item.folder.svelte-1vpnxlv .icon.svelte-1vpnxlv{-webkit-mask-image:var(--img-folder)}.item.doc.svelte-1vpnxlv .icon.svelte-1vpnxlv{-webkit-mask-image:var(--img-doc-text)}.item.image.svelte-1vpnxlv .icon.svelte-1vpnxlv{-webkit-mask-image:var(--img-photo)}.item.av.svelte-1vpnxlv .icon.svelte-1vpnxlv{-webkit-mask-image:var(--img-play-rectangle)}.item.isSelected.svelte-1vpnxlv.svelte-1vpnxlv{border-radius:4px}.item.isSelected.listHasFocus.svelte-1vpnxlv.svelte-1vpnxlv{background-color:var(--selectedContentBackgroundColor)}.item.isSelected.listHasFocus.svelte-1vpnxlv .disclosure [role='button'].svelte-1vpnxlv,.item.isSelected.listHasFocus.svelte-1vpnxlv .icon.svelte-1vpnxlv{background-color:var(--controlColor)}.item.isSelected.listHasFocus.svelte-1vpnxlv .label.svelte-1vpnxlv{color:var(--selectedMenuItemTextColor)}.item.isSelected.listHasFocus.svelte-1vpnxlv .counter.svelte-1vpnxlv{color:var(--controlColor);opacity:0.4}.item.isSelected.svelte-1vpnxlv.svelte-1vpnxlv:not(.listHasFocus){background-color:var(--disabledControlTextColor)}.item.svelte-1vpnxlv.svelte-1vpnxlv{--nestOffset:0px;position:absolute;user-select:none;margin-bottom:1px;width:230px;height:var(--itemHeight)}.item.svelte-1vpnxlv .disclosure.svelte-1vpnxlv{position:absolute;top:50%;transform:translate(0, -50%);left:calc(var(--nestOffset) + 5px);width:10px;height:10px}.item.svelte-1vpnxlv .disclosure [role='button'].svelte-1vpnxlv{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;-webkit-mask-image:var(--img-chevron-right);background-color:var(--controlTextColor);position:absolute;display:inline-block;top:50%;left:50%;width:8px;height:8px;transform:translate(-50%, -50%) rotateZ(0deg)}.item.svelte-1vpnxlv .disclosure.isExpanded [role='button'].svelte-1vpnxlv{transform:translate(-50%, -50%) rotateZ(90deg)}.item.svelte-1vpnxlv .icon.svelte-1vpnxlv{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;position:absolute;top:50%;transform:translate(0, -50%);background-color:var(--controlAccentColor);left:calc(var(--nestOffset) + 20px);width:14px;height:14px}.item.svelte-1vpnxlv .label.svelte-1vpnxlv{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);position:absolute;top:50%;transform:translate(0, -50%);color:var(--labelColor);left:calc(var(--nestOffset) + 42px);white-space:nowrap}.item.svelte-1vpnxlv .counter.svelte-1vpnxlv{position:absolute;top:50%;transform:translate(0, -50%);font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);color:var(--tertiaryLabelColor);position:absolute;right:7px}.children.svelte-1vpnxlv.svelte-1vpnxlv{--numberOfVisibleChildren:0;position:absolute;transform:translate(0, var(--itemHeight));width:var(--itemWidth);height:calc(var(--numberOfVisibleChildren) * var(--itemHeight));background:rgba(117, 233, 169, 0.2);overflow:hidden;transition:height var(--transitionSpeed)}.children.svelte-1vpnxlv.svelte-1vpnxlv:not(.isExpanded){height:0;transition:height var(--transitionSpeed)}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[15] = list[i];
	return child_ctx;
}

// (188:4) {#if isExpandable}
function create_if_block_2$1(ctx) {
	let div1;
	let div0;
	let dispose;

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			attr(div0, "role", "button");
			attr(div0, "alt", "Toggle Expanded");
			attr(div0, "class", "svelte-1vpnxlv");
			attr(div1, "class", "disclosure svelte-1vpnxlv");
			toggle_class(div1, "isExpanded", /*isExpanded*/ ctx[7]);
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			append(div1, div0);
			if (remount) dispose();
			dispose = listen(div0, "mousedown", stop_propagation(/*mousedown_handler_1*/ ctx[11]));
		},
		p(ctx, dirty) {
			if (dirty & /*isExpanded*/ 128) {
				toggle_class(div1, "isExpanded", /*isExpanded*/ ctx[7]);
			}
		},
		d(detaching) {
			if (detaching) detach(div1);
			dispose();
		}
	};
}

// (201:4) {#if isExpandable}
function create_if_block_1$3(ctx) {
	let div;
	let t_value = /*item*/ ctx[0].children.length + "";
	let t;

	return {
		c() {
			div = element("div");
			t = text(t_value);
			attr(div, "class", "counter svelte-1vpnxlv");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*item*/ 1 && t_value !== (t_value = /*item*/ ctx[0].children.length + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) detach(div);
		}
	};
}

// (207:2) {#if isExpandable}
function create_if_block$6(ctx) {
	let div;
	let div_style_value;
	let current;
	let each_value = /*item*/ ctx[0].children;
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

			attr(div, "class", "children svelte-1vpnxlv");
			attr(div, "style", div_style_value = `--numberOfVisibleChildren: ${/*numberOfVisibleChildren*/ ctx[8]};`);
			toggle_class(div, "isExpanded", /*isExpanded*/ ctx[7]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty & /*item*/ 1) {
				each_value = /*item*/ ctx[0].children;
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

			if (!current || dirty & /*numberOfVisibleChildren*/ 256 && div_style_value !== (div_style_value = `--numberOfVisibleChildren: ${/*numberOfVisibleChildren*/ ctx[8]};`)) {
				attr(div, "style", div_style_value);
			}

			if (dirty & /*isExpanded*/ 128) {
				toggle_class(div, "isExpanded", /*isExpanded*/ ctx[7]);
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

// (212:6) {#each item.children as child}
function create_each_block(ctx) {
	let current;

	const treelistitem2 = new TreeListItem2({
			props: {
				item: /*child*/ ctx[15],
				listHasFocus: true,
				isQueryEmpty: true
			}
		});

	treelistitem2.$on("mousedown", /*mousedown_handler*/ ctx[13]);
	treelistitem2.$on("toggleExpanded", /*toggleExpanded_handler*/ ctx[14]);

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
			if (dirty & /*item*/ 1) treelistitem2_changes.item = /*child*/ ctx[15];
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

function create_fragment$c(ctx) {
	let div3;
	let div2;
	let t0;
	let div0;
	let t1;
	let div1;
	let t2_value = /*item*/ ctx[0].name + "";
	let t2;
	let t3;
	let div2_style_value;
	let div2_class_value;
	let t4;
	let div3_style_value;
	let current;
	let dispose;
	let if_block0 = /*isExpandable*/ ctx[6] && create_if_block_2$1(ctx);
	let if_block1 = /*isExpandable*/ ctx[6] && create_if_block_1$3(ctx);
	let if_block2 = /*isExpandable*/ ctx[6] && create_if_block$6(ctx);

	return {
		c() {
			div3 = element("div");
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
			attr(div0, "class", "icon svelte-1vpnxlv");
			attr(div1, "class", "label svelte-1vpnxlv");
			attr(div2, "style", div2_style_value = `--nestOffset: ${(/*nestDepth*/ ctx[5] - 1) * 15}px`);
			attr(div2, "class", div2_class_value = "item " + /*type*/ ctx[2] + " svelte-1vpnxlv");
			toggle_class(div2, "listHasFocus", /*listHasFocus*/ ctx[1]);
			toggle_class(div2, "isSelected", /*isSelected*/ ctx[3]);
			toggle_class(div2, "isExpandable", /*isExpandable*/ ctx[6]);
			attr(div3, "class", "wrapper svelte-1vpnxlv");
			attr(div3, "style", div3_style_value = `--indexInLocalVisibleItems: ${/*indexInLocalVisibleItems*/ ctx[4]}`);
		},
		m(target, anchor, remount) {
			insert(target, div3, anchor);
			append(div3, div2);
			if (if_block0) if_block0.m(div2, null);
			append(div2, t0);
			append(div2, div0);
			append(div2, t1);
			append(div2, div1);
			append(div1, t2);
			append(div2, t3);
			if (if_block1) if_block1.m(div2, null);
			append(div3, t4);
			if (if_block2) if_block2.m(div3, null);
			current = true;
			if (remount) dispose();
			dispose = listen(div2, "mousedown", /*mousedown_handler_2*/ ctx[12]);
		},
		p(ctx, [dirty]) {
			if (/*isExpandable*/ ctx[6]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);
				} else {
					if_block0 = create_if_block_2$1(ctx);
					if_block0.c();
					if_block0.m(div2, t0);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if ((!current || dirty & /*item*/ 1) && t2_value !== (t2_value = /*item*/ ctx[0].name + "")) set_data(t2, t2_value);

			if (/*isExpandable*/ ctx[6]) {
				if (if_block1) {
					if_block1.p(ctx, dirty);
				} else {
					if_block1 = create_if_block_1$3(ctx);
					if_block1.c();
					if_block1.m(div2, null);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (!current || dirty & /*nestDepth*/ 32 && div2_style_value !== (div2_style_value = `--nestOffset: ${(/*nestDepth*/ ctx[5] - 1) * 15}px`)) {
				attr(div2, "style", div2_style_value);
			}

			if (!current || dirty & /*type*/ 4 && div2_class_value !== (div2_class_value = "item " + /*type*/ ctx[2] + " svelte-1vpnxlv")) {
				attr(div2, "class", div2_class_value);
			}

			if (dirty & /*type, listHasFocus*/ 6) {
				toggle_class(div2, "listHasFocus", /*listHasFocus*/ ctx[1]);
			}

			if (dirty & /*type, isSelected*/ 12) {
				toggle_class(div2, "isSelected", /*isSelected*/ ctx[3]);
			}

			if (dirty & /*type, isExpandable*/ 68) {
				toggle_class(div2, "isExpandable", /*isExpandable*/ ctx[6]);
			}

			if (/*isExpandable*/ ctx[6]) {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty & /*isExpandable*/ 64) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$6(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div3, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}

			if (!current || dirty & /*indexInLocalVisibleItems*/ 16 && div3_style_value !== (div3_style_value = `--indexInLocalVisibleItems: ${/*indexInLocalVisibleItems*/ ctx[4]}`)) {
				attr(div3, "style", div3_style_value);
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
			if (detaching) detach(div3);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
			dispose();
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	const dispatch = createEventDispatcher();
	let { item = {} } = $$props;
	let { listHasFocus = false } = $$props;
	let { isQueryEmpty = true } = $$props;
	let type = null;
	const mousedown_handler_1 = () => dispatch("toggleExpanded", { item, isExpanded });
	const mousedown_handler_2 = domEvent => dispatch("mousedown", { item, isSelected, domEvent });

	function mousedown_handler(event) {
		bubble($$self, event);
	}

	function toggleExpanded_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("item" in $$props) $$invalidate(0, item = $$props.item);
		if ("listHasFocus" in $$props) $$invalidate(1, listHasFocus = $$props.listHasFocus);
		if ("isQueryEmpty" in $$props) $$invalidate(10, isQueryEmpty = $$props.isQueryEmpty);
	};

	let isSelected;
	let indexInLocalVisibleItems;
	let nestDepth;
	let isExpandable;
	let isExpanded;
	let numberOfVisibleChildren;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*item*/ 1) {
			 $$invalidate(3, isSelected = item.isSelected);
		}

		if ($$self.$$.dirty & /*item*/ 1) {
			 $$invalidate(4, indexInLocalVisibleItems = item.indexInLocalVisibleItems);
		}

		if ($$self.$$.dirty & /*item*/ 1) {
			 $$invalidate(5, nestDepth = item.nestDepth);
		}

		if ($$self.$$.dirty & /*item*/ 1) {
			 $$invalidate(6, isExpandable = item.type == "folder" && item.children && item.children.length > 0);
		}

		if ($$self.$$.dirty & /*isExpandable, item*/ 65) {
			 $$invalidate(7, isExpanded = isExpandable && item.isExpanded);
		}

		if ($$self.$$.dirty & /*item*/ 1) {
			 $$invalidate(8, numberOfVisibleChildren = item.numberOfVisibleChildren);
		}

		if ($$self.$$.dirty & /*item*/ 1) {
			// Set `type`
			 {
				switch (item.type) {
					case "folder":
					case "doc":
						$$invalidate(2, type = item.type);
						break;
					case "media":
						switch (item.filetype) {
							case ".png":
							case ".jpg":
							case ".gif":
								$$invalidate(2, type = "image");
								break;
							default:
								$$invalidate(2, type = "av");
								break;
						}
						break;
				}
			}
		}
	};

	return [
		item,
		listHasFocus,
		type,
		isSelected,
		indexInLocalVisibleItems,
		nestDepth,
		isExpandable,
		isExpanded,
		numberOfVisibleChildren,
		dispatch,
		isQueryEmpty,
		mousedown_handler_1,
		mousedown_handler_2,
		mousedown_handler,
		toggleExpanded_handler
	];
}

class TreeListItem2 extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1vpnxlv-style")) add_css$a();

		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
			item: 0,
			listHasFocus: 1,
			isQueryEmpty: 10
		});
	}
}

/* src/js/renderer/component/SideBar/Project.svelte generated by Svelte v3.22.3 */

const { window: window_1 } = globals;

function add_css$b() {
	var style = element("style");
	style.id = "svelte-w11jrf-style";
	style.textContent = "#project.svelte-w11jrf{display:flex;flex-direction:column;overflow:hidden;flex-grow:1}.wrapper.svelte-w11jrf:not(.active){display:none}#results.svelte-w11jrf{margin:10px 10px 0;min-height:100%;overflow-y:scroll;position:relative}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[27] = list[i];
	return child_ctx;
}

// (445:4) {#each results2Tree as item}
function create_each_block$1(ctx) {
	let current;

	const treelistitem2 = new TreeListItem2({
			props: {
				item: /*item*/ ctx[27],
				listHasFocus: /*focused*/ ctx[0],
				isQueryEmpty: /*query*/ ctx[3] == ""
			}
		});

	treelistitem2.$on("mousedown", /*handleMouseDown*/ ctx[6]);
	treelistitem2.$on("toggleExpanded", /*toggleExpanded_handler*/ ctx[26]);

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
			if (dirty & /*results2Tree*/ 16) treelistitem2_changes.item = /*item*/ ctx[27];
			if (dirty & /*focused*/ 1) treelistitem2_changes.listHasFocus = /*focused*/ ctx[0];
			if (dirty & /*query*/ 8) treelistitem2_changes.isQueryEmpty = /*query*/ ctx[3] == "";
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

function create_fragment$d(ctx) {
	let div1;
	let t0;
	let t1;
	let updating_query;
	let t2;
	let div0;
	let current;
	let dispose;
	const header = new Header({ props: { title: /*tab*/ ctx[1].title } });
	const separator = new Separator({ props: { marginSides: 10 } });

	function searchfield_query_binding(value) {
		/*searchfield_query_binding*/ ctx[25].call(null, value);
	}

	let searchfield_props = { focused: true, placeholder: "Name" };

	if (/*query*/ ctx[3] !== void 0) {
		searchfield_props.query = /*query*/ ctx[3];
	}

	const searchfield = new SearchField({ props: searchfield_props });
	binding_callbacks.push(() => bind(searchfield, "query", searchfield_query_binding));
	let each_value = /*results2Tree*/ ctx[4];
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
			create_component(header.$$.fragment);
			t0 = space();
			create_component(separator.$$.fragment);
			t1 = space();
			create_component(searchfield.$$.fragment);
			t2 = space();
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div0, "id", "results");
			attr(div0, "class", "svelte-w11jrf");
			attr(div1, "id", "project");
			attr(div1, "class", "wrapper svelte-w11jrf");
			toggle_class(div1, "focused", /*focused*/ ctx[0]);
			toggle_class(div1, "active", /*active*/ ctx[2]);
		},
		m(target, anchor, remount) {
			insert(target, div1, anchor);
			mount_component(header, div1, null);
			append(div1, t0);
			mount_component(separator, div1, null);
			append(div1, t1);
			mount_component(searchfield, div1, null);
			append(div1, t2);
			append(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div0, null);
			}

			current = true;
			if (remount) dispose();
			dispose = listen(window_1, "keydown", /*handleKeydown*/ ctx[5]);
		},
		p(ctx, [dirty]) {
			const header_changes = {};
			if (dirty & /*tab*/ 2) header_changes.title = /*tab*/ ctx[1].title;

			if (dirty & /*$$scope*/ 1073741824) {
				header_changes.$$scope = { dirty, ctx };
			}

			header.$set(header_changes);
			const searchfield_changes = {};

			if (!updating_query && dirty & /*query*/ 8) {
				updating_query = true;
				searchfield_changes.query = /*query*/ ctx[3];
				add_flush_callback(() => updating_query = false);
			}

			searchfield.$set(searchfield_changes);

			if (dirty & /*results2Tree, focused, query, handleMouseDown, toggleExpanded*/ 217) {
				each_value = /*results2Tree*/ ctx[4];
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
			transition_in(header.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			transition_in(searchfield.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(header.$$.fragment, local);
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
			destroy_component(header);
			destroy_component(separator);
			destroy_component(searchfield);
			destroy_each(each_blocks, detaching);
			dispose();
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
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
		let shouldUpdateResults = false;

		if (state.changed.includes("sideBar.tabs.project") || firstRun) {
			$$invalidate(1, tab = state.sideBar2.tabs.find(t => t.name == "project"));
			shouldUpdateResults = true;
		}

		if (state.changed.includes("sideBar.activeTab") || firstRun) {
			$$invalidate(2, active = state.sideBar2.activeTab.name == "project");
			shouldUpdateResults = true;
		}

		if (state.changed.includes("folders") || state.changed.includes("documents") || state.changed.includes("media") || firstRun) {
			folders = state.folders;
			files = [].concat(...[state.documents, state.media]);
			shouldUpdateResults = true;
		}

		if (state.changed.includes("openDoc") || firstRun) {
			// console.log('openDoc changed')
			shouldUpdateResults = true;
		}

		if (shouldUpdateResults) updateResults();
		firstRun = false;
	}

	/*
Each item needs to know it's index among visible items. But only it's local index.
*/
	// -------- RESULTS -------- //
	let index = 0;

	let indexInAllVisibleItems = 0;
	let results2Tree = [];
	let results2Flat = [];

	// Update results when following change:
	// * Folders or files
	// * Search query change
	// * Search query change
	function updateResults() {
		index = 0;
		indexInAllVisibleItems = 0;

		if (query == "") {
			const foldersAndFiles = [].concat(...[folders, files]);
			$$invalidate(4, results2Tree = lib_1(foldersAndFiles)[0].children);
			sortChildren(results2Tree, true, 0);
		} // console.log(results2Tree)
		// results2Flat = createFlatHierarchy(results2Tree, {
	} //   saveExtractedChildren: true,
	// })

	// results2Flat.forEach((r) => {
	//   if (r.type == 'folder' && r.children && r.children.length) {
	//     r.children = r.children.map((c) => c.id)
	//   }
	// })
	// function updateSelected(children) {
	//   children.forEach((r) => {
	//     r.isSelected = tab.selectedItems.some((id) => id = r.id)
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
	//         const isExpanded = tab.expandedItems.some((id) => id == result.id)
	//         if (!isExpanded) {
	//           i += result.recursiveChildCount
	//         }
	//       }
	//     }
	//   }
	// }
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
		const item = resultsFlat.find(r => r.id == tab.lastSelectedItem.id);
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
			console.log("Jump selection to parent folder");

			selectParentFolder(item);
		}
	}

	function handleArrowUpDown(key, shiftPressed, altPressed) {
		let item = {};
		let selectedItems = [];

		// Checks
		const indexOfLastSelectedItemInResultsVisible = resultsVisible.findIndex(r => r.id == tab.lastSelectedItem.id);

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
			selectedItems = tab.selectedItems.slice();
			selectedItems.push(item.id);
		} else {
			selectedItems = [item.id];
		}

		// Update selection
		window.api.send("dispatch", {
			type: "SELECT_SIDEBAR_ITEMS",
			tabName: "project",
			lastSelectedItem: { id: item.id, type: item.type },
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

		const clickedWhileSelected = !domEvent.metaKey && isSelected;
		const clickedWhileNotSelected = !domEvent.metaKey && !isSelected;
		const cmdClickedWhileNotSelected = domEvent.metaKey && !isSelected;
		const cmdClickedWhileSelected = domEvent.metaKey && isSelected;
		let selectedItems = [];

		if (clickedWhileSelected) {
			return;
		} else if (shiftClicked) {
			const clickedIndex = resultsVisible.findIndex(r => r.id == item.id);
			const lastSelectedIndex = resultsVisible.findIndex(r => r.id == tab.lastSelectedItem.id);
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
			lastSelectedItem: { id: item.id, type: item.type },
			selectedItems
		});
	}

	// -------- HELPERS -------- //
	/**
 * Sort array of child items by sorting criteria
 * // TODO: Criteria is currently hard coded to alphabetical and A-Z.
 */
	function sortChildren(children, parentHierarchyIsExpanded, parentOffset) {
		let indexAmongSiblings = 0;

		// Sort
		children.sort((a, b) => a.name.localeCompare(b.name));

		// For each child, set properties (e.g. indexes)
		children.forEach(c => {
			// Set index within all items
			c.indexInAllItems = index++;

			// Set index within all visible items
			if (parentHierarchyIsExpanded) {
				c.indexInAllVisibleItems = indexInAllVisibleItems++;
			}

			// Set index within local visible items. We use this to set vertical position of element, within siblings.
			if (c.nestDepth > 1) {
				c.indexInLocalVisibleItems = c.indexInAllVisibleItems - parentOffset - 1;
			} else {
				c.indexInLocalVisibleItems = c.indexInAllVisibleItems - parentOffset;
			}

			// Set index within siblings. Depends on if siblings are expanded or not.
			c.indexAmongSiblings = indexAmongSiblings++;

			// Set visible
			c.visible = parentHierarchyIsExpanded;

			// Set selected
			c.isSelected = tab.selectedItems.find(id => id == c.id);

			// If folder...
			if (c.type == "folder") {
				// Set expanded
				c.isExpanded = tab.expandedItems.some(id => id == c.id);

				// Recursively sort children
				if (c.children.length > 0) {
					const isParentExpanded = parentHierarchyIsExpanded && c.isExpanded;
					sortChildren(c.children, isParentExpanded, c.indexInLocalVisibleItems);
				}
			}
		});

		// Set number of visible children. Have to wait until other values are set before we can do this.
		children.forEach((c, index) => {
			if (c.type == "folder") {
				if (c.isExpanded) {
					// = number of visible items until next sibling
					const isLastChild = index == children.length - 1;

					if (!isLastChild) {
						const nextSibling = children[index + 1];

						// console.log(c.name, nextSibling.name)
						c.numberOfVisibleChildren = nextSibling.indexInAllVisibleItems - c.indexInAllVisibleItems - 1;
					} // c.numberOfVisibleChildren = c.indexInAllVisibleItems +
				} // console.log("NE: ", c.name)
				// c.numberOfVisibleChildren = 0
			}

			console.log(c.name, c.indexAmongSiblings);
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

	function selectParentFolder(item) {
		const parentFolder = folders.find(f => f.id == item.parentId);

		window.api.send("dispatch", {
			type: "SELECT_SIDEBAR_ITEMS",
			tabName: "project",
			lastSelectedItem: {
				id: parentFolder.id,
				type: parentFolder.type
			},
			selectedItems: [parentFolder.id]
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

	let transitionTime;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*query*/ 8) {
			// -------- STATE -------- //
			 transitionTime = query == "" ? 300 : 0;
		}

		if ($$self.$$.dirty & /*state*/ 256) {
			 onStateChange(state);
		}
	};

	return [
		focused,
		tab,
		active,
		query,
		results2Tree,
		handleKeydown,
		handleMouseDown,
		toggleExpanded,
		state,
		folders,
		files,
		firstRun,
		index,
		indexInAllVisibleItems,
		transitionTime,
		resultsTree,
		resultsFlat,
		resultsVisible,
		onStateChange,
		results2Flat,
		updateResults,
		handleArrowLeftRight,
		handleArrowUpDown,
		sortChildren,
		selectParentFolder,
		searchfield_query_binding,
		toggleExpanded_handler
	];
}

class Project extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-w11jrf-style")) add_css$b();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { state: 8, focused: 0 });
	}
}

/* src/js/renderer/component/SideBar/AllDocuments.svelte generated by Svelte v3.22.3 */

function add_css$c() {
	var style = element("style");
	style.id = "svelte-667fxh-style";
	style.textContent = ".wrapper.svelte-667fxh:not(.active){display:none}";
	append(document.head, style);
}

function create_fragment$e(ctx) {
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

function instance$e($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-667fxh-style")) add_css$c();
		init(this, options, instance$e, create_fragment$e, safe_not_equal, { state: 2, focused: 0 });
	}
}

/* src/js/renderer/component/SideBar/SideBar.svelte generated by Svelte v3.22.3 */

function add_css$d() {
	var style = element("style");
	style.id = "svelte-1mcq9jl-style";
	style.textContent = "#sidebar2.svelte-1mcq9jl.svelte-1mcq9jl{width:100%;height:100%;position:relative;margin:0;padding:40px 0 0 0;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--separatorColor)}#sidebar2.svelte-1mcq9jl>div.svelte-1mcq9jl{max-height:100%}#tabs.svelte-1mcq9jl.svelte-1mcq9jl{min-height:30px;display:flex;justify-content:center}#tabs.svelte-1mcq9jl ul.svelte-1mcq9jl{padding:0;margin:0;list-style-type:none;display:flex;flex-direction:row;align-items:center}#tabs.svelte-1mcq9jl ul li.svelte-1mcq9jl{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;background-color:var(--controlTextColor);list-style-type:none;margin:0 12px 0 0;padding:0;width:14px;height:14px;opacity:70%}#tabs.svelte-1mcq9jl ul li.active.svelte-1mcq9jl{background-color:var(--controlAccentColor);opacity:100%}#tabs.svelte-1mcq9jl ul li.svelte-1mcq9jl:last-of-type{margin:0}.project.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-folder)}.project.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-folder-fill)}.all-documents.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-doc-on-doc)}.all-documents.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-doc-on-doc-fill)}.most-recent.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-clock)}.most-recent.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-clock-fill)}.tags.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-tag)}.tags.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-tag-fill)}.media.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-photo)}.media.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-photo-fill)}.citations.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-quote-bubble)}.citations.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-quote-bubble-fill)}.search.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-magnifyingglass)}.search.active.svelte-1mcq9jl.svelte-1mcq9jl{-webkit-mask-image:var(--img-magnifyingglass)}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[4] = list[i];
	child_ctx[6] = i;
	return child_ctx;
}

// (116:6) {#each tabs as tab, index}
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
			attr(li, "class", li_class_value = "" + (null_to_empty(/*tab*/ ctx[4].name) + " svelte-1mcq9jl"));
			toggle_class(li, "active", /*index*/ ctx[6] == /*state*/ ctx[0].sideBar2.activeTab.index);
		},
		m(target, anchor, remount) {
			insert(target, li, anchor);
			if (remount) dispose();
			dispose = listen(li, "click", click_handler);
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty & /*tabs*/ 4 && li_class_value !== (li_class_value = "" + (null_to_empty(/*tab*/ ctx[4].name) + " svelte-1mcq9jl"))) {
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

function create_fragment$f(ctx) {
	let div1;
	let div0;
	let ul;
	let t0;
	let t1;
	let t2;
	let t3;
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

	const preview = new Preview({ props: { state: /*state*/ ctx[0] } });

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
			t3 = space();
			create_component(preview.$$.fragment);
			attr(ul, "class", "svelte-1mcq9jl");
			attr(div0, "id", "tabs");
			attr(div0, "class", "svelte-1mcq9jl");
			attr(div1, "id", "sidebar2");
			attr(div1, "class", "svelte-1mcq9jl");
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
			append(div1, t3);
			mount_component(preview, div1, null);
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
			const preview_changes = {};
			if (dirty & /*state*/ 1) preview_changes.state = /*state*/ ctx[0];
			preview.$set(preview_changes);

			if (dirty & /*focused*/ 2) {
				toggle_class(div1, "focused", /*focused*/ ctx[1]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(separator.$$.fragment, local);
			transition_in(project.$$.fragment, local);
			transition_in(alldocuments.$$.fragment, local);
			transition_in(preview.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(separator.$$.fragment, local);
			transition_out(project.$$.fragment, local);
			transition_out(alldocuments.$$.fragment, local);
			transition_out(preview.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_each(each_blocks, detaching);
			destroy_component(separator);
			destroy_component(project);
			destroy_component(alldocuments);
			destroy_component(preview);
		}
	};
}

function clickTab(evt, index) {
	window.api.send("dispatch", {
		type: "SELECT_SIDEBAR_TAB_BY_INDEX",
		index
	});
}

function instance$f($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-1mcq9jl-style")) add_css$d();
		init(this, options, instance$f, create_fragment$f, safe_not_equal, { state: 0, focused: 1 });
	}
}

/* src/js/renderer/component/Layout.svelte generated by Svelte v3.22.3 */

function add_css$e() {
	var style = element("style");
	style.id = "svelte-223fs4-style";
	style.textContent = "#body.svelte-223fs4{background-color:var(--windowBackgroundColor)}";
	append(document.head, style);
}

// (37:0) {:else}
function create_else_block$1(ctx) {
	let div1;
	let t0;
	let div0;
	let t1;
	let current;

	const flexpanel = new FlexPanel({
			props: {
				visible: /*state*/ ctx[0].sideBar.show,
				min: 250,
				max: 300,
				start: 250,
				$$slots: { default: [create_default_slot$1] },
				$$scope: { ctx }
			}
		});

	flexpanel.$on("click", /*click_handler*/ ctx[5]);
	const toolbar = new ToolBar({ props: { state: /*state*/ ctx[0] } });
	const separator = new Separator({});

	return {
		c() {
			div1 = element("div");
			create_component(flexpanel.$$.fragment);
			t0 = space();
			div0 = element("div");
			create_component(toolbar.$$.fragment);
			t1 = space();
			create_component(separator.$$.fragment);
			attr(div0, "class", "flexContainerColumn svelte-223fs4");
			attr(div0, "id", "body");
			attr(div1, "class", "flexContainerRow");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(flexpanel, div1, null);
			append(div1, t0);
			append(div1, div0);
			mount_component(toolbar, div0, null);
			append(div0, t1);
			mount_component(separator, div0, null);
			current = true;
		},
		p(ctx, dirty) {
			const flexpanel_changes = {};
			if (dirty & /*state*/ 1) flexpanel_changes.visible = /*state*/ ctx[0].sideBar.show;

			if (dirty & /*$$scope, state*/ 65) {
				flexpanel_changes.$$scope = { dirty, ctx };
			}

			flexpanel.$set(flexpanel_changes);
			const toolbar_changes = {};
			if (dirty & /*state*/ 1) toolbar_changes.state = /*state*/ ctx[0];
			toolbar.$set(toolbar_changes);
		},
		i(local) {
			if (current) return;
			transition_in(flexpanel.$$.fragment, local);
			transition_in(toolbar.$$.fragment, local);
			transition_in(separator.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(flexpanel.$$.fragment, local);
			transition_out(toolbar.$$.fragment, local);
			transition_out(separator.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div1);
			destroy_component(flexpanel);
			destroy_component(toolbar);
			destroy_component(separator);
		}
	};
}

// (35:0) {#if state.projectPath == ''}
function create_if_block$7(ctx) {
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

// (39:4) <FlexPanel       visible={state.sideBar.show}       min={250}       max={300}       start={250}       on:click={() => setLayoutFocus('navigation')}>
function create_default_slot$1(ctx) {
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

function create_fragment$g(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$7, create_else_block$1];
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

function instance$g($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-223fs4-style")) add_css$e();
		init(this, options, instance$g, create_fragment$g, safe_not_equal, { state: 0, oldState: 2 });
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
