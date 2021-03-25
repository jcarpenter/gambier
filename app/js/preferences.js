// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
window.process = { env: { NODE_ENV: "production" } };
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
function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    return () => node.removeEventListener(event, handler, options);
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

let current_component;
function set_current_component(component) {
    current_component = component;
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
        wait().then(() => {
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
function prop_dev(node, property, value) {
    node[property] = value;
    dispatch_dev('SvelteDOMSetProperty', { node, property, value });
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

function n(n){for(var t=arguments.length,r=Array(t>1?t-1:0),e=1;e<t;e++)r[e-1]=arguments[e];if("production"!==process.env.NODE_ENV){var i=Y[n],o=i?"function"==typeof i?i.apply(null,r):i:"unknown error nr: "+n;throw Error("[Immer] "+o)}throw Error("[Immer] minified error nr: "+n+(r.length?" "+r.map((function(n){return "'"+n+"'"})).join(","):"")+". Find the full error at: https://bit.ly/3cXEKWf")}function t(n){return !!n&&!!n[Q]}function r(n){return !!n&&(function(n){if(!n||"object"!=typeof n)return !1;var t=Object.getPrototypeOf(n);return !t||t===Object.prototype}(n)||Array.isArray(n)||!!n[L]||!!n.constructor[L]||s(n)||v(n))}function i(n,t,r){void 0===r&&(r=!1),0===o(n)?(r?Object.keys:Z)(n).forEach((function(e){r&&"symbol"==typeof e||t(e,n[e],n);})):n.forEach((function(r,e){return t(e,r,n)}));}function o(n){var t=n[Q];return t?t.i>3?t.i-4:t.i:Array.isArray(n)?1:s(n)?2:v(n)?3:0}function u(n,t){return 2===o(n)?n.has(t):Object.prototype.hasOwnProperty.call(n,t)}function a(n,t){return 2===o(n)?n.get(t):n[t]}function f(n,t,r){var e=o(n);2===e?n.set(t,r):3===e?(n.delete(t),n.add(r)):n[t]=r;}function c(n,t){return n===t?0!==n||1/n==1/t:n!=n&&t!=t}function s(n){return X&&n instanceof Map}function v(n){return q&&n instanceof Set}function p(n){return n.o||n.t}function l(n){if(Array.isArray(n))return Array.prototype.slice.call(n);var t=nn(n);delete t[Q];for(var r=Z(t),e=0;e<r.length;e++){var i=r[e],o=t[i];!1===o.writable&&(o.writable=!0,o.configurable=!0),(o.get||o.set)&&(t[i]={configurable:!0,writable:!0,enumerable:o.enumerable,value:n[i]});}return Object.create(Object.getPrototypeOf(n),t)}function d(n,e){return void 0===e&&(e=!1),y(n)||t(n)||!r(n)?n:(o(n)>1&&(n.set=n.add=n.clear=n.delete=h),Object.freeze(n),e&&i(n,(function(n,t){return d(t,!0)}),!0),n)}function h(){n(2);}function y(n){return null==n||"object"!=typeof n||Object.isFrozen(n)}function b(t){var r=tn[t];return r||n(18,t),r}function m(n,t){tn[n]||(tn[n]=t);}function _(){return "production"===process.env.NODE_ENV||U||n(0),U}function j(n,t){t&&(b("Patches"),n.u=[],n.s=[],n.v=t);}function g(n){O(n),n.p.forEach(S),n.p=null;}function O(n){n===U&&(U=n.l);}function w(n){return U={p:[],l:U,h:n,m:!0,_:0}}function S(n){var t=n[Q];0===t.i||1===t.i?t.j():t.g=!0;}function P(t,e){e._=e.p.length;var i=e.p[0],o=void 0!==t&&t!==i;return e.h.O||b("ES5").S(e,t,o),o?(i[Q].P&&(g(e),n(4)),r(t)&&(t=M(e,t),e.l||x(e,t)),e.u&&b("Patches").M(i[Q],t,e.u,e.s)):t=M(e,i,[]),g(e),e.u&&e.v(e.u,e.s),t!==H?t:void 0}function M(n,t,r){if(y(t))return t;var e=t[Q];if(!e)return i(t,(function(i,o){return A(n,e,t,i,o,r)}),!0),t;if(e.A!==n)return t;if(!e.P)return x(n,e.t,!0),e.t;if(!e.I){e.I=!0,e.A._--;var o=4===e.i||5===e.i?e.o=l(e.k):e.o;i(3===e.i?new Set(o):o,(function(t,i){return A(n,e,o,t,i,r)})),x(n,o,!1),r&&n.u&&b("Patches").R(e,r,n.u,n.s);}return e.o}function A(e,i,o,a,c,s){if("production"!==process.env.NODE_ENV&&c===o&&n(5),t(c)){var v=M(e,c,s&&i&&3!==i.i&&!u(i.D,a)?s.concat(a):void 0);if(f(o,a,v),!t(v))return;e.m=!1;}if(r(c)&&!y(c)){if(!e.h.N&&e._<1)return;M(e,c),i&&i.A.l||x(e,c);}}function x(n,t,r){void 0===r&&(r=!1),n.h.N&&n.m&&d(t,r);}function z(n,t){var r=n[Q];return (r?p(r):n)[t]}function I(n,t){if(t in n)for(var r=Object.getPrototypeOf(n);r;){var e=Object.getOwnPropertyDescriptor(r,t);if(e)return e;r=Object.getPrototypeOf(r);}}function E(n){n.P||(n.P=!0,n.l&&E(n.l));}function k(n){n.o||(n.o=l(n.t));}function R(n,t,r){var e=s(t)?b("MapSet").T(t,r):v(t)?b("MapSet").F(t,r):n.O?function(n,t){var r=Array.isArray(n),e={i:r?1:0,A:t?t.A:_(),P:!1,I:!1,D:{},l:t,t:n,k:null,o:null,j:null,C:!1},i=e,o=rn;r&&(i=[e],o=en);var u=Proxy.revocable(i,o),a=u.revoke,f=u.proxy;return e.k=f,e.j=a,f}(t,r):b("ES5").J(t,r);return (r?r.A:_()).p.push(e),e}function D(e){return t(e)||n(22,e),function n(t){if(!r(t))return t;var e,u=t[Q],c=o(t);if(u){if(!u.P&&(u.i<4||!b("ES5").K(u)))return u.t;u.I=!0,e=N(t,c),u.I=!1;}else e=N(t,c);return i(e,(function(t,r){u&&a(u.t,t)===r||f(e,t,n(r));})),3===c?new Set(e):e}(e)}function N(n,t){switch(t){case 2:return new Map(n);case 3:return Array.from(n)}return l(n)}function F(){function e(n){if(!r(n))return n;if(Array.isArray(n))return n.map(e);if(s(n))return new Map(Array.from(n.entries()).map((function(n){return [n[0],e(n[1])]})));if(v(n))return new Set(Array.from(n).map(e));var t=Object.create(Object.getPrototypeOf(n));for(var i in n)t[i]=e(n[i]);return t}function f(n){return t(n)?e(n):n}var c="add";m("Patches",{$:function(t,r){return r.forEach((function(r){for(var i=r.path,u=r.op,f=t,s=0;s<i.length-1;s++)"object"!=typeof(f=a(f,i[s]))&&n(15,i.join("/"));var v=o(f),p=e(r.value),l=i[i.length-1];switch(u){case"replace":switch(v){case 2:return f.set(l,p);case 3:n(16);default:return f[l]=p}case c:switch(v){case 1:return f.splice(l,0,p);case 2:return f.set(l,p);case 3:return f.add(p);default:return f[l]=p}case"remove":switch(v){case 1:return f.splice(l,1);case 2:return f.delete(l);case 3:return f.delete(r.value);default:return delete f[l]}default:n(17,u);}})),t},R:function(n,t,r,e){switch(n.i){case 0:case 4:case 2:return function(n,t,r,e){var o=n.t,s=n.o;i(n.D,(function(n,i){var v=a(o,n),p=a(s,n),l=i?u(o,n)?"replace":c:"remove";if(v!==p||"replace"!==l){var d=t.concat(n);r.push("remove"===l?{op:l,path:d}:{op:l,path:d,value:p}),e.push(l===c?{op:"remove",path:d}:"remove"===l?{op:c,path:d,value:f(v)}:{op:"replace",path:d,value:f(v)});}}));}(n,t,r,e);case 5:case 1:return function(n,t,r,e){var i=n.t,o=n.D,u=n.o;if(u.length<i.length){var a=[u,i];i=a[0],u=a[1];var s=[e,r];r=s[0],e=s[1];}for(var v=0;v<i.length;v++)if(o[v]&&u[v]!==i[v]){var p=t.concat([v]);r.push({op:"replace",path:p,value:f(u[v])}),e.push({op:"replace",path:p,value:f(i[v])});}for(var l=i.length;l<u.length;l++){var d=t.concat([l]);r.push({op:c,path:d,value:f(u[l])});}i.length<u.length&&e.push({op:"replace",path:t.concat(["length"]),value:i.length});}(n,t,r,e);case 3:return function(n,t,r,e){var i=n.t,o=n.o,u=0;i.forEach((function(n){if(!o.has(n)){var i=t.concat([u]);r.push({op:"remove",path:i,value:n}),e.unshift({op:c,path:i,value:n});}u++;})),u=0,o.forEach((function(n){if(!i.has(n)){var o=t.concat([u]);r.push({op:c,path:o,value:n}),e.unshift({op:"remove",path:o,value:n});}u++;}));}(n,t,r,e)}},M:function(n,t,r,e){r.push({op:"replace",path:[],value:t}),e.push({op:"replace",path:[],value:n.t});}});}var G,U,W="undefined"!=typeof Symbol&&"symbol"==typeof Symbol("x"),X="undefined"!=typeof Map,q="undefined"!=typeof Set,B="undefined"!=typeof Proxy&&void 0!==Proxy.revocable&&"undefined"!=typeof Reflect,H=W?Symbol.for("immer-nothing"):((G={})["immer-nothing"]=!0,G),L=W?Symbol.for("immer-draftable"):"__$immer_draftable",Q=W?Symbol.for("immer-state"):"__$immer_state",Y={0:"Illegal state",1:"Immer drafts cannot have computed properties",2:"This object has been frozen and should not be mutated",3:function(n){return "Cannot use a proxy that has been revoked. Did you pass an object from inside an immer function to an async process? "+n},4:"An immer producer returned a new value *and* modified its draft. Either return a new value *or* modify the draft.",5:"Immer forbids circular references",6:"The first or second argument to `produce` must be a function",7:"The third argument to `produce` must be a function or undefined",8:"First argument to `createDraft` must be a plain object, an array, or an immerable object",9:"First argument to `finishDraft` must be a draft returned by `createDraft`",10:"The given draft is already finalized",11:"Object.defineProperty() cannot be used on an Immer draft",12:"Object.setPrototypeOf() cannot be used on an Immer draft",13:"Immer only supports deleting array indices",14:"Immer only supports setting array indices and the 'length' property",15:function(n){return "Cannot apply patch, path doesn't resolve: "+n},16:'Sets cannot have "replace" patches.',17:function(n){return "Unsupported patch operation: "+n},18:function(n){return "The plugin for '"+n+"' has not been loaded into Immer. To enable the plugin, import and call `enable"+n+"()` when initializing your application."},20:"Cannot use proxies if Proxy, Proxy.revocable or Reflect are not available",21:function(n){return "produce can only be called on things that are draftable: plain objects, arrays, Map, Set or classes that are marked with '[immerable]: true'. Got '"+n+"'"},22:function(n){return "'current' expects a draft, got: "+n},23:function(n){return "'original' expects a draft, got: "+n}},Z="undefined"!=typeof Reflect&&Reflect.ownKeys?Reflect.ownKeys:void 0!==Object.getOwnPropertySymbols?function(n){return Object.getOwnPropertyNames(n).concat(Object.getOwnPropertySymbols(n))}:Object.getOwnPropertyNames,nn=Object.getOwnPropertyDescriptors||function(n){var t={};return Z(n).forEach((function(r){t[r]=Object.getOwnPropertyDescriptor(n,r);})),t},tn={},rn={get:function(n,t){if(t===Q)return n;var e=p(n);if(!u(e,t))return function(n,t,r){var e,i=I(t,r);return i?"value"in i?i.value:null===(e=i.get)||void 0===e?void 0:e.call(n.k):void 0}(n,e,t);var i=e[t];return n.I||!r(i)?i:i===z(n.t,t)?(k(n),n.o[t]=R(n.A.h,i,n)):i},has:function(n,t){return t in p(n)},ownKeys:function(n){return Reflect.ownKeys(p(n))},set:function(n,t,r){var e=I(p(n),t);if(null==e?void 0:e.set)return e.set.call(n.k,r),!0;if(!n.P){var i=z(p(n),t),o=null==i?void 0:i[Q];if(o&&o.t===r)return n.o[t]=r,n.D[t]=!1,!0;if(c(r,i)&&(void 0!==r||u(n.t,t)))return !0;k(n),E(n);}return n.o[t]=r,n.D[t]=!0,!0},deleteProperty:function(n,t){return void 0!==z(n.t,t)||t in n.t?(n.D[t]=!1,k(n),E(n)):delete n.D[t],n.o&&delete n.o[t],!0},getOwnPropertyDescriptor:function(n,t){var r=p(n),e=Reflect.getOwnPropertyDescriptor(r,t);return e?{writable:!0,configurable:1!==n.i||"length"!==t,enumerable:e.enumerable,value:r[t]}:e},defineProperty:function(){n(11);},getPrototypeOf:function(n){return Object.getPrototypeOf(n.t)},setPrototypeOf:function(){n(12);}},en={};i(rn,(function(n,t){en[n]=function(){return arguments[0]=arguments[0][0],t.apply(this,arguments)};})),en.deleteProperty=function(t,r){return "production"!==process.env.NODE_ENV&&isNaN(parseInt(r))&&n(13),rn.deleteProperty.call(this,t[0],r)},en.set=function(t,r,e){return "production"!==process.env.NODE_ENV&&"length"!==r&&isNaN(parseInt(r))&&n(14),rn.set.call(this,t[0],r,e,t[0])};var on=function(){function e(n){this.O=B,this.N=!0,"boolean"==typeof(null==n?void 0:n.useProxies)&&this.setUseProxies(n.useProxies),"boolean"==typeof(null==n?void 0:n.autoFreeze)&&this.setAutoFreeze(n.autoFreeze),this.produce=this.produce.bind(this),this.produceWithPatches=this.produceWithPatches.bind(this);}var i=e.prototype;return i.produce=function(t,e,i){if("function"==typeof t&&"function"!=typeof e){var o=e;e=t;var u=this;return function(n){var t=this;void 0===n&&(n=o);for(var r=arguments.length,i=Array(r>1?r-1:0),a=1;a<r;a++)i[a-1]=arguments[a];return u.produce(n,(function(n){var r;return (r=e).call.apply(r,[t,n].concat(i))}))}}var a;if("function"!=typeof e&&n(6),void 0!==i&&"function"!=typeof i&&n(7),r(t)){var f=w(this),c=R(this,t,void 0),s=!0;try{a=e(c),s=!1;}finally{s?g(f):O(f);}return "undefined"!=typeof Promise&&a instanceof Promise?a.then((function(n){return j(f,i),P(n,f)}),(function(n){throw g(f),n})):(j(f,i),P(a,f))}if(!t||"object"!=typeof t){if((a=e(t))===H)return;return void 0===a&&(a=t),this.N&&d(a,!0),a}n(21,t);},i.produceWithPatches=function(n,t){var r,e,i=this;return "function"==typeof n?function(t){for(var r=arguments.length,e=Array(r>1?r-1:0),o=1;o<r;o++)e[o-1]=arguments[o];return i.produceWithPatches(t,(function(t){return n.apply(void 0,[t].concat(e))}))}:[this.produce(n,t,(function(n,t){r=n,e=t;})),r,e]},i.createDraft=function(e){r(e)||n(8),t(e)&&(e=D(e));var i=w(this),o=R(this,e,void 0);return o[Q].C=!0,O(i),o},i.finishDraft=function(t,r){var e=t&&t[Q];"production"!==process.env.NODE_ENV&&(e&&e.C||n(9),e.I&&n(10));var i=e.A;return j(i,r),P(void 0,i)},i.setAutoFreeze=function(n){this.N=n;},i.setUseProxies=function(t){t&&!B&&n(20),this.O=t;},i.applyPatches=function(n,r){var e;for(e=r.length-1;e>=0;e--){var i=r[e];if(0===i.path.length&&"replace"===i.op){n=i.value;break}}var o=b("Patches").$;return t(n)?o(n,r):this.produce(n,(function(n){return o(n,r.slice(e+1))}))},e}(),un=new on,fn=un.produceWithPatches.bind(un),cn=un.setAutoFreeze.bind(un),sn=un.setUseProxies.bind(un),vn=un.applyPatches.bind(un),pn=un.createDraft.bind(un),ln=un.finishDraft.bind(un);

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn) {
  var module = { exports: {} };
	return fn(module, module.exports), module.exports;
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

// -------- PROTOTYPE EXTENSIONS -------- //

/**
 * Return true if array has ALL of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAll = function(...items) {
  return items.every((i) => this.includes(i))
};

/**
 * Return true if array has ANY of the items
 * @param  {...any} items - One or more strings
 */
Array.prototype.hasAny = function(...items) {
  return items.some((i) => this.includes(i))
};

/**
 * Return true if string includes any of the items.
 * E.g. Returns true if item is `-span` and string is `text-span`
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAny = function(...items) {
  return items.some((i) => this.includes(i))
};

/**
 * Return true if string includes ALL of the items.
 * E.g. Returns true if string is "reference-full" and items
 * are "reference" and "full"
 * @param  {...any} items - One or more strings
 */
String.prototype.includesAll = function(...items) {
  return items.every((i) => this.includes(i))
};

/**
 * Return true if string equals any of the items.
 * E.g. Returns true if item is `-span` and string is `text-span`
 * @param  {...any} items - One or more strings
 */
String.prototype.equalsAny = function(...items) {
  return items.some((i) => this === i)
};

/**
 * Return first character of string
 */
String.prototype.firstChar = function() {
  return this.charAt(0)
};

/**
 * Return last character of string
 */
String.prototype.lastChar = function() {
  return this.charAt(this.length - 1)
};

// -------- COMPARE PATCHES -------- //

/**
 * Check if state property has changed by comparing Immer patches. And (optionally) if property now equals a specified value. For each patch, check if `path` array contains specified `props`, and if `value` value equals specified `toValue`.
 * @param {*} props - Either a string, or an array (for more precision).
 * @param {*} [toValue] - Optional value to check prop against
 */
function stateHasChanged(patches, props, toValue = '') {
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

/**
 * Compare two objects and return `true` if they differ.
 * @param {*} objA 
 * @param {*} objB 
 */
function objHasChanged(objA, objB) {
  return !deepEql(objA, objB)
}

/**
 * Set initial theme values
 * @param {*} initialColors 
 */
function init$1(initialState, initialColors) {
  
  // Set initial values
  setCSSVariables(initialColors.colors);
  setEditorThemeStylesheet(initialState.theme.editorTheme);
}

async function updateTheme(newState, patches) {
  const darkModeChanged = stateHasChanged(patches, ["darkMode"]);
  const themeChanged = stateHasChanged(patches, "theme");
  
  if (darkModeChanged || themeChanged) {
    const observeThemeOverrides = window.id !== 'preferences';
    const { colors } = await window.api.invoke('getColors', observeThemeOverrides);
    setCSSVariables(colors);
  }

  if (themeChanged) {
    setEditorThemeStylesheet(newState.theme.editorTheme);
  }
}


/**
 * Set CSS variables on the `body` element
 * @param {*} colors 
 */
function setCSSVariables(colors) {
  for (const [varName, rgbaHex] of Object.entries(colors)) {
    document.body.style.setProperty(`--${varName}`, rgbaHex);
  }
}

/**
 * Set `editor-theme` stylesheet href in `index.html`
 * E.g. If editor theme name is 'solarized', then stylesheet 
 * href is './styles/themes/solarized/solarized.css'.
 */
function setEditorThemeStylesheet(themeName) {
  const stylesheet = document.getElementById('editor-theme');
  const url = `./styles/editorThemes/${themeName}.css`;
  stylesheet.setAttribute('href', url);
}

F(); // Required by immer

// Svelte stores:
// These are accessed by Svelte components.
const state = writable({});
const isWindowFocused = writable(false);
const isMetaKeyDown = writable(false);
const project = writable({});
const sidebar = writable({});
const markdownOptions = writable({});

// Current state as JS object:
// This may seem redundant (why not access state store?, but it's here for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
let stateAsObject = {};

// Copy of the previous state, so we can check for changes
let oldState = {}; 

/**
 * Set Svelte stores from `stateAsObject`.
 */
function setStores() {
   
  // Set `state` store
  state.set(stateAsObject);

  // Set `isWindowFocused` store
  isWindowFocused.set(stateAsObject.focusedWindowId == window.id);

  // Set isMetaKeyDown false when window is not focused
  if (stateAsObject.focusedWindowId !== window.id) {
    isMetaKeyDown.set(false);
  }

  // Set `project` and `sidebar` stores, if this is NOT the prefs window.
  if (window.id !== 'preferences') {
    const proj = stateAsObject.projects.byId[window.id];
    project.set(proj);
    sidebar.set(proj.sidebar);
  }

  const markdownOptionsHaveChanged = objHasChanged(oldState.markdown, stateAsObject.markdown);
  if (markdownOptionsHaveChanged) {
    markdownOptions.set(stateAsObject.markdown);
  }
}

function updateFromPatches(patches) {

  // Update stateAsObject
  oldState = {...stateAsObject};
  stateAsObject = vn(stateAsObject, patches);

  // Update `window.state`
  window.state = stateAsObject;

  // Update stores
  setStores();

  // Update theme values
  updateTheme(stateAsObject, patches);
}


/**
 * Set initial value of stores and `stateAsObject`
 */
function init$2(initialState) {

  // Create listeners for changes
  window.api.receive("statePatchesFromMain", updateFromPatches);

  // Set window.id. Retreive value from url params.
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  window.id = urlParams.get('id');

  // Set initial state values
  stateAsObject = initialState;
  setStores();

  // Expose stateAsObject on window
  window.state = stateAsObject;

  // Listen for metakey presses
  document.addEventListener('keydown', (evt) => {
    if (evt.metaKey) {
      isMetaKeyDown.set(true);
    }
  });

  document.addEventListener('keyup', (evt) => {
    isMetaKeyDown.set(false);
  });

  
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


/**
 * For the given array of values, set the margin on the node (in px).
 * @param {*} values - Array of values. Same format as normal css values. E.g. '5px 0' or '100%'.
 */
function setSize(node, props) {

  function setStyles({ width, height, margin, padding }) {
    node.style.width = width;
    node.style.height = height;
    node.style.margin = margin;
    node.style.padding = padding;  
  }

  setStyles(props);

  return {
    update(newProps) {
      setStyles(newProps);
    },
  };
}

/* src/js/renderer/component/ui/Checkbox.svelte generated by Svelte v3.30.1 */
const file = "src/js/renderer/component/ui/Checkbox.svelte";

function add_css() {
	var style = element("style");
	style.id = "svelte-96hgg3-style";
	style.textContent = "@keyframes svelte-96hgg3-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}.checkbox.svelte-96hgg3.svelte-96hgg3.svelte-96hgg3{display:inline-flex;vertical-align:top;gap:0 5px;min-height:20px}.checkbox.svelte-96hgg3 .input.svelte-96hgg3.svelte-96hgg3{display:flex}.checkbox.svelte-96hgg3 input.svelte-96hgg3.svelte-96hgg3{opacity:0;width:0;height:0;margin:0}.checkbox.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{display:grid;place-items:center;transform:translate(0, 3px);width:14px;height:14px;border-radius:3px}.checkbox.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::before{content:\"\";-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:100%;height:100%;transform:translate(0, 0.5px);-webkit-mask-size:10px;-webkit-mask-image:var(--img-checkmark-heavy)}.checkbox.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::after{content:\"\";position:absolute;border-radius:inherit;top:0;left:0;width:100%;height:100%}.checkbox.svelte-96hgg3 .label.svelte-96hgg3.svelte-96hgg3{font-family:system-ui;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;color:var(--labelColor);transform:translate(0, 3px);user-select:none}.compact.checkbox.svelte-96hgg3.svelte-96hgg3.svelte-96hgg3{gap:0 4px;min-height:16px}.compact.checkbox.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{width:12px;height:12px;border-radius:2.5px;transform:translate(0, 2px)}.compact.checkbox.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::before{-webkit-mask-size:8px !important;transform:translate(0, 0) !important}.compact.checkbox.svelte-96hgg3 .label.svelte-96hgg3.svelte-96hgg3{font-family:system-ui;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0px;transform:translate(0, 1.5px)}@media(prefers-color-scheme: dark){.control.svelte-96hgg3.svelte-96hgg3.svelte-96hgg3{background:linear-gradient(rgba(255, 255, 255, 0.27), rgba(255, 255, 255, 0.38)), var(--buttonBackgroundColor);box-shadow:inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.15)}}@media(prefers-color-scheme: light){.control.svelte-96hgg3.svelte-96hgg3.svelte-96hgg3{background:var(--buttonBackgroundColor);box-shadow:inset 0 1.5px 1px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 0.5px rgba(0, 0, 0, 0.2)}}.control.svelte-96hgg3.svelte-96hgg3.svelte-96hgg3::before{opacity:0}.checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{background:linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)), var(--darkerControlAccentColor)}@media(prefers-color-scheme: dark){.checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{box-shadow:inset 0 0.5px 0 0 rgba(255, 255, 255, 0.3), 0 0 0 0.5px rgba(0, 0, 0, 0.2)}}@media(prefers-color-scheme: light){.checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{box-shadow:none}}.checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::before{background:white;opacity:1}@media(prefers-color-scheme: dark){.checkbox.svelte-96hgg3:not(.disabled):not(.checked) input.svelte-96hgg3:active+.control.svelte-96hgg3{filter:brightness(1.25)}}@media(prefers-color-scheme: light){.checkbox.svelte-96hgg3:not(.disabled):not(.checked) input.svelte-96hgg3:active+.control.svelte-96hgg3{filter:brightness(0.95)}}@media(prefers-color-scheme: dark){.checkbox:not(.disabled).checked.svelte-96hgg3 input.svelte-96hgg3:active+.control.svelte-96hgg3{filter:brightness(1.25)}}@media(prefers-color-scheme: light){.checkbox:not(.disabled).checked.svelte-96hgg3 input.svelte-96hgg3:active+.control.svelte-96hgg3{background:linear-gradient(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.15)), linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)), var(--darkerControlAccentColor)}}.disabled.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{opacity:0.6}.disabled.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::before{opacity:0.5}@media(prefers-color-scheme: dark){.disabled.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{background:linear-gradient(rgba(255, 255, 255, 0.27), rgba(255, 255, 255, 0.38)), var(--buttonBackgroundColor);box-shadow:inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.15)}}@media(prefers-color-scheme: light){.disabled.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{background:var(--buttonBackgroundColor);box-shadow:inset 0 1.5px 1px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 0.5px rgba(0, 0, 0, 0.2)}}.disabled.checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::before{background:var(--labelColor)}.disabled.svelte-96hgg3 .label.svelte-96hgg3.svelte-96hgg3{opacity:0.35}@media(prefers-color-scheme: dark){.checkbox:not(.windowFocused).checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{background:linear-gradient(rgba(255, 255, 255, 0.27), rgba(255, 255, 255, 0.38)), var(--buttonBackgroundColor);box-shadow:inset 0 1px 0 0 rgba(255, 255, 255, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.15)}}@media(prefers-color-scheme: light){.checkbox:not(.windowFocused).checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3{background:var(--buttonBackgroundColor);box-shadow:inset 0 1.5px 1px 0 rgba(0, 0, 0, 0.1), inset 0 0 0 0.5px rgba(0, 0, 0, 0.2)}}.checkbox:not(.windowFocused).checked.svelte-96hgg3 .control.svelte-96hgg3.svelte-96hgg3::before{background:var(--labelColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hlY2tib3guc3ZlbHRlIiwic291cmNlcyI6WyJDaGVja2JveC5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkIH0gZnJvbSBcIi4uLy4uL1N0YXRlTWFuYWdlclwiO1xuICBpbXBvcnQgeyBzZXRTaXplIH0gZnJvbSBcIi4vYWN0aW9uc1wiO1xuICBleHBvcnQgbGV0IGxhYmVsID0gJ0xhYmVsJ1xuICBleHBvcnQgbGV0IGNvbXBhY3QgPSBmYWxzZVxuICBleHBvcnQgbGV0IGNoZWNrZWQgPSBmYWxzZVxuICBleHBvcnQgbGV0IGRpc2FibGVkID0gZmFsc2VcbiAgZXhwb3J0IGxldCBtYXJnaW4gPSAnMCdcbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAyMHB4IHRyYW5zcGFyZW50LCAwIDAgMCAyMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCA0cHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KSwgMCAwIDAgNHB4IHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvcik7XG4gIH1cbn1cbi5jaGVja2JveCB7XG4gIGRpc3BsYXk6IGlubGluZS1mbGV4O1xuICB2ZXJ0aWNhbC1hbGlnbjogdG9wO1xuICBnYXA6IDAgNXB4O1xuICBtaW4taGVpZ2h0OiAyMHB4O1xufVxuLmNoZWNrYm94IC5pbnB1dCB7XG4gIGRpc3BsYXk6IGZsZXg7XG59XG4uY2hlY2tib3ggaW5wdXQge1xuICBvcGFjaXR5OiAwO1xuICB3aWR0aDogMDtcbiAgaGVpZ2h0OiAwO1xuICBtYXJnaW46IDA7XG59XG4uY2hlY2tib3ggLmNvbnRyb2wge1xuICBkaXNwbGF5OiBncmlkO1xuICBwbGFjZS1pdGVtczogY2VudGVyO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAzcHgpO1xuICB3aWR0aDogMTRweDtcbiAgaGVpZ2h0OiAxNHB4O1xuICBib3JkZXItcmFkaXVzOiAzcHg7XG59XG4uY2hlY2tib3ggLmNvbnRyb2w6OmJlZm9yZSB7XG4gIGNvbnRlbnQ6IFwiXCI7XG4gIC13ZWJraXQtbWFzay1zaXplOiBjb250YWluO1xuICAtd2Via2l0LW1hc2stcG9zaXRpb246IGNlbnRlcjtcbiAgLXdlYmtpdC1tYXNrLXJlcGVhdDogbm8tcmVwZWF0O1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwLjVweCk7XG4gIC13ZWJraXQtbWFzay1zaXplOiAxMHB4O1xuICAtd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLWltZy1jaGVja21hcmstaGVhdnkpO1xufVxuLmNoZWNrYm94IC5jb250cm9sOjphZnRlciB7XG4gIGNvbnRlbnQ6IFwiXCI7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgYm9yZGVyLXJhZGl1czogaW5oZXJpdDtcbiAgdG9wOiAwO1xuICBsZWZ0OiAwO1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiAxMDAlO1xufVxuLmNoZWNrYm94IC5sYWJlbCB7XG4gIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTNweDtcbiAgbGluZS1oZWlnaHQ6IDE1cHg7XG4gIGxldHRlci1zcGFjaW5nOiAtMC4wOHB4O1xuICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDNweCk7XG4gIHVzZXItc2VsZWN0OiBub25lO1xufVxuXG4uY29tcGFjdC5jaGVja2JveCB7XG4gIGdhcDogMCA0cHg7XG4gIG1pbi1oZWlnaHQ6IDE2cHg7XG59XG4uY29tcGFjdC5jaGVja2JveCAuY29udHJvbCB7XG4gIHdpZHRoOiAxMnB4O1xuICBoZWlnaHQ6IDEycHg7XG4gIGJvcmRlci1yYWRpdXM6IDIuNXB4O1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAycHgpO1xufVxuLmNvbXBhY3QuY2hlY2tib3ggLmNvbnRyb2w6OmJlZm9yZSB7XG4gIC13ZWJraXQtbWFzay1zaXplOiA4cHggIWltcG9ydGFudDtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMCkgIWltcG9ydGFudDtcbn1cbi5jb21wYWN0LmNoZWNrYm94IC5sYWJlbCB7XG4gIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbGluZS1oZWlnaHQ6IDEzcHg7XG4gIGxldHRlci1zcGFjaW5nOiAwcHg7XG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDEuNXB4KTtcbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAuY29udHJvbCB7XG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNyksIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4zOCkpLCB2YXIoLS1idXR0b25CYWNrZ3JvdW5kQ29sb3IpO1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMXB4IDAgMCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMTUpLCAwIDAgMCAwLjVweCByZ2JhKDAsIDAsIDAsIDAuMTUpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAuY29udHJvbCB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tYnV0dG9uQmFja2dyb3VuZENvbG9yKTtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDEuNXB4IDFweCAwIHJnYmEoMCwgMCwgMCwgMC4xKSwgaW5zZXQgMCAwIDAgMC41cHggcmdiYSgwLCAwLCAwLCAwLjIpO1xuICB9XG59XG4uY29udHJvbDo6YmVmb3JlIHtcbiAgb3BhY2l0eTogMDtcbn1cblxuLmNoZWNrZWQgLmNvbnRyb2wge1xuICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQocmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KSwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwKSksIHZhcigtLWRhcmtlckNvbnRyb2xBY2NlbnRDb2xvcik7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7XG4gIC5jaGVja2VkIC5jb250cm9sIHtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDAuNXB4IDAgMCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMyksIDAgMCAwIDAuNXB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLmNoZWNrZWQgLmNvbnRyb2wge1xuICAgIGJveC1zaGFkb3c6IG5vbmU7XG4gIH1cbn1cbi5jaGVja2VkIC5jb250cm9sOjpiZWZvcmUge1xuICBiYWNrZ3JvdW5kOiB3aGl0ZTtcbiAgb3BhY2l0eTogMTtcbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAuY2hlY2tib3g6bm90KC5kaXNhYmxlZCk6bm90KC5jaGVja2VkKSBpbnB1dDphY3RpdmUgKyAuY29udHJvbCB7XG4gICAgZmlsdGVyOiBicmlnaHRuZXNzKDEuMjUpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAuY2hlY2tib3g6bm90KC5kaXNhYmxlZCk6bm90KC5jaGVja2VkKSBpbnB1dDphY3RpdmUgKyAuY29udHJvbCB7XG4gICAgZmlsdGVyOiBicmlnaHRuZXNzKDAuOTUpO1xuICB9XG59XG5cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLmNoZWNrYm94Om5vdCguZGlzYWJsZWQpLmNoZWNrZWQgaW5wdXQ6YWN0aXZlICsgLmNvbnRyb2wge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygxLjI1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLmNoZWNrYm94Om5vdCguZGlzYWJsZWQpLmNoZWNrZWQgaW5wdXQ6YWN0aXZlICsgLmNvbnRyb2wge1xuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudChyZ2JhKDAsIDAsIDAsIDAuMTUpLCByZ2JhKDAsIDAsIDAsIDAuMTUpKSwgbGluZWFyLWdyYWRpZW50KHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSksIHJnYmEoMjU1LCAyNTUsIDI1NSwgMCkpLCB2YXIoLS1kYXJrZXJDb250cm9sQWNjZW50Q29sb3IpO1xuICB9XG59XG5cbi5kaXNhYmxlZCAuY29udHJvbCB7XG4gIG9wYWNpdHk6IDAuNjtcbn1cbi5kaXNhYmxlZCAuY29udHJvbDo6YmVmb3JlIHtcbiAgb3BhY2l0eTogMC41O1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAuZGlzYWJsZWQgLmNvbnRyb2wge1xuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudChyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjcpLCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMzgpKSwgdmFyKC0tYnV0dG9uQmFja2dyb3VuZENvbG9yKTtcbiAgICBib3gtc2hhZG93OiBpbnNldCAwIDFweCAwIDAgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjE1KSwgMCAwIDAgMC41cHggcmdiYSgwLCAwLCAwLCAwLjE1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLmRpc2FibGVkIC5jb250cm9sIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1idXR0b25CYWNrZ3JvdW5kQ29sb3IpO1xuICAgIGJveC1zaGFkb3c6IGluc2V0IDAgMS41cHggMXB4IDAgcmdiYSgwLCAwLCAwLCAwLjEpLCBpbnNldCAwIDAgMCAwLjVweCByZ2JhKDAsIDAsIDAsIDAuMik7XG4gIH1cbn1cblxuLmRpc2FibGVkLmNoZWNrZWQgLmNvbnRyb2w6OmJlZm9yZSB7XG4gIGJhY2tncm91bmQ6IHZhcigtLWxhYmVsQ29sb3IpO1xufVxuXG4uZGlzYWJsZWQgLmxhYmVsIHtcbiAgb3BhY2l0eTogMC4zNTtcbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAuY2hlY2tib3g6bm90KC53aW5kb3dGb2N1c2VkKS5jaGVja2VkIC5jb250cm9sIHtcbiAgICBiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQocmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI3KSwgcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjM4KSksIHZhcigtLWJ1dHRvbkJhY2tncm91bmRDb2xvcik7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAxcHggMCAwIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xNSksIDAgMCAwIDAuNXB4IHJnYmEoMCwgMCwgMCwgMC4xNSk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC5jaGVja2JveDpub3QoLndpbmRvd0ZvY3VzZWQpLmNoZWNrZWQgLmNvbnRyb2wge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWJ1dHRvbkJhY2tncm91bmRDb2xvcik7XG4gICAgYm94LXNoYWRvdzogaW5zZXQgMCAxLjVweCAxcHggMCByZ2JhKDAsIDAsIDAsIDAuMSksIGluc2V0IDAgMCAwIDAuNXB4IHJnYmEoMCwgMCwgMCwgMC4yKTtcbiAgfVxufVxuLmNoZWNrYm94Om5vdCgud2luZG93Rm9jdXNlZCkuY2hlY2tlZCAuY29udHJvbDo6YmVmb3JlIHtcbiAgYmFja2dyb3VuZDogdmFyKC0tbGFiZWxDb2xvcik7XG59PC9zdHlsZT5cblxuPGxhYmVsIFxuICBjbGFzcz1cImNoZWNrYm94XCIgXG4gIGNsYXNzOmNvbXBhY3QgXG4gIGNsYXNzOndpbmRvd0ZvY3VzZWQ9eyRpc1dpbmRvd0ZvY3VzZWR9IFxuICBjbGFzczpkaXNhYmxlZFxuICBjbGFzczpjaGVja2VkXG4gIHVzZTpzZXRTaXplPXt7bWFyZ2lufX1cbiAgb246Y2xpY2s+XG4gIDxzcGFuIGNsYXNzPVwiaW5wdXRcIj5cbiAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIge2Rpc2FibGVkfSB7Y2hlY2tlZH0gLz5cbiAgICA8c3BhbiBjbGFzcz1cImNvbnRyb2xcIj48L3NwYW4+XG4gIDwvc3Bhbj5cbiAgPHNwYW4gY2xhc3M9XCJsYWJlbFwiPntsYWJlbH08L3NwYW4+XG48L2xhYmVsPiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFVd0IsV0FBVyx5QkFBWSxDQUFDLEFBQzlDLElBQUksQUFBQyxDQUFDLEFBQ0osVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxBQUM1RCxDQUFDLEFBQ0QsRUFBRSxBQUFDLENBQUMsQUFDRixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxBQUN0RixDQUFDLEFBQ0gsQ0FBQyxBQUNELFNBQVMsMENBQUMsQ0FBQyxBQUNULE9BQU8sQ0FBRSxXQUFXLENBQ3BCLGNBQWMsQ0FBRSxHQUFHLENBQ25CLEdBQUcsQ0FBRSxDQUFDLENBQUMsR0FBRyxDQUNWLFVBQVUsQ0FBRSxJQUFJLEFBQ2xCLENBQUMsQUFDRCx1QkFBUyxDQUFDLE1BQU0sNEJBQUMsQ0FBQyxBQUNoQixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFDRCx1QkFBUyxDQUFDLEtBQUssNEJBQUMsQ0FBQyxBQUNmLE9BQU8sQ0FBRSxDQUFDLENBQ1YsS0FBSyxDQUFFLENBQUMsQ0FDUixNQUFNLENBQUUsQ0FBQyxDQUNULE1BQU0sQ0FBRSxDQUFDLEFBQ1gsQ0FBQyxBQUNELHVC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 */";
	append_dev(document.head, style);
}

function create_fragment(ctx) {
	let label_1;
	let span1;
	let input;
	let t0;
	let span0;
	let t1;
	let span2;
	let t2;
	let setSize_action;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			label_1 = element("label");
			span1 = element("span");
			input = element("input");
			t0 = space();
			span0 = element("span");
			t1 = space();
			span2 = element("span");
			t2 = text(/*label*/ ctx[0]);
			attr_dev(input, "type", "checkbox");
			input.disabled = /*disabled*/ ctx[3];
			input.checked = /*checked*/ ctx[2];
			attr_dev(input, "class", "svelte-96hgg3");
			add_location(input, file, 203, 4, 5116);
			attr_dev(span0, "class", "control svelte-96hgg3");
			add_location(span0, file, 204, 4, 5167);
			attr_dev(span1, "class", "input svelte-96hgg3");
			add_location(span1, file, 202, 2, 5091);
			attr_dev(span2, "class", "label svelte-96hgg3");
			add_location(span2, file, 206, 2, 5209);
			attr_dev(label_1, "class", "checkbox svelte-96hgg3");
			toggle_class(label_1, "compact", /*compact*/ ctx[1]);
			toggle_class(label_1, "windowFocused", /*$isWindowFocused*/ ctx[5]);
			toggle_class(label_1, "disabled", /*disabled*/ ctx[3]);
			toggle_class(label_1, "checked", /*checked*/ ctx[2]);
			add_location(label_1, file, 194, 0, 4932);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, label_1, anchor);
			append_dev(label_1, span1);
			append_dev(span1, input);
			append_dev(span1, t0);
			append_dev(span1, span0);
			append_dev(label_1, t1);
			append_dev(label_1, span2);
			append_dev(span2, t2);

			if (!mounted) {
				dispose = [
					action_destroyer(setSize_action = setSize.call(null, label_1, { margin: /*margin*/ ctx[4] })),
					listen_dev(label_1, "click", /*click_handler*/ ctx[6], false, false, false)
				];

				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*disabled*/ 8) {
				prop_dev(input, "disabled", /*disabled*/ ctx[3]);
			}

			if (dirty & /*checked*/ 4) {
				prop_dev(input, "checked", /*checked*/ ctx[2]);
			}

			if (dirty & /*label*/ 1) set_data_dev(t2, /*label*/ ctx[0]);
			if (setSize_action && is_function(setSize_action.update) && dirty & /*margin*/ 16) setSize_action.update.call(null, { margin: /*margin*/ ctx[4] });

			if (dirty & /*compact*/ 2) {
				toggle_class(label_1, "compact", /*compact*/ ctx[1]);
			}

			if (dirty & /*$isWindowFocused*/ 32) {
				toggle_class(label_1, "windowFocused", /*$isWindowFocused*/ ctx[5]);
			}

			if (dirty & /*disabled*/ 8) {
				toggle_class(label_1, "disabled", /*disabled*/ ctx[3]);
			}

			if (dirty & /*checked*/ 4) {
				toggle_class(label_1, "checked", /*checked*/ ctx[2]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(label_1);
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

function instance($$self, $$props, $$invalidate) {
	let $isWindowFocused;
	validate_store(isWindowFocused, "isWindowFocused");
	component_subscribe($$self, isWindowFocused, $$value => $$invalidate(5, $isWindowFocused = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Checkbox", slots, []);
	let { label = "Label" } = $$props;
	let { compact = false } = $$props;
	let { checked = false } = $$props;
	let { disabled = false } = $$props;
	let { margin = "0" } = $$props;
	const writable_props = ["label", "compact", "checked", "disabled", "margin"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Checkbox> was created with unknown prop '${key}'`);
	});

	function click_handler(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("compact" in $$props) $$invalidate(1, compact = $$props.compact);
		if ("checked" in $$props) $$invalidate(2, checked = $$props.checked);
		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
		if ("margin" in $$props) $$invalidate(4, margin = $$props.margin);
	};

	$$self.$capture_state = () => ({
		isWindowFocused,
		setSize,
		label,
		compact,
		checked,
		disabled,
		margin,
		$isWindowFocused
	});

	$$self.$inject_state = $$props => {
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("compact" in $$props) $$invalidate(1, compact = $$props.compact);
		if ("checked" in $$props) $$invalidate(2, checked = $$props.checked);
		if ("disabled" in $$props) $$invalidate(3, disabled = $$props.disabled);
		if ("margin" in $$props) $$invalidate(4, margin = $$props.margin);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [label, compact, checked, disabled, margin, $isWindowFocused, click_handler];
}

class Checkbox extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-96hgg3-style")) add_css();

		init(this, options, instance, create_fragment, safe_not_equal, {
			label: 0,
			compact: 1,
			checked: 2,
			disabled: 3,
			margin: 4
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Checkbox",
			options,
			id: create_fragment.name
		});
	}

	get label() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get compact() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set compact(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get checked() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set checked(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get disabled() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set disabled(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get margin() {
		throw new Error("<Checkbox>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set margin(value) {
		throw new Error("<Checkbox>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/Description.svelte generated by Svelte v3.30.1 */
const file$1 = "src/js/renderer/component/ui/Description.svelte";

function add_css$1() {
	var style = element("style");
	style.id = "svelte-1unwfsi-style";
	style.textContent = "@keyframes svelte-1unwfsi-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}p.svelte-1unwfsi{font-family:system-ui;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0px;color:var(--secondaryLabelColor);flex-basis:100%}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVzY3JpcHRpb24uc3ZlbHRlIiwic291cmNlcyI6WyJEZXNjcmlwdGlvbi5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgc2V0U2l6ZSB9IGZyb20gXCIuL2FjdGlvbnNcIjtcbiAgZXhwb3J0IGxldCBjb21wYWN0ID0gZmFsc2VcbiAgZXhwb3J0IGxldCBtYXJnaW4gPSAnMCdcbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAyMHB4IHRyYW5zcGFyZW50LCAwIDAgMCAyMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCA0cHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KSwgMCAwIDAgNHB4IHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvcik7XG4gIH1cbn1cbnAge1xuICBmb250LWZhbWlseTogc3lzdGVtLXVpO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMHB4O1xuICBjb2xvcjogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG4gIGZsZXgtYmFzaXM6IDEwMCU7XG59PC9zdHlsZT5cblxuPHAgXG4gIGNsYXNzOmNvbXBhY3RcbiAgdXNlOnNldFNpemU9e3ttYXJnaW59fVxuPlxuICA8c2xvdD48L3Nsb3Q+XG48L3A+XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBTXdCLFdBQVcsMEJBQVksQ0FBQyxBQUM5QyxJQUFJLEFBQUMsQ0FBQyxBQUNKLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDNUQsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksb0JBQW9CLENBQUMsQUFDdEYsQ0FBQyxBQUNILENBQUMsQUFDRCxDQUFDLGVBQUMsQ0FBQyxBQUNELFdBQVcsQ0FBRSxTQUFTLENBQ3RCLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLEdBQUcsQ0FDbkIsS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsQ0FDakMsVUFBVSxDQUFFLElBQUksQUFDbEIsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$1(ctx) {
	let p;
	let setSize_action;
	let current;
	let mounted;
	let dispose;
	const default_slot_template = /*#slots*/ ctx[3].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

	const block = {
		c: function create() {
			p = element("p");
			if (default_slot) default_slot.c();
			attr_dev(p, "class", "svelte-1unwfsi");
			toggle_class(p, "compact", /*compact*/ ctx[0]);
			add_location(p, file$1, 24, 0, 527);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, p, anchor);

			if (default_slot) {
				default_slot.m(p, null);
			}

			current = true;

			if (!mounted) {
				dispose = action_destroyer(setSize_action = setSize.call(null, p, { margin: /*margin*/ ctx[1] }));
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 4) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
				}
			}

			if (setSize_action && is_function(setSize_action.update) && dirty & /*margin*/ 2) setSize_action.update.call(null, { margin: /*margin*/ ctx[1] });

			if (dirty & /*compact*/ 1) {
				toggle_class(p, "compact", /*compact*/ ctx[0]);
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
			if (detaching) detach_dev(p);
			if (default_slot) default_slot.d(detaching);
			mounted = false;
			dispose();
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
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Description", slots, ['default']);
	let { compact = false } = $$props;
	let { margin = "0" } = $$props;
	const writable_props = ["compact", "margin"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Description> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("compact" in $$props) $$invalidate(0, compact = $$props.compact);
		if ("margin" in $$props) $$invalidate(1, margin = $$props.margin);
		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => ({ setSize, compact, margin });

	$$self.$inject_state = $$props => {
		if ("compact" in $$props) $$invalidate(0, compact = $$props.compact);
		if ("margin" in $$props) $$invalidate(1, margin = $$props.margin);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [compact, margin, $$scope, slots];
}

class Description extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1unwfsi-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { compact: 0, margin: 1 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Description",
			options,
			id: create_fragment$1.name
		});
	}

	get compact() {
		throw new Error("<Description>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set compact(value) {
		throw new Error("<Description>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get margin() {
		throw new Error("<Description>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set margin(value) {
		throw new Error("<Description>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

/* src/js/renderer/component/ui/FormRow.svelte generated by Svelte v3.30.1 */
const file$2 = "src/js/renderer/component/ui/FormRow.svelte";

function add_css$2() {
	var style = element("style");
	style.id = "svelte-nuuk4o-style";
	style.textContent = "@keyframes svelte-nuuk4o-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}.row.svelte-nuuk4o.svelte-nuuk4o{display:flex;align-items:center;max-width:var(--maxWidth)}.row.multiLine.svelte-nuuk4o.svelte-nuuk4o{align-items:start}.items.svelte-nuuk4o.svelte-nuuk4o{display:flex;gap:var(--gap);flex-wrap:nowrap;flex-grow:1}.multiLine.svelte-nuuk4o .items.svelte-nuuk4o{flex-wrap:wrap}.leftColumn.svelte-nuuk4o.svelte-nuuk4o{font-family:system-ui;font-weight:normal;font-size:13px;line-height:15px;letter-spacing:-0.08px;user-select:none;flex-basis:var(--leftColumn);text-align:right;color:var(--labelColor);flex-shrink:0;padding-top:var(--labelTopOffset);padding-right:8px;overflow:hidden;white-space:nowrap}.compact.svelte-nuuk4o .leftColumn.svelte-nuuk4o{font-family:system-ui;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0px;padding-top:var(--labelTopOffset);padding-right:5px}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRm9ybVJvdy5zdmVsdGUiLCJzb3VyY2VzIjpbIkZvcm1Sb3cuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGNzcywgc2V0U2l6ZSB9IGZyb20gXCIuL2FjdGlvbnNcIjtcbiAgaW1wb3J0IHsgZmFkZSB9IGZyb20gJ3N2ZWx0ZS90cmFuc2l0aW9uJztcbiAgXG4gIGV4cG9ydCBsZXQgbWF4V2lkdGggPSAnMTAwJSdcbiAgZXhwb3J0IGxldCBsZWZ0Q29sdW1uID0gJycgLy8gJzEwMHB4J1xuICBleHBvcnQgbGV0IGxhYmVsVG9wT2Zmc2V0ID0gJzAnXG4gIGV4cG9ydCBsZXQgbWFyZ2luID0gJzAnXG4gIGV4cG9ydCBsZXQgbXVsdGlMaW5lID0gZmFsc2VcbiAgZXhwb3J0IGxldCBjb21wYWN0ID0gZmFsc2VcbiAgXG4gIC8vIFNldHMgZmxleCBgYWxpZ24taXRlbXNgIHByb3BlcnR5LiBcbiAgLy8gU2V0IHRvICdzdHJldGNoJyAob3IgJ3N0YXJ0Jykgd2hlbiB3ZSB3YW50IHRvIHRvcC1hbGlnbiBsYWJlbHMgXG4gIC8vIGluc2lkZSB0YWxsIG11bHRpLWxpbmUgcm93cy5cbiAgLy8gUGVyOiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9DU1MvYWxpZ24taXRlbXNcbiAgZXhwb3J0IGxldCBhbGlnbkl0ZW1zID0gJ2NlbnRlcicgXG5cbiAgLy8gT3B0aW9uYWxseSBkZWZpbmUgZ2FwIGJldHdlZW4gaXRlbXNcbiAgZXhwb3J0IGxldCBnYXAgPSAnMHB4J1xuICBcbiAgLy8gT3B0aW9uYWxseSBhZGQgYSBsYWJlbCBhbmQgc2V0IGl0cyBzaXplXG4gIGV4cG9ydCBsZXQgbGFiZWwgPSAnJ1xuICBleHBvcnQgbGV0IGxhYmVsV2lkdGggPSAnNDYnXG4gIGV4cG9ydCBsZXQgbGFiZWxNYXJnaW4gPSAnMCdcbiAgXG4gIC8vIEJ5IGFkZGluZyBhbiBvdXRybyBkZWxheSwgd2UgZW5hYmxlIEV4cGFuZGFibGUgY29tcG9uZW50c1xuICAvLyB0aW1lIHRvIGFuaW1hdGUgdGhlaXIgY2xvc2luZy4gSXQncyBoYWNreSwgYnV0IGl0IHdvcmtzLlxuICAvLyBCeSBkZWZhdWx0IGl0J3MgemVybyAobm8gZGVsYXkpLlxuICBleHBvcnQgbGV0IG91dHJvRGVsYXkgPSAwXG4gIGV4cG9ydCBsZXQgb3V0cm9EdXJhdGlvbiA9IDBcblxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+QGtleWZyYW1lcyBzZWxlY3RGaWVsZCB7XG4gIGZyb20ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDIwcHggdHJhbnNwYXJlbnQsIDAgMCAwIDIwcHggdHJhbnNwYXJlbnQ7XG4gIH1cbiAgdG8ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDRweCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpLCAwIDAgMCA0cHggdmFyKC0tY29udHJvbEFjY2VudENvbG9yKTtcbiAgfVxufVxuLnJvdyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1heC13aWR0aDogdmFyKC0tbWF4V2lkdGgpO1xufVxuXG4ucm93Lm11bHRpTGluZSB7XG4gIGFsaWduLWl0ZW1zOiBzdGFydDtcbn1cblxuLml0ZW1zIHtcbiAgZGlzcGxheTogZmxleDtcbiAgZ2FwOiB2YXIoLS1nYXApO1xuICBmbGV4LXdyYXA6IG5vd3JhcDtcbiAgZmxleC1ncm93OiAxO1xufVxuXG4ubXVsdGlMaW5lIC5pdGVtcyB7XG4gIGZsZXgtd3JhcDogd3JhcDtcbn1cblxuLmxlZnRDb2x1bW4ge1xuICBmb250LWZhbWlseTogc3lzdGVtLXVpO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMDhweDtcbiAgdXNlci1zZWxlY3Q6IG5vbmU7XG4gIGZsZXgtYmFzaXM6IHZhcigtLWxlZnRDb2x1bW4pO1xuICB0ZXh0LWFsaWduOiByaWdodDtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICBmbGV4LXNocmluazogMDtcbiAgcGFkZGluZy10b3A6IHZhcigtLWxhYmVsVG9wT2Zmc2V0KTtcbiAgcGFkZGluZy1yaWdodDogOHB4O1xuICBvdmVyZmxvdzogaGlkZGVuO1xuICB3aGl0ZS1zcGFjZTogbm93cmFwO1xufVxuXG4uY29tcGFjdCAubGVmdENvbHVtbiB7XG4gIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7XG4gIGZvbnQtd2VpZ2h0OiBub3JtYWw7XG4gIGZvbnQtc2l6ZTogMTFweDtcbiAgbGluZS1oZWlnaHQ6IDEzcHg7XG4gIGxldHRlci1zcGFjaW5nOiAwcHg7XG4gIHBhZGRpbmctdG9wOiB2YXIoLS1sYWJlbFRvcE9mZnNldCk7XG4gIHBhZGRpbmctcmlnaHQ6IDVweDtcbn1cblxuLm5vLXRyYW5zaXRpb24ge1xuICBhbmltYXRpb246IG5vbmUgIWltcG9ydGFudDtcbn08L3N0eWxlPlxuXG48ZGl2IFxuICBjbGFzcz1cInJvd1wiIFxuICB1c2U6c2V0U2l6ZT17e21hcmdpbn19IFxuICB1c2U6Y3NzPXt7bWF4V2lkdGgsIGxlZnRDb2x1bW4sIGxhYmVsVG9wT2Zmc2V0LCBnYXB9fVxuICBjbGFzczptdWx0aUxpbmVcbiAgY2xhc3M6Y29tcGFjdFxuICBvdXQ6ZmFkZXxsb2NhbD17e1xuICAgIGR1cmF0aW9uOiBvdXRyb0R1cmF0aW9uLFxuICAgIGRlbGF5OiBvdXRyb0RlbGF5XG4gIH19XG4+XG4gIHsjaWYgbGVmdENvbHVtbn1cbiAgICA8c3BhbiBjbGFzcz1cImxlZnRDb2x1bW5cIj5cbiAgICAgIHtsYWJlbH1cbiAgICA8L3NwYW4+XG4gIHsvaWZ9XG4gIDxzcGFuIGNsYXNzPVwiaXRlbXNcIj5cbiAgICA8c2xvdD48L3Nsb3Q+XG4gIDwvc3Bhbj5cbjwvZGl2PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFpQ3dCLFdBQVcseUJBQVksQ0FBQyxBQUM5QyxJQUFJLEFBQUMsQ0FBQyxBQUNKLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDNUQsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksb0JBQW9CLENBQUMsQUFDdEYsQ0FBQyxBQUNILENBQUMsQUFDRCxJQUFJLDRCQUFDLENBQUMsQUFDSixPQUFPLENBQUUsSUFBSSxDQUNiLFdBQVcsQ0FBRSxNQUFNLENBQ25CLFNBQVMsQ0FBRSxJQUFJLFVBQVUsQ0FBQyxBQUM1QixDQUFDLEFBRUQsSUFBSSxVQUFVLDRCQUFDLENBQUMsQUFDZCxXQUFXLENBQUUsS0FBSyxBQUNwQixDQUFDLEFBRUQsTUFBTSw0QkFBQyxDQUFDLEFBQ04sT0FBTyxDQUFFLElBQUksQ0FDYixHQUFHLENBQUUsSUFBSSxLQUFLLENBQUMsQ0FDZixTQUFTLENBQUUsTUFBTSxDQUNqQixTQUFTLENBQUUsQ0FBQyxBQUNkLENBQUMsQUFFRCx3QkFBVSxDQUFDLE1BQU0sY0FBQyxDQUFDLEFBQ2pCLFNBQVMsQ0FBRSxJQUFJLEFBQ2pCLENBQUMsQUFFRCxXQUFXLDRCQUFDLENBQUMsQUFDWCxXQUFXLENBQUUsU0FBUyxDQUN0QixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxPQUFPLENBQ3ZCLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFVBQVUsQ0FBRSxJQUFJLFlBQVksQ0FBQyxDQUM3QixVQUFVLENBQUUsS0FBSyxDQUNqQixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQ0FDeEIsV0FBVyxDQUFFLENBQUMsQ0FDZCxXQUFXLENBQUUsSUFBSSxnQkFBZ0IsQ0FBQyxDQUNsQyxhQUFhLENBQUUsR0FBRyxDQUNsQixRQUFRLENBQUUsTUFBTSxDQUNoQixXQUFXLENBQUUsTUFBTSxBQUNyQixDQUFDLEFBRUQsc0JBQVEsQ0FBQyxXQUFXLGNBQUMsQ0FBQyxBQUNwQixXQUFXLENBQUUsU0FBUyxDQUN0QixXQUFXLENBQUUsTUFBTSxDQUNuQixTQUFTLENBQUUsSUFBSSxDQUNmLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLGNBQWMsQ0FBRSxHQUFHLENBQ25CLFdBQVcsQ0FBRSxJQUFJLGdCQUFnQixDQUFDLENBQ2xDLGFBQWEsQ0FBRSxHQUFHLEFBQ3BCLENBQUMifQ== */";
	append_dev(document.head, style);
}

// (105:2) {#if leftColumn}
function create_if_block(ctx) {
	let span;
	let t;

	const block = {
		c: function create() {
			span = element("span");
			t = text(/*label*/ ctx[7]);
			attr_dev(span, "class", "leftColumn svelte-nuuk4o");
			add_location(span, file$2, 105, 4, 2311);
		},
		m: function mount(target, anchor) {
			insert_dev(target, span, anchor);
			append_dev(span, t);
		},
		p: function update(ctx, dirty) {
			if (dirty & /*label*/ 128) set_data_dev(t, /*label*/ ctx[7]);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(span);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block.name,
		type: "if",
		source: "(105:2) {#if leftColumn}",
		ctx
	});

	return block;
}

function create_fragment$2(ctx) {
	let div;
	let t;
	let span;
	let setSize_action;
	let css_action;
	let div_outro;
	let current;
	let mounted;
	let dispose;
	let if_block = /*leftColumn*/ ctx[1] && create_if_block(ctx);
	const default_slot_template = /*#slots*/ ctx[14].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[13], null);

	const block = {
		c: function create() {
			div = element("div");
			if (if_block) if_block.c();
			t = space();
			span = element("span");
			if (default_slot) default_slot.c();
			attr_dev(span, "class", "items svelte-nuuk4o");
			add_location(span, file$2, 109, 2, 2373);
			attr_dev(div, "class", "row svelte-nuuk4o");
			toggle_class(div, "multiLine", /*multiLine*/ ctx[4]);
			toggle_class(div, "compact", /*compact*/ ctx[5]);
			add_location(div, file$2, 93, 0, 2073);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);
			if (if_block) if_block.m(div, null);
			append_dev(div, t);
			append_dev(div, span);

			if (default_slot) {
				default_slot.m(span, null);
			}

			current = true;

			if (!mounted) {
				dispose = [
					action_destroyer(setSize_action = setSize.call(null, div, { margin: /*margin*/ ctx[3] })),
					action_destroyer(css_action = css.call(null, div, {
						maxWidth: /*maxWidth*/ ctx[0],
						leftColumn: /*leftColumn*/ ctx[1],
						labelTopOffset: /*labelTopOffset*/ ctx[2],
						gap: /*gap*/ ctx[6]
					}))
				];

				mounted = true;
			}
		},
		p: function update(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (/*leftColumn*/ ctx[1]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block(ctx);
					if_block.c();
					if_block.m(div, t);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}

			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 8192) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[13], dirty, null, null);
				}
			}

			if (setSize_action && is_function(setSize_action.update) && dirty & /*margin*/ 8) setSize_action.update.call(null, { margin: /*margin*/ ctx[3] });

			if (css_action && is_function(css_action.update) && dirty & /*maxWidth, leftColumn, labelTopOffset, gap*/ 71) css_action.update.call(null, {
				maxWidth: /*maxWidth*/ ctx[0],
				leftColumn: /*leftColumn*/ ctx[1],
				labelTopOffset: /*labelTopOffset*/ ctx[2],
				gap: /*gap*/ ctx[6]
			});

			if (dirty & /*multiLine*/ 16) {
				toggle_class(div, "multiLine", /*multiLine*/ ctx[4]);
			}

			if (dirty & /*compact*/ 32) {
				toggle_class(div, "compact", /*compact*/ ctx[5]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(default_slot, local);
			if (div_outro) div_outro.end(1);
			current = true;
		},
		o: function outro(local) {
			transition_out(default_slot, local);

			if (local) {
				div_outro = create_out_transition(div, fade, {
					duration: /*outroDuration*/ ctx[9],
					delay: /*outroDelay*/ ctx[8]
				});
			}

			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div);
			if (if_block) if_block.d();
			if (default_slot) default_slot.d(detaching);
			if (detaching && div_outro) div_outro.end();
			mounted = false;
			run_all(dispose);
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
	validate_slots("FormRow", slots, ['default']);
	let { maxWidth = "100%" } = $$props;
	let { leftColumn = "" } = $$props; // '100px'
	let { labelTopOffset = "0" } = $$props;
	let { margin = "0" } = $$props;
	let { multiLine = false } = $$props;
	let { compact = false } = $$props;
	let { alignItems = "center" } = $$props;
	let { gap = "0px" } = $$props;
	let { label = "" } = $$props;
	let { labelWidth = "46" } = $$props;
	let { labelMargin = "0" } = $$props;
	let { outroDelay = 0 } = $$props;
	let { outroDuration = 0 } = $$props;

	const writable_props = [
		"maxWidth",
		"leftColumn",
		"labelTopOffset",
		"margin",
		"multiLine",
		"compact",
		"alignItems",
		"gap",
		"label",
		"labelWidth",
		"labelMargin",
		"outroDelay",
		"outroDuration"
	];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FormRow> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("maxWidth" in $$props) $$invalidate(0, maxWidth = $$props.maxWidth);
		if ("leftColumn" in $$props) $$invalidate(1, leftColumn = $$props.leftColumn);
		if ("labelTopOffset" in $$props) $$invalidate(2, labelTopOffset = $$props.labelTopOffset);
		if ("margin" in $$props) $$invalidate(3, margin = $$props.margin);
		if ("multiLine" in $$props) $$invalidate(4, multiLine = $$props.multiLine);
		if ("compact" in $$props) $$invalidate(5, compact = $$props.compact);
		if ("alignItems" in $$props) $$invalidate(10, alignItems = $$props.alignItems);
		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
		if ("label" in $$props) $$invalidate(7, label = $$props.label);
		if ("labelWidth" in $$props) $$invalidate(11, labelWidth = $$props.labelWidth);
		if ("labelMargin" in $$props) $$invalidate(12, labelMargin = $$props.labelMargin);
		if ("outroDelay" in $$props) $$invalidate(8, outroDelay = $$props.outroDelay);
		if ("outroDuration" in $$props) $$invalidate(9, outroDuration = $$props.outroDuration);
		if ("$$scope" in $$props) $$invalidate(13, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => ({
		css,
		setSize,
		fade,
		maxWidth,
		leftColumn,
		labelTopOffset,
		margin,
		multiLine,
		compact,
		alignItems,
		gap,
		label,
		labelWidth,
		labelMargin,
		outroDelay,
		outroDuration
	});

	$$self.$inject_state = $$props => {
		if ("maxWidth" in $$props) $$invalidate(0, maxWidth = $$props.maxWidth);
		if ("leftColumn" in $$props) $$invalidate(1, leftColumn = $$props.leftColumn);
		if ("labelTopOffset" in $$props) $$invalidate(2, labelTopOffset = $$props.labelTopOffset);
		if ("margin" in $$props) $$invalidate(3, margin = $$props.margin);
		if ("multiLine" in $$props) $$invalidate(4, multiLine = $$props.multiLine);
		if ("compact" in $$props) $$invalidate(5, compact = $$props.compact);
		if ("alignItems" in $$props) $$invalidate(10, alignItems = $$props.alignItems);
		if ("gap" in $$props) $$invalidate(6, gap = $$props.gap);
		if ("label" in $$props) $$invalidate(7, label = $$props.label);
		if ("labelWidth" in $$props) $$invalidate(11, labelWidth = $$props.labelWidth);
		if ("labelMargin" in $$props) $$invalidate(12, labelMargin = $$props.labelMargin);
		if ("outroDelay" in $$props) $$invalidate(8, outroDelay = $$props.outroDelay);
		if ("outroDuration" in $$props) $$invalidate(9, outroDuration = $$props.outroDuration);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [
		maxWidth,
		leftColumn,
		labelTopOffset,
		margin,
		multiLine,
		compact,
		gap,
		label,
		outroDelay,
		outroDuration,
		alignItems,
		labelWidth,
		labelMargin,
		$$scope,
		slots
	];
}

class FormRow extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-nuuk4o-style")) add_css$2();

		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
			maxWidth: 0,
			leftColumn: 1,
			labelTopOffset: 2,
			margin: 3,
			multiLine: 4,
			compact: 5,
			alignItems: 10,
			gap: 6,
			label: 7,
			labelWidth: 11,
			labelMargin: 12,
			outroDelay: 8,
			outroDuration: 9
		});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "FormRow",
			options,
			id: create_fragment$2.name
		});
	}

	get maxWidth() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set maxWidth(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get leftColumn() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set leftColumn(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get labelTopOffset() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set labelTopOffset(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get margin() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set margin(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get multiLine() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set multiLine(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get compact() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set compact(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get alignItems() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set alignItems(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get gap() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set gap(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get label() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get labelWidth() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set labelWidth(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get labelMargin() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set labelMargin(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outroDelay() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outroDelay(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get outroDuration() {
		throw new Error("<FormRow>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set outroDuration(value) {
		throw new Error("<FormRow>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/Separator.svelte generated by Svelte v3.30.1 */
const file$3 = "src/js/renderer/component/ui/Separator.svelte";

function add_css$3() {
	var style = element("style");
	style.id = "svelte-m26w37-style";
	style.textContent = "@keyframes svelte-m26w37-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}hr.svelte-m26w37{min-height:1px;border:0;background-color:var(--separatorColor)}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VwYXJhdG9yLnN2ZWx0ZSIsInNvdXJjZXMiOlsiU2VwYXJhdG9yLnN2ZWx0ZSJdLCJzb3VyY2VzQ29udGVudCI6WyI8c2NyaXB0PlxuICBpbXBvcnQgeyBzZXRTaXplIH0gZnJvbSBcIi4vYWN0aW9uc1wiO1xuXG4gIGV4cG9ydCBsZXQgbWFyZ2luID0gJzAnO1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5Aa2V5ZnJhbWVzIHNlbGVjdEZpZWxkIHtcbiAgZnJvbSB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgMjBweCB0cmFuc3BhcmVudCwgMCAwIDAgMjBweCB0cmFuc3BhcmVudDtcbiAgfVxuICB0byB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgNHB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNSksIDAgMCAwIDRweCB2YXIoLS1jb250cm9sQWNjZW50Q29sb3IpO1xuICB9XG59XG5ociB7XG4gIG1pbi1oZWlnaHQ6IDFweDtcbiAgYm9yZGVyOiAwO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zZXBhcmF0b3JDb2xvcik7XG59PC9zdHlsZT5cblxuPGhyIHVzZTpzZXRTaXplPXt7bWFyZ2lufX0gLz4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT3dCLFdBQVcseUJBQVksQ0FBQyxBQUM5QyxJQUFJLEFBQUMsQ0FBQyxBQUNKLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDNUQsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksb0JBQW9CLENBQUMsQUFDdEYsQ0FBQyxBQUNILENBQUMsQUFDRCxFQUFFLGNBQUMsQ0FBQyxBQUNGLFVBQVUsQ0FBRSxHQUFHLENBQ2YsTUFBTSxDQUFFLENBQUMsQ0FDVCxnQkFBZ0IsQ0FBRSxJQUFJLGdCQUFnQixDQUFDLEFBQ3pDLENBQUMifQ== */";
	append_dev(document.head, style);
}

function create_fragment$3(ctx) {
	let hr;
	let setSize_action;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			hr = element("hr");
			attr_dev(hr, "class", "svelte-m26w37");
			add_location(hr, file$3, 21, 0, 408);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, hr, anchor);

			if (!mounted) {
				dispose = action_destroyer(setSize_action = setSize.call(null, hr, { margin: /*margin*/ ctx[0] }));
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (setSize_action && is_function(setSize_action.update) && dirty & /*margin*/ 1) setSize_action.update.call(null, { margin: /*margin*/ ctx[0] });
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
		id: create_fragment$3.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$3($$self, $$props, $$invalidate) {
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Separator", slots, []);
	let { margin = "0" } = $$props;
	const writable_props = ["margin"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Separator> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("margin" in $$props) $$invalidate(0, margin = $$props.margin);
	};

	$$self.$capture_state = () => ({ setSize, margin });

	$$self.$inject_state = $$props => {
		if ("margin" in $$props) $$invalidate(0, margin = $$props.margin);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [margin];
}

class Separator extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-m26w37-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, { margin: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Separator",
			options,
			id: create_fragment$3.name
		});
	}

	get margin() {
		throw new Error("<Separator>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set margin(value) {
		throw new Error("<Separator>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/ToolbarTab.svelte generated by Svelte v3.30.1 */
const file$4 = "src/js/renderer/component/ui/ToolbarTab.svelte";

function add_css$4() {
	var style = element("style");
	style.id = "svelte-x5z8fo-style";
	style.textContent = "@keyframes svelte-x5z8fo-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}.tab.svelte-x5z8fo.svelte-x5z8fo{width:55px;height:45px;border-radius:6px;display:flex;flex-direction:column;align-items:center;overflow:hidden;-webkit-app-region:no-drag}.tab.svelte-x5z8fo .icon.svelte-x5z8fo{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:23px;min-height:21px;margin-top:5px;margin-bottom:2px;pointer-events:none}.tab.svelte-x5z8fo .label.svelte-x5z8fo{font-family:system-ui;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0px;text-align:center;margin:0;padding:0;pointer-events:none}.tab.isWindowFocused.svelte-x5z8fo.svelte-x5z8fo:not(.isSelected){background-color:none}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected) .icon.svelte-x5z8fo{background-color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected) .icon.svelte-x5z8fo{background-color:var(--labelColor);opacity:0.75}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected) .label.svelte-x5z8fo{color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected) .label.svelte-x5z8fo{color:var(--labelColor);opacity:0.75}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-x5z8fo.svelte-x5z8fo:not(.isSelected):hover{background:rgba(255, 255, 255, 0.08)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-x5z8fo.svelte-x5z8fo:not(.isSelected):hover{background:rgba(0, 0, 0, 0.05)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-x5z8fo.svelte-x5z8fo:not(.isSelected):active{background:rgba(255, 255, 255, 0.12)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-x5z8fo.svelte-x5z8fo:not(.isSelected):active{background:rgba(0, 0, 0, 0.08)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected):active .icon.svelte-x5z8fo{background:var(--labelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected):active .icon.svelte-x5z8fo{background:var(--labelColor)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected):active .label.svelte-x5z8fo{color:var(--labelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-x5z8fo:not(.isSelected):active .label.svelte-x5z8fo{color:var(--labelColor)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-x5z8fo.svelte-x5z8fo{background:rgba(255, 255, 255, 0.08)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.isSelected.svelte-x5z8fo.svelte-x5z8fo{background:rgba(0, 0, 0, 0.05)}}.tab.isWindowFocused.isSelected.svelte-x5z8fo .icon.svelte-x5z8fo{background-color:var(--iconAccentColor)}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-x5z8fo .icon.svelte-x5z8fo{filter:brightness(1.6)}}.tab.isWindowFocused.isSelected.svelte-x5z8fo .label.svelte-x5z8fo{color:var(--iconAccentColor)}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-x5z8fo .label.svelte-x5z8fo{filter:brightness(1.6)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-x5z8fo:hover .icon.svelte-x5z8fo{filter:brightness(2.25)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.isSelected.svelte-x5z8fo:hover .icon.svelte-x5z8fo{filter:brightness(0.7)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-x5z8fo:hover .label.svelte-x5z8fo{filter:brightness(2.25)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.isSelected.svelte-x5z8fo:hover .label.svelte-x5z8fo{filter:brightness(0.7)}}@media(prefers-color-scheme: dark){.tab:not(.isWindowFocused).isSelected.svelte-x5z8fo.svelte-x5z8fo{background:rgba(255, 255, 255, 0.08)}}@media(prefers-color-scheme: light){.tab:not(.isWindowFocused).isSelected.svelte-x5z8fo.svelte-x5z8fo{background:rgba(0, 0, 0, 0.05)}}@media(prefers-color-scheme: dark){.tab.svelte-x5z8fo.svelte-x5z8fo:not(.isWindowFocused):not(.isSelected){opacity:0.5}}@media(prefers-color-scheme: light){.tab.svelte-x5z8fo.svelte-x5z8fo:not(.isWindowFocused):not(.isSelected){opacity:0.6}}@media(prefers-color-scheme: dark){.tab.svelte-x5z8fo:not(.isWindowFocused) .icon.svelte-x5z8fo{background:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.svelte-x5z8fo:not(.isWindowFocused) .icon.svelte-x5z8fo{background:var(--secondaryLabelColor)}}@media(prefers-color-scheme: dark){.tab.svelte-x5z8fo:not(.isWindowFocused) .label.svelte-x5z8fo{color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.svelte-x5z8fo:not(.isWindowFocused) .label.svelte-x5z8fo{color:var(--secondaryLabelColor)}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbGJhclRhYi5zdmVsdGUiLCJzb3VyY2VzIjpbIlRvb2xiYXJUYWIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGlzV2luZG93Rm9jdXNlZCB9IGZyb20gXCIuLi8uLi9TdGF0ZU1hbmFnZXJcIjtcblxuICBleHBvcnQgbGV0IGxhYmVsID0gJycgLy8gJ1NldHRpbmdzJ1xuICBleHBvcnQgbGV0IGljb24gPSAnJyAvLyAnaW1nLXBob3RvJ1xuICBleHBvcnQgbGV0IGlzU2VsZWN0ZWQgPSBmYWxzZVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+QGtleWZyYW1lcyBzZWxlY3RGaWVsZCB7XG4gIGZyb20ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDIwcHggdHJhbnNwYXJlbnQsIDAgMCAwIDIwcHggdHJhbnNwYXJlbnQ7XG4gIH1cbiAgdG8ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDRweCByZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMjUpLCAwIDAgMCA0cHggdmFyKC0tY29udHJvbEFjY2VudENvbG9yKTtcbiAgfVxufVxuLnRhYiB7XG4gIHdpZHRoOiA1NXB4O1xuICBoZWlnaHQ6IDQ1cHg7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgLXdlYmtpdC1hcHAtcmVnaW9uOiBuby1kcmFnO1xufVxuLnRhYiAuaWNvbiB7XG4gIC13ZWJraXQtbWFzay1zaXplOiBjb250YWluO1xuICAtd2Via2l0LW1hc2stcG9zaXRpb246IGNlbnRlcjtcbiAgLXdlYmtpdC1tYXNrLXJlcGVhdDogbm8tcmVwZWF0O1xuICB3aWR0aDogMjNweDtcbiAgbWluLWhlaWdodDogMjFweDtcbiAgbWFyZ2luLXRvcDogNXB4O1xuICBtYXJnaW4tYm90dG9tOiAycHg7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuLnRhYiAubGFiZWwge1xuICBmb250LWZhbWlseTogc3lzdGVtLXVpO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMHB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG59XG5cbi50YWIuaXNXaW5kb3dGb2N1c2VkOm5vdCguaXNTZWxlY3RlZCkge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBub25lO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpIC5pY29uIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKSAuaWNvbiB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gICAgb3BhY2l0eTogMC43NTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpIC5sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLXNlY29uZGFyeUxhYmVsQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpIC5sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICAgIG9wYWNpdHk6IDAuNzU7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTpob3ZlciB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTpob3ZlciB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjA1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpOmFjdGl2ZSB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEyKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTphY3RpdmUge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wOCk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTphY3RpdmUgLmljb24ge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWxhYmVsQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpOmFjdGl2ZSAuaWNvbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbGFiZWxDb2xvcik7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTphY3RpdmUgLmxhYmVsIHtcbiAgICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkOm5vdCguaXNTZWxlY3RlZCk6YWN0aXZlIC5sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wNSk7XG4gIH1cbn1cbi50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQgLmljb24ge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1pY29uQWNjZW50Q29sb3IpO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZC5pc1NlbGVjdGVkIC5pY29uIHtcbiAgICBmaWx0ZXI6IGJyaWdodG5lc3MoMS42KTtcbiAgfVxufVxuLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZCAubGFiZWwge1xuICBjb2xvcjogdmFyKC0taWNvbkFjY2VudENvbG9yKTtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZCAubGFiZWwge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygxLjYpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQ6aG92ZXIgLmljb24ge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygyLjI1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZDpob3ZlciAuaWNvbiB7XG4gICAgZmlsdGVyOiBicmlnaHRuZXNzKDAuNyk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZDpob3ZlciAubGFiZWwge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygyLjI1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZDpob3ZlciAubGFiZWwge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygwLjcpO1xuICB9XG59XG5cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYjpub3QoLmlzV2luZG93Rm9jdXNlZCkuaXNTZWxlY3RlZCB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYjpub3QoLmlzV2luZG93Rm9jdXNlZCkuaXNTZWxlY3RlZCB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjA1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiOm5vdCguaXNXaW5kb3dGb2N1c2VkKTpub3QoLmlzU2VsZWN0ZWQpIHtcbiAgICBvcGFjaXR5OiAwLjU7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWI6bm90KC5pc1dpbmRvd0ZvY3VzZWQpOm5vdCguaXNTZWxlY3RlZCkge1xuICAgIG9wYWNpdHk6IDAuNjtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiOm5vdCguaXNXaW5kb3dGb2N1c2VkKSAuaWNvbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWI6bm90KC5pc1dpbmRvd0ZvY3VzZWQpIC5pY29uIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiOm5vdCguaXNXaW5kb3dGb2N1c2VkKSAubGFiZWwge1xuICAgIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYjpub3QoLmlzV2luZG93Rm9jdXNlZCkgLmxhYmVsIHtcbiAgICBjb2xvcjogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG4gIH1cbn08L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwidGFiXCIgY2xhc3M6aXNXaW5kb3dGb2N1c2VkPXskaXNXaW5kb3dGb2N1c2VkfSBjbGFzczppc1NlbGVjdGVkIG9uOm1vdXNldXA+XG4gIDxkaXYgY2xhc3M9XCJpY29uXCIgc3R5bGU9e2Atd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLSR7aWNvbn0pO2B9PjwvZGl2PlxuICA8aDEgY2xhc3M9XCJsYWJlbFwiPntsYWJlbH08L2gxPlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVF3QixXQUFXLHlCQUFZLENBQUMsQUFDOUMsSUFBSSxBQUFDLENBQUMsQUFDSixVQUFVLENBQUUsQ0FB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 */";
	append_dev(document.head, style);
}

function create_fragment$4(ctx) {
	let div1;
	let div0;
	let div0_style_value;
	let t0;
	let h1;
	let t1;
	let mounted;
	let dispose;

	const block = {
		c: function create() {
			div1 = element("div");
			div0 = element("div");
			t0 = space();
			h1 = element("h1");
			t1 = text(/*label*/ ctx[0]);
			attr_dev(div0, "class", "icon svelte-x5z8fo");
			attr_dev(div0, "style", div0_style_value = `-webkit-mask-image: var(--${/*icon*/ ctx[1]});`);
			add_location(div0, file$4, 202, 2, 4898);
			attr_dev(h1, "class", "label svelte-x5z8fo");
			add_location(h1, file$4, 203, 2, 4971);
			attr_dev(div1, "class", "tab svelte-x5z8fo");
			toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[3]);
			toggle_class(div1, "isSelected", /*isSelected*/ ctx[2]);
			add_location(div1, file$4, 201, 0, 4809);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			append_dev(div1, div0);
			append_dev(div1, t0);
			append_dev(div1, h1);
			append_dev(h1, t1);

			if (!mounted) {
				dispose = listen_dev(div1, "mouseup", /*mouseup_handler*/ ctx[4], false, false, false);
				mounted = true;
			}
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*icon*/ 2 && div0_style_value !== (div0_style_value = `-webkit-mask-image: var(--${/*icon*/ ctx[1]});`)) {
				attr_dev(div0, "style", div0_style_value);
			}

			if (dirty & /*label*/ 1) set_data_dev(t1, /*label*/ ctx[0]);

			if (dirty & /*$isWindowFocused*/ 8) {
				toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[3]);
			}

			if (dirty & /*isSelected*/ 4) {
				toggle_class(div1, "isSelected", /*isSelected*/ ctx[2]);
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
		id: create_fragment$4.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$4($$self, $$props, $$invalidate) {
	let $isWindowFocused;
	validate_store(isWindowFocused, "isWindowFocused");
	component_subscribe($$self, isWindowFocused, $$value => $$invalidate(3, $isWindowFocused = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("ToolbarTab", slots, []);
	let { label = "" } = $$props; // 'Settings'
	let { icon = "" } = $$props; // 'img-photo'
	let { isSelected = false } = $$props;
	const writable_props = ["label", "icon", "isSelected"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ToolbarTab> was created with unknown prop '${key}'`);
	});

	function mouseup_handler(event) {
		bubble($$self, event);
	}

	$$self.$$set = $$props => {
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
		if ("isSelected" in $$props) $$invalidate(2, isSelected = $$props.isSelected);
	};

	$$self.$capture_state = () => ({
		isWindowFocused,
		label,
		icon,
		isSelected,
		$isWindowFocused
	});

	$$self.$inject_state = $$props => {
		if ("label" in $$props) $$invalidate(0, label = $$props.label);
		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
		if ("isSelected" in $$props) $$invalidate(2, isSelected = $$props.isSelected);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [label, icon, isSelected, $isWindowFocused, mouseup_handler];
}

class ToolbarTab extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-x5z8fo-style")) add_css$4();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, { label: 0, icon: 1, isSelected: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "ToolbarTab",
			options,
			id: create_fragment$4.name
		});
	}

	get label() {
		throw new Error("<ToolbarTab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set label(value) {
		throw new Error("<ToolbarTab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get icon() {
		throw new Error("<ToolbarTab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set icon(value) {
		throw new Error("<ToolbarTab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	get isSelected() {
		throw new Error("<ToolbarTab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set isSelected(value) {
		throw new Error("<ToolbarTab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/ui/WindowFrame.svelte generated by Svelte v3.30.1 */
const file$5 = "src/js/renderer/component/ui/WindowFrame.svelte";

function add_css$5() {
	var style = element("style");
	style.id = "svelte-1cw5hxc-style";
	style.textContent = "@keyframes svelte-1cw5hxc-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}.window-frame.svelte-1cw5hxc{-webkit-app-region:drag;user-select:none;border-width:0 0 1px;border-style:solid;background-color:var(--windowBackgroundColor)}@media(prefers-color-scheme: dark){.window-frame.svelte-1cw5hxc{border-color:var(--shadowColor)}}@media(prefers-color-scheme: light){.window-frame.svelte-1cw5hxc{border-color:var(--separatorColor)}}@media(prefers-color-scheme: dark){.window-frame.svelte-1cw5hxc:not(.isWindowFocused){filter:brightness(0.75)}}@media(prefers-color-scheme: light){.window-frame.svelte-1cw5hxc:not(.isWindowFocused){filter:brightness(0.98)}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2luZG93RnJhbWUuc3ZlbHRlIiwic291cmNlcyI6WyJXaW5kb3dGcmFtZS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkIH0gZnJvbSBcIi4uLy4uL1N0YXRlTWFuYWdlclwiO1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5Aa2V5ZnJhbWVzIHNlbGVjdEZpZWxkIHtcbiAgZnJvbSB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgMjBweCB0cmFuc3BhcmVudCwgMCAwIDAgMjBweCB0cmFuc3BhcmVudDtcbiAgfVxuICB0byB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgNHB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNSksIDAgMCAwIDRweCB2YXIoLS1jb250cm9sQWNjZW50Q29sb3IpO1xuICB9XG59XG4ud2luZG93LWZyYW1lIHtcbiAgLXdlYmtpdC1hcHAtcmVnaW9uOiBkcmFnO1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgYm9yZGVyLXdpZHRoOiAwIDAgMXB4O1xuICBib3JkZXItc3R5bGU6IHNvbGlkO1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS13aW5kb3dCYWNrZ3JvdW5kQ29sb3IpO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAud2luZG93LWZyYW1lIHtcbiAgICBib3JkZXItY29sb3I6IHZhcigtLXNoYWRvd0NvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLndpbmRvdy1mcmFtZSB7XG4gICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1zZXBhcmF0b3JDb2xvcik7XG4gIH1cbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAud2luZG93LWZyYW1lOm5vdCguaXNXaW5kb3dGb2N1c2VkKSB7XG4gICAgZmlsdGVyOiBicmlnaHRuZXNzKDAuNzUpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAud2luZG93LWZyYW1lOm5vdCguaXNXaW5kb3dGb2N1c2VkKSB7XG4gICAgZmlsdGVyOiBicmlnaHRuZXNzKDAuOTgpO1xuICB9XG59PC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cIndpbmRvdy1mcmFtZVwiIGNsYXNzOmlzV2luZG93Rm9jdXNlZD17JGlzV2luZG93Rm9jdXNlZH0+XG4gIDxzbG90Pjwvc2xvdD5cbjwvZGl2PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLd0IsV0FBVywwQkFBWSxDQUFDLEFBQzlDLElBQUksQUFBQyxDQUFDLEFBQ0osVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxBQUM1RCxDQUFDLEFBQ0QsRUFBRSxBQUFDLENBQUMsQUFDRixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxBQUN0RixDQUFDLEFBQ0gsQ0FBQyxBQUNELGFBQWEsZUFBQyxDQUFDLEFBQ2Isa0JBQWtCLENBQUUsSUFBSSxDQUN4QixXQUFXLENBQUUsSUFBSSxDQUNqQixZQUFZLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQ3JCLFlBQVksQ0FBRSxLQUFLLENBQ25CLGdCQUFnQixDQUFFLElBQUksdUJBQXVCLENBQUMsQUFDaEQsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsSUFBSSxDQUFDLEFBQUMsQ0FBQyxBQUNuQyxhQUFhLGVBQUMsQ0FBQyxBQUNiLFlBQVksQ0FBRSxJQUFJLGFBQWEsQ0FBQyxBQUNsQyxDQUFDLEFBQ0gsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUNwQyxhQUFhLGVBQUMsQ0FBQyxBQUNiLFlBQVksQ0FBRSxJQUFJLGdCQUFnQixDQUFDLEFBQ3JDLENBQUMsQUFDSCxDQUFDLEFBRUQsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLDRCQUFhLEtBQUssZ0JBQWdCLENBQUMsQUFBQyxDQUFDLEFBQ25DLE1BQU0sQ0FBRSxXQUFXLElBQUksQ0FBQyxBQUMxQixDQUFDLEFBQ0gsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUNwQyw0QkFBYSxLQUFLLGdCQUFnQixDQUFDLEFBQUMsQ0FBQyxBQUNuQyxNQUFNLENBQUUsV0FBVyxJQUFJLENBQUMsQUFDMUIsQ0FBQyxBQUNILENBQUMifQ== */";
	append_dev(document.head, style);
}

function create_fragment$5(ctx) {
	let div;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr_dev(div, "class", "window-frame svelte-1cw5hxc");
			toggle_class(div, "isWindowFocused", /*$isWindowFocused*/ ctx[0]);
			add_location(div, file$5, 42, 0, 914);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div, anchor);

			if (default_slot) {
				default_slot.m(div, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			if (default_slot) {
				if (default_slot.p && dirty & /*$$scope*/ 2) {
					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
				}
			}

			if (dirty & /*$isWindowFocused*/ 1) {
				toggle_class(div, "isWindowFocused", /*$isWindowFocused*/ ctx[0]);
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
	let $isWindowFocused;
	validate_store(isWindowFocused, "isWindowFocused");
	component_subscribe($$self, isWindowFocused, $$value => $$invalidate(0, $isWindowFocused = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("WindowFrame", slots, ['default']);
	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WindowFrame> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
	};

	$$self.$capture_state = () => ({ isWindowFocused, $isWindowFocused });
	return [$isWindowFocused, $$scope, slots];
}

class WindowFrame extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1cw5hxc-style")) add_css$5();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "WindowFrame",
			options,
			id: create_fragment$5.name
		});
	}
}

/* src/js/renderer/component/ui/WindowTitleBar.svelte generated by Svelte v3.30.1 */
const file$6 = "src/js/renderer/component/ui/WindowTitleBar.svelte";

function add_css$6() {
	var style = element("style");
	style.id = "svelte-1smr3g4-style";
	style.textContent = "@keyframes svelte-1smr3g4-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}header.svelte-1smr3g4{font-family:system-ui;font-weight:bold;font-size:13px;line-height:15px;letter-spacing:-0.08px;display:flex;justify-content:center;align-items:center;margin:0;height:28px}@media(prefers-color-scheme: dark){header.svelte-1smr3g4{color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){header.svelte-1smr3g4{color:var(--labelColor)}}@media(prefers-color-scheme: dark){header.isWindowFocused.svelte-1smr3g4{opacity:1}}@media(prefers-color-scheme: light){header.isWindowFocused.svelte-1smr3g4{opacity:0.85}}@media(prefers-color-scheme: dark){header.svelte-1smr3g4:not(.isWindowFocused){opacity:0.5}}@media(prefers-color-scheme: light){header.svelte-1smr3g4:not(.isWindowFocused){opacity:0.35}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2luZG93VGl0bGVCYXIuc3ZlbHRlIiwic291cmNlcyI6WyJXaW5kb3dUaXRsZUJhci5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkIH0gZnJvbSBcIi4uLy4uL1N0YXRlTWFuYWdlclwiO1xuICBleHBvcnQgbGV0IHRpdGxlID0gJydcbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAyMHB4IHRyYW5zcGFyZW50LCAwIDAgMCAyMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCA0cHggcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjI1KSwgMCAwIDAgNHB4IHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvcik7XG4gIH1cbn1cbmhlYWRlciB7XG4gIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMDhweDtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1hcmdpbjogMDtcbiAgaGVpZ2h0OiAyOHB4O1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICBoZWFkZXIge1xuICAgIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgaGVhZGVyIHtcbiAgICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIH1cbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICBoZWFkZXIuaXNXaW5kb3dGb2N1c2VkIHtcbiAgICBvcGFjaXR5OiAxO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICBoZWFkZXIuaXNXaW5kb3dGb2N1c2VkIHtcbiAgICBvcGFjaXR5OiAwLjg1O1xuICB9XG59XG5cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgaGVhZGVyOm5vdCguaXNXaW5kb3dGb2N1c2VkKSB7XG4gICAgb3BhY2l0eTogMC41O1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICBoZWFkZXI6bm90KC5pc1dpbmRvd0ZvY3VzZWQpIHtcbiAgICBvcGFjaXR5OiAwLjM1O1xuICB9XG59PC9zdHlsZT5cblxuPGhlYWRlciBjbGFzczppc1dpbmRvd0ZvY3VzZWQ9eyRpc1dpbmRvd0ZvY3VzZWR9PlxuICB7dGl0bGV9XG48L2hlYWRlcj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBS3dCLFdBQVcsMEJBQVksQ0FBQyxBQUM5QyxJQUFJLEFBQUMsQ0FBQyxBQUNKLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDNUQsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksb0JBQW9CLENBQUMsQUFDdEYsQ0FBQyxBQUNILENBQUMsQUFDRCxNQUFNLGVBQUMsQ0FBQyxBQUNOLFdBQVcsQ0FBRSxTQUFTLENBQ3RCLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFNBQVMsQ0FBRSxJQUFJLENBQ2YsV0FBVyxDQUFFLElBQUksQ0FDakIsY0FBYyxDQUFFLE9BQU8sQ0FDdkIsT0FBTyxDQUFFLElBQUksQ0FDYixlQUFlLENBQUUsTUFBTSxDQUN2QixXQUFXLENBQUUsTUFBTSxDQUNuQixNQUFNLENBQUUsQ0FBQyxDQUNULE1BQU0sQ0FBRSxJQUFJLEFBQ2QsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsSUFBSSxDQUFDLEFBQUMsQ0FBQyxBQUNuQyxNQUFNLGVBQUMsQ0FBQyxBQUNOLEtBQUssQ0FBRSxJQUFJLHFCQUFxQixDQUFDLEFBQ25DLENBQUMsQUFDSCxDQUFDLEFBQ0QsTUFBTSxBQUFDLHVCQUF1QixLQUFLLENBQUMsQUFBQyxDQUFDLEFBQ3BDLE1BQU0sZUFBQyxDQUFDLEFBQ04sS0FBSyxDQUFFLElBQUksWUFBWSxDQUFDLEFBQzFCLENBQUMsQUFDSCxDQUFDLEFBRUQsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLE1BQU0sZ0JBQWdCLGVBQUMsQ0FBQyxBQUN0QixPQUFPLENBQUUsQ0FBQyxBQUNaLENBQUMsQUFDSCxDQUFDLEFBQ0QsTUFBTSxBQUFDLHVCQUF1QixLQUFLLENBQUMsQUFBQyxDQUFDLEFBQ3BDLE1BQU0sZ0JBQWdCLGVBQUMsQ0FBQyxBQUN0QixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFDSCxDQUFDLEFBRUQsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLHFCQUFNLEtBQUssZ0JBQWdCLENBQUMsQUFBQyxDQUFDLEFBQzVCLE9BQU8sQ0FBRSxHQUFHLEFBQ2QsQ0FBQyxBQUNILENBQUMsQUFDRCxNQUFNLEFBQUMsdUJBQXVCLEtBQUssQ0FBQyxBQUFDLENBQUMsQUFDcEMscUJBQU0sS0FBSyxnQkFBZ0IsQ0FBQyxBQUFDLENBQUMsQUFDNUIsT0FBTyxDQUFFLElBQUksQUFDZixDQUFDLEFBQ0gsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$6(ctx) {
	let header;
	let t;

	const block = {
		c: function create() {
			header = element("header");
			t = text(/*title*/ ctx[0]);
			attr_dev(header, "class", "svelte-1smr3g4");
			toggle_class(header, "isWindowFocused", /*$isWindowFocused*/ ctx[1]);
			add_location(header, file$6, 58, 0, 1111);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, header, anchor);
			append_dev(header, t);
		},
		p: function update(ctx, [dirty]) {
			if (dirty & /*title*/ 1) set_data_dev(t, /*title*/ ctx[0]);

			if (dirty & /*$isWindowFocused*/ 2) {
				toggle_class(header, "isWindowFocused", /*$isWindowFocused*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d: function destroy(detaching) {
			if (detaching) detach_dev(header);
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
	let $isWindowFocused;
	validate_store(isWindowFocused, "isWindowFocused");
	component_subscribe($$self, isWindowFocused, $$value => $$invalidate(1, $isWindowFocused = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("WindowTitleBar", slots, []);
	let { title = "" } = $$props;
	const writable_props = ["title"];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WindowTitleBar> was created with unknown prop '${key}'`);
	});

	$$self.$$set = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
	};

	$$self.$capture_state = () => ({ isWindowFocused, title, $isWindowFocused });

	$$self.$inject_state = $$props => {
		if ("title" in $$props) $$invalidate(0, title = $$props.title);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [title, $isWindowFocused];
}

class WindowTitleBar extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1smr3g4-style")) add_css$6();
		init(this, options, instance$6, create_fragment$6, safe_not_equal, { title: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "WindowTitleBar",
			options,
			id: create_fragment$6.name
		});
	}

	get title() {
		throw new Error("<WindowTitleBar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}

	set title(value) {
		throw new Error("<WindowTitleBar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
	}
}

/* src/js/renderer/component/preferences/Preferences.svelte generated by Svelte v3.30.1 */
const file$7 = "src/js/renderer/component/preferences/Preferences.svelte";

function add_css$7() {
	var style = element("style");
	style.id = "svelte-1hz4oz3-style";
	style.textContent = "@keyframes svelte-1hz4oz3-selectField{from{box-shadow:0 0 0 20px transparent, 0 0 0 20px transparent}to{box-shadow:0 0 0 4px rgba(255, 255, 255, 0.25), 0 0 0 4px var(--controlAccentColor)}}#main.svelte-1hz4oz3{width:100%;height:100%;overflow:hidden}.toolbar.svelte-1hz4oz3{display:flex;width:100%;justify-content:center;height:52px;gap:2px}.window-body.svelte-1hz4oz3{max-width:600px;margin:0 auto;height:100%;padding:20px;display:flex;flex-direction:column;overflow-x:hidden;overflow-y:scroll}@media(prefers-color-scheme: dark){.window-body.svelte-1hz4oz3{filter:brightness(0.6);background:var(--windowBackgroundColor)}}@media(prefers-color-scheme: light){.window-body.svelte-1hz4oz3{background:var(--windowBackgroundColor)}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJlZmVyZW5jZXMuc3ZlbHRlIiwic291cmNlcyI6WyJQcmVmZXJlbmNlcy5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkLCBzdGF0ZSB9IGZyb20gJy4uLy4uL1N0YXRlTWFuYWdlcic7XG4gIGltcG9ydCBDaGVja2JveCBmcm9tICcuLi91aS9DaGVja2JveC5zdmVsdGUnO1xuICBpbXBvcnQgRGVzY3JpcHRpb24gZnJvbSAnLi4vdWkvRGVzY3JpcHRpb24uc3ZlbHRlJztcbiAgaW1wb3J0IEZvcm1Sb3cgZnJvbSAnLi4vdWkvRm9ybVJvdy5zdmVsdGUnO1xuICBpbXBvcnQgU2VwYXJhdG9yIGZyb20gJy4uL3VpL1NlcGFyYXRvci5zdmVsdGUnO1xuICBpbXBvcnQgVG9vbGJhclRhYiBmcm9tICcuLi91aS9Ub29sYmFyVGFiLnN2ZWx0ZSc7XG4gIGltcG9ydCBXaW5kb3dGcmFtZSBmcm9tICcuLi91aS9XaW5kb3dGcmFtZS5zdmVsdGUnO1xuICBpbXBvcnQgV2luZG93VGl0bGVCYXIgZnJvbSAnLi4vdWkvV2luZG93VGl0bGVCYXIuc3ZlbHRlJzsgXG5cbiAgbGV0IGFjdGl2ZVRhYiA9ICdnZW5lcmFsJ1xuICBsZXQgdGFicyA9IFtcbiAgICB7XG4gICAgICBpZDogJ2dlbmVyYWwnLFxuICAgICAgdGl0bGU6ICdHZW5lcmFsJyxcbiAgICAgIGljb246ICdpbWctZ2VhcnNoYXBlJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICd0aGVtZScsXG4gICAgICB0aXRsZTogJ1RoZW1lJyxcbiAgICAgIGljb246ICdpbWctcGFpbnRwYWxldHRlLW1lZGl1bS1yZWd1bGFyJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICdtYXJrdXAnLFxuICAgICAgdGl0bGU6ICdNYXJrdXAnLFxuICAgICAgaWNvbjogJ2ltZy10ZXh0Zm9ybWF0LW1lZGl1bS1yZWd1bGFyJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICdtZWRpYScsXG4gICAgICB0aXRsZTogJ01lZGlhJyxcbiAgICAgIGljb246ICdpbWctcGhvdG8tbWVkaXVtLXJlZ3VsYXInXG4gICAgfSxcbiAgICB7XG4gICAgICBpZDogJ2NpdGF0aW9ucycsXG4gICAgICB0aXRsZTogJ0NpdGF0aW9ucycsXG4gICAgICBpY29uOiAnaW1nLXF1b3RlLWJ1YmJsZS1tZWRpdW0tcmVndWxhcidcbiAgICB9LFxuICBdXG5cbiAgJDogd2luZG93VGl0bGUgPSB0YWJzLmZpbmQoKHsgaWQgfSkgPT4gaWQgPT0gYWN0aXZlVGFiKS50aXRsZVxuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj5Aa2V5ZnJhbWVzIHNlbGVjdEZpZWxkIHtcbiAgZnJvbSB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgMjBweCB0cmFuc3BhcmVudCwgMCAwIDAgMjBweCB0cmFuc3BhcmVudDtcbiAgfVxuICB0byB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgNHB4IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4yNSksIDAgMCAwIDRweCB2YXIoLS1jb250cm9sQWNjZW50Q29sb3IpO1xuICB9XG59XG4jbWFpbiB7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDEwMCU7XG4gIG92ZXJmbG93OiBoaWRkZW47XG59XG5cbi50b29sYmFyIHtcbiAgZGlzcGxheTogZmxleDtcbiAgd2lkdGg6IDEwMCU7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBoZWlnaHQ6IDUycHg7XG4gIGdhcDogMnB4O1xufVxuXG4ud2luZG93LWJvZHkge1xuICBtYXgtd2lkdGg6IDYwMHB4O1xuICBtYXJnaW46IDAgYXV0bztcbiAgaGVpZ2h0OiAxMDAlO1xuICBwYWRkaW5nOiAyMHB4O1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xuICBvdmVyZmxvdy14OiBoaWRkZW47XG4gIG92ZXJmbG93LXk6IHNjcm9sbDtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLndpbmRvdy1ib2R5IHtcbiAgICBmaWx0ZXI6IGJyaWdodG5lc3MoMC42KTtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS13aW5kb3dCYWNrZ3JvdW5kQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAud2luZG93LWJvZHkge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLXdpbmRvd0JhY2tncm91bmRDb2xvcik7XG4gIH1cbn08L3N0eWxlPlxuXG48ZGl2IGlkPVwibWFpblwiIGNsYXNzOmlzV2luZG93Rm9jdXNlZD17JGlzV2luZG93Rm9jdXNlZH0+XG5cbiAgIDwhLS0tLS0tLS0tLSBGUkFNRSAtLS0tLS0tLS0tPlxuXG4gIDxXaW5kb3dGcmFtZT5cbiAgICA8V2luZG93VGl0bGVCYXIgdGl0bGU9e3dpbmRvd1RpdGxlfSAvPlxuICAgIDxkaXYgY2xhc3M9XCJ0b29sYmFyXCI+XG4gICAgICB7I2VhY2ggdGFicyBhcyB7aWQsIHRpdGxlLCBpY29ufX1cbiAgICAgICAgPFRvb2xiYXJUYWIgbGFiZWw9e3RpdGxlfSBpY29uPXtpY29ufSBpc1NlbGVjdGVkPXtpZCA9PSBhY3RpdmVUYWJ9IG9uOm1vdXNldXA9eygpID0+IGFjdGl2ZVRhYiA9IGlkfS8+XG4gICAgICB7L2VhY2h9XG4gICAgPC9kaXY+XG4gIDwvV2luZG93RnJhbWU+XG4gIFxuXG4gIDwhLS0tLS0tLS0tLSBCT0RZIC0tLS0tLS0tLS0+XG5cbiAgPGRpdiBjbGFzcz1cIndpbmRvdy1ib2R5XCI+XG5cbiAgICB7I2lmIGFjdGl2ZVRhYj09J21hcmt1cCd9IFxuXG4gICAgICA8IS0tIFN0cmlrZXRocm91Z2ggLS0+XG5cbiAgICAgIDxGb3JtUm93IGxhYmVsPXsnU3RyaWtldGhyb3VnaDonfSBsZWZ0Q29sdW1uPXsnMjAwcHgnfSBtYXJnaW49eyc4cHggMCAwJ30gbXVsdGlMaW5lPXt0cnVlfSBsYWJlbFRvcE9mZnNldD17JzNweCd9PlxuICAgICAgICA8Q2hlY2tib3ggXG4gICAgICAgICAgbGFiZWw9eydTdHJpa2V0aHJvdWdoJ31cbiAgICAgICAgICBjaGVja2VkPXskc3RhdGUubWFya2Rvd24uc3RyaWtldGhyb3VnaH1cbiAgICAgICAgICBvbjpjbGljaz17KCkgPT4ge1xuICAgICAgICAgICAgd2luZG93LmFwaS5zZW5kKCdkaXNwYXRjaCcsIHtcbiAgICAgICAgICAgICAgdHlwZTogJ1NFVF9NQVJLRE9XTl9PUFRJT05TJyxcbiAgICAgICAgICAgICAgbWFya2Rvd25PcHRpb25zOiB7XG4gICAgICAgICAgICAgICAgLi4uJHN0YXRlLm1hcmtkb3duLCBcbiAgICAgICAgICAgICAgICBzdHJpa2V0aHJvdWdoOiAhJHN0YXRlLm1hcmtkb3duLnN0cmlrZXRocm91Z2hcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9fVxuICAgICAgICAvPlxuICAgICAgICA8RGVzY3JpcHRpb24gbWFyZ2luPXsnNHB4IDAgMCAyMHB4J30+XG4gICAgICAgICAgVXNlIHdyYXBwaW5nIHRpbGRlIGNoYXJhY3RlcnMgdG8gY3JlYXRlIHN0cmlrZXRocm91Z2ggdGV4dDogfn5IZWxsbyBXb3JsZH5+LlxuICAgICAgICA8L0Rlc2NyaXB0aW9uPiAgXG4gICAgICA8L0Zvcm1Sb3c+XG5cbiAgICAgIDwhLS0gRmlndXJlcyAtLT5cblxuICAgICAgPEZvcm1Sb3cgbGFiZWw9eydGaWd1cmVzOid9IGxlZnRDb2x1bW49eycyMDBweCd9IG1hcmdpbj17JzhweCAwIDAnfSBtdWx0aUxpbmU9e3RydWV9IGxhYmVsVG9wT2Zmc2V0PXsnM3B4J30+XG4gICAgICAgIDxDaGVja2JveCBcbiAgICAgICAgICBsYWJlbD17J0ltcGxpY2l0IEZpZ3VyZXMnfVxuICAgICAgICAgIGNoZWNrZWQ9eyRzdGF0ZS5tYXJrZG93bi5pbXBsaWNpdEZpZ3VyZXN9XG4gICAgICAgICAgb246Y2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgIHdpbmRvdy5hcGkuc2VuZCgnZGlzcGF0Y2gnLCB7XG4gICAgICAgICAgICAgIHR5cGU6ICdTRVRfTUFSS0RPV05fT1BUSU9OUycsXG4gICAgICAgICAgICAgIG1hcmtkb3duT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIC4uLiRzdGF0ZS5tYXJrZG93biwgXG4gICAgICAgICAgICAgICAgaW1wbGljaXRGaWd1cmVzOiAhJHN0YXRlLm1hcmtkb3duLmltcGxpY2l0RmlndXJlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICAgIDxEZXNjcmlwdGlvbiBtYXJnaW49eyc0cHggMCAwIDIwcHgnfT5cbiAgICAgICAgICBBbiBpbWFnZSBlbGVtZW50IHdpdGggYWx0IHRleHQgb24gYW4gZW1wdHkgbGluZSB3aWxsIGJlIGludGVycHJldGVkIGFzIGEgZmlndXJlIGVsZW1lbnQsIGFuZCBjYW4gYmUgZGlzcGxheWVkIHdpdGggYW4gaW5saW5lIHByZXZpZXcuIFRoZSBhbHQgdGV4dCB3aWxsIGJlIHVzZWQgYXMgY2FwdGlvbiB0ZXh0LlxuICAgICAgICA8L0Rlc2NyaXB0aW9uPiAgXG4gICAgICA8L0Zvcm1Sb3c+XG4gICAgICBcbiAgICAgIDxGb3JtUm93IGxlZnRDb2x1bW49eycyMDBweCd9IG1hcmdpbj17JzhweCAwIDAnfT5cbiAgICAgICAgPENoZWNrYm94IFxuICAgICAgICAgIGxhYmVsPXsnU2hvdyBUaHVtYm5haWwnfVxuICAgICAgICAgIGRpc2FibGVkPXshJHN0YXRlLm1hcmtkb3duLmltcGxpY2l0RmlndXJlc31cbiAgICAgICAgICBjaGVja2VkPXt0cnVlfVxuICAgICAgICAgIG9uOmNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICB3aW5kb3cuYXBpLnNlbmQoJ2Rpc3BhdGNoJywge1xuICAgICAgICAgICAgICB0eXBlOiAnU0VUX01BUktET1dOX09QVElPTlMnLFxuICAgICAgICAgICAgICBtYXJrZG93bk9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgICAuLi4kc3RhdGUubWFya2Rvd24sIFxuICAgICAgICAgICAgICAgIGltcGxpY2l0RmlndXJlczogISRzdGF0ZS5tYXJrZG93bi5pbXBsaWNpdEZpZ3VyZXNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9fVxuICAgICAgICAvPlxuICAgICAgPC9Gb3JtUm93PlxuXG4gICAgICA8Rm9ybVJvdyBsZWZ0Q29sdW1uPXsnMjAwcHgnfSBtYXJnaW49eyc0cHggMCAwJ30+XG4gICAgICAgIDxDaGVja2JveCBcbiAgICAgICAgICBsYWJlbD17J1Nob3cgQ2FwdGlvbid9XG4gICAgICAgICAgZGlzYWJsZWQ9eyEkc3RhdGUubWFya2Rvd24uaW1wbGljaXRGaWd1cmVzfVxuICAgICAgICAgIGNoZWNrZWQ9e3RydWV9XG4gICAgICAgICAgb246Y2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgIHdpbmRvdy5hcGkuc2VuZCgnZGlzcGF0Y2gnLCB7XG4gICAgICAgICAgICAgIHR5cGU6ICdTRVRfTUFSS0RPV05fT1BUSU9OUycsXG4gICAgICAgICAgICAgIG1hcmtkb3duT3B0aW9uczoge1xuICAgICAgICAgICAgICAgIC4uLiRzdGF0ZS5tYXJrZG93biwgXG4gICAgICAgICAgICAgICAgaW1wbGljaXRGaWd1cmVzOiAhJHN0YXRlLm1hcmtkb3duLmltcGxpY2l0RmlndXJlc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICA8L0Zvcm1Sb3c+XG5cblxuICAgIHs6ZWxzZSBpZiBhY3RpdmVUYWI9PSdtZWRpYSd9IFxuXG4gICAgICA8Rm9ybVJvdyBsYWJlbD17J0ltYWdlczonfSBsZWZ0Q29sdW1uPXsnMjAwcHgnfSBtYXJnaW49eyc4cHggMCAwJ30gbXVsdGlMaW5lPXt0cnVlfSBsYWJlbFRvcE9mZnNldD17JzNweCd9PlxuICAgICAgICA8Q2hlY2tib3ggXG4gICAgICAgICAgbGFiZWw9eydBbHdheXMgY29weSBpbWFnZSBmaWxlcyBpbnRvIHByb2plY3QnfVxuICAgICAgICAgIGNoZWNrZWQ9eyRzdGF0ZS5tYXJrZG93bi5zdHJpa2V0aHJvdWdofVxuICAgICAgICAgIG9uOmNsaWNrPXsoKSA9PiB7XG4gICAgICAgICAgICB3aW5kb3cuYXBpLnNlbmQoJ2Rpc3BhdGNoJywge1xuICAgICAgICAgICAgICB0eXBlOiAnU0VUX01BUktET1dOX09QVElPTlMnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH19XG4gICAgICAgIC8+XG4gICAgICAgIDxEZXNjcmlwdGlvbiBtYXJnaW49eyc0cHggMCAwIDIwcHgnfT5cbiAgICAgICAgICBXaGVuIHNlbGVjdGVkLCBpbWFnZSBmaWxlcyBkcm9wcGVkIGludG8gdGhlIHByb2plY3QgZnJvbSB0aGUgZmlsZSBzeXN0ZW0gd2lsbCBhbHdheXMgYmUgY29waWVkLiBPdGhlcndpc2UgdGhleSB3aWxsIGJlIG1vdmVkIGJ5IGRlZmF1bHQsIGFuZCBjb3BpZWQgb25seSBpZiB0aGUgT3B0aW9uIGtleSBpcyBoZWxkLlxuICAgICAgICA8L0Rlc2NyaXB0aW9uPiAgXG4gICAgICA8L0Zvcm1Sb3c+XG5cbiAgICB7L2lmfVxuXG4gIDwvZGl2PlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQTJDd0IsV0FBVywwQkFBWSxDQUFDLEFBQzlDLElBQUksQUFBQyxDQUFDLEFBQ0osVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxBQUM1RCxDQUFDLEFBQ0QsRUFBRSxBQUFDLENBQUMsQUFDRixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxBQUN0RixDQUFDLEFBQ0gsQ0FBQyxBQUNELEtBQUssZUFBQyxDQUFDLEFBQ0wsS0FBSyxDQUFFLElBQUksQ0FDWCxNQUFNLENBQUUsSUFBSSxDQUNaLFFBQVEsQ0FBRSxNQUFNLEFBQ2xCLENBQUMsQUFFRCxRQUFRLGVBQUMsQ0FBQyxBQUNSLE9BQU8sQ0FBRSxJQUFJLENBQ2IsS0FBSyxDQUFFLElBQUksQ0FDWCxlQUFlLENBQUUsTUFBTSxDQUN2QixNQUFNLENBQUUsSUFBSSxDQUNaLEdBQUcsQ0FBRSxHQUFHLEFBQ1YsQ0FBQyxBQUVELFlBQVksZUFBQyxDQUFDLEFBQ1osU0FBUyxDQUFFLEtBQUssQ0FDaEIsTUFBTSxDQUFFLENBQUMsQ0FBQyxJQUFJLENBQ2QsTUFBTSxDQUFFLElBQUksQ0FDWixPQUFPLENBQUUsSUFBSSxDQUNiLE9BQU8sQ0FBRSxJQUFJLENBQ2IsY0FBYyxDQUFFLE1BQU0sQ0FDdEIsVUFBVSxDQUFFLE1BQU0sQ0FDbEIsVUFBVSxDQUFFLE1BQU0sQUFDcEIsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsSUFBSSxDQUFDLEFBQUMsQ0FBQyxBQUNuQyxZQUFZLGVBQUMsQ0FBQyxBQUNaLE1BQU0sQ0FBRSxXQUFXLEdBQUcsQ0FBQyxDQUN2QixVQUFVLENBQUUsSUFBSSx1QkFBdUIsQ0FBQyxBQUMxQyxDQUFDLEFBQ0gsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUNwQyxZQUFZLGVBQUMsQ0FBQyxBQUNaLFVBQVUsQ0FBRSxJQUFJLHVCQUF1QixDQUFDLEFBQzFDLENBQUMsQUFDSCxDQUFDIn0= */";
	append_dev(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[11] = list[i].id;
	child_ctx[12] = list[i].title;
	child_ctx[13] = list[i].icon;
	return child_ctx;
}

// (95:6) {#each tabs as {id, title, icon}}
function create_each_block(ctx) {
	let toolbartab;
	let current;

	function mouseup_handler() {
		return /*mouseup_handler*/ ctx[5](/*id*/ ctx[11]);
	}

	toolbartab = new ToolbarTab({
			props: {
				label: /*title*/ ctx[12],
				icon: /*icon*/ ctx[13],
				isSelected: /*id*/ ctx[11] == /*activeTab*/ ctx[0]
			},
			$$inline: true
		});

	toolbartab.$on("mouseup", mouseup_handler);

	const block = {
		c: function create() {
			create_component(toolbartab.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(toolbartab, target, anchor);
			current = true;
		},
		p: function update(new_ctx, dirty) {
			ctx = new_ctx;
			const toolbartab_changes = {};
			if (dirty & /*activeTab*/ 1) toolbartab_changes.isSelected = /*id*/ ctx[11] == /*activeTab*/ ctx[0];
			toolbartab.$set(toolbartab_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(toolbartab.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(toolbartab.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(toolbartab, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_each_block.name,
		type: "each",
		source: "(95:6) {#each tabs as {id, title, icon}}",
		ctx
	});

	return block;
}

// (92:2) <WindowFrame>
function create_default_slot_8(ctx) {
	let windowtitlebar;
	let t;
	let div;
	let current;

	windowtitlebar = new WindowTitleBar({
			props: { title: /*windowTitle*/ ctx[1] },
			$$inline: true
		});

	let each_value = /*tabs*/ ctx[4];
	validate_each_argument(each_value);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	const block = {
		c: function create() {
			create_component(windowtitlebar.$$.fragment);
			t = space();
			div = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr_dev(div, "class", "toolbar svelte-1hz4oz3");
			add_location(div, file$7, 93, 4, 2025);
		},
		m: function mount(target, anchor) {
			mount_component(windowtitlebar, target, anchor);
			insert_dev(target, t, anchor);
			insert_dev(target, div, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].m(div, null);
			}

			current = true;
		},
		p: function update(ctx, dirty) {
			const windowtitlebar_changes = {};
			if (dirty & /*windowTitle*/ 2) windowtitlebar_changes.title = /*windowTitle*/ ctx[1];
			windowtitlebar.$set(windowtitlebar_changes);

			if (dirty & /*tabs, activeTab*/ 17) {
				each_value = /*tabs*/ ctx[4];
				validate_each_argument(each_value);
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
		},
		i: function intro(local) {
			if (current) return;
			transition_in(windowtitlebar.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o: function outro(local) {
			transition_out(windowtitlebar.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(windowtitlebar, detaching);
			if (detaching) detach_dev(t);
			if (detaching) detach_dev(div);
			destroy_each(each_blocks, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_8.name,
		type: "slot",
		source: "(92:2) <WindowFrame>",
		ctx
	});

	return block;
}

// (185:33) 
function create_if_block_1(ctx) {
	let formrow;
	let current;

	formrow = new FormRow({
			props: {
				label: "Images:",
				leftColumn: "200px",
				margin: "8px 0 0",
				multiLine: true,
				labelTopOffset: "3px",
				$$slots: { default: [create_default_slot_6] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(formrow.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(formrow, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const formrow_changes = {};

			if (dirty & /*$$scope, $state*/ 65544) {
				formrow_changes.$$scope = { dirty, ctx };
			}

			formrow.$set(formrow_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(formrow.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(formrow.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(formrow, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block_1.name,
		type: "if",
		source: "(185:33) ",
		ctx
	});

	return block;
}

// (106:4) {#if activeTab=='markup'}
function create_if_block$1(ctx) {
	let formrow0;
	let t0;
	let formrow1;
	let t1;
	let formrow2;
	let t2;
	let formrow3;
	let current;

	formrow0 = new FormRow({
			props: {
				label: "Strikethrough:",
				leftColumn: "200px",
				margin: "8px 0 0",
				multiLine: true,
				labelTopOffset: "3px",
				$$slots: { default: [create_default_slot_4] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	formrow1 = new FormRow({
			props: {
				label: "Figures:",
				leftColumn: "200px",
				margin: "8px 0 0",
				multiLine: true,
				labelTopOffset: "3px",
				$$slots: { default: [create_default_slot_2] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	formrow2 = new FormRow({
			props: {
				leftColumn: "200px",
				margin: "8px 0 0",
				$$slots: { default: [create_default_slot_1] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	formrow3 = new FormRow({
			props: {
				leftColumn: "200px",
				margin: "4px 0 0",
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(formrow0.$$.fragment);
			t0 = space();
			create_component(formrow1.$$.fragment);
			t1 = space();
			create_component(formrow2.$$.fragment);
			t2 = space();
			create_component(formrow3.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(formrow0, target, anchor);
			insert_dev(target, t0, anchor);
			mount_component(formrow1, target, anchor);
			insert_dev(target, t1, anchor);
			mount_component(formrow2, target, anchor);
			insert_dev(target, t2, anchor);
			mount_component(formrow3, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const formrow0_changes = {};

			if (dirty & /*$$scope, $state*/ 65544) {
				formrow0_changes.$$scope = { dirty, ctx };
			}

			formrow0.$set(formrow0_changes);
			const formrow1_changes = {};

			if (dirty & /*$$scope, $state*/ 65544) {
				formrow1_changes.$$scope = { dirty, ctx };
			}

			formrow1.$set(formrow1_changes);
			const formrow2_changes = {};

			if (dirty & /*$$scope, $state*/ 65544) {
				formrow2_changes.$$scope = { dirty, ctx };
			}

			formrow2.$set(formrow2_changes);
			const formrow3_changes = {};

			if (dirty & /*$$scope, $state*/ 65544) {
				formrow3_changes.$$scope = { dirty, ctx };
			}

			formrow3.$set(formrow3_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(formrow0.$$.fragment, local);
			transition_in(formrow1.$$.fragment, local);
			transition_in(formrow2.$$.fragment, local);
			transition_in(formrow3.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(formrow0.$$.fragment, local);
			transition_out(formrow1.$$.fragment, local);
			transition_out(formrow2.$$.fragment, local);
			transition_out(formrow3.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(formrow0, detaching);
			if (detaching) detach_dev(t0);
			destroy_component(formrow1, detaching);
			if (detaching) detach_dev(t1);
			destroy_component(formrow2, detaching);
			if (detaching) detach_dev(t2);
			destroy_component(formrow3, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_if_block$1.name,
		type: "if",
		source: "(106:4) {#if activeTab=='markup'}",
		ctx
	});

	return block;
}

// (197:8) <Description margin={'4px 0 0 20px'}>
function create_default_slot_7(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("When selected, image files dropped into the project from the file system will always be copied. Otherwise they will be moved by default, and copied only if the Option key is held.");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_7.name,
		type: "slot",
		source: "(197:8) <Description margin={'4px 0 0 20px'}>",
		ctx
	});

	return block;
}

// (187:6) <FormRow label={'Images:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>
function create_default_slot_6(ctx) {
	let checkbox;
	let t;
	let description;
	let current;

	checkbox = new Checkbox({
			props: {
				label: "Always copy image files into project",
				checked: /*$state*/ ctx[3].markdown.strikethrough
			},
			$$inline: true
		});

	checkbox.$on("click", /*click_handler_4*/ ctx[10]);

	description = new Description({
			props: {
				margin: "4px 0 0 20px",
				$$slots: { default: [create_default_slot_7] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(checkbox.$$.fragment);
			t = space();
			create_component(description.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(checkbox, target, anchor);
			insert_dev(target, t, anchor);
			mount_component(description, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const checkbox_changes = {};
			if (dirty & /*$state*/ 8) checkbox_changes.checked = /*$state*/ ctx[3].markdown.strikethrough;
			checkbox.$set(checkbox_changes);
			const description_changes = {};

			if (dirty & /*$$scope*/ 65536) {
				description_changes.$$scope = { dirty, ctx };
			}

			description.$set(description_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(checkbox.$$.fragment, local);
			transition_in(description.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(checkbox.$$.fragment, local);
			transition_out(description.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(checkbox, detaching);
			if (detaching) detach_dev(t);
			destroy_component(description, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_6.name,
		type: "slot",
		source: "(187:6) <FormRow label={'Images:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>",
		ctx
	});

	return block;
}

// (124:8) <Description margin={'4px 0 0 20px'}>
function create_default_slot_5(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("Use wrapping tilde characters to create strikethrough text: ~~Hello World~~.");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_5.name,
		type: "slot",
		source: "(124:8) <Description margin={'4px 0 0 20px'}>",
		ctx
	});

	return block;
}

// (110:6) <FormRow label={'Strikethrough:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>
function create_default_slot_4(ctx) {
	let checkbox;
	let t;
	let description;
	let current;

	checkbox = new Checkbox({
			props: {
				label: "Strikethrough",
				checked: /*$state*/ ctx[3].markdown.strikethrough
			},
			$$inline: true
		});

	checkbox.$on("click", /*click_handler*/ ctx[6]);

	description = new Description({
			props: {
				margin: "4px 0 0 20px",
				$$slots: { default: [create_default_slot_5] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(checkbox.$$.fragment);
			t = space();
			create_component(description.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(checkbox, target, anchor);
			insert_dev(target, t, anchor);
			mount_component(description, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const checkbox_changes = {};
			if (dirty & /*$state*/ 8) checkbox_changes.checked = /*$state*/ ctx[3].markdown.strikethrough;
			checkbox.$set(checkbox_changes);
			const description_changes = {};

			if (dirty & /*$$scope*/ 65536) {
				description_changes.$$scope = { dirty, ctx };
			}

			description.$set(description_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(checkbox.$$.fragment, local);
			transition_in(description.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(checkbox.$$.fragment, local);
			transition_out(description.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(checkbox, detaching);
			if (detaching) detach_dev(t);
			destroy_component(description, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_4.name,
		type: "slot",
		source: "(110:6) <FormRow label={'Strikethrough:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>",
		ctx
	});

	return block;
}

// (145:8) <Description margin={'4px 0 0 20px'}>
function create_default_slot_3(ctx) {
	let t;

	const block = {
		c: function create() {
			t = text("An image element with alt text on an empty line will be interpreted as a figure element, and can be displayed with an inline preview. The alt text will be used as caption text.");
		},
		m: function mount(target, anchor) {
			insert_dev(target, t, anchor);
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(t);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_3.name,
		type: "slot",
		source: "(145:8) <Description margin={'4px 0 0 20px'}>",
		ctx
	});

	return block;
}

// (131:6) <FormRow label={'Figures:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>
function create_default_slot_2(ctx) {
	let checkbox;
	let t;
	let description;
	let current;

	checkbox = new Checkbox({
			props: {
				label: "Implicit Figures",
				checked: /*$state*/ ctx[3].markdown.implicitFigures
			},
			$$inline: true
		});

	checkbox.$on("click", /*click_handler_1*/ ctx[7]);

	description = new Description({
			props: {
				margin: "4px 0 0 20px",
				$$slots: { default: [create_default_slot_3] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			create_component(checkbox.$$.fragment);
			t = space();
			create_component(description.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(checkbox, target, anchor);
			insert_dev(target, t, anchor);
			mount_component(description, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const checkbox_changes = {};
			if (dirty & /*$state*/ 8) checkbox_changes.checked = /*$state*/ ctx[3].markdown.implicitFigures;
			checkbox.$set(checkbox_changes);
			const description_changes = {};

			if (dirty & /*$$scope*/ 65536) {
				description_changes.$$scope = { dirty, ctx };
			}

			description.$set(description_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(checkbox.$$.fragment, local);
			transition_in(description.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(checkbox.$$.fragment, local);
			transition_out(description.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(checkbox, detaching);
			if (detaching) detach_dev(t);
			destroy_component(description, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_2.name,
		type: "slot",
		source: "(131:6) <FormRow label={'Figures:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>",
		ctx
	});

	return block;
}

// (150:6) <FormRow leftColumn={'200px'} margin={'8px 0 0'}>
function create_default_slot_1(ctx) {
	let checkbox;
	let current;

	checkbox = new Checkbox({
			props: {
				label: "Show Thumbnail",
				disabled: !/*$state*/ ctx[3].markdown.implicitFigures,
				checked: true
			},
			$$inline: true
		});

	checkbox.$on("click", /*click_handler_2*/ ctx[8]);

	const block = {
		c: function create() {
			create_component(checkbox.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(checkbox, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const checkbox_changes = {};
			if (dirty & /*$state*/ 8) checkbox_changes.disabled = !/*$state*/ ctx[3].markdown.implicitFigures;
			checkbox.$set(checkbox_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(checkbox.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(checkbox.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(checkbox, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot_1.name,
		type: "slot",
		source: "(150:6) <FormRow leftColumn={'200px'} margin={'8px 0 0'}>",
		ctx
	});

	return block;
}

// (167:6) <FormRow leftColumn={'200px'} margin={'4px 0 0'}>
function create_default_slot(ctx) {
	let checkbox;
	let current;

	checkbox = new Checkbox({
			props: {
				label: "Show Caption",
				disabled: !/*$state*/ ctx[3].markdown.implicitFigures,
				checked: true
			},
			$$inline: true
		});

	checkbox.$on("click", /*click_handler_3*/ ctx[9]);

	const block = {
		c: function create() {
			create_component(checkbox.$$.fragment);
		},
		m: function mount(target, anchor) {
			mount_component(checkbox, target, anchor);
			current = true;
		},
		p: function update(ctx, dirty) {
			const checkbox_changes = {};
			if (dirty & /*$state*/ 8) checkbox_changes.disabled = !/*$state*/ ctx[3].markdown.implicitFigures;
			checkbox.$set(checkbox_changes);
		},
		i: function intro(local) {
			if (current) return;
			transition_in(checkbox.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(checkbox.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			destroy_component(checkbox, detaching);
		}
	};

	dispatch_dev("SvelteRegisterBlock", {
		block,
		id: create_default_slot.name,
		type: "slot",
		source: "(167:6) <FormRow leftColumn={'200px'} margin={'4px 0 0'}>",
		ctx
	});

	return block;
}

function create_fragment$7(ctx) {
	let div1;
	let windowframe;
	let t;
	let div0;
	let current_block_type_index;
	let if_block;
	let current;

	windowframe = new WindowFrame({
			props: {
				$$slots: { default: [create_default_slot_8] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const if_block_creators = [create_if_block$1, create_if_block_1];
	const if_blocks = [];

	function select_block_type(ctx, dirty) {
		if (/*activeTab*/ ctx[0] == "markup") return 0;
		if (/*activeTab*/ ctx[0] == "media") return 1;
		return -1;
	}

	if (~(current_block_type_index = select_block_type(ctx))) {
		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
	}

	const block = {
		c: function create() {
			div1 = element("div");
			create_component(windowframe.$$.fragment);
			t = space();
			div0 = element("div");
			if (if_block) if_block.c();
			attr_dev(div0, "class", "window-body svelte-1hz4oz3");
			add_location(div0, file$7, 103, 2, 2279);
			attr_dev(div1, "id", "main");
			attr_dev(div1, "class", "svelte-1hz4oz3");
			toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[2]);
			add_location(div1, file$7, 87, 0, 1869);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			mount_component(windowframe, div1, null);
			append_dev(div1, t);
			append_dev(div1, div0);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].m(div0, null);
			}

			current = true;
		},
		p: function update(ctx, [dirty]) {
			const windowframe_changes = {};

			if (dirty & /*$$scope, activeTab, windowTitle*/ 65539) {
				windowframe_changes.$$scope = { dirty, ctx };
			}

			windowframe.$set(windowframe_changes);
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

			if (dirty & /*$isWindowFocused*/ 4) {
				toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[2]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(windowframe.$$.fragment, local);
			transition_in(if_block);
			current = true;
		},
		o: function outro(local) {
			transition_out(windowframe.$$.fragment, local);
			transition_out(if_block);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(windowframe);

			if (~current_block_type_index) {
				if_blocks[current_block_type_index].d();
			}
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
	let $isWindowFocused;
	let $state;
	validate_store(isWindowFocused, "isWindowFocused");
	component_subscribe($$self, isWindowFocused, $$value => $$invalidate(2, $isWindowFocused = $$value));
	validate_store(state, "state");
	component_subscribe($$self, state, $$value => $$invalidate(3, $state = $$value));
	let { $$slots: slots = {}, $$scope } = $$props;
	validate_slots("Preferences", slots, []);
	let activeTab = "general";

	let tabs = [
		{
			id: "general",
			title: "General",
			icon: "img-gearshape"
		},
		{
			id: "theme",
			title: "Theme",
			icon: "img-paintpalette-medium-regular"
		},
		{
			id: "markup",
			title: "Markup",
			icon: "img-textformat-medium-regular"
		},
		{
			id: "media",
			title: "Media",
			icon: "img-photo-medium-regular"
		},
		{
			id: "citations",
			title: "Citations",
			icon: "img-quote-bubble-medium-regular"
		}
	];

	const writable_props = [];

	Object.keys($$props).forEach(key => {
		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Preferences> was created with unknown prop '${key}'`);
	});

	const mouseup_handler = id => $$invalidate(0, activeTab = id);

	const click_handler = () => {
		window.api.send("dispatch", {
			type: "SET_MARKDOWN_OPTIONS",
			markdownOptions: {
				...$state.markdown,
				strikethrough: !$state.markdown.strikethrough
			}
		});
	};

	const click_handler_1 = () => {
		window.api.send("dispatch", {
			type: "SET_MARKDOWN_OPTIONS",
			markdownOptions: {
				...$state.markdown,
				implicitFigures: !$state.markdown.implicitFigures
			}
		});
	};

	const click_handler_2 = () => {
		window.api.send("dispatch", {
			type: "SET_MARKDOWN_OPTIONS",
			markdownOptions: {
				...$state.markdown,
				implicitFigures: !$state.markdown.implicitFigures
			}
		});
	};

	const click_handler_3 = () => {
		window.api.send("dispatch", {
			type: "SET_MARKDOWN_OPTIONS",
			markdownOptions: {
				...$state.markdown,
				implicitFigures: !$state.markdown.implicitFigures
			}
		});
	};

	const click_handler_4 = () => {
		window.api.send("dispatch", { type: "SET_MARKDOWN_OPTIONS" });
	};

	$$self.$capture_state = () => ({
		isWindowFocused,
		state,
		Checkbox,
		Description,
		FormRow,
		Separator,
		ToolbarTab,
		WindowFrame,
		WindowTitleBar,
		activeTab,
		tabs,
		windowTitle,
		$isWindowFocused,
		$state
	});

	$$self.$inject_state = $$props => {
		if ("activeTab" in $$props) $$invalidate(0, activeTab = $$props.activeTab);
		if ("tabs" in $$props) $$invalidate(4, tabs = $$props.tabs);
		if ("windowTitle" in $$props) $$invalidate(1, windowTitle = $$props.windowTitle);
	};

	let windowTitle;

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*activeTab*/ 1) {
			 $$invalidate(1, windowTitle = tabs.find(({ id }) => id == activeTab).title);
		}
	};

	return [
		activeTab,
		windowTitle,
		$isWindowFocused,
		$state,
		tabs,
		mouseup_handler,
		click_handler,
		click_handler_1,
		click_handler_2,
		click_handler_3,
		click_handler_4
	];
}

class Preferences extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-1hz4oz3-style")) add_css$7();
		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Preferences",
			options,
			id: create_fragment$7.name
		});
	}
}

// ------ SETUP ------ //

async function init$3() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState');
  const initialColors = await window.api.invoke('getColors', false);

  // Set initial values
  init$2(initialState);
  init$1(initialState, initialColors);

  // Create layout
  const layout = new Preferences({
    target: document.querySelector('#layout')
  });
}

window.addEventListener('DOMContentLoaded', init$3);
//# sourceMappingURL=preferences.js.map
