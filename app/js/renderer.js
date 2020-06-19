// Copied from:
// https://github.com/Rich-Harris/yootils/blob/master/src/number/clamp.ts
function clamp(num, min, max) {
  return num < min ? min : num > max ? max : num;
}

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

/* src/js/component/FirstRun.svelte generated by Svelte v3.22.3 */

function add_css() {
	var style = element("style");
	style.id = "svelte-ko94oe-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#firstrun.svelte-ko94oe.svelte-ko94oe{padding:var(--grid-2);width:100%;height:100%;z-index:100;position:fixed;background-color:white}#firstrun.svelte-ko94oe h1.svelte-ko94oe{font-family:'SF Pro Display';font-weight:bold;font-size:20px;line-height:24px;letter-spacing:-0.12px}#firstrun.svelte-ko94oe h2.svelte-ko94oe{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:gray;margin:4em 0 1em}#firstrun.svelte-ko94oe button.svelte-ko94oe{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px}";
	append(document.head, style);
}

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
			attr(h1, "class", "svelte-ko94oe");
			attr(h2, "class", "svelte-ko94oe");
			attr(button, "class", "svelte-ko94oe");
			attr(div, "id", "firstrun");
			attr(div, "class", "svelte-ko94oe");
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
		window.api.send("selectProjectPath");
	};

	return [click_handler];
}

class FirstRun extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-ko94oe-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, {});
	}
}

/* src/js/component/FlexPanel.svelte generated by Svelte v3.22.3 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1voc2in-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#container.svelte-1voc2in{height:100%;overflow-x:visible;position:relative;display:none}#container.visible.svelte-1voc2in{display:block}.divider.svelte-1voc2in{position:absolute;top:0;right:0;transform:translate(50%, 0);width:8px;height:100%;z-index:200;cursor:ew-resize}";
	append(document.head, style);
}

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
			attr(div0, "class", "divider svelte-1voc2in");
			attr(div1, "id", "container");
			set_style(div1, "flex", "0 0 " + /*width*/ ctx[2] + "px");
			attr(div1, "class", "svelte-1voc2in");
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
		if (!document.getElementById("svelte-1voc2in-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { min: 5, max: 6, start: 7, visible: 0 });
	}
}

/* src/js/component/SideBarItem.svelte generated by Svelte v3.22.3 */

function add_css$2() {
	var style = element("style");
	style.id = "svelte-1u3p0qf-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#container.svelte-1u3p0qf.svelte-1u3p0qf{overflow:hidden;position:relative}#flex-row.svelte-1u3p0qf.svelte-1u3p0qf{margin-top:2px;height:24px;display:flex;align-items:center}.selected.svelte-1u3p0qf>#flex-row.svelte-1u3p0qf{background-color:rgba(0, 0, 0, 0.1)}#disclosure-triangle.svelte-1u3p0qf.svelte-1u3p0qf{border:none;outline:none;padding:0;margin:0;margin-left:4px;width:13px;height:13px;background-color:transparent}#disclosure-triangle.svelte-1u3p0qf img.svelte-1u3p0qf{width:100%;height:100%;display:none}#disclosure-triangle.expanded.svelte-1u3p0qf img.svelte-1u3p0qf{transform:rotate(90deg)}[data-nestDepth=\"1\"].svelte-1u3p0qf #disclosure-triangle.svelte-1u3p0qf{margin-left:calc(4px + calc(16px * 1))}[data-nestDepth=\"2\"].svelte-1u3p0qf #disclosure-triangle.svelte-1u3p0qf{margin-left:calc(4px + calc(16px * 2))}[data-nestDepth=\"3\"].svelte-1u3p0qf #disclosure-triangle.svelte-1u3p0qf{margin-left:calc(4px + calc(16px * 3))}.expandable.svelte-1u3p0qf #disclosure-triangle img.svelte-1u3p0qf{display:inline}#icon.svelte-1u3p0qf.svelte-1u3p0qf{margin-left:4px;width:18px;height:18px}#label.svelte-1u3p0qf.svelte-1u3p0qf{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;margin-left:6px;flex:1}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[13] = list[i];
	return child_ctx;
}

