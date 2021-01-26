// WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
window.process = { env: { NODE_ENV: "production" } };
function noop() { }
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

F(); // Required by immer

// -------- STORES -------- //

const state = writable({});
const isWindowFocused = writable(false);
const project = writable({});
const sidebar = writable({});


// This (seemingly redundant) `stateAsObject` variable is for performance reasons. When we applyPatches(state, patches), we need to pass it the current state. We could get that from `state` writable by using `get(state)`, but that creates and destroys a one-time subscriber every time. Which has performance implications given how often we modify state. Svelte specifically recommends against this type of use, in the docs: https://svelte.dev/docs#get. So instead we create an intemediary `stateAsObject`, apply patches to it, and then pass it to state.set(...).
let stateAsObject = {};

// -------- SETUP AND UPDATE -------- //

class StateManager {
  constructor(initialState) {

    // Get and set window paramaters
    // Note: These are only used for normal app windows——not Preferences windows.
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    window.id = urlParams.get('id');

    // Update state when patches arrive from main...
    window.api.receive("statePatchesFromMain", (patches) => {
      
      // Apply patches to state, and update stores
      stateAsObject = vn(stateAsObject, patches);
      updateStateStores();
      
      // Update theme stylesheet
      if (stateHasChanged(patches, 'theme')) {
        setThemeStylesheet();
      }

      // Update `isWindowFocused` store when `focusedWindowId` changes. If it equals this `window.id`, set true. Else, set false.
      const focusedWindowHasChanged = stateHasChanged(patches, ['focusedWindowId']);
      if (focusedWindowHasChanged) {
        if (stateAsObject.focusedWindowId == window.id) {
          isWindowFocused.set(true);
        } else {
          isWindowFocused.set(false);
        }
      }
    });

    // Set initial values
    stateAsObject = initialState;
    isWindowFocused.set(stateAsObject.focusedWindowId == window.id);
    updateStateStores();
    setThemeStylesheet();
  }
}

// Listen for window closing, save files, then issue the all-clear to main.
// const windowStatusHasChanged = stateHasChanged(patches, ['window', 'status'])
// if (windowStatusHasChanged) {
//   if (stateAsObject) {
//     const proj = stateAsObject.projects.find((p) => p.window.id == window.id)
//     if (proj.window.status == 'wantsToClose') {
//       // TODO. Save files
//       window.api.send('dispatch', {
//         type: 'CAN_SAFELY_CLOSE_PROJECT_WINDOW',
//       })
//     }
//   }
// }


function updateStateStores() {
  state.set(stateAsObject);
  const proj = stateAsObject.projects.byId[window.id];

  // We use if statement here because `project` and `sidebar` are only relevant
  // to normal app windows——not to a Preferences window.
  if (proj) {
    project.set(proj);
    sidebar.set(proj.sidebar);
  }
}

/**
 * Set stylesheet href in index.html per `theme.editor`
 * If `theme.editor` name is 'solarized', then stylesheet 
 * href is './styles/themes/solarized/solarized.css'.
 */
function setThemeStylesheet() {
  const editorTheme = stateAsObject.theme.editor;
  const stylesheet = document.getElementById('editor-theme');
  const href = `./styles/themes/${editorTheme}/${editorTheme}.css`;
  stylesheet.setAttribute('href', href);
}

/* src/js/renderer/component/ui/ToolbarTab.svelte generated by Svelte v3.30.1 */
const file = "src/js/renderer/component/ui/ToolbarTab.svelte";

