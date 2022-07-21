
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
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
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
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
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
        });
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
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

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
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
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
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

    /* src\Screens\Welcome.svelte generated by Svelte v3.49.0 */
    const file$3 = "src\\Screens\\Welcome.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (38:4) {#each renderedCategories as category}
    function create_each_block$1(ctx) {
    	let button;
    	let t_value = /*category*/ ctx[6].label + "";
    	let t;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*category*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			button.disabled = /*selected*/ ctx[0];
    			attr_dev(button, "class", "svelte-1r4o6qj");
    			add_location(button, file$3, 38, 8, 884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*renderedCategories*/ 2 && t_value !== (t_value = /*category*/ ctx[6].label + "")) set_data_dev(t, t_value);

    			if (dirty & /*selected*/ 1) {
    				prop_dev(button, "disabled", /*selected*/ ctx[0]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(38:4) {#each renderedCategories as category}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let header;
    	let h1;
    	let t0;
    	let span;
    	let t2;
    	let t3;
    	let p0;
    	let t4;
    	let a;
    	let t6;
    	let t7;
    	let p1;
    	let t9;
    	let p2;
    	let t11;
    	let div;
    	let each_value = /*renderedCategories*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			t0 = text("CameoP");
    			span = element("span");
    			span.textContent = "a";
    			t2 = text("rison");
    			t3 = space();
    			p0 = element("p");
    			t4 = text("On ");
    			a = element("a");
    			a.textContent = "cameo.com";
    			t6 = text(", you can buy personalised video clips from everyone from Lindsay Lohan to Ice T.");
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "But who commands the highest price?";
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "Pick a category to play a game:";
    			t11 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(span, "class", "logo svelte-1r4o6qj");
    			add_location(span, file$3, 24, 14, 499);
    			attr_dev(h1, "class", "svelte-1r4o6qj");
    			add_location(h1, file$3, 23, 4, 479);
    			attr_dev(a, "href", "https://cameo.com");
    			add_location(a, file$3, 28, 11, 567);
    			attr_dev(p0, "class", "svelte-1r4o6qj");
    			add_location(p0, file$3, 27, 4, 551);
    			attr_dev(p1, "class", "svelte-1r4o6qj");
    			add_location(p1, file$3, 31, 4, 707);
    			add_location(header, file$3, 22, 0, 465);
    			attr_dev(p2, "class", "svelte-1r4o6qj");
    			add_location(p2, file$3, 34, 0, 764);
    			attr_dev(div, "class", "categories svelte-1r4o6qj");
    			add_location(div, file$3, 36, 0, 806);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, t0);
    			append_dev(h1, span);
    			append_dev(h1, t2);
    			append_dev(header, t3);
    			append_dev(header, p0);
    			append_dev(p0, t4);
    			append_dev(p0, a);
    			append_dev(p0, t6);
    			append_dev(header, t7);
    			append_dev(header, p1);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selected, select, renderedCategories*/ 7) {
    				each_value = /*renderedCategories*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
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
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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
    	let renderedCategories;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Welcome', slots, []);
    	const dispatch = createEventDispatcher();
    	let { categories } = $$props;
    	let selected = false;

    	const select = category => {
    		$$invalidate(0, selected = true);
    		dispatch('select', { category });
    	};

    	const writable_props = ['categories'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Welcome> was created with unknown prop '${key}'`);
    	});

    	const click_handler = category => select(category);

    	$$self.$$set = $$props => {
    		if ('categories' in $$props) $$invalidate(3, categories = $$props.categories);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		dispatch,
    		categories,
    		selected,
    		select,
    		renderedCategories
    	});

    	$$self.$inject_state = $$props => {
    		if ('categories' in $$props) $$invalidate(3, categories = $$props.categories);
    		if ('selected' in $$props) $$invalidate(0, selected = $$props.selected);
    		if ('renderedCategories' in $$props) $$invalidate(1, renderedCategories = $$props.renderedCategories);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*categories*/ 8) {
    			$$invalidate(1, renderedCategories = categories.map(d => {
    				return {
    					slug: d,
    					label: d[0].toUpperCase() + d.slice(1)
    				};
    			}));
    		}
    	};

    	return [selected, renderedCategories, select, categories, click_handler];
    }

    class Welcome extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { categories: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Welcome",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*categories*/ ctx[3] === undefined && !('categories' in props)) {
    			console.warn("<Welcome> was created without expected prop 'categories'");
    		}
    	}

    	get categories() {
    		throw new Error("<Welcome>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set categories(value) {
    		throw new Error("<Welcome>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*
    Adapted from https://github.com/mattdesl
    Distributed under MIT License https://github.com/mattdesl/eases/blob/master/LICENSE.md
    */
    function backInOut(t) {
        const s = 1.70158 * 1.525;
        if ((t *= 2) < 1)
            return 0.5 * (t * t * ((s + 1) * t - s));
        return 0.5 * ((t -= 2) * t * ((s + 1) * t + s) + 2);
    }
    function backIn(t) {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
    }
    function backOut(t) {
        const s = 1.70158;
        return --t * t * ((s + 1) * t + s) + 1;
    }
    function bounceOut(t) {
        const a = 4.0 / 11.0;
        const b = 8.0 / 11.0;
        const c = 9.0 / 10.0;
        const ca = 4356.0 / 361.0;
        const cb = 35442.0 / 1805.0;
        const cc = 16061.0 / 1805.0;
        const t2 = t * t;
        return t < a
            ? 7.5625 * t2
            : t < b
                ? 9.075 * t2 - 9.9 * t + 3.4
                : t < c
                    ? ca * t2 - cb * t + cc
                    : 10.8 * t * t - 20.52 * t + 10.72;
    }
    function bounceInOut(t) {
        return t < 0.5
            ? 0.5 * (1.0 - bounceOut(1.0 - t * 2.0))
            : 0.5 * bounceOut(t * 2.0 - 1.0) + 0.5;
    }
    function bounceIn(t) {
        return 1.0 - bounceOut(1.0 - t);
    }
    function circInOut(t) {
        if ((t *= 2) < 1)
            return -0.5 * (Math.sqrt(1 - t * t) - 1);
        return 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    }
    function circIn(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    }
    function circOut(t) {
        return Math.sqrt(1 - --t * t);
    }
    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicIn(t) {
        return t * t * t;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function elasticInOut(t) {
        return t < 0.5
            ? 0.5 *
                Math.sin(((+13.0 * Math.PI) / 2) * 2.0 * t) *
                Math.pow(2.0, 10.0 * (2.0 * t - 1.0))
            : 0.5 *
                Math.sin(((-13.0 * Math.PI) / 2) * (2.0 * t - 1.0 + 1.0)) *
                Math.pow(2.0, -10.0 * (2.0 * t - 1.0)) +
                1.0;
    }
    function elasticIn(t) {
        return Math.sin((13.0 * t * Math.PI) / 2) * Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function elasticOut(t) {
        return (Math.sin((-13.0 * (t + 1.0) * Math.PI) / 2) * Math.pow(2.0, -10.0 * t) + 1.0);
    }
    function expoInOut(t) {
        return t === 0.0 || t === 1.0
            ? t
            : t < 0.5
                ? +0.5 * Math.pow(2.0, 20.0 * t - 10.0)
                : -0.5 * Math.pow(2.0, 10.0 - t * 20.0) + 1.0;
    }
    function expoIn(t) {
        return t === 0.0 ? t : Math.pow(2.0, 10.0 * (t - 1.0));
    }
    function expoOut(t) {
        return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
    }
    function quadInOut(t) {
        t /= 0.5;
        if (t < 1)
            return 0.5 * t * t;
        t--;
        return -0.5 * (t * (t - 2) - 1);
    }
    function quadIn(t) {
        return t * t;
    }
    function quadOut(t) {
        return -t * (t - 2.0);
    }
    function quartInOut(t) {
        return t < 0.5
            ? +8.0 * Math.pow(t, 4.0)
            : -8.0 * Math.pow(t - 1.0, 4.0) + 1.0;
    }
    function quartIn(t) {
        return Math.pow(t, 4.0);
    }
    function quartOut(t) {
        return Math.pow(t - 1.0, 3.0) * (1.0 - t) + 1.0;
    }
    function quintInOut(t) {
        if ((t *= 2) < 1)
            return 0.5 * t * t * t * t * t;
        return 0.5 * ((t -= 2) * t * t * t * t + 2);
    }
    function quintIn(t) {
        return t * t * t * t * t;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }
    function sineInOut(t) {
        return -0.5 * (Math.cos(Math.PI * t) - 1);
    }
    function sineIn(t) {
        const v = Math.cos(t * Math.PI * 0.5);
        if (Math.abs(v) < 1e-14)
            return 1;
        else
            return 1 - v;
    }
    function sineOut(t) {
        return Math.sin((t * Math.PI) / 2);
    }

    var eases = /*#__PURE__*/Object.freeze({
        __proto__: null,
        backIn: backIn,
        backInOut: backInOut,
        backOut: backOut,
        bounceIn: bounceIn,
        bounceInOut: bounceInOut,
        bounceOut: bounceOut,
        circIn: circIn,
        circInOut: circInOut,
        circOut: circOut,
        cubicIn: cubicIn,
        cubicInOut: cubicInOut,
        cubicOut: cubicOut,
        elasticIn: elasticIn,
        elasticInOut: elasticInOut,
        elasticOut: elasticOut,
        expoIn: expoIn,
        expoInOut: expoInOut,
        expoOut: expoOut,
        quadIn: quadIn,
        quadInOut: quadInOut,
        quadOut: quadOut,
        quartIn: quartIn,
        quartInOut: quartInOut,
        quartOut: quartOut,
        quintIn: quintIn,
        quintInOut: quintInOut,
        quintOut: quintOut,
        sineIn: sineIn,
        sineInOut: sineInOut,
        sineOut: sineOut,
        linear: identity
    });

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    /* src\components\Card.svelte generated by Svelte v3.49.0 */
    const file$2 = "src\\components\\Card.svelte";

    // (25:8) {#if showprice}
    function create_if_block$2(ctx) {
    	let div;
    	let span;
    	let t0;
    	let t1_value = /*celeb*/ ctx[0].price + "";
    	let t1;
    	let span_intro;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			t0 = text("$");
    			t1 = text(t1_value);
    			add_location(span, file$2, 28, 16, 782);
    			attr_dev(div, "class", "price svelte-1cwsufd");
    			toggle_class(div, "large", /*winner*/ ctx[2]);
    			add_location(div, file$2, 25, 12, 708);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*celeb*/ 1 && t1_value !== (t1_value = /*celeb*/ ctx[0].price + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*winner*/ 4) {
    				toggle_class(div, "large", /*winner*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (!span_intro) {
    				add_render_callback(() => {
    					span_intro = create_in_transition(span, scale, { easing: elasticOut, duration: 600 });
    					span_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(25:8) {#if showprice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let button;
    	let div0;
    	let h2;
    	let a;
    	let t0_value = /*celeb*/ ctx[0].name + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let p;
    	let t2_value = /*celeb*/ ctx[0].type + "";
    	let t2;
    	let t3;
    	let mounted;
    	let dispose;
    	let if_block = /*showprice*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button = element("button");
    			div0 = element("div");
    			h2 = element("h2");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", a_href_value = "https://cameo.com/" + /*celeb*/ ctx[0].id);
    			add_location(a, file$2, 19, 16, 527);
    			attr_dev(h2, "class", "svelte-1cwsufd");
    			add_location(h2, file$2, 19, 12, 523);
    			attr_dev(p, "class", "type svelte-1cwsufd");
    			add_location(p, file$2, 21, 12, 619);
    			attr_dev(div0, "class", "details svelte-1cwsufd");
    			add_location(div0, file$2, 18, 8, 488);
    			attr_dev(button, "class", "card-inner svelte-1cwsufd");
    			set_style(button, "background-image", "url(" + /*celeb*/ ctx[0].image + ")");
    			add_location(button, file$2, 13, 4, 324);
    			attr_dev(div1, "class", "card-outer svelte-1cwsufd");
    			add_location(div1, file$2, 12, 0, 294);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button);
    			append_dev(button, div0);
    			append_dev(div0, h2);
    			append_dev(h2, a);
    			append_dev(a, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p);
    			append_dev(p, t2);
    			append_dev(button, t3);
    			if (if_block) if_block.m(button, null);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*celeb*/ 1 && t0_value !== (t0_value = /*celeb*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*celeb*/ 1 && a_href_value !== (a_href_value = "https://cameo.com/" + /*celeb*/ ctx[0].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*celeb*/ 1 && t2_value !== (t2_value = /*celeb*/ ctx[0].type + "")) set_data_dev(t2, t2_value);

    			if (/*showprice*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*showprice*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(button, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*celeb*/ 1) {
    				set_style(button, "background-image", "url(" + /*celeb*/ ctx[0].image + ")");
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
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
    	validate_slots('Card', slots, []);
    	let { celeb } = $$props;
    	let { showprice } = $$props;
    	let { winner } = $$props;
    	const dispatch = createEventDispatcher();
    	const writable_props = ['celeb', 'showprice', 'winner'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Card> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch('select');

    	$$self.$$set = $$props => {
    		if ('celeb' in $$props) $$invalidate(0, celeb = $$props.celeb);
    		if ('showprice' in $$props) $$invalidate(1, showprice = $$props.showprice);
    		if ('winner' in $$props) $$invalidate(2, winner = $$props.winner);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		scale,
    		elasticOut,
    		celeb,
    		showprice,
    		winner,
    		dispatch
    	});

    	$$self.$inject_state = $$props => {
    		if ('celeb' in $$props) $$invalidate(0, celeb = $$props.celeb);
    		if ('showprice' in $$props) $$invalidate(1, showprice = $$props.showprice);
    		if ('winner' in $$props) $$invalidate(2, winner = $$props.winner);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [celeb, showprice, winner, dispatch, click_handler];
    }

    class Card extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { celeb: 0, showprice: 1, winner: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Card",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*celeb*/ ctx[0] === undefined && !('celeb' in props)) {
    			console.warn("<Card> was created without expected prop 'celeb'");
    		}

    		if (/*showprice*/ ctx[1] === undefined && !('showprice' in props)) {
    			console.warn("<Card> was created without expected prop 'showprice'");
    		}

    		if (/*winner*/ ctx[2] === undefined && !('winner' in props)) {
    			console.warn("<Card> was created without expected prop 'winner'");
    		}
    	}

    	get celeb() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set celeb(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showprice() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showprice(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get winner() {
    		throw new Error("<Card>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set winner(value) {
    		throw new Error("<Card>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function pick_random(array) {
    	const index = Math.floor(array.length * Math.random());
    	return array[index];
    }

    function sleep(ms){
    	return new Promise(fulfil  => {
    		setTimeout(fulfil, ms);
    	});
    }

    function load_image(src){
    	return new Promise((fulfil, reject)=> {
    		const img = new Image();
    		img.onload = ()=> fulfil(img);
    		img.onerror = reject;
    		img.src = src;
    	})
    }

    /* src\Screens\Game.svelte generated by Svelte v3.49.0 */
    const file$1 = "src\\Screens\\Game.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[20] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_then_context(ctx) {
    	ctx[22] = ctx[24][0];
    	ctx[23] = ctx[24][1];
    }

    // (75:20) 
    function create_if_block_3(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 24,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*promises*/ ctx[9][/*i*/ ctx[5]], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*i*/ 32 && promise !== (promise = /*promises*/ ctx[9][/*i*/ ctx[5]]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(75:20) ",
    		ctx
    	});

    	return block;
    }

    // (69:4) {#if done}
    function create_if_block_2(ctx) {
    	let div;
    	let strong;
    	let t0;
    	let t1;
    	let t2_value = /*results*/ ctx[0].length + "";
    	let t2;
    	let t3;
    	let p;
    	let t4_value = /*pick_message*/ ctx[10](/*score*/ ctx[4] / /*results*/ ctx[0].length) + "";
    	let t4;
    	let t5;
    	let button;
    	let div_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			strong = element("strong");
    			t0 = text(/*score*/ ctx[4]);
    			t1 = text(" / ");
    			t2 = text(t2_value);
    			t3 = space();
    			p = element("p");
    			t4 = text(t4_value);
    			t5 = space();
    			button = element("button");
    			button.textContent = "Restart";
    			attr_dev(strong, "class", "svelte-1qwrxcn");
    			add_location(strong, file$1, 70, 12, 2136);
    			add_location(p, file$1, 71, 12, 2193);
    			add_location(button, file$1, 72, 12, 2252);
    			attr_dev(div, "class", "done svelte-1qwrxcn");
    			add_location(div, file$1, 69, 8, 2058);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, strong);
    			append_dev(strong, t0);
    			append_dev(strong, t1);
    			append_dev(strong, t2);
    			append_dev(div, t3);
    			append_dev(div, p);
    			append_dev(p, t4);
    			append_dev(div, t5);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*score*/ 16) set_data_dev(t0, /*score*/ ctx[4]);
    			if (dirty & /*results*/ 1 && t2_value !== (t2_value = /*results*/ ctx[0].length + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*score, results*/ 17 && t4_value !== (t4_value = /*pick_message*/ ctx[10](/*score*/ ctx[4] / /*results*/ ctx[0].length) + "")) set_data_dev(t4, t4_value);
    		},
    		i: function intro(local) {
    			if (!div_intro) {
    				add_render_callback(() => {
    					div_intro = create_in_transition(div, scale, { easing: elasticOut, duration: 600 });
    					div_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(69:4) {#if done}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import {createEventDispatcher}
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>      import {createEventDispatcher}",
    		ctx
    	});

    	return block;
    }

    // (76:40)               <div class="game"                   in:fly={{duration:200, y:20}}
    function create_then_block(ctx) {
    	get_then_context(ctx);
    	let div3;
    	let div0;
    	let card0;
    	let t0;
    	let div1;
    	let button;
    	let t1;
    	let button_winner_value;
    	let t2;
    	let div2;
    	let card1;
    	let div3_intro;
    	let div3_outro;
    	let current;
    	let mounted;
    	let dispose;

    	function select_handler() {
    		return /*select_handler*/ ctx[14](/*a*/ ctx[22], /*b*/ ctx[23]);
    	}

    	card0 = new Card({
    			props: {
    				celeb: /*a*/ ctx[22],
    				showprice: !!/*last_result*/ ctx[1],
    				winner: /*a*/ ctx[22].price > /*b*/ ctx[23].price
    			},
    			$$inline: true
    		});

    	card0.$on("select", select_handler);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[15](/*a*/ ctx[22], /*b*/ ctx[23]);
    	}

    	function select_handler_1() {
    		return /*select_handler_1*/ ctx[16](/*a*/ ctx[22], /*b*/ ctx[23]);
    	}

    	card1 = new Card({
    			props: {
    				celeb: /*b*/ ctx[23],
    				showprice: !!/*last_result*/ ctx[1],
    				winner: /*a*/ ctx[22].price < /*b*/ ctx[23].price
    			},
    			$$inline: true
    		});

    	card1.$on("select", select_handler_1);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			create_component(card0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			t1 = text("same price");
    			t2 = space();
    			div2 = element("div");
    			create_component(card1.$$.fragment);
    			attr_dev(div0, "class", "card-container svelte-1qwrxcn");
    			add_location(div0, file$1, 82, 16, 2651);
    			attr_dev(button, "class", "same svelte-1qwrxcn");
    			attr_dev(button, "winner", button_winner_value = /*a*/ ctx[22].price === /*b*/ ctx[23].price);
    			add_location(button, file$1, 91, 20, 3012);
    			attr_dev(div1, "class", "svelte-1qwrxcn");
    			add_location(div1, file$1, 90, 16, 2985);
    			attr_dev(div2, "class", "card-container svelte-1qwrxcn");
    			add_location(div2, file$1, 98, 16, 3282);
    			attr_dev(div3, "class", "game svelte-1qwrxcn");
    			add_location(div3, file$1, 76, 12, 2407);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(card0, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div1, button);
    			append_dev(button, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			mount_component(card1, div2, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", click_handler_1, false, false, false),
    					listen_dev(div3, "outrostart", /*outrostart_handler*/ ctx[17], false, false, false),
    					listen_dev(div3, "outroend", /*outroend_handler*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			get_then_context(ctx);
    			const card0_changes = {};
    			if (dirty & /*i*/ 32) card0_changes.celeb = /*a*/ ctx[22];
    			if (dirty & /*last_result*/ 2) card0_changes.showprice = !!/*last_result*/ ctx[1];
    			if (dirty & /*i*/ 32) card0_changes.winner = /*a*/ ctx[22].price > /*b*/ ctx[23].price;
    			card0.$set(card0_changes);

    			if (!current || dirty & /*i*/ 32 && button_winner_value !== (button_winner_value = /*a*/ ctx[22].price === /*b*/ ctx[23].price)) {
    				attr_dev(button, "winner", button_winner_value);
    			}

    			const card1_changes = {};
    			if (dirty & /*i*/ 32) card1_changes.celeb = /*b*/ ctx[23];
    			if (dirty & /*last_result*/ 2) card1_changes.showprice = !!/*last_result*/ ctx[1];
    			if (dirty & /*i*/ 32) card1_changes.winner = /*a*/ ctx[22].price < /*b*/ ctx[23].price;
    			card1.$set(card1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(card0.$$.fragment, local);
    			transition_in(card1.$$.fragment, local);

    			add_render_callback(() => {
    				if (div3_outro) div3_outro.end(1);
    				div3_intro = create_in_transition(div3, fly, { duration: 200, y: 20 });
    				div3_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(card0.$$.fragment, local);
    			transition_out(card1.$$.fragment, local);
    			if (div3_intro) div3_intro.invalidate();
    			div3_outro = create_out_transition(div3, fly, { duration: 200, y: -20 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(card0);
    			destroy_component(card1);
    			if (detaching && div3_outro) div3_outro.end();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(76:40)               <div class=\\\"game\\\"                   in:fly={{duration:200, y:20}}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>      import {createEventDispatcher}
    function create_pending_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>      import {createEventDispatcher}",
    		ctx
    	});

    	return block;
    }

    // (110:0) {#if last_result}
    function create_if_block_1$1(ctx) {
    	let img;
    	let img_alt_value;
    	let img_src_value;
    	let img_intro;
    	let img_outro;
    	let current;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "giant-result svelte-1qwrxcn");
    			attr_dev(img, "alt", img_alt_value = "" + (/*last_result*/ ctx[1] + " answer"));
    			if (!src_url_equal(img.src, img_src_value = "./icons/" + /*last_result*/ ctx[1] + ".svg")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$1, 110, 4, 3626);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (!current || dirty & /*last_result*/ 2 && img_alt_value !== (img_alt_value = "" + (/*last_result*/ ctx[1] + " answer"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty & /*last_result*/ 2 && !src_url_equal(img.src, img_src_value = "./icons/" + /*last_result*/ ctx[1] + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (img_outro) img_outro.end(1);
    				img_intro = create_in_transition(img, fly, { x: 100, duration: 300 });
    				img_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (img_intro) img_intro.invalidate();
    			img_outro = create_out_transition(img, /*send*/ ctx[7], { key: /*i*/ ctx[5] });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    			if (detaching && img_outro) img_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(110:0) {#if last_result}",
    		ctx
    	});

    	return block;
    }

    // (120:12) {#if result}
    function create_if_block$1(ctx) {
    	let img;
    	let img_alt_value;
    	let img_src_value;
    	let img_intro;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "alt", img_alt_value = "" + (/*result*/ ctx[20] + " answer"));
    			if (!src_url_equal(img.src, img_src_value = "./icons/" + /*result*/ ctx[20] + ".svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "svelte-1qwrxcn");
    			add_location(img, file$1, 120, 19, 4004);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*results*/ 1 && img_alt_value !== (img_alt_value = "" + (/*result*/ ctx[20] + " answer"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*results*/ 1 && !src_url_equal(img.src, img_src_value = "./icons/" + /*result*/ ctx[20] + ".svg")) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		i: function intro(local) {
    			if (!img_intro) {
    				add_render_callback(() => {
    					img_intro = create_in_transition(img, /*receive*/ ctx[8], { key: /*i*/ ctx[5] });
    					img_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(120:12) {#if result}",
    		ctx
    	});

    	return block;
    }

    // (118:4) {#each results as result,i}
    function create_each_block(ctx) {
    	let span;
    	let t;
    	let if_block = /*result*/ ctx[20] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(span, "class", "result svelte-1qwrxcn");
    			add_location(span, file$1, 118, 8, 3936);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if (if_block) if_block.m(span, null);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (/*result*/ ctx[20]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*results*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(span, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block);
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(118:4) {#each results as result,i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let header;
    	let p;
    	let t1;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let t3;
    	let div1;
    	let current;
    	const if_block_creators = [create_if_block_2, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*done*/ ctx[2]) return 0;
    		if (/*ready*/ ctx[3]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	let if_block1 = /*last_result*/ ctx[1] && create_if_block_1$1(ctx);
    	let each_value = /*results*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			p = element("p");
    			p.textContent = "tap on the more monetisable celebrity or tap \"same price\"";
    			t1 = space();
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(p, file$1, 63, 4, 1922);
    			add_location(header, file$1, 62, 0, 1908);
    			attr_dev(div0, "class", "game-container svelte-1qwrxcn");
    			add_location(div0, file$1, 67, 0, 2004);
    			attr_dev(div1, "class", "results svelte-1qwrxcn");
    			set_style(div1, "grid-template-columns", "repeat(" + /*results*/ ctx[0].length + ", 1fr)");
    			add_location(div1, file$1, 116, 0, 3811);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, p);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

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
    					} else {
    						if_block0.p(ctx, dirty);
    					}

    					transition_in(if_block0, 1);
    					if_block0.m(div0, null);
    				} else {
    					if_block0 = null;
    				}
    			}

    			if (/*last_result*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*last_result*/ 2) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t3.parentNode, t3);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*results*/ 1) {
    				each_value = /*results*/ ctx[0];
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
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty & /*results*/ 1) {
    				set_style(div1, "grid-template-columns", "repeat(" + /*results*/ ctx[0].length + ", 1fr)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
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
    	let score;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Game', slots, []);
    	let { selection } = $$props;
    	const dispatch = createEventDispatcher();
    	const [send, receive] = crossfade({ easing: cubicOut, duration: 300 });

    	const load_details = async celeb => {
    		const res = await fetch("https://cameo-explorer.netlify.app/celebs/" + celeb.id + ".json");
    		const details = await res.json();
    		await load_image(details.image);
    		return details;
    	};

    	const promises = selection.map(round => Promise.all([load_details(round.a), load_details(round.b)]));
    	const results = Array(selection.length);
    	let last_result;
    	let done = false;
    	let ready = true;

    	const pick_message = p => {
    		if (p <= 0.2) return pick_random([`Oof.`, `Better luck next time?`]);
    		if (p <= 0.5) return pick_random([`I've seen worse`, `Keep trying!`]);
    		if (p <= 0.8) return pick_random([`Yeah!`, `Not bad. Practice makes perfect`]);
    		if (p < 1) return pick_random([`Impressive.`]);
    		return pick_random([`Flawless victory`, `Top marks`]);
    	};

    	const submit = async (a, b, sign) => {
    		$$invalidate(1, last_result = Math.sign(a.price - b.price) === sign
    		? "right"
    		: "wrong");

    		await sleep(1500);
    		$$invalidate(0, results[i] = last_result, results);
    		$$invalidate(1, last_result = null);
    		await sleep(500);

    		if (i < selection.length - 1) {
    			$$invalidate(5, i += 1);
    		} else {
    			$$invalidate(2, done = true);
    		}
    	};

    	let i = 0;
    	const writable_props = ['selection'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => dispatch("restart");
    	const select_handler = (a, b) => submit(a, b, 1);
    	const click_handler_1 = (a, b) => submit(a, b, 0);
    	const select_handler_1 = (a, b) => submit(a, b, -1);
    	const outrostart_handler = () => $$invalidate(3, ready = false);
    	const outroend_handler = () => $$invalidate(3, ready = true);

    	$$self.$$set = $$props => {
    		if ('selection' in $$props) $$invalidate(12, selection = $$props.selection);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Card,
    		sleep,
    		pick_random,
    		load_image,
    		fly,
    		crossfade,
    		scale,
    		elasticOut,
    		eases,
    		selection,
    		dispatch,
    		send,
    		receive,
    		load_details,
    		promises,
    		results,
    		last_result,
    		done,
    		ready,
    		pick_message,
    		submit,
    		i,
    		score
    	});

    	$$self.$inject_state = $$props => {
    		if ('selection' in $$props) $$invalidate(12, selection = $$props.selection);
    		if ('last_result' in $$props) $$invalidate(1, last_result = $$props.last_result);
    		if ('done' in $$props) $$invalidate(2, done = $$props.done);
    		if ('ready' in $$props) $$invalidate(3, ready = $$props.ready);
    		if ('i' in $$props) $$invalidate(5, i = $$props.i);
    		if ('score' in $$props) $$invalidate(4, score = $$props.score);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*results*/ 1) {
    			$$invalidate(4, score = results.filter(d => d === "right").length);
    		}
    	};

    	return [
    		results,
    		last_result,
    		done,
    		ready,
    		score,
    		i,
    		dispatch,
    		send,
    		receive,
    		promises,
    		pick_message,
    		submit,
    		selection,
    		click_handler,
    		select_handler,
    		click_handler_1,
    		select_handler_1,
    		outrostart_handler,
    		outroend_handler
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { selection: 12 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*selection*/ ctx[12] === undefined && !('selection' in props)) {
    			console.warn("<Game> was created without expected prop 'selection'");
    		}
    	}

    	get selection() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selection(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const ROUNDS_PER_GAME = 3;

    function remove(array, index) {
    	// if a 'similar' account was picked, there's no
    	// guarantee that it's in the filtered array
    	if (index === -1) return;

    	// this is much faster than splicing the array
    	array[index] = array[array.length - 1];
    	array.pop();
    }

    function select(celebs, lookup, category) {
    	const filtered = celebs.filter(c => {
    		return c.categories.includes(category);
    	});

    	const seen = new Set();
    	const selection = [];

    	let i = ROUNDS_PER_GAME;
    	while (i--) {
    		const n = Math.random();
    		const ai = Math.floor(n * filtered.length);
    		const a = filtered[ai];

    		// remove a from the array so this person can't be picked again
    		remove(filtered, ai);
    		let b;

    		// if this celeb has 'similar' celebs, decide whether to pick one
    		const similar = a.similar.filter(id => !seen.has(id));
    		if ((similar.length > 0) && (Math.random() < 0.75)) {
    			const id = pick_random(similar);
    			b = lookup.get(id);
    		}

    		// otherwise pick someone at random
    		else {
    			b = pick_random(filtered);
    		}

    		selection.push({ a, b });

    		seen.add(a.id);
    		seen.add(b.id);

    		// remove b from the array so this person can't be picked again
    		remove(filtered, filtered.indexOf(b));
    	}

    	return selection;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    const url = "https://cameo-explorer.netlify.app/celebs.json";

    const jsonCelebs =  readable({}, async set => {
        const response = await fetch(url);
        const data = await response.json();
        set({entries : data});
        
    });

    const fullData = derived(jsonCelebs, $rawData => {
        const {entries = []} = $rawData;
        return entries;

    });

    derived(jsonCelebs, $rawData=> {
        const {entries = []} = $rawData;
         const filter = entries.filter(d => d.reviews > 50);
        return filter;

    });

    /* src\App.svelte generated by Svelte v3.49.0 */
    const file = "src\\App.svelte";

    // (42:30) 
    function create_if_block_1(ctx) {
    	let game;
    	let current;

    	game = new Game({
    			props: { selection: /*selection*/ ctx[1] },
    			$$inline: true
    		});

    	game.$on("restart", /*restart_handler*/ ctx[5]);

    	const block = {
    		c: function create() {
    			create_component(game.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(game, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const game_changes = {};
    			if (dirty & /*selection*/ 2) game_changes.selection = /*selection*/ ctx[1];
    			game.$set(game_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(game.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(game.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(game, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(42:30) ",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#if state === "welcome"}
    function create_if_block(ctx) {
    	let welcome;
    	let current;

    	welcome = new Welcome({
    			props: { categories: /*categories*/ ctx[2] },
    			$$inline: true
    		});

    	welcome.$on("select", function () {
    		if (is_function(/*start*/ ctx[3])) /*start*/ ctx[3].apply(this, arguments);
    	});

    	const block = {
    		c: function create() {
    			create_component(welcome.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(welcome, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const welcome_changes = {};
    			if (dirty & /*categories*/ 4) welcome_changes.categories = /*categories*/ ctx[2];
    			welcome.$set(welcome_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(welcome.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(welcome.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(welcome, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if state === \\\"welcome\\\"}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*state*/ ctx[0] === "welcome") return 0;
    		if (/*state*/ ctx[0] === "playing") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			attr_dev(main, "class", "svelte-g5egg3");
    			add_location(main, file, 36, 0, 800);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

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
    					if_block.m(main, null);
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
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
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
    	let start;
    	let categories;
    	let $fullData;
    	validate_store(fullData, 'fullData');
    	component_subscribe($$self, fullData, $$value => $$invalidate(4, $fullData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let state = "welcome"; //or playing
    	let celebs_promise;
    	let selection;
    	let lookup = new Map();

    	onMount(() => {
    		// celebs_promise = load_celebs();
    		load_image("./icons/right.svg");

    		load_image("./icons/wrong.svg");
    		load_image("./icons/compare.svg");
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const restart_handler = () => $$invalidate(0, state = "welcome");

    	$$self.$capture_state = () => ({
    		onMount,
    		Welcome,
    		Game,
    		select,
    		load_image,
    		fullData,
    		state,
    		celebs_promise,
    		selection,
    		lookup,
    		categories,
    		start,
    		$fullData
    	});

    	$$self.$inject_state = $$props => {
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('celebs_promise' in $$props) celebs_promise = $$props.celebs_promise;
    		if ('selection' in $$props) $$invalidate(1, selection = $$props.selection);
    		if ('lookup' in $$props) $$invalidate(7, lookup = $$props.lookup);
    		if ('categories' in $$props) $$invalidate(2, categories = $$props.categories);
    		if ('start' in $$props) $$invalidate(3, start = $$props.start);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$fullData*/ 16) {
    			$$invalidate(3, start = e => {
    				$$invalidate(1, selection = select($fullData, lookup, e.detail.category.slug));
    				$$invalidate(0, state = "playing");
    			});
    		}

    		if ($$self.$$.dirty & /*$fullData*/ 16) {
    			$fullData.forEach(c => {
    				lookup.set(c.id, c);
    			});
    		}

    		if ($$self.$$.dirty & /*$fullData*/ 16) {
    			$$invalidate(2, categories = $fullData.map(d => d.categories).flat().filter((v, i, a) => a.indexOf(v) === i));
    		}
    	};

    	return [state, selection, categories, start, $fullData, restart_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