// (177:2) {#if children.length > 0}
function create_if_block(ctx) {
	let each_1_anchor;
	let current;
	let each_value = /*children*/ ctx[3];
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
			if (dirty & /*state, children, nestDepth*/ 74) {
				each_value = /*children*/ ctx[3];
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

// (178:4) {#each children as item}
function create_each_block(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[1],
				label: /*item*/ ctx[13].name,
				id: /*item*/ ctx[13].id,
				selected: /*state*/ ctx[1].sideBar.selectedItemId == /*item*/ ctx[13].id,
				children: /*item*/ ctx[13].children
				? /*item*/ ctx[13].children
				: [],
				icon: "images/folder.svg",
				filesSearchCriteria: /*item*/ ctx[13].filesSearchCriteria,
				showFilesList: true,
				nestDepth: /*nestDepth*/ ctx[6] + 1,
				expanded: true
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
			if (dirty & /*state*/ 2) sidebaritem_changes.state = /*state*/ ctx[1];
			if (dirty & /*children*/ 8) sidebaritem_changes.label = /*item*/ ctx[13].name;
			if (dirty & /*children*/ 8) sidebaritem_changes.id = /*item*/ ctx[13].id;
			if (dirty & /*state, children*/ 10) sidebaritem_changes.selected = /*state*/ ctx[1].sideBar.selectedItemId == /*item*/ ctx[13].id;

			if (dirty & /*children*/ 8) sidebaritem_changes.children = /*item*/ ctx[13].children
			? /*item*/ ctx[13].children
			: [];

			if (dirty & /*children*/ 8) sidebaritem_changes.filesSearchCriteria = /*item*/ ctx[13].filesSearchCriteria;
			if (dirty & /*nestDepth*/ 64) sidebaritem_changes.nestDepth = /*nestDepth*/ ctx[6] + 1;
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
	let t2;
	let t3;
	let current;
	let dispose;
	let if_block = /*children*/ ctx[3].length > 0 && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			button = element("button");
			button.innerHTML = `<img src="images/mac/disclosure-triangle.svg" alt="Collapse/Expand" class="svelte-1u3p0qf">`;
			t0 = space();
			img1 = element("img");
			t1 = space();
			span = element("span");
			t2 = text(/*label*/ ctx[2]);
			t3 = space();
			if (if_block) if_block.c();
			attr(button, "id", "disclosure-triangle");
			attr(button, "alt", "Expand");
			attr(button, "class", "svelte-1u3p0qf");
			toggle_class(button, "expanded", /*expanded*/ ctx[0]);
			if (img1.src !== (img1_src_value = /*icon*/ ctx[4])) attr(img1, "src", img1_src_value);
			attr(img1, "id", "icon");
			attr(img1, "alt", "Icon");
			attr(img1, "class", "svelte-1u3p0qf");
			attr(span, "id", "label");
			attr(span, "class", "svelte-1u3p0qf");
			attr(div0, "id", "flex-row");
			attr(div0, "class", "svelte-1u3p0qf");
			attr(div1, "id", "container");
			attr(div1, "data-nestdepth", /*nestDepth*/ ctx[6]);
			attr(div1, "class", "svelte-1u3p0qf");
			toggle_class(div1, "expandable", /*expandable*/ ctx[7]);
			toggle_class(div1, "selected", /*selected*/ ctx[5]);
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
				listen(button, "click", stop_propagation(/*click_handler*/ ctx[12])),
				listen(div0, "click", /*clicked*/ ctx[8])
			];
		},
		p(ctx, [dirty]) {
			if (dirty & /*expanded*/ 1) {
				toggle_class(button, "expanded", /*expanded*/ ctx[0]);
			}

			if (!current || dirty & /*icon*/ 16 && img1.src !== (img1_src_value = /*icon*/ ctx[4])) {
				attr(img1, "src", img1_src_value);
			}

			if (!current || dirty & /*label*/ 4) set_data(t2, /*label*/ ctx[2]);

			if (/*children*/ ctx[3].length > 0) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty & /*children*/ 8) {
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

			if (!current || dirty & /*nestDepth*/ 64) {
				attr(div1, "data-nestdepth", /*nestDepth*/ ctx[6]);
			}

			if (dirty & /*expandable*/ 128) {
				toggle_class(div1, "expandable", /*expandable*/ ctx[7]);
			}

			if (dirty & /*selected*/ 32) {
				toggle_class(div1, "selected", /*selected*/ ctx[5]);
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
	let { label = "Label" } = $$props;
	let { id } = $$props;
	let { children = [] } = $$props;
	let { showFilesList = false } = $$props;
	let { filesSearchCriteria = undefined } = $$props;
	let { icon = "images/sidebar-default-icon.svg" } = $$props;
	let { selected = false } = $$props;
	let { expanded } = $$props;
	let { nestDepth = 0 } = $$props;

	function clicked() {
		if (selected) return;
		const action = { type: "SELECT_SIDEBAR_ITEM", id };
		window.api.send("dispatch", action);
	}

	const click_handler = () => $$invalidate(0, expanded = !expanded);

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(1, state = $$props.state);
		if ("label" in $$props) $$invalidate(2, label = $$props.label);
		if ("id" in $$props) $$invalidate(9, id = $$props.id);
		if ("children" in $$props) $$invalidate(3, children = $$props.children);
		if ("showFilesList" in $$props) $$invalidate(10, showFilesList = $$props.showFilesList);
		if ("filesSearchCriteria" in $$props) $$invalidate(11, filesSearchCriteria = $$props.filesSearchCriteria);
		if ("icon" in $$props) $$invalidate(4, icon = $$props.icon);
		if ("selected" in $$props) $$invalidate(5, selected = $$props.selected);
		if ("expanded" in $$props) $$invalidate(0, expanded = $$props.expanded);
		if ("nestDepth" in $$props) $$invalidate(6, nestDepth = $$props.nestDepth);
	};

	let expandable;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*children*/ 8) {
			 $$invalidate(7, expandable = children.length > 0);
		}
	};

	return [
		expanded,
		state,
		label,
		children,
		icon,
		selected,
		nestDepth,
		expandable,
		clicked,
		id,
		showFilesList,
		filesSearchCriteria,
		click_handler
	];
}

