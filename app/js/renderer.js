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

// (146:2) {#each folders as item}
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

// (151:2) {#each documents as item}
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

// (156:2) {#each media as item}
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
	child_ctx[25] = list[i];
	child_ctx[27] = i;
	return child_ctx;
}

// (462:4) {#each docs as doc, index (doc.id)}
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
			if (/*sort*/ ctx[5].by === void 0) add_render_callback(() => /*select_1_change_handler*/ ctx[22].call(select_1));
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
		if (!document.getElementById("svelte-3a08x3-style")) add_css$5();
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
      texMathEquation: false,
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
      if (!state.texMathEquation && stream.match(/^\$\$$/)) {
        state.texMathEquation = true;
        stream.skipToEnd();
        return 'line-texmath-equation'
      } else if (state.texMathEquation) {
        // If we've reached the end, stop the state
        if (stream.match(/^\$\$$/)) state.texMathEquation = false;
        stream.skipToEnd();
        return 'line-texmath-equation'
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
      return `line-texmath-equation`
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
      highlightFormatting: false,
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

let makeMarks = false;

let lastCursorLine = 0;

const turndownService = new TurndownService();


// -------- UTILITY -------- //

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
    // console.log(`mediaBasePath is ${mediaBasePath}`)
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
  if (!makeMarks) return
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
    indentWithTabs: false,
    // We use closebracket.js for character-closing behaviour. 
    // https://codemirror.net/doc/manual.html#addon_closebrackets
    // We add support for `**` and `__` by copying the default config object from closebrackets.js, and adding `**__` to the pairs property.
    autoCloseBrackets: { 
      pairs: "**__()[]{}''\"\"",
      closeBefore: ")]}'\":;>",
      triples: "",
      explode: "[]{}"
    },
    keyMap: 'sublime',
    extraKeys: {
      'Shift-Cmd-K': 'deleteLine',
      'Cmd-L': 'selectLine',
      'Shift-Alt-Down': 'duplicateLine',
      'Cmd-D': 'selectNextOccurrence',
      'Alt-Up': 'swapLineUp',
      'Alt-Down': 'swapLineDown',
      'Shift-Ctrl-Up': 'addCursorToPrevLine',
      'Shift-Ctrl-Down': 'addCursorToNextLine',
      'Enter': 'newlineAndIndentContinueMarkdownList',
      'Tab': 'autoIndentMarkdownList',
      'Shift-Tab': 'autoUnindentMarkdownList',
      // "'_'": () => wrapText('_')
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
  editor.setOption("theme", initialState.editorTheme);

  // Setup change listeners
  window.api.receive('stateChanged', async (newState, oldState) => {
    state = newState;

    if (state.changed.includes('editorTheme')) {
      editor.setOption("theme", newState.editorTheme);
    }

    if (state.changed.includes('openDoc')) {
      if (state.openDoc.path) {
        loadFileByPath(state.openDoc.path);
      }
    }

    if (state.changed.includes('newDoc')) {

      // Place the cursor at the end of the document.
      // We have to wait a moment before calling.
      // Per: https://stackoverflow.com/a/61934020
      setTimeout(() => {
        editor.focus();
        editor.setCursor({
          line: editor.lastLine(),
          ch: editor.getLine(editor.lastLine()).length,
        });
      }, 0);
    }
  });

  window.api.receive('mainRequestsSaveFile', () => {
    window.api.send('dispatch', {
      type: 'SAVE_FILE',
      path: state.openDoc.path,
      data: editor.getValue()
    });
  });

  // "Source mode" toggle reverts displayed text to plain markdown (without widgets, etc) when activated. 
  window.api.receive('mainRequestsToggleSource', (showSource) => {
    const theme = showSource ? 'markdown' : 'test';
    // editor.setOption('mode', mode)

    // Set theme
    editor.setOption('theme', theme);

    // Enable or disable marks
    if (showSource) {
      makeMarks = false;
      editor.getAllMarks().forEach((m) => m.clear());
    } else {
      makeMarks = true;
      findAndMark();
    }

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