function add_css() {
	var style = element("style");
	style.id = "svelte-1r8zq0f-style";
	style.textContent = "@keyframes svelte-1r8zq0f-selectField{from{box-shadow:0 0 0 20px transparent}to{box-shadow:0 0 0 3.5px var(--controlAccentColor)}}.tab.svelte-1r8zq0f.svelte-1r8zq0f{width:55px;height:45px;border-radius:6px;display:flex;flex-direction:column;align-items:center;overflow:hidden;-webkit-app-region:no-drag}.tab.svelte-1r8zq0f .icon.svelte-1r8zq0f{-webkit-mask-size:contain;-webkit-mask-position:center;-webkit-mask-repeat:no-repeat;width:23px;min-height:21px;margin-top:5px;margin-bottom:2px;pointer-events:none}.tab.svelte-1r8zq0f .label.svelte-1r8zq0f{font-family:system-ui;font-weight:normal;font-size:11px;line-height:13px;letter-spacing:0px;text-align:center;margin:0;padding:0;pointer-events:none}.tab.isWindowFocused.svelte-1r8zq0f.svelte-1r8zq0f:not(.isSelected){background-color:none}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected) .icon.svelte-1r8zq0f{background-color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected) .icon.svelte-1r8zq0f{background-color:var(--labelColor);opacity:0.75}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected) .label.svelte-1r8zq0f{color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected) .label.svelte-1r8zq0f{color:var(--labelColor);opacity:0.75}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-1r8zq0f.svelte-1r8zq0f:not(.isSelected):hover{background:rgba(255, 255, 255, 0.08)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-1r8zq0f.svelte-1r8zq0f:not(.isSelected):hover{background:rgba(0, 0, 0, 0.05)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-1r8zq0f.svelte-1r8zq0f:not(.isSelected):active{background:rgba(255, 255, 255, 0.12)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-1r8zq0f.svelte-1r8zq0f:not(.isSelected):active{background:rgba(0, 0, 0, 0.08)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected):active .icon.svelte-1r8zq0f{background:var(--labelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected):active .icon.svelte-1r8zq0f{background:var(--labelColor)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected):active .label.svelte-1r8zq0f{color:var(--labelColor)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.svelte-1r8zq0f:not(.isSelected):active .label.svelte-1r8zq0f{color:var(--labelColor)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-1r8zq0f.svelte-1r8zq0f{background:rgba(255, 255, 255, 0.08)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.isSelected.svelte-1r8zq0f.svelte-1r8zq0f{background:rgba(0, 0, 0, 0.05)}}.tab.isWindowFocused.isSelected.svelte-1r8zq0f .icon.svelte-1r8zq0f{background-color:var(--controlAccentColor)}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-1r8zq0f .icon.svelte-1r8zq0f{filter:brightness(1.6)}}.tab.isWindowFocused.isSelected.svelte-1r8zq0f .label.svelte-1r8zq0f{color:var(--controlAccentColor)}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-1r8zq0f .label.svelte-1r8zq0f{filter:brightness(1.6)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-1r8zq0f:hover .icon.svelte-1r8zq0f{filter:brightness(2.25)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.isSelected.svelte-1r8zq0f:hover .icon.svelte-1r8zq0f{filter:brightness(0.7)}}@media(prefers-color-scheme: dark){.tab.isWindowFocused.isSelected.svelte-1r8zq0f:hover .label.svelte-1r8zq0f{filter:brightness(2.25)}}@media(prefers-color-scheme: light){.tab.isWindowFocused.isSelected.svelte-1r8zq0f:hover .label.svelte-1r8zq0f{filter:brightness(0.7)}}@media(prefers-color-scheme: dark){.tab:not(.isWindowFocused).isSelected.svelte-1r8zq0f.svelte-1r8zq0f{background:rgba(255, 255, 255, 0.08)}}@media(prefers-color-scheme: light){.tab:not(.isWindowFocused).isSelected.svelte-1r8zq0f.svelte-1r8zq0f{background:rgba(0, 0, 0, 0.05)}}@media(prefers-color-scheme: dark){.tab.svelte-1r8zq0f.svelte-1r8zq0f:not(.isWindowFocused):not(.isSelected){opacity:0.5}}@media(prefers-color-scheme: light){.tab.svelte-1r8zq0f.svelte-1r8zq0f:not(.isWindowFocused):not(.isSelected){opacity:0.6}}@media(prefers-color-scheme: dark){.tab.svelte-1r8zq0f:not(.isWindowFocused) .icon.svelte-1r8zq0f{background:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.svelte-1r8zq0f:not(.isWindowFocused) .icon.svelte-1r8zq0f{background:var(--secondaryLabelColor)}}@media(prefers-color-scheme: dark){.tab.svelte-1r8zq0f:not(.isWindowFocused) .label.svelte-1r8zq0f{color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){.tab.svelte-1r8zq0f:not(.isWindowFocused) .label.svelte-1r8zq0f{color:var(--secondaryLabelColor)}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVG9vbGJhclRhYi5zdmVsdGUiLCJzb3VyY2VzIjpbIlRvb2xiYXJUYWIuc3ZlbHRlIl0sInNvdXJjZXNDb250ZW50IjpbIjxzY3JpcHQ+XG4gIGltcG9ydCB7IGlzV2luZG93Rm9jdXNlZCB9IGZyb20gXCIuLi8uLi9TdGF0ZU1hbmFnZXJcIjtcblxuICBleHBvcnQgbGV0IGxhYmVsID0gJycgLy8gJ1NldHRpbmdzJ1xuICBleHBvcnQgbGV0IGljb24gPSAnJyAvLyAnaW1nLXBob3RvJ1xuICBleHBvcnQgbGV0IGlzU2VsZWN0ZWQgPSBmYWxzZVxuPC9zY3JpcHQ+XG5cbjxzdHlsZSB0eXBlPVwidGV4dC9zY3NzXCI+LyogLS0tLS0tLS0tLS0tLS0gTGlnaHQgJiBEYXJrIG1vZGUgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFNldCBmb2N1cyAtLS0tLS0tLS0tLS0tLSAqL1xuQGtleWZyYW1lcyBzZWxlY3RGaWVsZCB7XG4gIGZyb20ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDIwcHggdHJhbnNwYXJlbnQ7XG4gIH1cbiAgdG8ge1xuICAgIGJveC1zaGFkb3c6IDAgMCAwIDMuNXB4IHZhcigtLWNvbnRyb2xBY2NlbnRDb2xvcik7XG4gIH1cbn1cbi8qIC0tLS0tLS0tLS0tLS0tIENvbW1vbiBVSSBlbGVtZW50IHN0eWxlcyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTGF5b3V0IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBSZXNldCAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gTWF0ZXJpYWxzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBQYXR0ZXJucyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gVHlwb2dyYXBoeSAtLS0tLS0tLS0tLS0tLSAqL1xuLnRhYiB7XG4gIHdpZHRoOiA1NXB4O1xuICBoZWlnaHQ6IDQ1cHg7XG4gIGJvcmRlci1yYWRpdXM6IDZweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbiAgLXdlYmtpdC1hcHAtcmVnaW9uOiBuby1kcmFnO1xufVxuLnRhYiAuaWNvbiB7XG4gIC13ZWJraXQtbWFzay1zaXplOiBjb250YWluO1xuICAtd2Via2l0LW1hc2stcG9zaXRpb246IGNlbnRlcjtcbiAgLXdlYmtpdC1tYXNrLXJlcGVhdDogbm8tcmVwZWF0O1xuICB3aWR0aDogMjNweDtcbiAgbWluLWhlaWdodDogMjFweDtcbiAgbWFyZ2luLXRvcDogNXB4O1xuICBtYXJnaW4tYm90dG9tOiAycHg7XG4gIHBvaW50ZXItZXZlbnRzOiBub25lO1xufVxuLnRhYiAubGFiZWwge1xuICBmb250LWZhbWlseTogc3lzdGVtLXVpO1xuICBmb250LXdlaWdodDogbm9ybWFsO1xuICBmb250LXNpemU6IDExcHg7XG4gIGxpbmUtaGVpZ2h0OiAxM3B4O1xuICBsZXR0ZXItc3BhY2luZzogMHB4O1xuICB0ZXh0LWFsaWduOiBjZW50ZXI7XG4gIG1hcmdpbjogMDtcbiAgcGFkZGluZzogMDtcbiAgcG9pbnRlci1ldmVudHM6IG5vbmU7XG59XG5cbi50YWIuaXNXaW5kb3dGb2N1c2VkOm5vdCguaXNTZWxlY3RlZCkge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiBub25lO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpIC5pY29uIHtcbiAgICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKSAuaWNvbiB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gICAgb3BhY2l0eTogMC43NTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpIC5sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLXNlY29uZGFyeUxhYmVsQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpIC5sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICAgIG9wYWNpdHk6IDAuNzU7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTpob3ZlciB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTpob3ZlciB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjA1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpOmFjdGl2ZSB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEyKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTphY3RpdmUge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wOCk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTphY3RpdmUgLmljb24ge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWxhYmVsQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZDpub3QoLmlzU2VsZWN0ZWQpOmFjdGl2ZSAuaWNvbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tbGFiZWxDb2xvcik7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQ6bm90KC5pc1NlbGVjdGVkKTphY3RpdmUgLmxhYmVsIHtcbiAgICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkOm5vdCguaXNTZWxlY3RlZCk6YWN0aXZlIC5sYWJlbCB7XG4gICAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wOCk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQge1xuICAgIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC4wNSk7XG4gIH1cbn1cbi50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQgLmljb24ge1xuICBiYWNrZ3JvdW5kLWNvbG9yOiB2YXIoLS1jb250cm9sQWNjZW50Q29sb3IpO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiLmlzV2luZG93Rm9jdXNlZC5pc1NlbGVjdGVkIC5pY29uIHtcbiAgICBmaWx0ZXI6IGJyaWdodG5lc3MoMS42KTtcbiAgfVxufVxuLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZCAubGFiZWwge1xuICBjb2xvcjogdmFyKC0tY29udHJvbEFjY2VudENvbG9yKTtcbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZCAubGFiZWwge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygxLjYpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7XG4gIC50YWIuaXNXaW5kb3dGb2N1c2VkLmlzU2VsZWN0ZWQ6aG92ZXIgLmljb24ge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygyLjI1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZDpob3ZlciAuaWNvbiB7XG4gICAgZmlsdGVyOiBicmlnaHRuZXNzKDAuNyk7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZDpob3ZlciAubGFiZWwge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygyLjI1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYi5pc1dpbmRvd0ZvY3VzZWQuaXNTZWxlY3RlZDpob3ZlciAubGFiZWwge1xuICAgIGZpbHRlcjogYnJpZ2h0bmVzcygwLjcpO1xuICB9XG59XG5cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgLnRhYjpub3QoLmlzV2luZG93Rm9jdXNlZCkuaXNTZWxlY3RlZCB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjA4KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYjpub3QoLmlzV2luZG93Rm9jdXNlZCkuaXNTZWxlY3RlZCB7XG4gICAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjA1KTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiOm5vdCguaXNXaW5kb3dGb2N1c2VkKTpub3QoLmlzU2VsZWN0ZWQpIHtcbiAgICBvcGFjaXR5OiAwLjU7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWI6bm90KC5pc1dpbmRvd0ZvY3VzZWQpOm5vdCguaXNTZWxlY3RlZCkge1xuICAgIG9wYWNpdHk6IDAuNjtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiOm5vdCguaXNXaW5kb3dGb2N1c2VkKSAuaWNvbiB7XG4gICAgYmFja2dyb3VuZDogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG4gIH1cbn1cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGxpZ2h0KSB7XG4gIC50YWI6bm90KC5pc1dpbmRvd0ZvY3VzZWQpIC5pY29uIHtcbiAgICBiYWNrZ3JvdW5kOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAudGFiOm5vdCguaXNXaW5kb3dGb2N1c2VkKSAubGFiZWwge1xuICAgIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLnRhYjpub3QoLmlzV2luZG93Rm9jdXNlZCkgLmxhYmVsIHtcbiAgICBjb2xvcjogdmFyKC0tc2Vjb25kYXJ5TGFiZWxDb2xvcik7XG4gIH1cbn08L3N0eWxlPlxuXG48ZGl2IGNsYXNzPVwidGFiXCIgY2xhc3M6aXNXaW5kb3dGb2N1c2VkPXskaXNXaW5kb3dGb2N1c2VkfSBjbGFzczppc1NlbGVjdGVkIG9uOm1vdXNldXA+XG4gIDxkaXYgY2xhc3M9XCJpY29uXCIgc3R5bGU9e2Atd2Via2l0LW1hc2staW1hZ2U6IHZhcigtLSR7aWNvbn0pO2B9PjwvZGl2PlxuICA8aDEgY2xhc3M9XCJsYWJlbFwiPntsYWJlbH08L2gxPlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVVBLFdBQVcsMEJBQVksQ0FBQyxBQUN0QixJQUFJLEFBQUMsQ0FBQyxBQUNKLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxBQUNwQyxDQUFDLEFBQ0QsRUFBRSxBQUFDLENBQUMsQUFDRixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksb0JBQW9CLENBQUMsQUFDbkQsQ0FBQyxBQUNILENBQUMsQUFPRCxJQUFJLDhCQUFDLENBQUMsQUFDSixLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osYUFBYSxDQUFFLEdBQUcsQ0FDbEIsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsTUFBTSxDQUN0QixXQUFXLENBQUUsTUFBTSxDQUNuQixRQUFRLENBQUUsTUFBTSxDQUNoQixrQkFBa0IsQ0FBRSxPQUFPLEFBQzdCLENBQUMsQUFDRCxtQkFBSSxDQUFDLEtBQUssZUFBQyxDQUFDLEFBQ1YsaUJBQWlCLENBQUUsT0FBTyxDQUMxQixxQkFBcUIsQ0FBRSxNQUFNLENBQzdCLG1CQUFtQixDQUFFLFNBQVMsQ0FDOUIsS0FBSyxDQUFFLElBQUksQ0FDWCxVQUFVLENBQUUsSUFBSSxDQUNoQixVQUFVLENBQUUsR0FBRyxDQUNmLGFBQWEsQ0FBRSxHQUFHLENBQ2xCLGNBQWMsQ0FBRSxJ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 */";
	append_dev(document.head, style);
}