class SideBarItem extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1u3p0qf-style")) add_css$2();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			state: 1,
			label: 2,
			id: 9,
			children: 3,
			showFilesList: 10,
			filesSearchCriteria: 11,
			icon: 4,
			selected: 5,
			expanded: 0,
			nestDepth: 6
		});
	}
}

/* src/js/component/SideBar.svelte generated by Svelte v3.22.3 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-1gmu8r1-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#sidebar.svelte-1gmu8r1{width:100%;height:100%;background-color:lightgray;overflow-y:scroll;position:relative;border-right:1px solid black;user-select:none}#sidebar.focused.svelte-1gmu8r1{background-color:red}.title.svelte-1gmu8r1{font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px;margin:15px 0 0 9px}.title.svelte-1gmu8r1:first-of-type{margin-top:9px}";
	append(document.head, style);
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i];
	return child_ctx;
}

// (158:4) {#each group.children as item}
function create_each_block_1(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				label: /*item*/ ctx[5].label,
				id: /*item*/ ctx[5].id,
				selected: /*item*/ ctx[5].id == /*state*/ ctx[0].sideBar.selectedItemId
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
			if (dirty & /*state*/ 1) sidebaritem_changes.label = /*item*/ ctx[5].label;
			if (dirty & /*state*/ 1) sidebaritem_changes.id = /*item*/ ctx[5].id;
			if (dirty & /*state*/ 1) sidebaritem_changes.selected = /*item*/ ctx[5].id == /*state*/ ctx[0].sideBar.selectedItemId;
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

