import TurndownService from './third-party/turndown/turndown.es.js';

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
		window.api.send("dispatch", { type: "SET_PROJECT_PATH" });
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

const urlRE = new RegExp(/^((?:(?:aaas?|about|acap|adiumxtra|af[ps]|aim|apt|attachment|aw|beshare|bitcoin|bolo|callto|cap|chrome(?:-extension)?|cid|coap|com-eventbrite-attendee|content|crid|cvs|data|dav|dict|dlna-(?:playcontainer|playsingle)|dns|doi|dtn|dvb|ed2k|facetime|feed|file|finger|fish|ftp|geo|gg|git|gizmoproject|go|gopher|gtalk|h323|hcp|https?|iax|icap|icon|im|imap|info|ipn|ipp|irc[6s]?|iris(?:\.beep|\.lwz|\.xpc|\.xpcs)?|itms|jar|javascript|jms|keyparc|lastfm|ldaps?|magnet|mailto|maps|market|message|mid|mms|ms-help|msnim|msrps?|mtqp|mumble|mupdate|mvn|news|nfs|nih?|nntp|notes|oid|opaquelocktoken|palm|paparazzi|platform|pop|pres|proxy|psyc|query|res(?:ource)?|rmi|rsync|rtmp|rtsp|secondlife|service|session|sftp|sgn|shttp|sieve|sips?|skype|sm[bs]|snmp|soap\.beeps?|soldat|spotify|ssh|steam|svn|tag|teamspeak|tel(?:net)?|tftp|things|thismessage|tip|tn3270|tv|udp|unreal|urn|ut2004|vemmi|ventrilo|view-source|webcal|wss?|wtai|wyciwyg|xcon(?:-userid)?|xfire|xmlrpc\.beeps?|xmpp|xri|ymsgr|z39\.50[rs]?):(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]|\([^\s()<>]*\))+(?:\([^\s()<>]*\)|[^\s`*!()\[\]{};:'".,<>?«»“”‘’]))/i);

/**
 * Check if string is URL. Uses regexp from GitHub Flavored Markdown:
 * https://github.com/codemirror/CodeMirror/blob/master/mode/gfm/gfm.js#L14
 */
function isUrl(string) {
  return urlRE.test(string)
}

/* src/js/renderer/component/FlexPanel.svelte generated by Svelte v3.22.3 */

function add_css$1() {
	var style = element("style");
	style.id = "svelte-p13iqj-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#container.svelte-p13iqj{height:100%;overflow-x:hidden;position:relative;display:none}#container.visible.svelte-p13iqj{display:block}.divider.svelte-p13iqj{position:absolute;top:0;right:0;transform:translate(50%, 0);width:8px;height:100%;z-index:200;cursor:ew-resize}";
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
			attr(div0, "class", "divider svelte-p13iqj");
			attr(div1, "id", "container");
			set_style(div1, "flex", "0 0 " + /*width*/ ctx[2] + "px");
			attr(div1, "class", "svelte-p13iqj");
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
		if (!document.getElementById("svelte-p13iqj-style")) add_css$1();
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

function add_css$2() {
	var style = element("style");
	style.id = "svelte-1c2yl96-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#container.svelte-1c2yl96.svelte-1c2yl96{overflow:hidden;position:relative}#flex-row.svelte-1c2yl96.svelte-1c2yl96{margin-top:2px;height:24px;display:flex;align-items:center}.selected.svelte-1c2yl96>#flex-row.svelte-1c2yl96{background-color:rgba(0, 0, 0, 0.1)}#disclosure-triangle.svelte-1c2yl96.svelte-1c2yl96{border:none;outline:none;padding:0;margin:0;margin-left:4px;width:13px;height:13px;background-color:transparent}#disclosure-triangle.svelte-1c2yl96 img.svelte-1c2yl96{width:100%;height:100%;display:none}#disclosure-triangle.expandable.svelte-1c2yl96 img.svelte-1c2yl96{display:inline}#disclosure-triangle.expanded.svelte-1c2yl96 img.svelte-1c2yl96{transform:rotate(90deg)}[data-nestDepth=\"1\"].svelte-1c2yl96 #disclosure-triangle.svelte-1c2yl96{margin-left:calc(4px + calc(16px * 1))}[data-nestDepth=\"2\"].svelte-1c2yl96 #disclosure-triangle.svelte-1c2yl96{margin-left:calc(4px + calc(16px * 2))}[data-nestDepth=\"3\"].svelte-1c2yl96 #disclosure-triangle.svelte-1c2yl96{margin-left:calc(4px + calc(16px * 3))}#icon.svelte-1c2yl96.svelte-1c2yl96{margin-left:4px;width:18px;height:18px}#label.svelte-1c2yl96.svelte-1c2yl96{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;white-space:nowrap;overflow:hidden;margin-left:6px;flex:1}#children.svelte-1c2yl96.svelte-1c2yl96{height:0}#children.expanded.svelte-1c2yl96.svelte-1c2yl96{height:auto}";
	append(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[6] = list[i];
	return child_ctx;
}

// (183:2) {#if item.children.length > 0}
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
			attr(div, "class", "svelte-1c2yl96");
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

// (185:6) {#each item.children as childItem}
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
			button.innerHTML = `<img src="images/mac/disclosure-triangle.svg" alt="Collapse/Expand" class="svelte-1c2yl96">`;
			t0 = space();
			img1 = element("img");
			t1 = space();
			span = element("span");
			t2 = text(t2_value);
			t3 = space();
			if (if_block) if_block.c();
			attr(button, "id", "disclosure-triangle");
			attr(button, "alt", "Expand");
			attr(button, "class", "svelte-1c2yl96");
			toggle_class(button, "expandable", /*item*/ ctx[1].children.length > 0);
			toggle_class(button, "expanded", /*item*/ ctx[1].expanded);
			if (img1.src !== (img1_src_value = /*item*/ ctx[1].icon)) attr(img1, "src", img1_src_value);
			attr(img1, "id", "icon");
			attr(img1, "alt", "Icon");
			attr(img1, "class", "svelte-1c2yl96");
			attr(span, "id", "label");
			attr(span, "class", "svelte-1c2yl96");
			attr(div0, "id", "flex-row");
			attr(div0, "class", "svelte-1c2yl96");
			attr(div1, "id", "container");
			attr(div1, "data-nestdepth", /*nestDepth*/ ctx[2]);
			attr(div1, "class", "svelte-1c2yl96");
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
		if (!document.getElementById("svelte-1c2yl96-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { state: 0, item: 1, nestDepth: 2 });
	}
}

/* src/js/renderer/component/SideBar.svelte generated by Svelte v3.22.3 */

function add_css$3() {
	var style = element("style");
	style.id = "svelte-1gmu8r1-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#sidebar.svelte-1gmu8r1{width:100%;height:100%;background-color:lightgray;overflow-y:scroll;position:relative;border-right:1px solid black;user-select:none}#sidebar.focused.svelte-1gmu8r1{background-color:red}.title.svelte-1gmu8r1{font:caption;font-weight:bold;font-size:11px;line-height:13px;letter-spacing:0.07px;margin:15px 0 0 9px}.title.svelte-1gmu8r1:first-of-type{margin-top:9px}";
	append(document.head, style);
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i];
	return child_ctx;
}

// (145:2) {#each folders as item}
function create_each_block_2(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*item*/ ctx[5]
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
			if (dirty & /*folders*/ 4) sidebaritem_changes.item = /*item*/ ctx[5];
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

// (150:2) {#each documents as item}
function create_each_block_1(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*item*/ ctx[5]
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
			if (dirty & /*documents*/ 8) sidebaritem_changes.item = /*item*/ ctx[5];
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

// (155:2) {#each media as item}
function create_each_block$1(ctx) {
	let current;

	const sidebaritem = new SideBarItem({
			props: {
				state: /*state*/ ctx[0],
				item: /*item*/ ctx[5]
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
			if (dirty & /*media*/ 16) sidebaritem_changes.item = /*item*/ ctx[5];
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

			attr(h10, "class", "title svelte-1gmu8r1");
			attr(h11, "class", "title svelte-1gmu8r1");
			attr(h12, "class", "title svelte-1gmu8r1");
			attr(div, "id", "sidebar");
			attr(div, "class", "svelte-1gmu8r1");
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

	let folders;
	let documents;
	let media;

	$$self.$$.update = () => {
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
		if (!document.getElementById("svelte-1gmu8r1-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { state: 0, focused: 1 });
	}
}

/* src/js/renderer/component/DocListItem.svelte generated by Svelte v3.22.3 */

function add_css$4() {
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
		if (!document.getElementById("svelte-cke80v-style")) add_css$4();

		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
			state: 4,
			selected: 0,
			title: 1,
			excerpt: 2
		});
	}
}

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
            'discouraged and will be removed in an upcoming major release. Please refer to ' +
            'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
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
            if (isMomentInput(arguments[0])) {
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
            val = this.startOf('day').valueOf();

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
            val = this.startOf('day').valueOf();

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
            val = this.startOf('day').valueOf();

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
            val = this.startOf('day').valueOf();

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

    hooks.version = '2.27.0';

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

function updateDocList(state, filter) {

  // Get search paramaters
  const filterDateModified = filter.filterDateModified;
  const filterDateCreated = filter.filterDateCreated;

  // Get folder. If `lookInFolderId` is '*', that means "search all folders", so we get the root folder (the one without a parentId). Else, we get the folder specified by `lookInFolderId`.
  const folder = filter.lookInFolderId == '*' ?
    state.folders.find((f) => f.parentId == '') :
    state.folders.find((f) => f.id == filter.lookInFolderId);

  // Get docs for selected folder
  let docs = state.documents.filter((d) => d.parentId == folder.id);

  // If `includeChildren`, get docs for all descendant folders
  if (filter.includeChildren) {
    // Get ids of child folders
    let childFolderIds = getChildFolderIds(folder);

    // Add docs in child folders
    state.documents.forEach((c) => {
      if (childFolderIds.includes(c.parentId)) {
        docs.push(c);
      }
    });
  }

  /**
   * Get all the child folder ids of specified folder, recursively.
   * @param {*} parentFolder 
   */
  function getChildFolderIds(parentFolder) {

    let ids = [];

    state.folders.forEach((f) => {
      if (f.parentId == parentFolder.id) {
        // Push id of child folder
        ids.push(f.id);

        // Find and add ids of the child's children (recursive)
        ids.concat(getChildFolderIds(f));
      }
    });
    return ids;
  }

  // Set `selected` property to false, by default
  docs.forEach((f) => f.selected = false);

  // Filter by tags
  if (filter.tags.length > 0) {
    docs = docs.filter((f) => {
      return filter.tags.some((t) => {
        if (f.tags.includes(t)) {
          return true;
        }
      });
    });
  }

  // If we should use dateModified, we need to validate the dates.
  // E.g. `from` must be before `to`. 
  // If the dates are not valid, we do not apply the filter.
  if (filter.dateModified.use) {

    // Start by copying the input from and to values
    let from = filter.dateModified.from;
    let to = filter.dateModified.to;

    // Convert `from` value to date
    if (from == 'NOW' || from == '') {
      from = moment().format();
    } else if (filter.dateModified.from.includes('DAYS-AGO')) {
      let numberOf = from.substring(0, from.indexOf('-'));
      from = moment().subtract(numberOf, 'days');
    } else {
      from = moment(from).format();
    }

    // Convert `to` value to date
    if (filter.dateModified.to.includes('DAYS-AGO')) {
      let numberOf = to.substring(0, to.indexOf('-'));
      to = moment().subtract(numberOf, 'days').format();
    } else {
      to = moment(to).format();
    }

    console.log(from);
    console.log(to);

    if (from > to) {
      docs = docs.filter((f) => {
        const modified = moment(f.modified).format();
        if (modified < from && modified > to) {
          return f
        }
      });
    }
  }

  // Filter by date modified
  // if (filterDateModified) {
  //   const from = new Date(filter.fromDateModified);
  //   const to = new Date(filter.toDateModified);
  //   docs = docs.filter(f => {
  //     const modified = new Date(f.modified);
  //     if (modified < from && modified > to) {
  //       return f;
  //     }
  //   });
  // }

  // // Filter by date modified
  // if (filterDateCreated) {
  //   const from = new Date(filter.fromDateCreated);
  //   const to = new Date(filter.toDateCreated);
  //   docs = docs.filter(f => {
  //     const created = new Date(f.created);
  //     if (created < from && created > to) {
  //       return f;
  //     }
  //   });
  // }

  return docs
}

function sortDocList(docsBefore, sort) {

  let docs = docsBefore;

  switch (sort.by) {
    case 'title':
      docs.sort((a, b) => a.title.localeCompare(b.title));
      break
    case 'date-modified':
      docs.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      break
    case 'date-created':
      docs.sort((a, b) => new Date(b.created) - new Date(a.created));
      break
  }

  if (sort.order == 'descending') docs.reverse();

  return docs
}

/* src/js/renderer/component/DocList.svelte generated by Svelte v3.22.3 */

const { window: window_1 } = globals;

function add_css$5() {
	var style = element("style");
	style.id = "svelte-3a08x3-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#list.svelte-3a08x3.svelte-3a08x3{width:100%;height:100%;overflow:hidden;display:flex;flex-direction:column;background-color:white}#header.svelte-3a08x3.svelte-3a08x3{margin:0;padding:0.5rem;border-right:1px solid black;border-bottom:1px solid black;width:100%;z-index:1;position:relative;overflow:hidden;display:flex;flex-wrap:nowrap;align-items:center;justify-content:space-between;height:2rem}#header.svelte-3a08x3 h1.svelte-3a08x3{font:caption;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;font-weight:bold;margin:0;padding:0;white-space:nowrap}#header.svelte-3a08x3:hover #sorting-options.svelte-3a08x3{display:block}#sorting-options.svelte-3a08x3.svelte-3a08x3{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;display:none;position:absolute;right:0.5em;top:50%;transform:translate(0%, -50%);background:white;box-shadow:0px 0px 15px 20px white}#sorting-options.svelte-3a08x3 select.svelte-3a08x3{font:caption;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0.07px;font-weight:bold}#docs.svelte-3a08x3.svelte-3a08x3{width:100%;flex-grow:1;overflow-y:scroll;border-right:1px solid black;padding:0;user-select:none}";
	append(document.head, style);
}

function get_each_context$2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[23] = list[i];
	child_ctx[25] = i;
	return child_ctx;
}

// (470:4) {#each docs as doc, index (doc.id)}
function create_each_block$2(key_1, ctx) {
	let first;
	let current;

	const doclistitem = new DocListItem({
			props: {
				state: /*state*/ ctx[1],
				title: /*doc*/ ctx[23].title,
				excerpt: /*doc*/ ctx[23].excerpt,
				selected: /*doc*/ ctx[23].selected
			}
		});

	doclistitem.$on("click", function () {
		if (is_function(/*handleClick*/ ctx[7](event, /*index*/ ctx[25]))) /*handleClick*/ ctx[7](event, /*index*/ ctx[25]).apply(this, arguments);
	});

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
			if (dirty & /*docs*/ 4) doclistitem_changes.title = /*doc*/ ctx[23].title;
			if (dirty & /*docs*/ 4) doclistitem_changes.excerpt = /*doc*/ ctx[23].excerpt;
			if (dirty & /*docs*/ 4) doclistitem_changes.selected = /*doc*/ ctx[23].selected;
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
	const get_key = ctx => /*doc*/ ctx[23].id;

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

			attr(h1, "class", "svelte-3a08x3");
			attr(label, "for", "sort-select");
			attr(label, "class", "svelte-3a08x3");
			option0.__value = "title";
			option0.value = option0.__value;
			attr(option0, "class", "svelte-3a08x3");
			option1.__value = "date-modified";
			option1.value = option1.__value;
			attr(option1, "class", "svelte-3a08x3");
			option2.__value = "date-created";
			option2.value = option2.__value;
			attr(option2, "class", "svelte-3a08x3");
			attr(select_1, "name", "Sort By");
			attr(select_1, "id", "sort-select");
			attr(select_1, "class", "svelte-3a08x3");
			if (/*sort*/ ctx[5].by === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[21].call(select_1));
			attr(div0, "id", "sorting-options");
			attr(div0, "class", "svelte-3a08x3");
			attr(div1, "id", "header");
			attr(div1, "class", "svelte-3a08x3");
			attr(div2, "id", "docs");
			attr(div2, "class", "svelte-3a08x3");
			toggle_class(div2, "focused", /*focused*/ ctx[0]);
			attr(div3, "id", "list");
			attr(div3, "class", "svelte-3a08x3");
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

			/*div2_binding*/ ctx[22](div2);
			current = true;
			if (remount) run_all(dispose);

			dispose = [
				listen(window_1, "keydown", /*handleKeydown*/ ctx[6]),
				listen(select_1, "change", /*select_1_change_handler*/ ctx[21]),
				listen(select_1, "change", /*selectionMade*/ ctx[8])
			];
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*sideBarItem*/ 16) && t0_value !== (t0_value = /*sideBarItem*/ ctx[4].label + "")) set_data(t0, t0_value);

			if (dirty & /*sort*/ 32) {
				select_option(select_1, /*sort*/ ctx[5].by);
			}

			if (dirty & /*state, docs, handleClick, event*/ 134) {
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

			/*div2_binding*/ ctx[22](null);
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
			$$invalidate(2, docs = updateDocList(state, filter));
			$$invalidate(2, docs = sortDocList(docs, sort));
			$$invalidate(2, docs = restoreLastSelection(docs, sideBarItem.lastSelection));
			setScrollPosition();
		} else if (state.changed.includes("sideBar") || state.changed.includes("folders") || state.changed.includes("documents")) {
			$$invalidate(2, docs = updateDocList(state, filter));
			$$invalidate(2, docs = sortDocList(docs, sort));
			$$invalidate(2, docs = restoreLastSelection(docs, sideBarItem.lastSelection));
		} else if (state.changed.includes("sort")) {
			$$invalidate(2, docs = sortDocList(docs, sort));
		}
	}

	onMount(async () => {
		$$invalidate(2, docs = updateDocList(state, filter));
		$$invalidate(2, docs = sortDocList(docs, sort));
		$$invalidate(2, docs = restoreLastSelection(docs, sideBarItem.lastSelection));
		setScrollPosition();
		mounted = true;
	});

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
 * @param {*} previousSelections - Each is object: `{ index: 0, id: 'file-3234376' }`
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

			// If none of the previously selected docs still exist (most commonly, after a selected doc was deleted), then try to select the "next" doc (the new doc at the same index number as the previously selected doc). Or if the previously-selected doc was last in the list, select the new last doc.
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
			type: "SAVE_SIDEBAR_LAST_SELECTION",
			item: sideBarItem,
			lastSelection: selectedDocs
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
			 $$invalidate(4, sideBarItem = state.selectedSideBarItem);
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
		saveOutgoingSideBarItemScrollPosition,
		setScrollPosition,
		select,
		toggleSelected,
		selectRange,
		restoreLastSelection,
		dispatchSelectionChangesToStore,
		deleteFile,
		select_1_change_handler,
		div2_binding
	];
}

class DocList extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-3a08x3-style")) add_css$5();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, { state: 1, oldState: 9, focused: 0 });
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

/**
 * A _slighty_ more compact snippet for getting text from a range.
 */
function getTextFromRange(editor, line, start, end) {
  return editor.getRange({ line: line, ch: start }, { line: line, ch: end })
}

/* src/js/renderer/component/Link.svelte generated by Svelte v3.22.3 */

function add_css$6() {
	var style = element("style");
	style.id = "svelte-giy5sl-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}.link.svelte-giy5sl{box-sizing:border-box;color:var(--clr-blue);background-color:var(--clr-blue-lighter);padding:0 0.2em 0 0.15em;border-radius:0.15em;border:1px solid var(--clr-blue-light)}";
	append(document.head, style);
}

function create_fragment$6(ctx) {
	let span;
	let t;

	return {
		c() {
			span = element("span");
			t = text(/*text*/ ctx[0]);
			attr(span, "class", "link svelte-giy5sl");
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

function instance$6($$self, $$props, $$invalidate) {
	let { text } = $$props;

	$$self.$set = $$props => {
		if ("text" in $$props) $$invalidate(0, text = $$props.text);
	};

	return [text];
}

class Link extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-giy5sl-style")) add_css$6();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { text: 0 });
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

// -------- SHARED VARIABLES -------- //

let state = {};

let editor;
let mediaBasePath;

let lastCursorLine = 0;

const turndownService = new TurndownService();


// -------- SETUP -------- //

/**
 * Load file contents into CodeMirror
 * If id param is empty, start new doc. This can happen when opening an empty SideBar item (e.g. Favorites, if there are no files with `favorite` tag.)
 */
async function loadFileByPath(filePath) {
  if (filePath == '') {
    startNewDoc();
  } else {
    // Load file into editor
    const file = await window.api.invoke('getFileByPath', filePath, 'utf8');
    editor.setValue(file);
    editor.clearHistory();
    findAndMark();

    // Update media path
    mediaBasePath = filePath.substring(0, filePath.lastIndexOf('/'));
    console.log(`mediaBasePath is ${mediaBasePath}`);
  }
}

function startNewDoc() {
  editor.setValue("Empty doc");
  editor.clearHistory();
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

      if (isFigure) ; else {
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

  // TODO: June 23: Revisit this. Turned off temporarily.
  findAndMark();
}


/**
 * Handle paste operations
 * If URL, generate link.
 * Else, if HTML, convert to markdown} cm 
 */
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

// -------- SETUP -------- //

function makeEditor(textarea) {

  // Brackets widget
  // bracketsWidget = mountReplace(BracketsWidget, {
  //   target: document.querySelector('#bracketsWidget'),
  //   // props: {  }
  // })

  // Define "gambier" CodeMirror mode
  defineGambierMode();

  // Create CodeMirror instance from textarea element (which is replaced).
  const editor = CodeMirror.fromTextArea(textarea, {
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
  // editor.on("change", onChange)

  /**
   * "This event is fired before a change is applied, and its handler may choose to modify or cancel the change"
   * See: https://codemirror.net/doc/manual.html#event_beforeChange
   */
  editor.on('beforeChange', onBeforeChange);

  return editor
}

async function setup(textarea, initialState) {

  state = initialState;

  // Make editor
  editor = makeEditor(textarea);

  // Setup change listeners
  window.api.receive('stateChanged', async (newState, oldState) => {
    state = newState;
    if (state.changed.includes('openDoc')) {
      if (state.openDoc.path) {
        loadFileByPath(state.openDoc.path);
      }
    }
  });

  window.api.receive('mainRequestsSaveFile', () => {
    window.api.send('dispatch', {
      type: 'SAVE_FILE',
      path: state.openDoc.path,
      data: editor.getValue()
    });
  });

  window.api.receive('mainRequestsToggleSource', (showSource) => {
    const mode = showSource ? 'markdown' : 'gambier';
    const theme = showSource ? '' : 'gambier';
    editor.setOption('mode', mode);
    editor.setOption('theme', theme);
  });

  if (state.openDoc.path) {
    loadFileByPath(state.openDoc.path);
  }
}

/* src/js/renderer/component/Editor.svelte generated by Svelte v3.22.3 */

function add_css$7() {
	var style = element("style");
	style.id = "svelte-l3qa0q-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}#editor.svelte-l3qa0q{width:100%;height:100%;background-color:white;display:none;justify-content:center}#editor.visible.svelte-l3qa0q{display:flex}";
	append(document.head, style);
}

function create_fragment$7(ctx) {
	let div;
	let textarea_1;
	let dispose;

	return {
		c() {
			div = element("div");
			textarea_1 = element("textarea");
			set_style(textarea_1, "display", "none");
			textarea_1.value = "Gambier";
			attr(textarea_1, "class", "svelte-l3qa0q");
			attr(div, "id", "editor");
			attr(div, "class", "svelte-l3qa0q");
			toggle_class(div, "focused", /*focused*/ ctx[0]);
			toggle_class(div, "visible", /*visible*/ ctx[1]);
		},
		m(target, anchor, remount) {
			insert(target, div, anchor);
			append(div, textarea_1);
			/*textarea_1_binding*/ ctx[5](textarea_1);
			if (remount) dispose();
			dispose = listen(div, "click", /*click_handler*/ ctx[4]);
		},
		p(ctx, [dirty]) {
			if (dirty & /*focused*/ 1) {
				toggle_class(div, "focused", /*focused*/ ctx[0]);
			}

			if (dirty & /*visible*/ 2) {
				toggle_class(div, "visible", /*visible*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) detach(div);
			/*textarea_1_binding*/ ctx[5](null);
			dispose();
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let { focused } = $$props;
	let { visible } = $$props;
	let { state = {} } = $$props;
	let textarea;

	onMount(() => {
		setup(textarea, state);
	});

	function click_handler(event) {
		bubble($$self, event);
	}

	function textarea_1_binding($$value) {
		binding_callbacks[$$value ? "unshift" : "push"](() => {
			$$invalidate(2, textarea = $$value);
		});
	}

	$$self.$set = $$props => {
		if ("focused" in $$props) $$invalidate(0, focused = $$props.focused);
		if ("visible" in $$props) $$invalidate(1, visible = $$props.visible);
		if ("state" in $$props) $$invalidate(3, state = $$props.state);
	};

	return [focused, visible, textarea, state, click_handler, textarea_1_binding];
}

class Editor extends SvelteComponent {
	constructor(options) {
		super();
		if (!document.getElementById("svelte-l3qa0q-style")) add_css$7();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, { focused: 0, visible: 1, state: 3 });
	}
}

/* src/js/renderer/component/Layout.svelte generated by Svelte v3.22.3 */

function add_css$8() {
	var style = element("style");
	style.id = "svelte-1d8kdq7-style";
	style.textContent = ":root{--layout:[nav-start] minmax(calc(var(--grid) * 6), calc(var(--grid) * 8)) [nav-end files-start]\n        minmax(calc(var(--grid) * 8), calc(var(--grid) * 10)) [files-end editor-start] 1fr [editor-end];--clr-editorText:#24292e;--side-bar-bg-color:#fafafa;--control-text-color:#777;--body-color:rgb(51, 51, 51);--body-color-light:rgb(96, 96, 96);--clr-warning:rgba(255, 50, 50, 0.4);--clr-warning-dark:rgba(255, 50, 50, 0.75);--clr-gray-darkest:hsl(0, 0%, 7.5%);--clr-gray-darker:hsl(0, 0%, 15%);--clr-gray-dark:hsl(0, 0%, 30%);--clr-gray:hsl(0, 0%, 50%);--clr-gray-light:hsl(0, 0%, 70%);--clr-gray-lighter:hsl(0, 0%, 85%);--clr-gray-lightest:hsl(0, 0%, 92.5%);--clr-blue:rgb(13, 103, 220);--clr-blue-light:#b9d0ee;--clr-blue-lighter:rgb(232, 242, 255);--baseFontSize:16px;--baseLineHeight:1.625rem;--baseFontScale:1.125;--font-base-size:1rem;--font-sml-3:calc(var(--font-sml-2) / var(--baseFontScale));--font-sml-2:calc(var(--font-sml-1) / var(--baseFontScale));--font-sml-1:calc(var(--font-base-size) / var(--baseFontScale));--font-lg-1:calc(var(--font-base-size) * var(--baseFontScale));--font-lg-2:calc(var(--font-lg-1) * var(--baseFontScale));--font-lg-3:calc(var(--font-lg-2) * var(--baseFontScale));--font-lg-4:calc(var(--font-lg-3) * var(--baseFontScale));--font-lg-5:calc(var(--font-lg-4) * var(--baseFontScale));--font-lg-6:calc(var(--font-lg-5) * var(--baseFontScale));--font-lg-7:calc(var(--font-lg-6) * var(--baseFontScale));--font-lg-8:calc(var(--font-lg-7) * var(--baseFontScale));--grid:var(--baseLineHeight);--grid-eighth:calc(var(--grid) * 0.125);--grid-sixth:calc(var(--grid) * 0.166);--grid-quarter:calc(var(--grid) * 0.25);--grid-half:calc(var(--grid) * 0.5);--grid-three-quarters:calc(var(--grid) * 0.75);--grid-1-and-quarter:calc(var(--grid) * 1.25);--grid-1-and-half:calc(var(--grid) * 1.5);--grid-1-and-three-quarters:calc(var(--grid) * 1.75);--grid-2:calc(var(--grid) * 2);--grid-3:calc(var(--grid) * 3);--grid-4:calc(var(--grid) * 4);--grid-5:calc(var(--grid) * 5);--grid-6:calc(var(--grid) * 6);--grid-7:calc(var(--grid) * 7);--grid-8:calc(var(--grid) * 8);--grid-9:calc(var(--grid) * 9);--grid-10:calc(var(--grid) * 10);--grid-12:calc(var(--grid) * 12);--grid-14:calc(var(--grid) * 14);--grid-16:calc(var(--grid) * 16);--grid-24:calc(var(--grid) * 24);--grid-32:calc(var(--grid) * 32)}.flexLayout.svelte-1d8kdq7{display:flex;width:100%;height:100%}#mainSection.svelte-1d8kdq7{width:100%;height:100%}";
	append(document.head, style);
}

// (117:0) {:else}
function create_else_block(ctx) {
	let div1;
	let t0;
	let t1;
	let div0;
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
	let if_block = /*state*/ ctx[0].showFilesList && create_if_block_1(ctx);

	const editor = new Editor({
			props: {
				state: /*state*/ ctx[0],
				visible: /*isEditorVisible*/ ctx[2]
			}
		});

	editor.$on("click", /*click_handler_2*/ ctx[7]);

	return {
		c() {
			div1 = element("div");
			create_component(flexpanel.$$.fragment);
			t0 = space();
			if (if_block) if_block.c();
			t1 = space();
			div0 = element("div");
			create_component(editor.$$.fragment);
			attr(div0, "id", "mainSection");
			attr(div0, "class", "svelte-1d8kdq7");
			attr(div1, "class", "flexLayout svelte-1d8kdq7");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			mount_component(flexpanel, div1, null);
			append(div1, t0);
			if (if_block) if_block.m(div1, null);
			append(div1, t1);
			append(div1, div0);
			mount_component(editor, div0, null);
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
					if_block = create_if_block_1(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(div1, t1);
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
			if (detaching) detach(div1);
			destroy_component(flexpanel);
			if (if_block) if_block.d();
			destroy_component(editor);
		}
	};
}

// (115:0) {#if state.projectPath == ''}
function create_if_block$1(ctx) {
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

// (119:4) <FlexPanel       visible={state.sideBar.show}       min={160}       max={220}       start={180}       on:click={() => setLayoutFocus('navigation')}>
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

// (127:4) {#if state.showFilesList}
function create_if_block_1(ctx) {
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

// (128:6) <FlexPanel         min={260}         max={360}         start={280}         on:click={() => setLayoutFocus('navigation')}>
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

function create_fragment$8(ctx) {
	let current_block_type_index;
	let if_block;
	let if_block_anchor;
	let current;
	const if_block_creators = [create_if_block$1, create_else_block];
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

function instance$8($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-1d8kdq7-style")) add_css$8();
		init(this, options, instance$8, create_fragment$8, safe_not_equal, { state: 0, oldState: 1 });
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

async function setup$1() {

  const initialState = await window.api.invoke('getState');

  const layout = new Layout({
    target: document.querySelector('#layout'),
    props: { 
      state: initialState,
      oldState: initialState,
    }
  });

  window.api.receive("stateChanged", (newState, oldState) => {
    layout.state = newState;
    layout.oldState = oldState;
  });

  window.api.send('showWindow');


  // Editor.setup(initialState)

  // // Set variable colors
  // let test = getComputedStyle(document.documentElement)
  //   .getPropertyValue('--clr-blue'); // #999999
  //   console.log(test)

}
window.addEventListener('DOMContentLoaded', setup$1);

// function reloading() {
//   window.api.send('hideWindow')
// }

// window.addEventListener('beforeunload', reloading)
//# sourceMappingURL=renderer.js.map