function create_fragment(ctx) {
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
			attr_dev(div0, "class", "icon svelte-1r8zq0f");
			attr_dev(div0, "style", div0_style_value = `-webkit-mask-image: var(--${/*icon*/ ctx[1]});`);
			add_location(div0, file, 210, 2, 5229);
			attr_dev(h1, "class", "label svelte-1r8zq0f");
			add_location(h1, file, 211, 2, 5302);
			attr_dev(div1, "class", "tab svelte-1r8zq0f");
			toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[3]);
			toggle_class(div1, "isSelected", /*isSelected*/ ctx[2]);
			add_location(div1, file, 209, 0, 5140);
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
		if (!document.getElementById("svelte-1r8zq0f-style")) add_css();
		init(this, options, instance, create_fragment, safe_not_equal, { label: 0, icon: 1, isSelected: 2 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "ToolbarTab",
			options,
			id: create_fragment.name
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
const file$1 = "src/js/renderer/component/ui/WindowFrame.svelte";

function add_css$1() {
	var style = element("style");
	style.id = "svelte-ihfk35-style";
	style.textContent = "@keyframes svelte-ihfk35-selectField{from{box-shadow:0 0 0 20px transparent}to{box-shadow:0 0 0 3.5px var(--controlAccentColor)}}.window-frame.svelte-ihfk35{-webkit-app-region:drag;user-select:none;border-width:0 0 1px;border-style:solid}@media(prefers-color-scheme: dark){.window-frame.svelte-ihfk35{border-color:var(--shadowColor)}}@media(prefers-color-scheme: light){.window-frame.svelte-ihfk35{border-color:var(--separatorColor)}}@media(prefers-color-scheme: dark){.window-frame.isWindowFocused.svelte-ihfk35{background-color:var(--windowBackgroundColor)}}@media(prefers-color-scheme: light){.window-frame.isWindowFocused.svelte-ihfk35{background:linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), var(--windowBackgroundColor)}}@media(prefers-color-scheme: dark){.window-frame.svelte-ihfk35:not(.isWindowFocused){background:linear-gradient(rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.25)), var(--windowBackgroundColor)}}@media(prefers-color-scheme: light){.window-frame.svelte-ihfk35:not(.isWindowFocused){background:linear-gradient(rgba(0, 0, 0, 0.02), rgba(0, 0, 0, 0.02)), var(--windowBackgroundColor)}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2luZG93RnJhbWUuc3ZlbHRlIiwic291cmNlcyI6WyJXaW5kb3dGcmFtZS5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkIH0gZnJvbSBcIi4uLy4uL1N0YXRlTWFuYWdlclwiO1xuXG48L3NjcmlwdD5cblxuPHN0eWxlIHR5cGU9XCJ0ZXh0L3Njc3NcIj4vKiAtLS0tLS0tLS0tLS0tLSBMaWdodCAmIERhcmsgbW9kZSAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gU2V0IGZvY3VzIC0tLS0tLS0tLS0tLS0tICovXG5Aa2V5ZnJhbWVzIHNlbGVjdEZpZWxkIHtcbiAgZnJvbSB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgMjBweCB0cmFuc3BhcmVudDtcbiAgfVxuICB0byB7XG4gICAgYm94LXNoYWRvdzogMCAwIDAgMy41cHggdmFyKC0tY29udHJvbEFjY2VudENvbG9yKTtcbiAgfVxufVxuLyogLS0tLS0tLS0tLS0tLS0gQ29tbW9uIFVJIGVsZW1lbnQgc3R5bGVzIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBMYXlvdXQgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFJlc2V0IC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBNYXRlcmlhbHMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFBhdHRlcm5zIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBUeXBvZ3JhcGh5IC0tLS0tLS0tLS0tLS0tICovXG4ud2luZG93LWZyYW1lIHtcbiAgLXdlYmtpdC1hcHAtcmVnaW9uOiBkcmFnO1xuICB1c2VyLXNlbGVjdDogbm9uZTtcbiAgYm9yZGVyLXdpZHRoOiAwIDAgMXB4O1xuICBib3JkZXItc3R5bGU6IHNvbGlkO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAud2luZG93LWZyYW1lIHtcbiAgICBib3JkZXItY29sb3I6IHZhcigtLXNoYWRvd0NvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLndpbmRvdy1mcmFtZSB7XG4gICAgYm9yZGVyLWNvbG9yOiB2YXIoLS1zZXBhcmF0b3JDb2xvcik7XG4gIH1cbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAud2luZG93LWZyYW1lLmlzV2luZG93Rm9jdXNlZCB7XG4gICAgYmFja2dyb3VuZC1jb2xvcjogdmFyKC0td2luZG93QmFja2dyb3VuZENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgLndpbmRvdy1mcmFtZS5pc1dpbmRvd0ZvY3VzZWQge1xuICAgIGJhY2tncm91bmQ6IGxpbmVhci1ncmFkaWVudChyZ2JhKDI1NSwgMjU1LCAyNTUsIDAuMSksIHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSksIHZhcigtLXdpbmRvd0JhY2tncm91bmRDb2xvcik7XG4gIH1cbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAud2luZG93LWZyYW1lOm5vdCguaXNXaW5kb3dGb2N1c2VkKSB7XG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHJnYmEoMCwgMCwgMCwgMC4yNSksIHJnYmEoMCwgMCwgMCwgMC4yNSkpLCB2YXIoLS13aW5kb3dCYWNrZ3JvdW5kQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAud2luZG93LWZyYW1lOm5vdCguaXNXaW5kb3dGb2N1c2VkKSB7XG4gICAgYmFja2dyb3VuZDogbGluZWFyLWdyYWRpZW50KHJnYmEoMCwgMCwgMCwgMC4wMiksIHJnYmEoMCwgMCwgMCwgMC4wMikpLCB2YXIoLS13aW5kb3dCYWNrZ3JvdW5kQ29sb3IpO1xuICB9XG59PC9zdHlsZT5cblxuPGRpdiBjbGFzcz1cIndpbmRvdy1mcmFtZVwiIGNsYXNzOmlzV2luZG93Rm9jdXNlZD17JGlzV2luZG93Rm9jdXNlZH0+XG4gIDxzbG90Pjwvc2xvdD5cbjwvZGl2PiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFPQSxXQUFXLHlCQUFZLENBQUMsQUFDdEIsSUFBSSxBQUFDLENBQUMsQUFDSixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDcEMsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFvQixDQUFDLEFBQ25ELENBQUMsQUFDSCxDQUFDLEFBT0QsYUFBYSxjQUFDLENBQUMsQUFDYixrQkFBa0IsQ0FBRSxJQUFJLENBQ3hCLFdBQVcsQ0FBRSxJQUFJLENBQ2pCLFlBQVksQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FDckIsWUFBWSxDQUFFLEtBQUssQUFDckIsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsSUFBSSxDQUFDLEFBQUMsQ0FBQyxBQUNuQyxhQUFhLGNBQUMsQ0FBQyxBQUNiLFlBQVksQ0FBRSxJQUFJLGFBQWEsQ0FBQyxBQUNsQyxDQUFDLEFBQ0gsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUNwQyxhQUFhLGNBQUMsQ0FBQyxBQUNiLFlBQVksQ0FBRSxJQUFJLGdCQUFnQixDQUFDLEFBQ3JDLENBQUMsQUFDSCxDQUFDLEFBRUQsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLGFBQWEsZ0JBQWdCLGNBQUMsQ0FBQyxBQUM3QixnQkFBZ0IsQ0FBRSxJQUFJLHVCQUF1QixDQUFDLEFBQ2hELENBQUMsQUFDSCxDQUFDLEFBQ0QsTUFBTSxBQUFDLHVCQUF1QixLQUFLLENBQUMsQUFBQyxDQUFDLEFBQ3BDLGFBQWEsZ0JBQWdCLGNBQUMsQ0FBQyxBQUM3QixVQUFVLENBQUUsZ0JBQWdCLEtBQUssR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLHVCQUF1QixDQUFDLEFBQy9HLENBQUMsQUFDSCxDQUFDLEFBRUQsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLDJCQUFhLEtBQUssZ0JBQWdCLENBQUMsQUFBQyxDQUFDLEFBQ25DLFVBQVUsQ0FBRSxnQkFBZ0IsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksdUJBQXVCLENBQUMsQUFDckcsQ0FBQyxBQUNILENBQUMsQUFDRCxNQUFNLEFBQUMsdUJBQXVCLEtBQUssQ0FBQyxBQUFDLENBQUMsQUFDcEMsMkJBQWEsS0FBSyxnQkFBZ0IsQ0FBQyxBQUFDLENBQUMsQUFDbkMsVUFBVSxDQUFFLGdCQUFnQixLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxBQUNyRyxDQUFDLEFBQ0gsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function create_fragment$1(ctx) {
	let div;
	let current;
	const default_slot_template = /*#slots*/ ctx[2].default;
	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

	const block = {
		c: function create() {
			div = element("div");
			if (default_slot) default_slot.c();
			attr_dev(div, "class", "window-frame svelte-ihfk35");
			toggle_class(div, "isWindowFocused", /*$isWindowFocused*/ ctx[0]);
			add_location(div, file$1, 60, 0, 1664);
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
		id: create_fragment$1.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$1($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-ihfk35-style")) add_css$1();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "WindowFrame",
			options,
			id: create_fragment$1.name
		});
	}
}

/* src/js/renderer/component/ui/WindowTitleBar.svelte generated by Svelte v3.30.1 */
const file$2 = "src/js/renderer/component/ui/WindowTitleBar.svelte";

function add_css$2() {
	var style = element("style");
	style.id = "svelte-1gta8j1-style";
	style.textContent = "@keyframes svelte-1gta8j1-selectField{from{box-shadow:0 0 0 20px transparent}to{box-shadow:0 0 0 3.5px var(--controlAccentColor)}}header.svelte-1gta8j1{font-family:system-ui;font-weight:bold;font-size:13px;line-height:15px;letter-spacing:-0.08px;display:flex;justify-content:center;align-items:center;margin:0;height:28px}@media(prefers-color-scheme: dark){header.svelte-1gta8j1{color:var(--secondaryLabelColor)}}@media(prefers-color-scheme: light){header.svelte-1gta8j1{color:var(--labelColor)}}@media(prefers-color-scheme: dark){header.isWindowFocused.svelte-1gta8j1{opacity:1}}@media(prefers-color-scheme: light){header.isWindowFocused.svelte-1gta8j1{opacity:0.85}}@media(prefers-color-scheme: dark){header.svelte-1gta8j1:not(.isWindowFocused){opacity:0.5}}@media(prefers-color-scheme: light){header.svelte-1gta8j1:not(.isWindowFocused){opacity:0.35}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2luZG93VGl0bGVCYXIuc3ZlbHRlIiwic291cmNlcyI6WyJXaW5kb3dUaXRsZUJhci5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkIH0gZnJvbSBcIi4uLy4uL1N0YXRlTWFuYWdlclwiO1xuICBleHBvcnQgbGV0IHRpdGxlID0gJydcbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIExpZ2h0ICYgRGFyayBtb2RlIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBTZXQgZm9jdXMgLS0tLS0tLS0tLS0tLS0gKi9cbkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAyMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAzLjVweCB2YXIoLS1jb250cm9sQWNjZW50Q29sb3IpO1xuICB9XG59XG4vKiAtLS0tLS0tLS0tLS0tLSBDb21tb24gVUkgZWxlbWVudCBzdHlsZXMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIExheW91dCAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUmVzZXQgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbmhlYWRlciB7XG4gIGZvbnQtZmFtaWx5OiBzeXN0ZW0tdWk7XG4gIGZvbnQtd2VpZ2h0OiBib2xkO1xuICBmb250LXNpemU6IDEzcHg7XG4gIGxpbmUtaGVpZ2h0OiAxNXB4O1xuICBsZXR0ZXItc3BhY2luZzogLTAuMDhweDtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIG1hcmdpbjogMDtcbiAgaGVpZ2h0OiAyOHB4O1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICBoZWFkZXIge1xuICAgIGNvbG9yOiB2YXIoLS1zZWNvbmRhcnlMYWJlbENvbG9yKTtcbiAgfVxufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogbGlnaHQpIHtcbiAgaGVhZGVyIHtcbiAgICBjb2xvcjogdmFyKC0tbGFiZWxDb2xvcik7XG4gIH1cbn1cblxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICBoZWFkZXIuaXNXaW5kb3dGb2N1c2VkIHtcbiAgICBvcGFjaXR5OiAxO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICBoZWFkZXIuaXNXaW5kb3dGb2N1c2VkIHtcbiAgICBvcGFjaXR5OiAwLjg1O1xuICB9XG59XG5cbkBtZWRpYSAocHJlZmVycy1jb2xvci1zY2hlbWU6IGRhcmspIHtcbiAgaGVhZGVyOm5vdCguaXNXaW5kb3dGb2N1c2VkKSB7XG4gICAgb3BhY2l0eTogMC41O1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICBoZWFkZXI6bm90KC5pc1dpbmRvd0ZvY3VzZWQpIHtcbiAgICBvcGFjaXR5OiAwLjM1O1xuICB9XG59PC9zdHlsZT5cblxuPGhlYWRlciBjbGFzczppc1dpbmRvd0ZvY3VzZWQ9eyRpc1dpbmRvd0ZvY3VzZWR9Pnt0aXRsZX08L2hlYWRlcj4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBT0EsV0FBVywwQkFBWSxDQUFDLEFBQ3RCLElBQUksQUFBQyxDQUFDLEFBQ0osVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEFBQ3BDLENBQUMsQUFDRCxFQUFFLEFBQUMsQ0FBQyxBQUNGLFVBQVUsQ0FBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxBQUNuRCxDQUFDLEFBQ0gsQ0FBQyxBQU9ELE1BQU0sZUFBQyxDQUFDLEFBQ04sV0FBVyxDQUFFLFNBQVMsQ0FDdEIsV0FBVyxDQUFFLElBQUksQ0FDakIsU0FBUyxDQUFFLElBQUksQ0FDZixXQUFXLENBQUUsSUFBSSxDQUNqQixjQUFjLENBQUUsT0FBTyxDQUN2QixPQUFPLENBQUUsSUFBSSxDQUNiLGVBQWUsQ0FBRSxNQUFNLENBQ3ZCLFdBQVcsQ0FBRSxNQUFNLENBQ25CLE1BQU0sQ0FBRSxDQUFDLENBQ1QsTUFBTSxDQUFFLElBQUksQUFDZCxDQUFDLEFBQ0QsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLE1BQU0sZUFBQyxDQUFDLEFBQ04sS0FBSyxDQUFFLElBQUkscUJBQXFCLENBQUMsQUFDbkMsQ0FBQyxBQUNILENBQUMsQUFDRCxNQUFNLEFBQUMsdUJBQXVCLEtBQUssQ0FBQyxBQUFDLENBQUMsQUFDcEMsTUFBTSxlQUFDLENBQUMsQUFDTixLQUFLLENBQUUsSUFBSSxZQUFZLENBQUMsQUFDMUIsQ0FBQyxBQUNILENBQUMsQUFFRCxNQUFNLEFBQUMsdUJBQXVCLElBQUksQ0FBQyxBQUFDLENBQUMsQUFDbkMsTUFBTSxnQkFBZ0IsZUFBQyxDQUFDLEFBQ3RCLE9BQU8sQ0FBRSxDQUFDLEFBQ1osQ0FBQyxBQUNILENBQUMsQUFDRCxNQUFNLEFBQUMsdUJBQXVCLEtBQUssQ0FBQyxBQUFDLENBQUMsQUFDcEMsTUFBTSxnQkFBZ0IsZUFBQyxDQUFDLEFBQ3RCLE9BQU8sQ0FBRSxJQUFJLEFBQ2YsQ0FBQyxBQUNILENBQUMsQUFFRCxNQUFNLEFBQUMsdUJBQXVCLElBQUksQ0FBQyxBQUFDLENBQUMsQUFDbkMscUJBQU0sS0FBSyxnQkFBZ0IsQ0FBQyxBQUFDLENBQUMsQUFDNUIsT0FBTyxDQUFFLEdBQUcsQUFDZCxDQUFDLEFBQ0gsQ0FBQyxBQUNELE1BQU0sQUFBQyx1QkFBdUIsS0FBSyxDQUFDLEFBQUMsQ0FBQyxBQUNwQyxxQkFBTSxLQUFLLGdCQUFnQixDQUFDLEFBQUMsQ0FBQyxBQUM1QixPQUFPLENBQUUsSUFBSSxBQUNmLENBQUMsQUFDSCxDQUFDIn0= */";
	append_dev(document.head, style);
}

function create_fragment$2(ctx) {
	let header;
	let t;

	const block = {
		c: function create() {
			header = element("header");
			t = text(/*title*/ ctx[0]);
			attr_dev(header, "class", "svelte-1gta8j1");
			toggle_class(header, "isWindowFocused", /*$isWindowFocused*/ ctx[1]);
			add_location(header, file$2, 66, 0, 1436);
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
		id: create_fragment$2.name,
		type: "component",
		source: "",
		ctx
	});

	return block;
}

function instance$2($$self, $$props, $$invalidate) {
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
		if (!document.getElementById("svelte-1gta8j1-style")) add_css$2();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { title: 0 });

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "WindowTitleBar",
			options,
			id: create_fragment$2.name
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
const file$3 = "src/js/renderer/component/preferences/Preferences.svelte";

function add_css$3() {
	var style = element("style");
	style.id = "svelte-18z22lj-style";
	style.textContent = "@keyframes svelte-18z22lj-selectField{from{box-shadow:0 0 0 20px transparent}to{box-shadow:0 0 0 3.5px var(--controlAccentColor)}}#main.svelte-18z22lj{width:100%;height:100%;overflow:hidden}.toolbar.svelte-18z22lj{display:flex;width:100%;justify-content:center;height:52px;gap:2px}.window-body.svelte-18z22lj{height:100%;padding:20px;display:flex;flex-direction:column;gap:10px 0;overflow-x:hidden;overflow-y:scroll}@media(prefers-color-scheme: dark){.window-body.svelte-18z22lj{background:var(--controlBackgroundColor)}}@media(prefers-color-scheme: light){.window-body.svelte-18z22lj{background:var(--windowBackgroundColor)}}\n/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJlZmVyZW5jZXMuc3ZlbHRlIiwic291cmNlcyI6WyJQcmVmZXJlbmNlcy5zdmVsdGUiXSwic291cmNlc0NvbnRlbnQiOlsiPHNjcmlwdD5cbiAgaW1wb3J0IHsgaXNXaW5kb3dGb2N1c2VkIH0gZnJvbSAnLi4vLi4vU3RhdGVNYW5hZ2VyJztcbiAgaW1wb3J0IFRvb2xiYXJUYWIgZnJvbSAnLi4vdWkvVG9vbGJhclRhYi5zdmVsdGUnO1xuICBpbXBvcnQgV2luZG93RnJhbWUgZnJvbSAnLi4vdWkvV2luZG93RnJhbWUuc3ZlbHRlJztcbiAgaW1wb3J0IFdpbmRvd1RpdGxlQmFyIGZyb20gJy4uL3VpL1dpbmRvd1RpdGxlQmFyLnN2ZWx0ZSc7IFxuXG4gIGxldCBhY3RpdmVUYWIgPSAnZ2VuZXJhbCdcblxuICBsZXQgdGFicyA9IFtcbiAgICB7XG4gICAgICBpZDogJ2dlbmVyYWwnLFxuICAgICAgdGl0bGU6ICdHZW5lcmFsJyxcbiAgICAgIGljb246ICdpbWctZ2VhcnNoYXBlJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICd0aGVtZScsXG4gICAgICB0aXRsZTogJ1RoZW1lJyxcbiAgICAgIGljb246ICdpbWctcGFpbnRwYWxldHRlLW1lZGl1bS1yZWd1bGFyJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICdtYXJrdXAnLFxuICAgICAgdGl0bGU6ICdNYXJrdXAnLFxuICAgICAgaWNvbjogJ2ltZy10ZXh0Zm9ybWF0LW1lZGl1bS1yZWd1bGFyJ1xuICAgIH0sXG4gICAge1xuICAgICAgaWQ6ICdtZWRpYScsXG4gICAgICB0aXRsZTogJ01lZGlhJyxcbiAgICAgIGljb246ICdpbWctcGhvdG8tbWVkaXVtLXJlZ3VsYXInXG4gICAgfSxcbiAgICB7XG4gICAgICBpZDogJ2NpdGF0aW9ucycsXG4gICAgICB0aXRsZTogJ0NpdGF0aW9ucycsXG4gICAgICBpY29uOiAnaW1nLXF1b3RlLWJ1YmJsZS1tZWRpdW0tcmVndWxhcidcbiAgICB9LFxuICBdXG5cbjwvc2NyaXB0PlxuXG48c3R5bGUgdHlwZT1cInRleHQvc2Nzc1wiPi8qIC0tLS0tLS0tLS0tLS0tIExpZ2h0ICYgRGFyayBtb2RlIC0tLS0tLS0tLS0tLS0tICovXG4vKiAtLS0tLS0tLS0tLS0tLSBTZXQgZm9jdXMgLS0tLS0tLS0tLS0tLS0gKi9cbkBrZXlmcmFtZXMgc2VsZWN0RmllbGQge1xuICBmcm9tIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAyMHB4IHRyYW5zcGFyZW50O1xuICB9XG4gIHRvIHtcbiAgICBib3gtc2hhZG93OiAwIDAgMCAzLjVweCB2YXIoLS1jb250cm9sQWNjZW50Q29sb3IpO1xuICB9XG59XG4vKiAtLS0tLS0tLS0tLS0tLSBDb21tb24gVUkgZWxlbWVudCBzdHlsZXMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIExheW91dCAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUmVzZXQgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIE1hdGVyaWFscyAtLS0tLS0tLS0tLS0tLSAqL1xuLyogLS0tLS0tLS0tLS0tLS0gUGF0dGVybnMgLS0tLS0tLS0tLS0tLS0gKi9cbi8qIC0tLS0tLS0tLS0tLS0tIFR5cG9ncmFwaHkgLS0tLS0tLS0tLS0tLS0gKi9cbiNtYWluIHtcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMTAwJTtcbiAgb3ZlcmZsb3c6IGhpZGRlbjtcbn1cblxuLnRvb2xiYXIge1xuICBkaXNwbGF5OiBmbGV4O1xuICB3aWR0aDogMTAwJTtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGhlaWdodDogNTJweDtcbiAgZ2FwOiAycHg7XG59XG5cbi53aW5kb3ctYm9keSB7XG4gIGhlaWdodDogMTAwJTtcbiAgcGFkZGluZzogMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcbiAgZ2FwOiAxMHB4IDA7XG4gIG92ZXJmbG93LXg6IGhpZGRlbjtcbiAgb3ZlcmZsb3cteTogc2Nyb2xsO1xufVxuQG1lZGlhIChwcmVmZXJzLWNvbG9yLXNjaGVtZTogZGFyaykge1xuICAud2luZG93LWJvZHkge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLWNvbnRyb2xCYWNrZ3JvdW5kQ29sb3IpO1xuICB9XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBsaWdodCkge1xuICAud2luZG93LWJvZHkge1xuICAgIGJhY2tncm91bmQ6IHZhcigtLXdpbmRvd0JhY2tncm91bmRDb2xvcik7XG4gIH1cbn1cblxuLnJvdyB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgbWFyZ2luLWxlZnQ6IDQwJTtcbn1cblxuLmxhYmVsIHtcbiAgZm9udC1mYW1pbHk6IHN5c3RlbS11aTtcbiAgZm9udC13ZWlnaHQ6IG5vcm1hbDtcbiAgZm9udC1zaXplOiAxM3B4O1xuICBsaW5lLWhlaWdodDogMTVweDtcbiAgbGV0dGVyLXNwYWNpbmc6IC0wLjA4cHg7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgbGVmdDogLThweDtcbiAgY29sb3I6IHZhcigtLWxhYmVsQ29sb3IpO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMTAwJSwgMCk7XG4gIGhlaWdodDogMjBweDtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbn1cblxuLmxhYmVsLnNlY29uZGFyeSB7XG4gIG9wYWNpdHk6IDAuMjU7XG59PC9zdHlsZT5cblxuPGRpdiBpZD1cIm1haW5cIiBjbGFzczppc1dpbmRvd0ZvY3VzZWQ9eyRpc1dpbmRvd0ZvY3VzZWR9PlxuXG4gICA8IS0tLS0tLS0tLS0gRlJBTUUgLS0tLS0tLS0tLT5cblxuICA8V2luZG93RnJhbWU+XG4gICAgPFdpbmRvd1RpdGxlQmFyIHRpdGxlPXt0YWJzLmZpbmQoKHQpID0+IHQuaWQgPT0gYWN0aXZlVGFiKS50aXRsZX0gLz5cbiAgICA8ZGl2IGNsYXNzPVwidG9vbGJhclwiPlxuICAgICAgeyNlYWNoIHRhYnMgYXMge2lkLCB0aXRsZSwgaWNvbn19XG4gICAgICAgIDxUb29sYmFyVGFiIGxhYmVsPXt0aXRsZX0gaWNvbj17aWNvbn0gaXNTZWxlY3RlZD17aWQgPT0gYWN0aXZlVGFifSBvbjptb3VzZXVwPXsoKSA9PiBhY3RpdmVUYWIgPSBpZH0vPlxuICAgICAgey9lYWNofVxuICAgIDwvZGl2PlxuICA8L1dpbmRvd0ZyYW1lPlxuICBcblxuICA8IS0tLS0tLS0tLS0gQk9EWSAtLS0tLS0tLS0tPlxuXG4gIDxkaXYgY2xhc3M9XCJ3aW5kb3ctYm9keVwiPlxuXG4gICAgPCEtLSBUT0RPIC0tPlxuXG4gIDwvZGl2PlxuPC9kaXY+Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQXdDQSxXQUFXLDBCQUFZLENBQUMsQUFDdEIsSUFBSSxBQUFDLENBQUMsQUFDSixVQUFVLENBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQUFDcEMsQ0FBQyxBQUNELEVBQUUsQUFBQyxDQUFDLEFBQ0YsVUFBVSxDQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFvQixDQUFDLEFBQ25ELENBQUMsQUFDSCxDQUFDLEFBT0QsS0FBSyxlQUFDLENBQUMsQUFDTCxLQUFLLENBQUUsSUFBSSxDQUNYLE1BQU0sQ0FBRSxJQUFJLENBQ1osUUFBUSxDQUFFLE1BQU0sQUFDbEIsQ0FBQyxBQUVELFFBQVEsZUFBQyxDQUFDLEFBQ1IsT0FBTyxDQUFFLElBQUksQ0FDYixLQUFLLENBQUUsSUFBSSxDQUNYLGVBQWUsQ0FBRSxNQUFNLENBQ3ZCLE1BQU0sQ0FBRSxJQUFJLENBQ1osR0FBRyxDQUFFLEdBQUcsQUFDVixDQUFDLEFBRUQsWUFBWSxlQUFDLENBQUMsQUFDWixNQUFNLENBQUUsSUFBSSxDQUNaLE9BQU8sQ0FBRSxJQUFJLENBQ2IsT0FBTyxDQUFFLElBQUksQ0FDYixjQUFjLENBQUUsTUFBTSxDQUN0QixHQUFHLENBQUUsSUFBSSxDQUFDLENBQUMsQ0FDWCxVQUFVLENBQUUsTUFBTSxDQUNsQixVQUFVLENBQUUsTUFBTSxBQUNwQixDQUFDLEFBQ0QsTUFBTSxBQUFDLHVCQUF1QixJQUFJLENBQUMsQUFBQyxDQUFDLEFBQ25DLFlBQVksZUFBQyxDQUFDLEFBQ1osVUFBVSxDQUFFLElBQUksd0JBQXdCLENBQUMsQUFDM0MsQ0FBQyxBQUNILENBQUMsQUFDRCxNQUFNLEFBQUMsdUJBQXVCLEtBQUssQ0FBQyxBQUFDLENBQUMsQUFDcEMsWUFBWSxlQUFDLENBQUMsQUFDWixVQUFVLENBQUUsSUFBSSx1QkFBdUIsQ0FBQyxBQUMxQyxDQUFDLEFBQ0gsQ0FBQyJ9 */";
	append_dev(document.head, style);
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[5] = list[i].id;
	child_ctx[6] = list[i].title;
	child_ctx[7] = list[i].icon;
	return child_ctx;
}

// (120:6) {#each tabs as {id, title, icon}}
function create_each_block(ctx) {
	let toolbartab;
	let current;

	function mouseup_handler() {
		return /*mouseup_handler*/ ctx[4](/*id*/ ctx[5]);
	}

	toolbartab = new ToolbarTab({
			props: {
				label: /*title*/ ctx[6],
				icon: /*icon*/ ctx[7],
				isSelected: /*id*/ ctx[5] == /*activeTab*/ ctx[0]
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
			if (dirty & /*activeTab*/ 1) toolbartab_changes.isSelected = /*id*/ ctx[5] == /*activeTab*/ ctx[0];
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
		source: "(120:6) {#each tabs as {id, title, icon}}",
		ctx
	});

	return block;
}

// (117:2) <WindowFrame>
function create_default_slot(ctx) {
	let windowtitlebar;
	let t;
	let div;
	let current;

	windowtitlebar = new WindowTitleBar({
			props: {
				title: /*tabs*/ ctx[2].find(/*func*/ ctx[3]).title
			},
			$$inline: true
		});

	let each_value = /*tabs*/ ctx[2];
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

			attr_dev(div, "class", "toolbar svelte-18z22lj");
			add_location(div, file$3, 118, 4, 2433);
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
			if (dirty & /*activeTab*/ 1) windowtitlebar_changes.title = /*tabs*/ ctx[2].find(/*func*/ ctx[3]).title;
			windowtitlebar.$set(windowtitlebar_changes);

			if (dirty & /*tabs, activeTab*/ 5) {
				each_value = /*tabs*/ ctx[2];
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
		id: create_default_slot.name,
		type: "slot",
		source: "(117:2) <WindowFrame>",
		ctx
	});

	return block;
}

function create_fragment$3(ctx) {
	let div1;
	let windowframe;
	let t;
	let div0;
	let current;

	windowframe = new WindowFrame({
			props: {
				$$slots: { default: [create_default_slot] },
				$$scope: { ctx }
			},
			$$inline: true
		});

	const block = {
		c: function create() {
			div1 = element("div");
			create_component(windowframe.$$.fragment);
			t = space();
			div0 = element("div");
			attr_dev(div0, "class", "window-body svelte-18z22lj");
			add_location(div0, file$3, 128, 2, 2687);
			attr_dev(div1, "id", "main");
			attr_dev(div1, "class", "svelte-18z22lj");
			toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[1]);
			add_location(div1, file$3, 112, 0, 2247);
		},
		l: function claim(nodes) {
			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
		},
		m: function mount(target, anchor) {
			insert_dev(target, div1, anchor);
			mount_component(windowframe, div1, null);
			append_dev(div1, t);
			append_dev(div1, div0);
			current = true;
		},
		p: function update(ctx, [dirty]) {
			const windowframe_changes = {};

			if (dirty & /*$$scope, activeTab*/ 1025) {
				windowframe_changes.$$scope = { dirty, ctx };
			}

			windowframe.$set(windowframe_changes);

			if (dirty & /*$isWindowFocused*/ 2) {
				toggle_class(div1, "isWindowFocused", /*$isWindowFocused*/ ctx[1]);
			}
		},
		i: function intro(local) {
			if (current) return;
			transition_in(windowframe.$$.fragment, local);
			current = true;
		},
		o: function outro(local) {
			transition_out(windowframe.$$.fragment, local);
			current = false;
		},
		d: function destroy(detaching) {
			if (detaching) detach_dev(div1);
			destroy_component(windowframe);
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
	let $isWindowFocused;
	validate_store(isWindowFocused, "isWindowFocused");
	component_subscribe($$self, isWindowFocused, $$value => $$invalidate(1, $isWindowFocused = $$value));
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

	const func = t => t.id == activeTab;
	const mouseup_handler = id => $$invalidate(0, activeTab = id);

	$$self.$capture_state = () => ({
		isWindowFocused,
		ToolbarTab,
		WindowFrame,
		WindowTitleBar,
		activeTab,
		tabs,
		$isWindowFocused
	});

	$$self.$inject_state = $$props => {
		if ("activeTab" in $$props) $$invalidate(0, activeTab = $$props.activeTab);
		if ("tabs" in $$props) $$invalidate(2, tabs = $$props.tabs);
	};

	if ($$props && "$$inject" in $$props) {
		$$self.$inject_state($$props.$$inject);
	}

	return [activeTab, $isWindowFocused, tabs, func, mouseup_handler];
}

class Preferences extends SvelteComponentDev {
	constructor(options) {
		super(options);
		if (!document.getElementById("svelte-18z22lj-style")) add_css$3();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

		dispatch_dev("SvelteRegisterComponent", {
			component: this,
			tagName: "Preferences",
			options,
			id: create_fragment$3.name
		});
	}
}

// Going to need to read and set state
// Going to need to get state to Svelte components

async function init$1() {

  // Get initial state and files
  const initialState = await window.api.invoke('getState');
  // const initialFiles = await window.api.invoke('getFiles')

  // Create managers
  const stateManager = new StateManager(initialState);

  // Create layout
  const layout = new Preferences({
    target: document.querySelector('#layout')
  });
}

window.addEventListener('DOMContentLoaded', init$1);
//# sourceMappingURL=preferences.js.map