// (156:2) {#each state.sideBar.items as group}
function create_each_block$1(ctx) {
	let h1;
	let t0_value = /*group*/ ctx[2].label + "";
	let t0;
	let t1;
	let each_1_anchor;
	let current;
	let each_value_1 = /*group*/ ctx[2].children;
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			h1 = element("h1");
			t0 = text(t0_value);
			t1 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			each_1_anchor = empty();
			attr(h1, "class", "title svelte-1gmu8r1");
		},
		m(target, anchor) {
			insert(target, h1, anchor);
			append(h1, t0);
			insert(target, t1, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(target, anchor);
			}

			insert(target, each_1_anchor, anchor);
			current = true;
		},
		p(ctx, dirty) {
			if ((!current || dirty & /*state*/ 1) && t0_value !== (t0_value = /*group*/ ctx[2].label + "")) set_data(t0, t0_value);

			if (dirty & /*state*/ 1) {
				each_value_1 = /*group*/ ctx[2].children;
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_1.length; i += 1) {
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
			if (detaching) detach(h1);
			if (detaching) detach(t1);
			destroy_each(each_blocks, detaching);
			if (detaching) detach(each_1_anchor);
		}
	};
}

function create_fragment$3(ctx) {
	let div;
	let current;
	let each_value = /*state*/ ctx[0].sideBar.items;
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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

			attr(div, "id", "sidebar");
			attr(div, "class", "svelte-1gmu8r1");
			toggle_class(div, "focused", /*focused*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p(ctx, [dirty]) {
			if (dirty & /*state*/ 1) {
				each_value = /*state*/ ctx[0].sideBar.items;
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
					out(i);
				}

				check_outros();
			}

			if (dirty & /*focused*/ 2) {
				toggle_class(div, "focused", /*focused*/ ctx[1]);
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

function instance$3($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { focused } = $$props;

	// $: shortcuts = [
	//   {
	//     label: "All",
	//     id: "all",
	//     showFilesList: true,
	//     filesSearchCriteria: {
	//       lookInFolderId: state.rootFolderId,
	//       includeChildren: true
	//     }
	//   },
	//   {
	//     label: "Most Recent",
	//     id: "most-recent",
	//     showFilesList: true,
	//     filesSearchCriteria: {
	//       lookInFolderId: state.rootFolderId,
	//       includeChildren: true,
	//       filterDateModified: true,
	//       fromDateModified: new Date().toISOString(),
	//       toDateModified: new Date(
	//         Date.now() - 7 * 24 * 60 * 60 * 1000
	//       ).toISOString()
	//     }
	//   },
	//   {
	//     label: "Favorites",
	//     id: "favorites",
	//     showFilesList: true,
	//     filesSearchCriteria: {
	//       lookInFolderId: state.rootFolderId,
	//       includeChildren: true,
	//       tags: ["favorite"]
	//     }
	//   }
	// ];
	onMount(() => {
		if (state.sideBar.selectedItemId == "") {
			window.api.send("dispatch", { type: "SELECT_SIDEBAR_ITEM", id: "all" });
		}
	});

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
		if ("focused" in $$props) $$invalidate(1, focused = $$props.focused);
	};

	return [state, focused];
}

class SideBar extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1gmu8r1-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { state: 0, focused: 1 });
	}
}

/* src/js/component/FileList.svelte generated by Svelte v3.22.3 */

const { window: window_1 } = globals;

function add_css$4() {
	var style = element("style");
	style.id = "svelte-51zhvt-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#files.svelte-51zhvt.svelte-51zhvt{width:100%;height:100%;background-color:white;overflow-y:scroll;border-right:1px solid black;padding:0;user-select:none}.file.svelte-51zhvt.svelte-51zhvt{padding:0.5em 1em 0}.file.svelte-51zhvt.svelte-51zhvt:focus{outline:none}h2.svelte-51zhvt.svelte-51zhvt,p.svelte-51zhvt.svelte-51zhvt{margin:0;padding:0;pointer-events:none;word-break:break-word}h2.svelte-51zhvt.svelte-51zhvt{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px}p.svelte-51zhvt.svelte-51zhvt{font:caption;font-weight:500;font-size:12px;line-height:16px;letter-spacing:-0.07px;color:gray;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}hr.svelte-51zhvt.svelte-51zhvt{margin:0.5em 0 0;height:1px;background-color:rgba(0, 0, 0, 0.2);border:0}.selected.svelte-51zhvt.svelte-51zhvt{background:var(--clr-gray-lightest)}.focused.svelte-51zhvt .selected.svelte-51zhvt{background:#2d67fa}.focused.svelte-51zhvt .selected h2.svelte-51zhvt{color:white}.focused.svelte-51zhvt .selected p.svelte-51zhvt{color:rgba(255, 255, 255, 0.8)}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[12] = list[i];
	return child_ctx;
}

// (369:4) {:else}
function create_else_block(ctx) {
	let div;
	let h2;
	let t0_value = /*file*/ ctx[12].title + "";
	let t0;
	let t1;
	let p;
	let t2_value = /*file*/ ctx[12].excerpt + "";
	let t2;
	let t3;
	let hr;
	let t4;
	let dispose;

	function click_handler(...args) {
		return /*click_handler*/ ctx[11](/*file*/ ctx[12], ...args);
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
			attr(h2, "class", "svelte-51zhvt");
			attr(p, "class", "svelte-51zhvt");
			attr(hr, "class", "svelte-51zhvt");
			attr(div, "class", "file svelte-51zhvt");
			attr(div, "tabindex", "0");
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
			dispose = listen(div, "click", prevent_default(click_handler));
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			if (dirty & /*files*/ 2 && t0_value !== (t0_value = /*file*/ ctx[12].title + "")) set_data(t0, t0_value);
			if (dirty & /*files*/ 2 && t2_value !== (t2_value = /*file*/ ctx[12].excerpt + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(div);
			dispose();
		}
	};
}

// (363:4) {#if file.selected}
function create_if_block$1(ctx) {
	let div;
	let h2;
	let t0_value = /*file*/ ctx[12].title + "";
	let t0;
	let t1;
	let p;
	let t2_value = /*file*/ ctx[12].excerpt + "";
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
			attr(h2, "class", "svelte-51zhvt");
			attr(p, "class", "svelte-51zhvt");
			attr(hr, "class", "svelte-51zhvt");
			attr(div, "class", "file selected svelte-51zhvt");
			attr(div, "tabindex", "0");
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
			/*div_binding*/ ctx[10](div);
		},
		p(ctx, dirty) {
			if (dirty & /*files*/ 2 && t0_value !== (t0_value = /*file*/ ctx[12].title + "")) set_data(t0, t0_value);
			if (dirty & /*files*/ 2 && t2_value !== (t2_value = /*file*/ ctx[12].excerpt + "")) set_data(t2, t2_value);
		},
		d(detaching) {
			if (detaching) detach(div);
			/*div_binding*/ ctx[10](null);
		}
	};
}

// (362:2) {#each files as file}
function create_each_block$2(ctx) {
	let if_block_anchor;

	function select_block_type(ctx, dirty) {
		if (/*file*/ ctx[12].selected) return create_if_block$1;
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

function create_fragment$4(ctx) {
	let div;
	let dispose;
	let each_value = /*files*/ ctx[1];
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
	}

	return {
		c() {
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(div, "id", "files");
			attr(div, "class", "svelte-51zhvt");
			toggle_class(div, "focused", /*focused*/ ctx[0]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			if (remount) dispose();
			dispose = listen(window_1, "keydown", /*handleKeydown*/ ctx[3]);
		},
		p(ctx, [dirty]) {
			if (dirty & /*selectedEl, files, openFile*/ 6) {
				each_value = /*files*/ ctx[1];
				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$2(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block$2(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value.length;
			}

			if (dirty & /*focused*/ 1) {
				toggle_class(div, "focused", /*focused*/ ctx[0]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			destroy_each(each_blocks, detaching);
			dispose();
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

function openFile(id) {
	window.api.send("dispatch", {
		type: "OPEN_FILE",
		// parentId: selectedFolderId,
		fileId: id
	});
}

function instance$4($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let { focused } = $$props;
	let files = [];
	let selectedFileIndex = 0;
	let selectedEl = undefined;

	onMount(async () => {
		$$invalidate(1, files = getFiles());
		sortFiles();
	});

	function getChildFolderIds(parentFolder) {
		let ids = [];

		const children = state.contents.map(c => {
			if (c.type == "directory" && c.parentId == parentFolder.id) {
				// Push id of child folder
				ids.push(c.id);

				// Find and push ids of the child's children (recursive)
				getChildFolderIds(c).map(m => {
					ids.push(m);
				});
			}
		});

		return ids;
	}

	function getFiles() {
		if (state.projectPath == "" || !state.contents.length > 0 || !state.filesSearchCriteria) return [];
		let files = [];
		const folderId = state.filesSearchCriteria.lookInFolderId;
		const includeChildren = state.filesSearchCriteria.includeChildren;
		const tags = state.filesSearchCriteria.tags;
		const filterDateModified = state.filesSearchCriteria.filterDateModified;
		const filterDateCreated = state.filesSearchCriteria.filterDateCreated;

		// Get selected folder
		const folder = state.contents.find(c => c.type == "directory" && c.id == folderId);

		// Get all files for selected folder
		files = state.contents.filter(c => c.type == "file" && c.parentId == folderId);

		// If `includeChildren`, add files of child folders
		if (includeChildren) {
			// Get ids of child folders
			let childFolderIds = getChildFolderIds(folder);

			// Add files in child folders
			state.contents.map(c => {
				if (c.type == "file") {
					if (childFolderIds.includes(c.parentId)) {
						files.push(c);
					}
				}
			});
		}

		// Filter by tags
		if (tags && tags.length > 0) {
			files = files.filter(f => {
				return tags.some(t => {
					if (f.tags.includes(t)) {
						return true;
					}
				});
			});
		}

		// Filter by date modified
		if (filterDateModified) {
			const from = new Date(state.filesSearchCriteria.fromDateModified);
			const to = new Date(state.filesSearchCriteria.toDateModified);

			files = files.filter(f => {
				const modified = new Date(f.modified);

				if (modified < from && modified > to) {
					return f;
				}
			});
		}

		// Filter by date modified
		if (filterDateCreated) {
			const from = new Date(state.filesSearchCriteria.fromDateCreated);
			const to = new Date(state.filesSearchCriteria.toDateCreated);

			files = files.filter(f => {
				const created = new Date(f.created);

				if (created < from && created > to) {
					return f;
				}
			});
		}

		return files;
	}

	function sortFiles() {
		if (!files) return;

		{
			{
				files.sort((a, b) => a.title.localeCompare(b.title));
			}
		}
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
		if (selectedFileId == "") {
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
		($$invalidate(1, files), $$invalidate(4, state));

		// Await tick, then scroll file into view
		await tick();

		scrollFileIntoView(selectedEl, true);
	}

	/**
 * User can press arrow keys to navigate up/down the list
 * TODO: SideBar + FileList should be one unified focus area. Pressing arrows while clicking inside SideBar should translate into up/down inside FileList.
 */
	function handleKeydown(event) {
		if (!focused) return;
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

	function div_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, selectedEl = $$value);
		});
	}

	const click_handler = file => openFile(file.id);

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(4, state = $$props.state);
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*state*/ 16) {
			 {
				if (state.changed.includes("contents") || state.changed.includes("filesSearchCriteria") || state.changed.includes("selectedFileId")) {
					$$invalidate(1, files = getFiles());
					sortFiles();
				}
			}
		}
	};

	return [
		focused,
		files,
		selectedEl,
		handleKeydown,
		state,
		selectedFileIndex,
		getChildFolderIds,
		getFiles,
		sortFiles,
		setSelectedFile,
		div_binding,
		click_handler
	];
}

class FileList extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-51zhvt-style")) add_css$4();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { state: 4, focused: 0 });
	}
}

/* src/js/component/Editor.svelte generated by Svelte v3.22.3 */

function add_css$5() {
	var style = element("style");
	style.id = "svelte-1jlvyx7-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#editor.svelte-1jlvyx7{flex:1 1 1600px;background-color:aliceblue}#editor.focused.svelte-1jlvyx7{background-color:red}";
	append(document.head, style);
}

function create_fragment$5(ctx) {
	let div;
	let dispose;

	return {
		c() {
			div = element("div");
			div.innerHTML = `<p class="svelte-1jlvyx7">Editor</p>`;
			attr(div, "id", "editor");
			attr(div, "class", "svelte-1jlvyx7");
			toggle_class(div, "focused", /*focused*/ ctx[0]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			if (remount) dispose();
			dispose = listen(div, "click", /*click_handler*/ ctx[1]);
		},
		p(ctx, [dirty]) {
			if (dirty & /*focused*/ 1) {
				toggle_class(div, "focused", /*focused*/ ctx[0]);
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

function instance$5($$self, $$props, $$invalidate) {
	let { focused } = $$props;

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$set = $$props => {
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
	};

	return [focused, click_handler];
}

class Editor extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1jlvyx7-style")) add_css$5();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { focused: 0 });
	}
}

/* src/js/component/Layout.svelte generated by Svelte v3.22.3 */

function add_css$6() {
	var style = element("style");
	style.id = "svelte-1v0a37p-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}.flexLayout.svelte-1v0a37p{display:flex;width:100%;height:100%}";
	append(document.head, style);
}

// (103:0) {:else}
function create_else_block$1(ctx) {
	let div;
	let t0;
	let t1;
	let current;

	const flexpanel0 = new FlexPanel({
			props: {
				visible: /*state*/ ctx[0].sideBar.show,
				min: 160,
				max: 220,
				start: 180,
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			}
		});

	flexpanel0.$on("click", /*click_handler*/ ctx[2]);

	const flexpanel1 = new FlexPanel({
			props: {
				visible: /*state*/ ctx[0].showFilesList,
				min: 260,
				max: 320,
				start: 280,
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			}
		});

	flexpanel1.$on("click", /*click_handler_1*/ ctx[3]);

	const editor = new Editor({
			props: {
				focused: /*focusedSection*/ ctx[1] == "Editor"
			}
		});

	editor.$on("click", /*click_handler_2*/ ctx[4]);

	return {
		c() {
			div = element("div");
			create_component(flexpanel0.$$.fragment);
			t0 = space();
			create_component(flexpanel1.$$.fragment);
			t1 = space();
			create_component(editor.$$.fragment);
			attr(div, "class", "flexLayout svelte-1v0a37p");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			mount_component(flexpanel0, div, null);
			append(div, t0);
			mount_component(flexpanel1, div, null);
			append(div, t1);
			mount_component(editor, div, null);
			current = true;
		},
		p(ctx, dirty) {
			const flexpanel0_changes = {};
			if (dirty & /*state*/ 1) flexpanel0_changes.visible = /*state*/ ctx[0].sideBar.show;

			if (dirty & /*$$scope, state, focusedSection*/ 35) {
				flexpanel0_changes.$$scope = { dirty, ctx };
			}

			flexpanel0.$set(flexpanel0_changes);
			const flexpanel1_changes = {};
			if (dirty & /*state*/ 1) flexpanel1_changes.visible = /*state*/ ctx[0].showFilesList;

			if (dirty & /*$$scope, state, focusedSection*/ 35) {
				flexpanel1_changes.$$scope = { dirty, ctx };
			}

			flexpanel1.$set(flexpanel1_changes);
			const editor_changes = {};
			if (dirty & /*focusedSection*/ 2) editor_changes.focused = /*focusedSection*/ ctx[1] == "Editor";
			editor.$set(editor_changes);
		},
		i(local) {
			if (current) return;
			transition_in(flexpanel0.$$.fragment, local);
			transition_in(flexpanel1.$$.fragment, local);
			transition_in(editor.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(flexpanel0.$$.fragment, local);
			transition_out(flexpanel1.$$.fragment, local);
			transition_out(editor.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) detach(div);
			destroy_component(flexpanel0);
			destroy_component(flexpanel1);
			destroy_component(editor);
		}
	};
}

// (101:0) {#if state.projectPath == ''}
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

// (105:4) <FlexPanel       visible={state.sideBar.show}       min={160}       max={220}       start={180}       on:click={() => (focusedSection = 'Navigation')}>
function create_default_slot_1(ctx) {
	let current;

	const sidebar = new SideBar({
			props: {
				state: /*state*/ ctx[0],
				focused: /*focusedSection*/ ctx[1] == "Navigation"
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
			if (dirty & /*focusedSection*/ 2) sidebar_changes.focused = /*focusedSection*/ ctx[1] == "Navigation";
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

// (113:4) <FlexPanel       visible={state.showFilesList}       min={260}       max={320}       start={280}       on:click={() => (focusedSection = 'Navigation')}>
function create_default_slot(ctx) {
	let current;

	const filelist = new FileList({
			props: {
				state: /*state*/ ctx[0],
				focused: /*focusedSection*/ ctx[1] == "Navigation"
			}
		});

	return {
		c() {
			create_component(filelist.$$.fragment);
		},
		m(target, anchor) {
			mount_component(filelist, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const filelist_changes = {};
			if (dirty & /*state*/ 1) filelist_changes.state = /*state*/ ctx[0];
			if (dirty & /*focusedSection*/ 2) filelist_changes.focused = /*focusedSection*/ ctx[1] == "Navigation";
			filelist.$set(filelist_changes);
		},
		i(local) {
			if (current) return;
			transition_in(filelist.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(filelist.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(filelist, detaching);
		}
	};
}

function create_fragment$6(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$2, create_else_block$1];
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

function instance$6($$self, $$props, $$invalidate) {
	let { state = {} } = $$props;
	let focusedSection;
	const click_handler = () => $$invalidate(1, focusedSection = "Navigation");
	const click_handler_1 = () => $$invalidate(1, focusedSection = "Navigation");
	const click_handler_2 = () => $$invalidate(1, focusedSection = "Editor");

	$$self.$set = $$props => {
		if ("state" in $$props) $$invalidate(0, state = $$props.state);
	};

	return [state, focusedSection, click_handler, click_handler_1, click_handler_2];
}

class Layout extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-1v0a37p-style")) add_css$6();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { state: 0 });
	}

	get state() {
		return this.$$.ctx[0];
	}

	set state(state) {
		this.$set({ state });
		flush();
	}
}

// import Fuse from './third-party/fuse/fuse.esm.js'

async function setup() {

  const initialState = await window.api.invoke('getState');

  const layout = new Layout({
    target: document.querySelector('#layout'),
    props: { state: initialState }
  });

  window.api.receive("stateChanged", (newState, oldState) => {
    console.log("State changed");
    console.log(layout.state);
    console.log(newState);
    console.log("----");
    layout.state = newState;
  });

  window.api.send('showWindow');


  // Editor.setup(initialState)

  // // Set variable colors
  // let test = getComputedStyle(document.documentElement)
  //   .getPropertyValue('--clr-blue'); // #999999
  //   console.log(test)

}
window.addEventListener('DOMContentLoaded', setup);

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)
//# sourceMappingURL=renderer.js.map
